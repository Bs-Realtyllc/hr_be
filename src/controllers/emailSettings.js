const EmailSettings = require('../models/EmailSettings');
const emailSettingsDto = require('../dtos/emailSettingsDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.get = asyncHandler(async (req, res) => {
  const row = await EmailSettings.findPublicByEmployeeId(req.params.employeeId);
  // Never return the password to the client
  res.json(row || null);
});

exports.save = asyncHandler(async (req, res) => {
  const data = emailSettingsDto.toSaveInput(req.body);
  const existing = await EmailSettings.findFullByEmployeeId(req.params.employeeId);

  if (!existing && !data.smtp_pass) {
    throw new AppError('Password is required for initial setup', 400);
  }

  if (data.smtp_pass) {
    await EmailSettings.upsertWithPassword(req.params.employeeId, data);
    testSmtpAsync(data.smtp_host, data.smtp_port, data.smtp_user, data.smtp_pass);
  } else {
    // Update without touching the stored password
    await EmailSettings.updateWithoutPassword(req.params.employeeId, data);
  }

  res.json({ success: true });
});

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
