const db = require('../db');

exports.findWithNames = async ({ employeeId, status }) => {
  let query = `
    SELECT pr.*, e.name AS employee_name, e.designation, e.department,
           r.name AS reviewer_name
    FROM performance_reviews pr
    JOIN employees e ON pr.employee_id = e.id
    LEFT JOIN employees r ON pr.reviewer_id = r.id
    WHERE 1=1`;
  const params = [];

  if (employeeId) { query += ' AND pr.employee_id = ?'; params.push(employeeId); }
  if (status)     { query += ' AND pr.status = ?'; params.push(status); }
  query += ' ORDER BY pr.review_period DESC, pr.created_at DESC';

  const [rows] = await db.query(query, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM performance_reviews WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO performance_reviews
       (employee_id, reviewer_id, review_period, overall_rating, category_ratings,
        strengths, improvements, manager_comments, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [data.employee_id, data.reviewer_id, data.review_period, data.overall_rating,
     JSON.stringify(data.category_ratings || {}), data.strengths, data.improvements, data.manager_comments]
  );
  return result.insertId;
};

exports.update = async (id, data) => {
  await db.query(
    `UPDATE performance_reviews SET overall_rating = ?, category_ratings = ?,
       strengths = ?, improvements = ?, manager_comments = ? WHERE id = ?`,
    [data.overall_rating, JSON.stringify(data.category_ratings || {}),
     data.strengths, data.improvements, data.manager_comments, id]
  );
};

exports.submit = async (id) => {
  await db.query(
    `UPDATE performance_reviews SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
    [id]
  );
};

exports.acknowledge = async (id, employeeComments) => {
  await db.query(
    `UPDATE performance_reviews SET status = 'acknowledged', acknowledged_at = NOW(), employee_comments = ? WHERE id = ?`,
    [employeeComments, id]
  );
};

exports.remove = async (id) => {
  await db.query('DELETE FROM performance_reviews WHERE id = ?', [id]);
};

exports.ratingTrendByEmployee = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT review_period, overall_rating FROM performance_reviews
     WHERE employee_id = ? AND status IN ('submitted', 'acknowledged')
     ORDER BY review_period ASC`,
    [employeeId]
  );
  return rows;
};
