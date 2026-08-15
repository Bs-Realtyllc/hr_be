import { Op } from 'sequelize';
import { PasswordResetToken } from '../models';

// Same exported function names as the old src/models/PasswordResetToken.js.

export async function invalidateActiveForEmployee(employeeId: number | string) {
  await PasswordResetToken.update(
    { used_at: new Date() },
    { where: { employee_id: employeeId, used_at: null } }
  );
}

export async function create(employeeId: number | string, token: string, expiresAt: Date, actorId: number | null = null) {
  await PasswordResetToken.create({
    employee_id: employeeId,
    token,
    expires_at: expiresAt,
    created_by: actorId,
    updated_by: actorId,
    created_at: new Date(),
  } as any);
}

export async function findValidByToken(token: string) {
  const row = await PasswordResetToken.findOne({
    where: { token, used_at: null, expires_at: { [Op.gt]: new Date() } },
  });
  return row ? row.toJSON() : null;
}

export async function markUsed(id: number | string) {
  await PasswordResetToken.update({ used_at: new Date() }, { where: { id } });
}
