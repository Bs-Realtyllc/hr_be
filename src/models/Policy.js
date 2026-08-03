const db = require('../db');

exports.create = async ({ type, title, filePath, version, uploadedBy, category }) => {
  const [result] = await db.query(
    `INSERT INTO policies (type, title, file_path, version, uploaded_by, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [type, title, filePath, version, uploadedBy, category]
  );
  return result.insertId;
};

exports.findActiveByType = async (type) => {
  const [rows] = await db.query(
    `SELECT * FROM policies WHERE type = ? AND is_active = TRUE
     ORDER BY version DESC LIMIT 1`,
    [type]
  );
  return rows[0] || null;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM policies WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.listActive = async (category) => {
  const conditions = ['p.is_active = TRUE'];
  const params = [];
  if (category !== undefined) {
    conditions.push('p.category = ?');
    params.push(category);
  }
  const [rows] = await db.query(
    `SELECT p.*, e.name AS uploaded_by_name
     FROM policies p
     LEFT JOIN employees e ON p.uploaded_by = e.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.is_pinned DESC, p.type, p.version DESC`,
    params
  );
  return rows;
};

exports.deactivateByType = async (type) => {
  await db.query('UPDATE policies SET is_active = FALSE WHERE type = ?', [type]);
};

exports.remove = async (id) => {
  await db.query('DELETE FROM policies WHERE id = ?', [id]);
};

exports.setPinned = async (id, pinned) => {
  await db.query('UPDATE policies SET is_pinned = ? WHERE id = ?', [pinned, id]);
};
