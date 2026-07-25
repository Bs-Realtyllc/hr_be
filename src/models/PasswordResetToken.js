const db = require('../db');

exports.invalidateActiveForEmployee = async (employeeId) => {
  await db.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE employee_id = ? AND used_at IS NULL',
    [employeeId]
  );
};

exports.create = async (employeeId, token, expiresAt) => {
  await db.query(
    'INSERT INTO password_reset_tokens (employee_id, token, expires_at) VALUES (?, ?, ?)',
    [employeeId, token, expiresAt]
  );
};

exports.findValidByToken = async (token) => {
  const [rows] = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
};

exports.markUsed = async (id) => {
  await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id]);
};
