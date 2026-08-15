import { sql } from 'drizzle-orm';
import { db } from '../config/database';
import { employees, leaveRequests, overtimeRequests, standups, projects } from '../models';

// Same exported function names/signatures as the old src/models/Dashboard.js.
// Pure aggregate reads over tables already modeled by other domains — no new
// table of its own, so no dedicated model file.

async function scalarCount(query: any): Promise<number> {
  const result: any = await db.execute(query);
  return Number(Object.values(result[0][0])[0]);
}

export async function countActiveEmployees() {
  return scalarCount(sql`SELECT COUNT(*) as total_active FROM ${employees} WHERE is_active = TRUE`);
}

export async function countOnLeaveToday(today: string) {
  return scalarCount(sql`
    SELECT COUNT(DISTINCT employee_id) as on_leave_today
    FROM ${leaveRequests}
    WHERE status = 'approved' AND start_date <= ${today} AND end_date >= ${today}
  `);
}

export async function countNewHiresLast30Days() {
  return scalarCount(sql`
    SELECT COUNT(*) as new_hires FROM ${employees}
    WHERE is_active = TRUE AND start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `);
}

export async function countPendingLeaves() {
  return scalarCount(sql`SELECT COUNT(*) as pending_leaves FROM ${leaveRequests} WHERE status = 'pending'`);
}

export async function countPendingOvertime() {
  return scalarCount(sql`SELECT COUNT(*) as pending_overtime FROM ${overtimeRequests} WHERE status = 'pending'`);
}

export async function countStandupsToday(today: string) {
  return scalarCount(sql`SELECT COUNT(*) as standups_today FROM ${standups} WHERE standup_date = ${today}`);
}

export async function countActiveProjects() {
  return scalarCount(sql`SELECT COUNT(*) as active_projects FROM ${projects} WHERE status = 'active'`);
}

export async function standupTrendLast30Days() {
  const result: any = await db.execute(sql`
    SELECT standup_date AS date, COUNT(*) AS count
    FROM ${standups}
    WHERE standup_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY standup_date
    ORDER BY standup_date ASC
  `);
  return result[0] as any[];
}

export async function leaveTrendLast30Days() {
  const result: any = await db.execute(sql`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM ${leaveRequests}
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  return result[0] as any[];
}
