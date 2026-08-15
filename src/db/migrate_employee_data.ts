// OBSOLETE as of Phase 5 (migrate_normalize_employees_p3.sql): the legacy
// employees.department/designation/role/password_hash/etc. columns this
// script reads from no longer exist — it was a one-time Phase 2 backfill tool
// and has served its purpose. Kept for historical reference only; do not run.
//
// Phase 2 backfill: populates the new normalized tables (employee_auth,
// employee_profile, employee_job_history, employee_compensation_history,
// employee_documents) and the departments/designations lookup tables from
// today's `employees` row data. Standalone script, run manually — mirrors
// create-admin.ts's precedent of not being part of migrate.ts's auto-run path.
//
// Safe to re-run: every step is idempotent (INSERT IGNORE / ON DUPLICATE KEY
// UPDATE / existence checks), so running this twice just no-ops the second time.
//
// Usage: npm run migrate-employee-data
//        npm run migrate-employee-data -- --verify   (report-only, no writes)

import mysql from 'mysql2/promise';
import 'dotenv/config';

const VERIFY_ONLY = process.argv.includes('--verify');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log(VERIFY_ONLY ? 'Running in --verify mode (no writes).\n' : 'Starting backfill…\n');

  // ── 1. Seed departments / designations from distinct existing free text ──
  if (!VERIFY_ONLY) {
    await conn.query(
      `INSERT IGNORE INTO departments (name)
       SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department <> ''`
    );
    await conn.query(
      `INSERT IGNORE INTO designations (title)
       SELECT DISTINCT designation FROM employees WHERE designation IS NOT NULL AND designation <> ''`
    );
    await conn.query(
      `UPDATE employees e JOIN departments d ON d.name = e.department
       SET e.department_id = d.id WHERE e.department_id IS NULL`
    );
    await conn.query(
      `UPDATE employees e JOIN designations d ON d.title = e.designation
       SET e.designation_id = d.id WHERE e.designation_id IS NULL`
    );
  }
  const [[deptCount]]: any = await conn.query('SELECT COUNT(*) AS n FROM departments');
  const [[desigCount]]: any = await conn.query('SELECT COUNT(*) AS n FROM designations');
  console.log(`departments: ${deptCount.n} rows, designations: ${desigCount.n} rows`);

  // ── 2. Pull every employee row (all statuses, not just active) ───────────
  const [employees]: any = await conn.query('SELECT * FROM employees');
  console.log(`Backfilling ${employees.length} employee row(s)…\n`);

  let authWritten = 0,
    profileWritten = 0,
    jobHistWritten = 0,
    compHistWritten = 0,
    docsWritten = 0;

  for (const emp of employees) {
    // employee_auth
    if (!VERIFY_ONLY) {
      await conn.query(
        `INSERT INTO employee_auth (employee_id, password_hash, role)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
        [emp.id, emp.password_hash, emp.role]
      );
    }
    authWritten++;

    // employee_profile
    if (!VERIFY_ONLY) {
      await conn.query(
        `INSERT INTO employee_profile
           (employee_id, phone, alt_phone, discord_username, emergency_contact, dob, bio, address,
            timezone, work_hours, leave_policy_accepted, leave_policy_accepted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           phone = VALUES(phone), alt_phone = VALUES(alt_phone), discord_username = VALUES(discord_username),
           emergency_contact = VALUES(emergency_contact), dob = VALUES(dob), bio = VALUES(bio), address = VALUES(address),
           timezone = VALUES(timezone), work_hours = VALUES(work_hours),
           leave_policy_accepted = VALUES(leave_policy_accepted), leave_policy_accepted_at = VALUES(leave_policy_accepted_at)`,
        [
          emp.id,
          emp.phone,
          emp.alt_phone,
          emp.discord_username,
          emp.emergency_contact,
          emp.dob,
          emp.bio,
          emp.address,
          emp.timezone,
          emp.work_hours,
          emp.leave_policy_accepted,
          emp.leave_policy_accepted_at,
        ]
      );
    }
    profileWritten++;

    // employee_job_history — one "current" row (effective_to NULL) per employee.
    // Re-runs must not duplicate the current row, so check first.
    const effectiveFrom = emp.start_date || emp.created_at;
    if (!VERIFY_ONLY) {
      const [[existingJob]]: any = await conn.query(
        'SELECT id FROM employee_job_history WHERE employee_id = ? AND effective_to IS NULL',
        [emp.id]
      );
      if (!existingJob) {
        const [[dept]]: any = emp.department
          ? await conn.query('SELECT id FROM departments WHERE name = ?', [emp.department])
          : [[null]];
        const [[desig]]: any = emp.designation
          ? await conn.query('SELECT id FROM designations WHERE title = ?', [emp.designation])
          : [[null]];
        await conn.query(
          `INSERT INTO employee_job_history
             (employee_id, designation_id, department_id, manager_id, effective_from, change_reason)
           VALUES (?, ?, ?, ?, ?, 'backfill')`,
          [emp.id, desig?.id ?? null, dept?.id ?? null, emp.manager_id, effectiveFrom]
        );
      }
    }
    jobHistWritten++;

    // employee_compensation_history — only if a salary is set; same "one current row" rule.
    if (emp.salary != null) {
      if (!VERIFY_ONLY) {
        const [[existingComp]]: any = await conn.query(
          'SELECT id FROM employee_compensation_history WHERE employee_id = ? AND effective_to IS NULL',
          [emp.id]
        );
        if (!existingComp) {
          await conn.query(
            `INSERT INTO employee_compensation_history
               (employee_id, salary, pay_frequency, effective_from, change_reason)
             VALUES (?, ?, ?, ?, 'backfill')`,
            [emp.id, emp.salary, emp.pay_frequency, effectiveFrom]
          );
        }
      }
      compHistWritten++;
    }

    // employee_documents — one row per non-null doc column, best-effort uploaded_at.
    const docs: [string, string | null][] = [
      ['profile_picture', emp.profile_picture],
      ['citizenship_front', emp.citizenship_front],
      ['citizenship_back', emp.citizenship_back],
    ];
    for (const [docType, filename] of docs) {
      if (!filename) continue;
      if (!VERIFY_ONLY) {
        const [[existingDoc]]: any = await conn.query(
          'SELECT id FROM employee_documents WHERE employee_id = ? AND doc_type = ? AND is_current = TRUE',
          [emp.id, docType]
        );
        if (!existingDoc) {
          await conn.query(
            `INSERT INTO employee_documents (employee_id, doc_type, filename, uploaded_at, is_current)
             VALUES (?, ?, ?, ?, TRUE)`,
            [emp.id, docType, filename, emp.created_at]
          );
        }
      }
      docsWritten++;
    }
  }

  console.log(`employee_auth:                 ${authWritten} row(s)`);
  console.log(`employee_profile:               ${profileWritten} row(s)`);
  console.log(`employee_job_history (current): ${jobHistWritten} row(s)`);
  console.log(`employee_compensation_history:  ${compHistWritten} row(s) (salary IS NOT NULL only)`);
  console.log(`employee_documents:             ${docsWritten} row(s) (non-null filename only)`);

  // ── 3. Verification: diff row counts / spot-check values ────────────────
  console.log('\n── Verification ──');
  const [[empCount]]: any = await conn.query('SELECT COUNT(*) AS n FROM employees');
  const [[authCount]]: any = await conn.query('SELECT COUNT(*) AS n FROM employee_auth');
  const [[profileCount]]: any = await conn.query('SELECT COUNT(*) AS n FROM employee_profile');
  console.log(`employees: ${empCount.n} | employee_auth: ${authCount.n} | employee_profile: ${profileCount.n}`);
  if (authCount.n !== empCount.n || profileCount.n !== empCount.n) {
    console.warn('WARNING: row counts do not match 1:1 — investigate before proceeding to Phase 3.');
  }

  const [mismatches]: any = await conn.query(`
    SELECT e.id, e.email, e.role AS legacy_role, a.role AS auth_role
    FROM employees e JOIN employee_auth a ON a.employee_id = e.id
    WHERE e.role <> a.role OR e.password_hash <=> a.password_hash = 0
  `);
  if (mismatches.length) {
    console.warn(`WARNING: ${mismatches.length} employee_auth row(s) don't match legacy employees columns:`, mismatches);
  } else {
    console.log('employee_auth values match legacy employees.role/password_hash for all rows. ✔');
  }

  await conn.end();
  console.log('\nDone.');
})().catch((err) => {
  console.error('Backfill aborted:', err.message);
  process.exit(1);
});
