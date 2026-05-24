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

exports.payrollSummary = async (req, res) => {
  try {
    const [[emp]] = await db.query(
      'SELECT id, name, designation, department, salary, pay_frequency, start_date FROM employees WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (!emp) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Count Mon–Fri working days in current month
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [leaveRows] = await db.query(
      `SELECT start_date, end_date FROM leave_requests
       WHERE employee_id = ? AND status = 'approved'
         AND start_date <= ? AND end_date >= ?`,
      [req.params.id, monthEnd, monthStart]
    );

    let leaveDays = 0;
    for (const lr of leaveRows) {
      const s = new Date(Math.max(new Date(lr.start_date), new Date(monthStart)));
      const e = new Date(Math.min(new Date(lr.end_date),   new Date(monthEnd)));
      for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) leaveDays++;
      }
    }

    const presentDays = workingDays - leaveDays;
    const dailyRate   = emp.salary ? emp.salary / workingDays : 0;

    res.json({
      ...emp,
      working_days_this_month: workingDays,
      leave_days_this_month:   leaveDays,
      present_days:            presentDays,
      daily_rate:              Math.round(dailyRate),
      expected_pay:            Math.round(dailyRate * presentDays),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
