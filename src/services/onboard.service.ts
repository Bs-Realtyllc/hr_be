import * as onboardRepo from "../repositories/onboard.repository";

export async function get(type: "intern" | "employee" | "all") {
  return onboardRepo.getOnboardProfile(type);
}

export async function create(data: string | Record<string, any>) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  return onboardRepo.saveOnboardProfile(parsedData);
}

export async function approve(id: number) {
  return onboardRepo.approveOnboardProfile(id);
}

export async function remove(id: number) {
  return onboardRepo.deleteOnboardProfile(id);
}
