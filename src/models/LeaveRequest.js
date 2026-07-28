const db = require('../db');

exports.findWithNames = async ({ employeeId, status }) => {
  let query = `
    SELECT lr.*, e.name AS employee_name, e.designation,
           r.name AS reviewer_name
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN employees r ON lr.reviewed_by = r.id
    WHERE 1=1`;
  const params = [];

  if (employeeId) { query += ' AND lr.employee_id = ?'; params.push(employeeId); }
  if (status) { query += ' AND lr.status = ?'; params.push(status); }
  query += ' ORDER BY lr.created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.findBalances = async (employeeId, year) => {
  const [rows] = await db.query(
    `SELECT *, (total - taken) AS remaining
     FROM leave_balances
     WHERE employee_id = ? AND year = ?`,
    [employeeId, year]
  );
  return rows;
};

exports.findBalanceForType = async (employeeId, leaveType, year) => {
  const [rows] = await db.query(
    `SELECT *, (total - taken) AS remaining
     FROM leave_balances
     WHERE employee_id = ? AND leave_type = ? AND year = ?`,
    [employeeId, leaveType, year]
  );
  return rows[0] || null;
};

exports.findBalanceTotalsForYear = async (year) => {
  const [rows] = await db.query(
    `SELECT e.id AS employee_id, e.name AS employee_name,
            COALESCE(SUM(lb.total), 0) AS total_leaves,
            COALESCE(SUM(lb.taken), 0) AS total_taken
     FROM employees e
     LEFT JOIN leave_balances lb ON lb.employee_id = e.id AND lb.year = ?
     WHERE e.is_active = TRUE
     GROUP BY e.id, e.name
     ORDER BY e.name`,
    [year]
  );
  return rows;
};

exports.findApprovedRangesForAllInRange = async (rangeStart, rangeEnd) => {
  const [rows] = await db.query(
    `SELECT employee_id, start_date, end_date FROM leave_requests
     WHERE status = 'approved' AND start_date <= ? AND end_date >= ?`,
    [rangeEnd, rangeStart]
  );
  return rows;
};

exports.findOutToday = async (today) => {
  const [rows] = await db.query(
    `SELECT e.name, e.designation, e.profile_picture, lr.leave_type, lr.end_date
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.id
     WHERE lr.status = 'approved' AND ? BETWEEN lr.start_date AND lr.end_date`,
    [today]
  );
  return rows;
};

exports.findOutInRange = async (rangeStart, rangeEnd) => {
  const [rows] = await db.query(
    `SELECT e.name, e.designation, lr.leave_type, lr.start_date, lr.end_date
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.id
     WHERE lr.status = 'approved'
       AND lr.start_date <= ? AND lr.end_date >= ?`,
    [rangeEnd, rangeStart]
  );
  return rows;
};

exports.create = async ({ employee_id, leave_type, start_date, end_date, reason }) => {
  const [result] = await db.query(
    `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [employee_id, leave_type, start_date, end_date, reason]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.findWithEmployeeById = async (id) => {
  const [rows] = await db.query(
    `SELECT lr.*, e.name AS employee_name, e.designation, e.department
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.id
     WHERE lr.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.approve = async (id, reviewerId) => {
  await db.query(
    `UPDATE leave_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [reviewerId, id]
  );
};

// For leaves approved by an external system (no internal reviewer) — e.g. the n8n leave-approval webhook.
exports.approveExternally = async (id) => {
  await db.query(
    `UPDATE leave_requests SET status = 'approved', reviewed_at = NOW() WHERE id = ?`,
    [id]
  );
};

exports.findApprovedForEmployeeInRange = async (employeeId, startDate, endDate) => {
  const [rows] = await db.query(
    `SELECT id FROM leave_requests
     WHERE employee_id = ? AND status = 'approved' AND start_date = ? AND end_date = ?
     LIMIT 1`,
    [employeeId, startDate, endDate]
  );
  return rows[0] || null;
};

exports.reject = async (id, reviewerId) => {
  await db.query(
    `UPDATE leave_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [reviewerId, id]
  );
};

exports.incrementBalanceTaken = async (employeeId, leaveType, year, days) => {
  await db.query(
    `UPDATE leave_balances SET taken = taken + ?
     WHERE employee_id = ? AND leave_type = ? AND year = ?`,
    [days, employeeId, leaveType, year]
  );
};

exports.update = async (id, { leave_type, start_date, end_date, reason }) => {
  await db.query(
    'UPDATE leave_requests SET leave_type = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?',
    [leave_type, start_date, end_date, reason, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM leave_requests WHERE id = ?', [id]);
};
