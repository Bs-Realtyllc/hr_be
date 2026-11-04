import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../config/database';
import { loginHistory, employees } from '../../drizzle/schema';

const loginHistoryColumns = {
  id: loginHistory.id,
  employee_id: loginHistory.employeeId,
  email: loginHistory.email,
  ip_address: loginHistory.ipAddress,
  user_agent: loginHistory.userAgent,
  success: loginHistory.success,
  failure_reason: loginHistory.failureReason,
  created_at: loginHistory.createdAt,
};

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
    employeeId,
    email,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    success,
    failureReason: failureReason ?? null,
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
      .select(loginHistoryColumns)
      .from(loginHistory)
      .where(eq(loginHistory.employeeId, employeeId))
      .orderBy(desc(loginHistory.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(loginHistory)
      .where(eq(loginHistory.employeeId, employeeId)),
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
        eq(loginHistory.employeeId, employeeId),
        eq(loginHistory.success, true),
        eq(loginHistory.ipAddress, ipAddress),
        eq(loginHistory.userAgent, userAgent),
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
        employee_id: loginHistory.employeeId,
        email: loginHistory.email,
        ip_address: loginHistory.ipAddress,
        user_agent: loginHistory.userAgent,
        success: loginHistory.success,
        failure_reason: loginHistory.failureReason,
        created_at: loginHistory.createdAt,
        employee_name: employees.name,
      })
      .from(loginHistory)
      .leftJoin(employees, eq(loginHistory.employeeId, employees.id))
      .orderBy(desc(loginHistory.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(loginHistory),
  ]);

  return { entries, total: countResult[0]?.count ?? 0 };
}
