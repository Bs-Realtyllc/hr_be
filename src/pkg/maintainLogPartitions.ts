/**
 * Partition maintenance for access_log and operation_log.
 *
 * Layout per month (all dates UTC):
 *   p_YYYY_MM_01  days 1–7
 *   p_YYYY_MM_08  days 8–14
 *   p_YYYY_MM_15  days 15–21
 *   p_YYYY_MM_22  days 22–28
 *   p_YYYY_MM_29  day 29 to end of month (does not exist in non-leap February)
 *
 * Every run is idempotent:
 *   1. Makes sure every partition of the current month exists, plus p_<next month>_01
 *      so the first week of next month can be logged before the next run.
 *      If earlier runs were missed, the gap is filled as well.
 *   2. Drops every partition belonging to a month more than RETAIN_MONTHS months
 *      before the current month (on 2027-01-xx: everything before p_2026_10).
 *
 * There is deliberately no MAXVALUE partition: an insert with no matching partition fails
 * (ER 1526). That is why this runs from three places:
 *   - at the end of `npm run migrate` (src/db/migrate.ts), so a freshly migrated DB is current;
 *   - at app startup, and daily at 03:30 UTC via node-cron (start(), called from index.ts);
 *   - manually from the CLI:
 *       npm run partitions:maintain -- --dry-run
 *       npm run partitions:maintain -- --dry-run --date=2027-01-01
 *       npx tsx src/pkg/maintainLogPartitions.ts --dry-run          (no build needed)
 *     --dry-run prints the ALTER statements without running them.
 *     --date pretends "today" is that date (UTC), for testing.
 *
 * Partition definitions live only in drizzle/migrations/0018_log_tables_partitioning.sql
 * and here; drizzle doesn't know about them.
 */
import "dotenv/config";
import cron from "node-cron";
import mysql, { type RowDataPacket } from "mysql2/promise";

const TABLES = ["access_log", "operation_log"] as const;
const RETAIN_MONTHS = 3; // full months kept before the current month
const START_DAYS = [1, 8, 15, 22, 29] as const;
const NAME_RE = /^p_\d{4}_\d{2}_\d{2}$/;
const LOCK_NAME = "hr_be.maintain_log_partitions";
const TAG = "[log-partitions]";

interface YearMonth {
  y: number;
  m: number; // 1–12
}

interface PartitionDef {
  name: string; // p_2026_12_08
  lessThan: string; // '2026-12-15'
}

