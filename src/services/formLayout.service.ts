import * as formLayoutRepo from "../repositories/formLayout.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";

const TEMPLATE_DIR = path.join(process.cwd(), "uploads/templates");

export async function create(name: string, data: string | Record<string, any>) {
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  return formLayoutRepo.saveFormLayout(name, parsedData);
}

export async function get(name: string) {
//   const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  return formLayoutRepo.getFormLayout(name);
}

interface ContractTemplateInfo {
  filename: string;
  originalName: string;
}

export async function saveContractTemplate(
  name: string,
  filename: string,
  originalName: string,
) {
  const layout = (await formLayoutRepo.getFormLayout(name)) as Record<
    string,
    any
  > | null;
  const previous = layout?.contractTemplate as
    | ContractTemplateInfo
    | undefined;

  await formLayoutRepo.saveFormLayout(name, {
    contractTemplate: { filename, originalName } as ContractTemplateInfo,
  });

  if (previous?.filename) {
    fs.unlink(path.join(TEMPLATE_DIR, previous.filename), () => {});
  }
}

export async function getContractTemplatePath(name: string) {
  const layout = (await formLayoutRepo.getFormLayout(name)) as Record<
    string,
    any
  > | null;
  const template = layout?.contractTemplate as
    | ContractTemplateInfo
    | undefined;

  if (!template?.filename) {
    throw new AppError("No contract template configured.", 404);
  }

  const filePath = path.join(TEMPLATE_DIR, template.filename);
  if (!fs.existsSync(filePath)) {
    throw new AppError("Contract template file is missing.", 404);
  }

  return { filePath, originalName: template.originalName };
}

export async function removeContractTemplate(name: string) {
  const layout = (await formLayoutRepo.getFormLayout(name)) as Record<
    string,
    any
  > | null;
  const template = layout?.contractTemplate as
    | ContractTemplateInfo
    | undefined;

  await formLayoutRepo.saveFormLayout(name, { contractTemplate: null });

  if (template?.filename) {
    fs.unlink(path.join(TEMPLATE_DIR, template.filename), () => {});
  }
}