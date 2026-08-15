import * as dashboardRepo from '../repositories/dashboard.repository';

export async function getStats() {
  const today = new Date().toISOString().split('T')[0];

  const total_active = await dashboardRepo.countActiveEmployees();
  const on_leave_today = await dashboardRepo.countOnLeaveToday(today);
  const new_hires = await dashboardRepo.countNewHiresLast30Days();
  const pending_leaves = await dashboardRepo.countPendingLeaves();
  const pending_overtime = await dashboardRepo.countPendingOvertime();
  const standups_today = await dashboardRepo.countStandupsToday(today);
  const active_projects = await dashboardRepo.countActiveProjects();

  return {
    total_active,
    on_leave_today,
    present_today: total_active - on_leave_today,
    new_hires_month: new_hires,
    pending_leaves,
    pending_overtime,
    standups_today,
    active_projects,
  };
}

export async function standupTrend() {
  return dashboardRepo.standupTrendLast30Days();
}

export async function leaveTrend() {
  return dashboardRepo.leaveTrendLast30Days();
}
