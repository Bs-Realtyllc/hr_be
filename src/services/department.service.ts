import * as departmentRepo from "../repositories/department.repository";
import * as positionRepo from "../repositories/position.repository";
import AppError from "../pkg/AppError";

export async function list() {
  return departmentRepo.findAllActive();
}

export async function setHead(departmentId: string, positionId: number | null) {
  const department = await departmentRepo.findById(departmentId);
  if (!department) throw new AppError("Not found", 404);

  if (positionId != null) {
    const position = await positionRepo.findById(positionId);
    if (!position) throw new AppError("Position not found", 404);
    if (position.department_id !== Number(departmentId)) {
      throw new AppError("That position belongs to a different department", 400);
    }
  }

  await departmentRepo.setHead(departmentId, positionId);
}
