const db = require('../db');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, m.name AS manager_name
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.is_active = TRUE
       ORDER BY e.name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, m.name AS manager_name
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const {
    name, email, phone, emergency_contact, designation,
    department, manager_id, start_date, timezone, work_hours, tech_stack, role,
  } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO employees
       (name, email, phone, emergency_contact, designation, department, manager_id, start_date, timezone, work_hours, tech_stack, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, emergency_contact, designation, department,
       manager_id || null, start_date, timezone, work_hours,
       JSON.stringify(tech_stack || []), role || 'employee']
    );

    // Seed default leave balances for current year
    const year = new Date().getFullYear();
    await db.query(
      `INSERT INTO leave_balances (employee_id, leave_type, total, taken, year) VALUES
       (?, 'casual', 12, 0, ?),
       (?, 'sick', 10, 0, ?),
       (?, 'annual', 15, 0, ?)`,
      [result.insertId, year, result.insertId, year, result.insertId, year]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const fields = ['name', 'phone', 'discord_username', 'emergency_contact', 'designation', 'department',
                  'manager_id', 'timezone', 'work_hours', 'tech_stack', 'role'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(f === 'tech_stack' ? JSON.stringify(req.body[f]) : req.body[f]);
    }
  });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  try {
    await db.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query(`UPDATE employees SET is_active = FALSE WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
