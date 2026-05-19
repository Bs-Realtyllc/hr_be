const db = require('../db');

async function getStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [[{ total_active }]] = await db.query(
      'SELECT COUNT(*) as total_active FROM employees WHERE is_active = TRUE'
    );

    const [[{ on_leave_today }]] = await db.query(
      `SELECT COUNT(DISTINCT employee_id) as on_leave_today
       FROM leave_requests
       WHERE status = 'approved' AND start_date <= ? AND end_date >= ?`,
      [today, today]
    );

    const [[{ new_hires }]] = await db.query(
      `SELECT COUNT(*) as new_hires FROM employees
       WHERE is_active = TRUE AND start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    const [[{ pending_leaves }]] = await db.query(
      `SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status = 'pending'`
    );

    const [[{ standups_today }]] = await db.query(
      `SELECT COUNT(*) as standups_today FROM standups WHERE standup_date = ?`,
      [today]
    );

    const [[{ active_projects }]] = await db.query(
      `SELECT COUNT(*) as active_projects FROM projects WHERE status = 'active'`
    );

    res.json({
      total_active,
      on_leave_today,
      present_today: total_active - on_leave_today,
      new_hires_month: new_hires,
      pending_leaves,
      standups_today,
      active_projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getStats };
