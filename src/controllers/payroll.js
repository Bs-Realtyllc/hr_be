const db = require('../db');
const bcrypt = require('bcryptjs');

async function getPayroll(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, name, designation, department, role, salary, pay_frequency
       FROM employees WHERE is_active = TRUE ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateSalary(req, res) {
  try {
    const { salary, pay_frequency } = req.body;
    await db.query(
      'UPDATE employees SET salary = ?, pay_frequency = ? WHERE id = ?',
      [salary ?? null, pay_frequency ?? 'monthly', req.params.id]
    );
    res.json({ message: 'Salary updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getPayroll, updateSalary, resetPassword };
