import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../config/database';
import { loginHistory, employees } from '../models';

interface RecordAttemptInput {
  employeeId: number | null;
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  failureReason?: string | null;
}

export async function record({ employeeId, email, ipAddress, userAgent, success, failureReason }: RecordAttemptInput) {
  await db.insert(loginHistory).values({
    employee_id: employeeId,
    email,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
    success,
    failure_reason: failureReason ?? null,
  });
}

interface Pagination {
  page: number;
  limit: number;
}

export async function findByEmployeeId(employeeId: number, { page, limit }: Pagination) {
  const offset = (page - 1) * limit;

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.employee_id, employeeId))
      .orderBy(desc(loginHistory.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(loginHistory)
      .where(eq(loginHistory.employee_id, employeeId)),
  ]);

  return { entries, total: countResult[0]?.count ?? 0 };
}

// ipAddress/userAgent are the same defaulted ('unknown'/null-coalesced) strings
// the login flow already stores, so this is a plain equality match against history.
export async function hasPriorSuccessfulLogin(employeeId: number, ipAddress: string, userAgent: string) {
  const rows = await db
    .select({ id: loginHistory.id })
    .from(loginHistory)
    .where(
      and(
        eq(loginHistory.employee_id, employeeId),
        eq(loginHistory.success, true),
        eq(loginHistory.ip_address, ipAddress),
        eq(loginHistory.user_agent, userAgent),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function findAll({ page, limit }: Pagination) {
  const offset = (page - 1) * limit;

  const [entries, countResult] = await Promise.all([
    db
      .select({
        id: loginHistory.id,
        employee_id: loginHistory.employee_id,
        email: loginHistory.email,
        ip_address: loginHistory.ip_address,
        user_agent: loginHistory.user_agent,
        success: loginHistory.success,
        failure_reason: loginHistory.failure_reason,
        created_at: loginHistory.created_at,
        employee_name: employees.name,
      })
      .from(loginHistory)
      .leftJoin(employees, eq(loginHistory.employee_id, employees.id))
      .orderBy(desc(loginHistory.created_at))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(loginHistory),
  ]);

  return { entries, total: countResult[0]?.count ?? 0 };
}
