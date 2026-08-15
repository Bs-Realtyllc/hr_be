const db = require('../db');

exports.findWithNames = async ({ employeeId, status, category }) => {
  let query = `
    SELECT g.*, e.name AS employee_name, e.designation, e.department,
           c.name AS created_by_name
    FROM goals g
    JOIN employees_flat e ON g.employee_id = e.id
    LEFT JOIN employees_flat c ON g.created_by = c.id
    WHERE 1=1`;
  const params = [];

  if (employeeId) { query += ' AND g.employee_id = ?'; params.push(employeeId); }
  if (status)     { query += ' AND g.status = ?'; params.push(status); }
  if (category)   { query += ' AND g.category = ?'; params.push(category); }
  query += ' ORDER BY FIELD(g.status, \'at_risk\',\'in_progress\',\'not_started\',\'completed\',\'missed\'), g.due_date IS NULL, g.due_date ASC';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM goals WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO goals
       (employee_id, title, description, category, metric_unit, target_value, current_value,
        weight, status, start_date, due_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.employee_id, data.title, data.description, data.category, data.metric_unit,
     data.target_value, data.current_value, data.weight, data.status,
     data.start_date, data.due_date, data.created_by]
  );
  return result.insertId;
};

exports.updateProgress = async (id, { current_value, status }) => {
  await db.query(
    'UPDATE goals SET current_value = ?, status = ? WHERE id = ?',
    [current_value, status, id]
  );
};

exports.update = async (id, data) => {
  await db.query(
    `UPDATE goals SET title = ?, description = ?, category = ?, metric_unit = ?,
       target_value = ?, weight = ?, start_date = ?, due_date = ? WHERE id = ?`,
    [data.title, data.description, data.category, data.metric_unit,
     data.target_value, data.weight, data.start_date, data.due_date, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM goals WHERE id = ?', [id]);
};

exports.summaryByEmployee = async () => {
  const [rows] = await db.query(`
    SELECT e.id AS employee_id, e.name AS employee_name,
           COUNT(g.id) AS total_goals,
           SUM(g.status = 'completed') AS completed_goals,
           SUM(g.status = 'at_risk') AS at_risk_goals,
           AVG(CASE WHEN g.target_value > 0 THEN LEAST(g.current_value / g.target_value, 1) * 100 ELSE NULL END) AS avg_progress
    FROM employees_flat e
    LEFT JOIN goals g ON g.employee_id = e.id
    WHERE e.is_active = TRUE
    GROUP BY e.id, e.name
    HAVING total_goals > 0
    ORDER BY e.name`);
  return rows;
};