export interface MaintainOptions {
  dryRun?: boolean;
  /** Pretend "today" is this date; only its UTC year/month matter. Defaults to now. */
  today?: Date;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Prefix shared by all partitions of a month, e.g. "p_2026_12". */
const monthKey = ({ y, m }: YearMonth) => `p_${y}_${pad(m)}`;

function addMonths({ y, m }: YearMonth, delta: number): YearMonth {
  const i = y * 12 + (m - 1) + delta;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

const daysInMonth = ({ y, m }: YearMonth) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** The partitions of one month, in order, each bounded by the start of the next one. */
function monthPartitions(month: YearMonth): PartitionDef[] {
  const starts = START_DAYS.filter((d) => d <= daysInMonth(month)); // drops 29 in non-leap Feb
  const next = addMonths(month, 1);
  return starts.map((day, i) => ({
    name: `${monthKey(month)}_${pad(day)}`,
    lessThan:
      i + 1 < starts.length
        ? `${month.y}-${pad(month.m)}-${pad(starts[i + 1])}`
        : `${next.y}-${pad(next.m)}-01`,
  }));
}

function monthOfName(name: string): YearMonth {
  const [, y, m] = name.split("_");
  return { y: Number(y), m: Number(m) };
}

/** Pure planning step: which partitions to add and drop, given the existing names. */
export function planPartitions(existing: string[], current: YearMonth) {
  const managed = existing.filter((n) => NAME_RE.test(n)).sort();
  const highest = managed[managed.length - 1] as string | undefined;

  const cutoffMonth = addMonths(current, -RETAIN_MONTHS);

  // Start from the month of the highest existing partition if it is behind the current
  // month (missed runs), otherwise from the current month. Never start before the cutoff
  // month: partitions for months already out of retention would only be dropped on the next
  // run. (The first partition added then also covers the gap since `highest`, which is fine:
  // no row could have been inserted for that period anyway.)
  let month = current;
  if (highest && monthKey(monthOfName(highest)) < monthKey(current)) {
    month = monthOfName(highest);
    if (monthKey(month) < monthKey(cutoffMonth)) month = cutoffMonth;
  }

  const wanted: PartitionDef[] = [];
  for (; monthKey(month) <= monthKey(current); month = addMonths(month, 1)) {
    wanted.push(...monthPartitions(month));
  }
  // Buffer for next month. To pre-create ALL of next month instead, use:
  //   wanted.push(...monthPartitions(addMonths(current, 1)));
  wanted.push(monthPartitions(addMonths(current, 1))[0]);

  // Without a MAXVALUE partition, new partitions can only be appended above the highest one.
  const toAdd = wanted.filter((p) => !highest || p.name > highest);

  // "p_2026_09_29" < "p_2026_10" but "p_2026_10_01" > "p_2026_10", so this drops whole months only.
  const cutoff = monthKey(cutoffMonth);
  const toDrop = managed.filter((n) => n < cutoff);

  return { toAdd, toDrop };
}

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${TAG} ${msg}`);
const logError = (msg: string, err?: unknown) =>
  console.error(`[${new Date().toISOString()}] ${TAG} ${msg}`, err instanceof Error ? err.message : err ?? "");

/**
 * Brings both log tables' partitions up to date. Never throws: returns false if anything
 * failed (each table is handled independently).
 */
export async function maintainLogPartitions({ dryRun = false, today = new Date() }: MaintainOptions = {}): Promise<boolean> {
  const current: YearMonth = { y: today.getUTCFullYear(), m: today.getUTCMonth() + 1 };
  let ok = true;
  let conn: mysql.Connection | undefined;

  try {
    // Own connection (not the app pool) so session settings don't leak and the CLI exits cleanly.
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "hr_platform",
      socketPath: process.env.DB_SOCKET_PATH,
    });

    // Only one run at a time across processes/containers (startup, cron, migrate, CLI).
    const [lockRows] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK(?, 0) AS got", [LOCK_NAME]);
    if (Number(lockRows[0]?.got) !== 1) {
      log("another run holds the lock, skipping");
      return true;
    }

    // Give up instead of blocking log inserts if a long query holds a lock on the table.
    await conn.query("SET SESSION lock_wait_timeout = 30");

    for (const table of TABLES) {
      try {
        const [rows] = await conn.query<RowDataPacket[]>(
          `SELECT PARTITION_NAME AS name
             FROM information_schema.PARTITIONS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND PARTITION_NAME IS NOT NULL`,
          [table],
        );
        if (rows.length === 0) {
          throw new Error("table missing or not partitioned (is migration 0018 applied?)");
        }

        const { toAdd, toDrop } = planPartitions(rows.map((r) => String(r.name)), current);
        const statements: string[] = [];

        // Add before drop: a failed drop only keeps an old month a day longer, whereas a failed
        // drop blocking the add would break logging once the buffer week runs out.
        if (toAdd.length) {
          const defs = toAdd.map((p) => `PARTITION ${p.name} VALUES LESS THAN ('${p.lessThan}')`);
          statements.push(`ALTER TABLE \`${table}\` ADD PARTITION (${defs.join(", ")})`);
        }
        if (toDrop.length) {
          statements.push(`ALTER TABLE \`${table}\` DROP PARTITION ${toDrop.join(", ")}`);
        }

        if (statements.length === 0) log(`${table}: nothing to do`);
        for (const stmt of statements) {
          log(`${table}: ${dryRun ? "[dry-run] " : ""}${stmt}`);
          if (!dryRun) await conn.query(stmt);
        }
      } catch (err) {
        ok = false;
        logError(`${table}: FAILED`, err);
      }
    }
  } catch (err) {
    ok = false;
    logError("FAILED", err);
  } finally {
    await conn?.end().catch(() => undefined); // also releases the named lock
  }
  return ok;
}

/** In-process schedule: once at startup, then daily at 03:30 UTC. */
export function start() {
  void maintainLogPartitions();
  cron.schedule("30 3 * * *", () => void maintainLogPartitions(), { timezone: "UTC", noOverlap: true });
  console.log("✔ Log partition maintenance scheduled  →  startup + daily 03:30 UTC");
}

function parseArgs(argv: string[]): MaintainOptions {
  const dryRun = argv.includes("--dry-run");
  const dateArg = argv.find((a) => a.startsWith("--date="))?.slice("--date=".length);
  if (dateArg === undefined) return { dryRun };
  const today = new Date(`${dateArg}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg) || Number.isNaN(today.getTime()) || today.toISOString().slice(0, 10) !== dateArg) {
    throw new Error(`Invalid --date: ${dateArg} (expected YYYY-MM-DD)`);
  }
  return { dryRun, today };
}

if (require.main === module) {
  (async () => {
    const ok = await maintainLogPartitions(parseArgs(process.argv.slice(2)));
    process.exitCode = ok ? 0 : 1;
  })().catch((err) => {
    logError("FAILED", err);
    process.exitCode = 1;
  });
}
