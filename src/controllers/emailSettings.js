const db = require('../db');

exports.get = async (req, res) => {
  try {
    const [[row]] = await db.query(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_from, default_to, default_cc, default_bcc FROM email_settings WHERE employee_id = ?',
      [req.params.employeeId]
    );
    // Never return the password to the client
    res.json(row || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.save = async (req, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc } = req.body;

  if (!smtp_host || !smtp_user) {
    return res.status(400).json({ error: 'smtp_host and smtp_user are required' });
  }

  const port = smtp_port || 587;
  const from = smtp_from || smtp_user;
  const to   = default_to  || '';
  const cc   = default_cc  || '';
  const bcc  = default_bcc || '';

  try {
    const [[existing]] = await db.query(
      'SELECT id FROM email_settings WHERE employee_id = ?',
      [req.params.employeeId]
    );

    if (!existing && !smtp_pass) {
      return res.status(400).json({ error: 'Password is required for initial setup' });
    }

    if (smtp_pass) {
      await db.query(
        `INSERT INTO email_settings (employee_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, default_to, default_cc, default_bcc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           smtp_host = VALUES(smtp_host), smtp_port = VALUES(smtp_port),
           smtp_user = VALUES(smtp_user), smtp_pass = VALUES(smtp_pass),
           smtp_from = VALUES(smtp_from), default_to = VALUES(default_to),
           default_cc = VALUES(default_cc), default_bcc = VALUES(default_bcc)`,
        [req.params.employeeId, smtp_host, port, smtp_user, smtp_pass, from, to, cc, bcc]
      );
      testSmtpAsync(smtp_host, port, smtp_user, smtp_pass);
    } else {
      // Update without touching the stored password
      await db.query(
        `UPDATE email_settings SET
           smtp_host = ?, smtp_port = ?, smtp_user = ?,
           smtp_from = ?, default_to = ?, default_cc = ?, default_bcc = ?
         WHERE employee_id = ?`,
        [smtp_host, port, smtp_user, from, to, cc, bcc, req.params.employeeId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function testSmtpAsync(host, port, user, pass) {
  const nodemailer = require('nodemailer');
  try {
    const t = nodemailer.createTransport({ host, port: +port, secure: +port === 465, auth: { user, pass } });
    await t.verify();
    console.log(`[email] SMTP OK — ${user}@${host}:${port}`);
  } catch (err) {
    console.error(`[email] SMTP test failed — ${err.message}`);
  }
}

// Called by the leave email sender — returns full row including password
exports.getForSending = async (employeeId) => {
  const [[row]] = await db.query(
    'SELECT * FROM email_settings WHERE employee_id = ?',
    [employeeId]
  );
  return row || null;
};
