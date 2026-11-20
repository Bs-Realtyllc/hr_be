/**
 * Demo people for trying out the org chart locally.
 *
 *   npx tsx src/db/seed/orgChartDemo.ts           # add the demo org
 *   npx tsx src/db/seed/orgChartDemo.ts --remove  # delete the demo people again
 *
 * Safe by design:
 *  - only INSERTs; never truncates or edits existing employees
 *  - every demo person has an @orgchart-demo.local email, which is how
 *    --remove finds them (nothing else is deleted)
 *  - demo people have no password, so nobody can log in as them
 *  - refuses to run against a non-local database or with NODE_ENV=production
 *
 * The department heads report to the first admin account, so the chart has
 * a single top person. Departments and designations are found by name or
 * created; they are left in place on --remove (harmless, and they may be
 * shared with real employees).
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DEMO_DOMAIN = 'orgchart-demo.local';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mysql', 'db']);

type Role = 'lead' | 'employee' | 'intern';
interface DemoPerson {
  key: string;
  name: string;
  title: string;
  department: string;
  role: Role;
  /** key of their manager; omitted = reports to the admin */
  manager?: string;
}

const PEOPLE: DemoPerson[] = [
  { key: 'sita', name: 'Sita Karki', title: 'Head of Engineering', department: 'IT', role: 'lead' },
  { key: 'aarav', name: 'Aarav Sharma', title: 'Engineering Manager', department: 'IT', role: 'lead', manager: 'sita' },
  { key: 'john', name: 'John Doe', title: 'Senior Developer', department: 'IT', role: 'employee', manager: 'aarav' },
  { key: 'priya', name: 'Priya Thapa', title: 'Developer', department: 'IT', role: 'employee', manager: 'aarav' },
  { key: 'ram', name: 'Ram Gurung', title: 'Software Intern', department: 'IT', role: 'intern', manager: 'john' },
  { key: 'nisha', name: 'Nisha Shrestha', title: 'QA Lead', department: 'IT', role: 'lead', manager: 'sita' },
  { key: 'kiran', name: 'Kiran Magar', title: 'QA Engineer', department: 'IT', role: 'employee', manager: 'nisha' },
  { key: 'bishal', name: 'Bishal Sharma', title: 'Finance Manager', department: 'Finance', role: 'lead' },
  { key: 'maya', name: 'Maya Rai', title: 'Accountant', department: 'Finance', role: 'employee', manager: 'bishal' },
  { key: 'suman', name: 'Suman Adhikari', title: 'Payroll Officer', department: 'Finance', role: 'employee', manager: 'bishal' },
  { key: 'anita', name: 'Anita Joshi', title: 'HR Manager', department: 'HR', role: 'lead' },
  { key: 'rekha', name: 'Rekha Tamang', title: 'HR Executive', department: 'HR', role: 'employee', manager: 'anita' },
  { key: 'rohan', name: 'Rohan KC', title: 'Marketing Lead', department: 'Marketing', role: 'lead' },
  { key: 'pooja', name: 'Pooja Basnet', title: 'Content Strategist', department: 'Marketing', role: 'employee', manager: 'rohan' },
  { key: 'sanjay', name: 'Sanjay Lama', title: 'Graphic Designer', department: 'Marketing', role: 'employee', manager: 'rohan' },
  { key: 'deepak', name: 'Deepak Bhandari', title: 'Sales Manager', department: 'Sales', role: 'lead' },
  { key: 'asha', name: 'Asha Poudel', title: 'Account Executive', department: 'Sales', role: 'employee', manager: 'deepak' },
  { key: 'bikash', name: 'Bikash Thapa', title: 'Sales Associate', department: 'Sales', role: 'employee', manager: 'deepak' },
];

const emailOf = (p: DemoPerson) => `${p.key}@${DEMO_DOMAIN}`;

function assertSafeTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run with NODE_ENV=production.');
  }
  const host = process.env.DB_HOST ?? '';
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to run against non-local DB_HOST "${host}".`);
  }
}

async function findOrCreate(
  conn: mysql.Connection,
  select: string,
  insert: string,
  selectArgs: unknown[],
  insertArgs: unknown[],
): Promise<number> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(select, selectArgs);
  if (rows.length) return rows[0].id as number;
  const [res] = await conn.query<mysql.ResultSetHeader>(insert, insertArgs);
  return res.insertId;
}

async function add(conn: mysql.Connection) {
  const [existing] = await conn.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM employees WHERE email LIKE ?',
    [`%@${DEMO_DOMAIN}`],
  );
  if (existing[0].n > 0) {
    console.log(`Demo org already present (${existing[0].n} people). Run with --remove first to re-create it.`);
    return;
  }

  const [admins] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, name FROM employees WHERE role = 'admin' AND status <> 'terminated' ORDER BY id LIMIT 1",
  );
  const topId: number | null = admins[0]?.id ?? null;

  await conn.beginTransaction();
  try {
    const ids = new Map<string, number>();
    // PEOPLE is ordered so every manager comes before their reports.
    for (const p of PEOPLE) {
      const departmentId = await findOrCreate(
        conn,
        'SELECT id FROM departments WHERE name = ?',
        'INSERT INTO departments (name, is_active) VALUES (?, 1)',
        [p.department],
        [p.department],
      );
      const designationId = await findOrCreate(
        conn,
        'SELECT id FROM designations WHERE title = ?',
        'INSERT INTO designations (title, department_id, is_active) VALUES (?, ?, 1)',
        [p.title],
        [p.title, departmentId],
      );
      const managerId = p.manager ? ids.get(p.manager)! : topId;
      const [res] = await conn.query<mysql.ResultSetHeader>(
        `INSERT INTO employees (name, email, role, status, department_id, designation_id, manager_id)
         VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        [p.name, emailOf(p), p.role, departmentId, designationId, managerId],
      );
      ids.set(p.key, res.insertId);
    }
    await conn.commit();
    console.log(
      `Added ${PEOPLE.length} demo people` +
        (topId ? ` reporting up to "${admins[0].name}" (id ${topId}).` : ' (no admin found: heads are top-level).'),
    );
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

async function remove(conn: mysql.Connection) {
  await conn.beginTransaction();
  try {
    // Detach anyone who reports to a demo person first (the FK would set
    // null anyway; doing it explicitly keeps real employees intact).
    await conn.query(
      `UPDATE employees e JOIN employees m ON e.manager_id = m.id
       SET e.manager_id = NULL
       WHERE m.email LIKE ? AND e.email NOT LIKE ?`,
      [`%@${DEMO_DOMAIN}`, `%@${DEMO_DOMAIN}`],
    );
    await conn.query('UPDATE employees SET manager_id = NULL WHERE email LIKE ?', [`%@${DEMO_DOMAIN}`]);
    const [res] = await conn.query<mysql.ResultSetHeader>('DELETE FROM employees WHERE email LIKE ?', [
      `%@${DEMO_DOMAIN}`,
    ]);
    await conn.commit();
    console.log(`Removed ${res.affectedRows} demo people.`);
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

(async () => {
  assertSafeTarget();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    if (process.argv.includes('--remove')) await remove(conn);
    else await add(conn);
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error('Org chart demo seed failed:', err.message);
  process.exit(1);
});
