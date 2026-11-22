import * as designationRepo from "../repositories/designation.repository";

export async function list() {
  return designationRepo.findAllActive();
}
