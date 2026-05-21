const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' });
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

module.exports = { login, changePassword };
