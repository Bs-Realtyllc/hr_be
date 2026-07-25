const EmailSettings = require('../models/EmailSettings');
const emailSettingsDto = require('../dtos/emailSettingsDto');

exports.get = async (req, res) => {
  try {
    const row = await EmailSettings.findPublicByEmployeeId(req.params.employeeId);
    // Never return the password to the client
    res.json(row || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.save = async (req, res) => {
  try {
    const data = emailSettingsDto.toSaveInput(req.body);
    const existing = await EmailSettings.findFullByEmployeeId(req.params.employeeId);

    if (!existing && !data.smtp_pass) {
      return res.status(400).json({ error: 'Password is required for initial setup' });
    }

    if (data.smtp_pass) {
      await EmailSettings.upsertWithPassword(req.params.employeeId, data);
      testSmtpAsync(data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_pass);
    } else {
      // Update without touching the stored password
      await EmailSettings.updateWithoutPassword(req.params.employeeId, data);
    }

    res.json({ success: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
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
exports.getForSending = async (employeeId) => EmailSettings.findFullByEmployeeId(employeeId);
