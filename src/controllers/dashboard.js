const Dashboard = require('../models/Dashboard');

async function getStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const total_active = await Dashboard.countActiveEmployees();
    const on_leave_today = await Dashboard.countOnLeaveToday(today);
    const new_hires = await Dashboard.countNewHiresLast30Days();
    const pending_leaves = await Dashboard.countPendingLeaves();
    const pending_overtime = await Dashboard.countPendingOvertime();
    const standups_today = await Dashboard.countStandupsToday(today);
    const active_projects = await Dashboard.countActiveProjects();

    res.json({
      total_active,
      on_leave_today,
      present_today: total_active - on_leave_today,
      new_hires_month: new_hires,
      pending_leaves,
      pending_overtime,
      standups_today,
      active_projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function standupTrend(req, res) {
  try {
    const rows = await Dashboard.standupTrendLast30Days();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function leaveTrend(req, res) {
  try {
    const rows = await Dashboard.leaveTrendLast30Days();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStats, standupTrend, leaveTrend };
