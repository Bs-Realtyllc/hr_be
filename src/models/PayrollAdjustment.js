const db = require('../db');

exports.create = async ({ employee_id, type, title, amount, year, month, reference_type, reference_id, notes }) => {
  const [result] = await db.query(
    `INSERT INTO payroll_adjustments
     (employee_id, type, title, amount, year, month, reference_type, reference_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee_id, type, title, amount, year, month ?? null, reference_type ?? null, reference_id ?? null, notes ?? null]
  );
  return result.insertId;
};

// Adjustments relevant to one employee's payslip for a given month: that month's
// overtime/deduction entries, plus any year-end bonus (month IS NULL) for that year.
exports.findForEmployeePeriod = async (employeeId, year, month) => {
  const [rows] = await db.query(
    `SELECT * FROM payroll_adjustments
     WHERE employee_id = ? AND year = ? AND (month = ? OR month IS NULL)
     ORDER BY created_at DESC`,
    [employeeId, year, month]
  );
  return rows;
};

// Ledger listing for the Payroll page — privileged users see everyone, employees see their own.
exports.findAll = async ({ employeeId, year, month }) => {
  let query = `
    SELECT pa.*, e.name AS employee_name, e.designation
    FROM payroll_adjustments pa
    JOIN employees e ON pa.employee_id = e.id
    WHERE 1=1`;
  const params = [];
  if (employeeId) { query += ' AND pa.employee_id = ?'; params.push(employeeId); }
  if (year) { query += ' AND pa.year = ?'; params.push(year); }
  if (month) { query += ' AND pa.month = ?'; params.push(month); }
  query += ' ORDER BY pa.created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
};

// Per-employee totals for the given month (overtime/deduction) and year (bonus is month-less).
exports.summaryForPeriod = async (year, month) => {
  const [rows] = await db.query(
    `SELECT employee_id,
            COALESCE(SUM(CASE WHEN type = 'overtime_pay'   AND month = ? THEN amount END), 0) AS overtime_pay,
            COALESCE(SUM(CASE WHEN type = 'leave_deduction' AND month = ? THEN amount END), 0) AS leave_deduction,
            COALESCE(SUM(CASE WHEN type = 'leave_bonus'     AND year = ?  THEN amount END), 0) AS leave_bonus
     FROM payroll_adjustments
     WHERE year = ?
     GROUP BY employee_id`,
    [month, month, year, year]
  );
  return rows;
};

exports.existsBonusForYear = async (employeeId, year) => {
  const [rows] = await db.query(
    `SELECT id FROM payroll_adjustments WHERE employee_id = ? AND type = 'leave_bonus' AND year = ? LIMIT 1`,
    [employeeId, year]
  );
  return !!rows[0];
};
