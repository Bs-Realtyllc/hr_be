const db = require('../db');

exports.countActiveEmployees = async () => {
  const [[{ total_active }]] = await db.query(
    'SELECT COUNT(*) as total_active FROM employees WHERE is_active = TRUE'
  );
  return total_active;
};

exports.countOnLeaveToday = async (today) => {
  const [[{ on_leave_today }]] = await db.query(
    `SELECT COUNT(DISTINCT employee_id) as on_leave_today
     FROM leave_requests
     WHERE status = 'approved' AND start_date <= ? AND end_date >= ?`,
    [today, today]
  );
  return on_leave_today;
};

exports.countNewHiresLast30Days = async () => {
  const [[{ new_hires }]] = await db.query(
    `SELECT COUNT(*) as new_hires FROM employees
     WHERE is_active = TRUE AND start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
  );
  return new_hires;
};

exports.countPendingLeaves = async () => {
  const [[{ pending_leaves }]] = await db.query(
    `SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status = 'pending'`
  );
  return pending_leaves;
};

exports.countPendingOvertime = async () => {
  const [[{ pending_overtime }]] = await db.query(
    `SELECT COUNT(*) as pending_overtime FROM overtime_requests WHERE status = 'pending'`
  );
  return pending_overtime;
};

exports.countStandupsToday = async (today) => {
  const [[{ standups_today }]] = await db.query(
    `SELECT COUNT(*) as standups_today FROM standups WHERE standup_date = ?`,
    [today]
  );
  return standups_today;
};

exports.countActiveProjects = async () => {
  const [[{ active_projects }]] = await db.query(
    `SELECT COUNT(*) as active_projects FROM projects WHERE status = 'active'`
  );
  return active_projects;
};

exports.standupTrendLast30Days = async () => {
  const [rows] = await db.query(`
      SELECT standup_date AS date, COUNT(*) AS count
      FROM standups
      WHERE standup_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY standup_date
      ORDER BY standup_date ASC
    `);
  return rows;
};

exports.leaveTrendLast30Days = async () => {
  const [rows] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM leave_requests
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
  return rows;
};
