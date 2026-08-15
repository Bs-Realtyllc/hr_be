const Dashboard = require('../models/Dashboard');
const asyncHandler = require('../middleware/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
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
});

const standupTrend = asyncHandler(async (req, res) => {
  const rows = await Dashboard.standupTrendLast30Days();
  res.json(rows);
});

const leaveTrend = asyncHandler(async (req, res) => {
  const rows = await Dashboard.leaveTrendLast30Days();
  res.json(rows);
});

module.exports = { getStats, standupTrend, leaveTrend };
