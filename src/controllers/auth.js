const crypto = require('crypto');
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const ALLOWED_DOMAINS = ['bsrealtyllc.com', 'gitgi.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return res.status(403).json({ error: 'Access restricted to organization members only. Please use your company email.' });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, role, designation, department, password_hash
       FROM employees WHERE email = ? AND is_active = TRUE`,
      [email]
    );

    const emp = rows[0];
    if (!emp?.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, emp.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...user } = emp;
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [rows] = await db.query(
      'SELECT password_hash FROM employees WHERE id = ?',
      [req.user.id]
    );

    const emp = rows[0];
    if (emp?.password_hash) {
      const valid = await bcrypt.compare(current_password, emp.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const [[emp]] = await db.query(
      'SELECT id, name FROM employees WHERE email = ? AND is_active = TRUE',
      [email]
    );

    // Always respond the same way to prevent email enumeration
    if (!emp) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing unused tokens for this employee
    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE employee_id = ? AND used_at IS NULL',
      [emp.id]
    );
    await db.query(
      'INSERT INTO password_reset_tokens (employee_id, token, expires_at) VALUES (?, ?, ?)',
      [emp.id, token, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    if (process.env.MAIL_HOST) {
      try {
        await sendResetEmail(emp.name, email, resetLink);
      } catch (mailErr) {
        console.error('[auth] Failed to send reset email:', mailErr.message);
      }
    } else {
      console.info(`[auth] MAIL_HOST not set — reset link for ${email}: ${resetLink}`);
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function resetPassword(req, res) {
  const { token, new_password } = req.body;
  if (!token || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Token and new password (min 6 characters) are required' });
  }

  try {
    const [[row]] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
      [token]
    );

    if (!row) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, row.employee_id]);
    await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [row.id]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function sendResetEmail(name, to, resetLink) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: 'HR Platform — Password Reset',
    html: `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password.
         This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetLink}" style="color:#4f46e5;font-weight:bold">Reset My Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px">HR Platform</p>
    `,
  });
}

module.exports = { login, changePassword, forgotPassword, resetPassword };
