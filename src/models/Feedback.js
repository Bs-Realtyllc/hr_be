const db = require('../db');

const BASE_SELECT = `
  SELECT f.*, s.name AS from_name, s.designation AS from_designation,
         t.name AS to_name, t.designation AS to_designation, p.name AS project_name
  FROM feedback_notes f
  JOIN employees_flat s ON f.from_employee_id = s.id
  JOIN employees_flat t ON f.to_employee_id = t.id
  LEFT JOIN projects p ON f.project_id = p.id
`;

exports.findFeed = async ({ scope, employeeId, type }) => {
  let query = `${BASE_SELECT} WHERE 1=1`;
  const params = [];

  if (scope === 'received') { query += ' AND f.to_employee_id = ?'; params.push(employeeId); }
  if (scope === 'sent')     { query += ' AND f.from_employee_id = ?'; params.push(employeeId); }
  if (scope === 'public')   { query += ' AND f.visibility = \'public\''; }
  if (type)                 { query += ' AND f.feedback_type = ?'; params.push(type); }

  query += ' ORDER BY f.created_at DESC LIMIT 200';
  const [rows] = await db.query(query, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM feedback_notes WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO feedback_notes (from_employee_id, to_employee_id, feedback_type, visibility, message, project_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.from_employee_id, data.to_employee_id, data.feedback_type, data.visibility, data.message, data.project_id]
  );
  return result.insertId;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM feedback_notes WHERE id = ?', [id]);
};

exports.summaryReceivedByEmployee = async () => {
  const [rows] = await db.query(`
    SELECT e.id AS employee_id, e.name AS employee_name,
           COUNT(f.id) AS total_received,
           SUM(f.feedback_type = 'praise') AS praise_count,
           SUM(f.feedback_type = 'constructive') AS constructive_count
    FROM employees_flat e
    LEFT JOIN feedback_notes f ON f.to_employee_id = e.id
    WHERE e.is_active = TRUE
    GROUP BY e.id, e.name
    HAVING total_received > 0
    ORDER BY total_received DESC`);
  return rows;
};
