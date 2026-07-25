const db = require('../db');

exports.findPublicByEmployeeId = async (employeeId) => {
  const [rows] = await db.query(
    'SELECT smtp_host, smtp_port, smtp_user, smtp_from, default_to, default_cc, default_bcc FROM email_settings WHERE employee_id = ?',
    [employeeId]
  );
  return rows[0] || null;
};

// Includes smtp_pass — for server-side sending use only, never return this to a client.
exports.findFullByEmployeeId = async (employeeId) => {
  const [rows] = await db.query('SELECT * FROM email_settings WHERE employee_id = ?', [employeeId]);
  return rows[0] || null;
};

exports.upsertWithPassword = async (employeeId, data) => {
  await db.query(
    `INSERT INTO email_settings (employee_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       smtp_host = VALUES(smtp_host), smtp_port = VALUES(smtp_port),
       smtp_user = VALUES(smtp_user), smtp_pass = VALUES(smtp_pass),
       smtp_from = VALUES(smtp_from), default_to = VALUES(default_to),
       default_cc = VALUES(default_cc), default_bcc = VALUES(default_bcc)`,
    [employeeId, data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_pass,
     data.smtp_from, data.default_to, data.default_cc, data.default_bcc]
  );
};

exports.updateWithoutPassword = async (employeeId, data) => {
  await db.query(
    `UPDATE email_settings SET
       smtp_host = ?, smtp_port = ?, smtp_user = ?,
       smtp_from = ?, default_to = ?, default_cc = ?, default_bcc = ?
     WHERE employee_id = ?`,
    [data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_from,
     data.default_to, data.default_cc, data.default_bcc, employeeId]
  );
};
