const db = require('../db');

exports.findWithNames = async ({ employeeId, status }) => {
  let query = `
    SELECT o.*, e.name AS employee_name, e.designation,
           p.name AS project_name, r.name AS reviewer_name
    FROM overtime_requests o
    JOIN employees e ON o.employee_id = e.id
    LEFT JOIN projects p ON o.project_id = p.id
    LEFT JOIN employees r ON o.reviewed_by = r.id
    WHERE 1=1`;
  const params = [];

  if (employeeId) { query += ' AND o.employee_id = ?'; params.push(employeeId); }
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.create = async ({ employee_id, project_id, work_date, hours, reason, approved_by_name }) => {
  const [result] = await db.query(
    `INSERT INTO overtime_requests (employee_id, project_id, work_date, hours, reason, approved_by_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employee_id, project_id, work_date, hours, reason, approved_by_name]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM overtime_requests WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.findWithEmployeeById = async (id) => {
  const [rows] = await db.query(
    `SELECT o.*, e.name AS employee_name, p.name AS project_name
     FROM overtime_requests o
     JOIN employees e ON o.employee_id = e.id
     LEFT JOIN projects p ON o.project_id = p.id
     WHERE o.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.approve = async (id, reviewerId, { hourlyRate, overtimeRate, amount }) => {
  await db.query(
    `UPDATE overtime_requests
     SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(),
         hourly_rate = ?, overtime_rate = ?, amount = ?
     WHERE id = ?`,
    [reviewerId, hourlyRate, overtimeRate, amount, id]
  );
};

exports.reject = async (id, reviewerId) => {
  await db.query(
    `UPDATE overtime_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [reviewerId, id]
  );
};

exports.update = async (id, { project_id, work_date, hours, reason, approved_by_name }) => {
  await db.query(
    `UPDATE overtime_requests
     SET project_id = ?, work_date = ?, hours = ?, reason = ?, approved_by_name = ?
     WHERE id = ?`,
    [project_id, work_date, hours, reason, approved_by_name, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM overtime_requests WHERE id = ?', [id]);
};
