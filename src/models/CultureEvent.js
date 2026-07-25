const db = require('../db');

exports.findUpcoming = async () => {
  const [rows] = await db.query(
    `SELECT ce.*, e.name AS employee_name, e.profile_picture
     FROM culture_events ce
     LEFT JOIN employees e ON ce.employee_id = e.id
     WHERE ce.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
     ORDER BY ce.event_date ASC`
  );
  return rows;
};

exports.findRecent = async () => {
  const [rows] = await db.query(
    `SELECT ce.*, e.name AS employee_name
     FROM culture_events ce
     LEFT JOIN employees e ON ce.employee_id = e.id
     ORDER BY ce.event_date DESC LIMIT 50`
  );
  return rows;
};

exports.create = async ({ title, event_type, employee_id, event_date, description }) => {
  const [result] = await db.query(
    `INSERT INTO culture_events (title, event_type, employee_id, event_date, description)
     VALUES (?, ?, ?, ?, ?)`,
    [title, event_type, employee_id || null, event_date, description]
  );
  return result.insertId;
};

exports.findBirthdayByEmployeeId = async (employeeId) => {
  const [rows] = await db.query(
    'SELECT id FROM culture_events WHERE employee_id = ? AND event_type = "birthday" LIMIT 1',
    [employeeId]
  );
  return rows[0] || null;
};

exports.updateDateAndTitle = async (id, date, title) => {
  await db.query('UPDATE culture_events SET event_date = ?, title = ? WHERE id = ?', [date, title, id]);
};

exports.createBirthday = async (employeeId, date, title, description) => {
  await db.query(
    'INSERT INTO culture_events (title, event_type, employee_id, event_date, description) VALUES (?, "birthday", ?, ?, ?)',
    [title, employeeId, date, description]
  );
};
