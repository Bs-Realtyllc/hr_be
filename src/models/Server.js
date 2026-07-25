const db = require('../db');

const BASE_SELECT = `SELECT s.*, p.name AS project_name FROM servers s LEFT JOIN projects p ON s.project_id = p.id`;

exports.findAll = async (projectId) => {
  let query = `${BASE_SELECT} WHERE 1=1`;
  const params = [];
  if (projectId) { query += ' AND s.project_id = ?'; params.push(projectId); }
  query += ' ORDER BY s.environment, s.name';
  const [rows] = await db.query(query, params);
  return rows;
};

exports.create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO servers (project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.project_id, data.name, data.environment, data.ip_address, data.domain, data.ssh_user, data.notes, data.is_sensitive]
  );
  return result.insertId;
};

exports.update = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);
  values.push(id);
  await db.query(`UPDATE servers SET ${setClause} WHERE id = ?`, values);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM servers WHERE id = ?', [id]);
};
