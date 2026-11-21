import * as positionRepo from '../repositories/position.repository';
import AppError from '../pkg/AppError';
import type { PositionCreateInput, PositionUpdateInput } from '../dtos/position.dto';

function validate(data: PositionCreateInput | PositionUpdateInput) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new AppError('Position title is required', 400);
  }
  if (data.departmentId !== undefined && !data.departmentId) {
    throw new AppError('Department is required', 400);
  }
}

export async function list() {
  return positionRepo.findAllActive();
}

export async function create(data: PositionCreateInput) {
  validate(data);
  return positionRepo.create(data);
}

export async function update(id: string, data: PositionUpdateInput) {
  const existing = await positionRepo.findById(id);
  if (!existing) throw new AppError('Not found', 404);
  validate(data);

  if (data.reportsToPositionId !== undefined) {
    await positionRepo.assertNoPositionCycle(id, data.reportsToPositionId);
  }

  await positionRepo.update(id, data);
}

export async function deactivate(id: string) {
  const existing = await positionRepo.findById(id);
  if (!existing) throw new AppError('Not found', 404);

  const incumbent = await positionRepo.findIncumbent(id);
  if (incumbent) {
    throw new AppError(`Cannot deactivate — ${incumbent.name} currently holds this position`, 400);
  }

  const reports = await positionRepo.findPositionsReportingTo(id);
  if (reports.length) {
    throw new AppError(
      `Cannot deactivate — ${reports.map((r) => r.title).join(', ')} still report${reports.length === 1 ? 's' : ''} to this position`,
      400
    );
  }

  await positionRepo.deactivate(id);
}
