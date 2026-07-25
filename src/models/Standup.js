const db = require('../db');

exports.findWithNames = async ({ employeeId, date, startDate, endDate }) => {
  let query = `
    SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
    FROM standups s JOIN employees e ON s.employee_id = e.id
    WHERE 1=1`;
  const params = [];

  if (employeeId) {
    query += ' AND s.employee_id = ?';
    params.push(employeeId);
  }

  if (date) {
    query += ' AND s.standup_date = ?';
    params.push(date);
  } else {
    if (startDate) { query += ' AND s.standup_date >= ?'; params.push(startDate); }
    if (endDate)   { query += ' AND s.standup_date <= ?'; params.push(endDate); }
  }
  query += ' ORDER BY s.standup_date DESC, s.created_at DESC LIMIT 200';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.findToday = async (today, employeeId) => {
  let query = `
    SELECT s.*, e.name AS employee_name, e.designation, e.profile_picture
    FROM standups s JOIN employees e ON s.employee_id = e.id
    WHERE s.standup_date = ?`;
  const params = [today];

  if (employeeId) {
    query += ' AND s.employee_id = ?';
    params.push(employeeId);
  }
  query += ' ORDER BY s.created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.upsert = async ({ employee_id, yesterday, today, blockers, standup_date }) => {
  const date = standup_date || new Date().toISOString().split('T')[0];
  const [result] = await db.query(
    `INSERT INTO standups (employee_id, yesterday, today, blockers, standup_date)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE yesterday = VALUES(yesterday), today = VALUES(today), blockers = VALUES(blockers)`,
    [employee_id, yesterday, today, blockers, date]
  );
  return result.insertId;
};
