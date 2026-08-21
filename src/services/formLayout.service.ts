import * as formLayoutRepo from "../repositories/formLayout.repository";
export async function create(name: string, data: string | Record<string, any>) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  return formLayoutRepo.saveFormLayout(name, parsedData);
}

export async function get(name: string) {
//   const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  return formLayoutRepo.getFormLayout(name);
}