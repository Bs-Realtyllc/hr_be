import { eq, inArray } from "drizzle-orm";
import { db } from "../config/database";
import { formsLayout, FormFieldConfig } from "../../drizzle/schema";
import type {
  ContractTemplateInfo,
  FormLayoutRowInput,
} from "../dtos/formLayout.dto";

/** Upserts one forms_layout row per section, all-or-nothing. */
export async function upsertSections(
  rows: FormLayoutRowInput[],
  updatedBy: number | null,
) {
  await db.transaction(async (tx) => {
    for (const { name, data } of rows) {
      await tx
        .insert(formsLayout)
        .values({ name, data, updatedBy })
        // Set updatedAt explicitly: ON UPDATE CURRENT_TIMESTAMP only fires when
        // a value actually changes, and a re-save should still bump it.
        .onDuplicateKeyUpdate({ set: { data, updatedBy, updatedAt: new Date() } });
    }
  });
}

export async function getSections(names: string[]) {
  if (!names.length) return [];
  return db
    .select({ name: formsLayout.name, data: formsLayout.data })
    .from(formsLayout)
    .where(inArray(formsLayout.name, names));
}

// The contract template still lives in the legacy row named after the layout
// type ("intern" / "employee") as { contractTemplate: {...} }, so templates
// uploaded before the per-section layout rows keep working. That row's data
// isn't a FormFieldConfig[], hence the casts.
type LegacyTemplateData = { contractTemplate?: ContractTemplateInfo | null };

export async function getContractTemplate(
  type: string,
): Promise<ContractTemplateInfo | null> {
  const result = await db
    .select({ data: formsLayout.data })
    .from(formsLayout)
    .where(eq(formsLayout.name, type))
    .limit(1);
  const data = result[0]?.data as unknown as LegacyTemplateData | null;
  return data?.contractTemplate ?? null;
}

export async function setContractTemplate(
  type: string,
  template: ContractTemplateInfo | null,
  updatedBy: number | null,
) {
  const data = {
    contractTemplate: template,
  } as unknown as FormFieldConfig[];
  await db
    .insert(formsLayout)
    .values({ name: type, data, updatedBy })
    .onDuplicateKeyUpdate({ set: { data, updatedBy, updatedAt: new Date() } });
}
