const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const PasswordResetToken = require('../models/PasswordResetToken');
const authDto = require('../dtos/authDto');
const authService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = authDto.toLoginInput(req.body);

  console.log(`[auth] Login attempt for ${email}`);

  const emp = await Employee.findAuthByEmail(email);
  if (!emp?.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, emp.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log(`[auth] ${emp.name} (${email}) logged in successfully`);

  const user = authDto.toLoginResponse(emp);
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = authDto.toChangePasswordInput(req.body);

  const currentHash = await Employee.findPasswordHashById(req.user.id);
  if (currentHash) {
    const valid = await bcrypt.compare(current_password, currentHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = await bcrypt.hash(new_password, 10);
  await Employee.updatePasswordHash(req.user.id, hash);
  res.json({ message: 'Password updated' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = authDto.toForgotPasswordInput(req.body);

  const emp = await Employee.findActiveBasicByEmail(email);

  // Always respond the same way to prevent email enumeration
  if (!emp) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.invalidateActiveForEmployee(emp.id);
  await PasswordResetToken.create(emp.id, token, expiresAt);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  if (process.env.MAIL_HOST) {
    try {
      await authService.sendResetEmail(emp.name, email, resetLink);
    } catch (mailErr) {
      console.error('[auth] Failed to send reset email:', mailErr.message);
    }
  } else {
    console.info(`[auth] MAIL_HOST not set — reset link for ${email}: ${resetLink}`);
  }

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, new_password } = authDto.toResetPasswordInput(req.body);

  const row = await PasswordResetToken.findValidByToken(token);
  if (!row) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

  const hash = await bcrypt.hash(new_password, 10);
  await Employee.updatePasswordHash(row.employee_id, hash);
  await PasswordResetToken.markUsed(row.id);

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

module.exports = { login, changePassword, forgotPassword, resetPassword };
