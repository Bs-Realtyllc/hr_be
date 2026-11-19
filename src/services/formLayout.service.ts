import * as formLayoutRepo from "../repositories/formLayout.repository";
import AppError from "../pkg/AppError";
import path from "path";
import fs from "fs";
import type { FormFieldConfig } from "../../drizzle/schema";
import {
  FORM_SECTIONS,
  layoutName,
  FormLayoutType,
  FormLayoutSaveInput,
} from "../dtos/formLayout.dto";

const TEMPLATE_DIR = path.join(process.cwd(), "uploads/templates");

export async function save(input: FormLayoutSaveInput, updatedBy: number | null) {
  await formLayoutRepo.upsertSections(input.rows, updatedBy);
}

/** Configured sections for a layout type, keyed by forms_layout.name. */
export async function get(type: FormLayoutType) {
  const names = FORM_SECTIONS.map((section) => layoutName(type, section));
  const [rows, contractTemplate] = await Promise.all([
    formLayoutRepo.getSections(names),
    formLayoutRepo.getContractTemplate(type),
  ]);

  const sections: Record<string, FormFieldConfig[]> = {};
  rows.forEach((row) => {
    sections[row.name] = Array.isArray(row.data) ? row.data : [];
  });
  return { sections, contractTemplate };
}

export async function saveContractTemplate(
  type: FormLayoutType,
  filename: string,
  originalName: string,
  updatedBy: number | null,
) {
  const previous = await formLayoutRepo.getContractTemplate(type);

  await formLayoutRepo.setContractTemplate(
    type,
    { filename, originalName },
    updatedBy,
  );

  if (previous?.filename) {
    fs.unlink(path.join(TEMPLATE_DIR, previous.filename), () => {});
  }
}

export async function getContractTemplatePath(type: FormLayoutType) {
  const template = await formLayoutRepo.getContractTemplate(type);

  if (!template?.filename) {
    throw new AppError("No contract template configured.", 404);
  }

  const filePath = path.join(TEMPLATE_DIR, template.filename);
  if (!fs.existsSync(filePath)) {
    throw new AppError("Contract template file is missing.", 404);
  }

  return { filePath, originalName: template.originalName };
}

export async function removeContractTemplate(
  type: FormLayoutType,
  updatedBy: number | null,
) {
  const template = await formLayoutRepo.getContractTemplate(type);

  await formLayoutRepo.setContractTemplate(type, null, updatedBy);

  if (template?.filename) {
    fs.unlink(path.join(TEMPLATE_DIR, template.filename), () => {});
  }
}
