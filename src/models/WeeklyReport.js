const db = require('../db');

// employeeId === null/undefined => no employee filter (privileged/"all" view).
exports.findWithEmployeeNames = async ({ employeeId, weekStartDate, year }) => {
  let q = `SELECT r.*, e.name AS employee_name, e.designation, e.department
           FROM weekly_reports r
           JOIN employees e ON r.employee_id = e.id
           WHERE 1=1`;
  const p = [];

  if (employeeId) {
    q += ' AND r.employee_id = ?';
    p.push(employeeId);
  }

  if (weekStartDate) { q += ' AND r.week_start_date = ?';        p.push(weekStartDate); }
  if (year)          { q += ' AND YEAR(r.week_start_date) = ?';  p.push(year); }

  q += ' ORDER BY r.week_start_date DESC, r.submitted_at DESC';

  const [rows] = await db.query(q, p);
  return rows;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO weekly_reports (employee_id, title, week_start_date, file_name, file_path, file_size, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.employee_id, data.title, data.week_start_date, data.file_name, data.file_path, data.file_size, data.notes ?? null]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [[report]] = await db.query('SELECT * FROM weekly_reports WHERE id = ?', [id]);
  return report || null;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM weekly_reports WHERE id = ?', [id]);
};
