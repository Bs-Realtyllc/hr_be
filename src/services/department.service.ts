import * as departmentRepo from "../repositories/department.repository";

export async function list() {
  return departmentRepo.findAllActive();
}
