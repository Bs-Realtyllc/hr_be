const db = require('../db');

// Matches the original handleCallback query: only needs the row's id to decide insert vs update.
exports.findSingleton = async () => {
  const [rows] = await db.query('SELECT id FROM google_settings LIMIT 1');
  return rows[0] || null;
};

// Matches the original getStatus query.
exports.findConnectionStatus = async () => {
  const [rows] = await db.query('SELECT refresh_token, channel_expiry FROM google_settings LIMIT 1');
  return rows[0] || null;
};

exports.upsertTokens = async ({ refresh_token, access_token, token_expiry }, existingId) => {
  if (existingId) {
    await db.query(
      `UPDATE google_settings SET refresh_token = ?, access_token = ?, token_expiry = ? WHERE id = ?`,
      [refresh_token, access_token, token_expiry, existingId]
    );
  } else {
    await db.query(
      `INSERT INTO google_settings (refresh_token, access_token, token_expiry) VALUES (?, ?, ?)`,
      [refresh_token, access_token, token_expiry]
    );
  }
};

exports.clearTokens = async () => {
  await db.query(`UPDATE google_settings SET refresh_token = NULL, access_token = NULL, token_expiry = NULL`);
};
