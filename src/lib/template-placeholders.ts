/**
 * Template placeholder replacement for letter and email templates.
 * Placeholders: {{deceased_name}}, {{contact_name}}, {{contact_email}}, {{case_name}}, etc.
 */

import type { Case } from "@/types";

export const PLACEHOLDERS: Record<string, string> = {
  deceased_name: "{{deceased_name}}",
  deceased_firstName: "{{deceased_firstName}}",
  deceased_lastName: "{{deceased_lastName}}",
  deceased_birthDate: "{{deceased_birthDate}}",
  deceased_deathDate: "{{deceased_deathDate}}",
  deceased_deathPlace: "{{deceased_deathPlace}}",
  deceased_address: "{{deceased_address}}",
  contact_name: "{{contact_name}}",
  contact_firstName: "{{contact_firstName}}",
  contact_lastName: "{{contact_lastName}}",
  contact_phone: "{{contact_phone}}",
  contact_email: "{{contact_email}}",
  contact_address: "{{contact_address}}",
  contact_relation: "{{contact_relation}}",
  case_name: "{{case_name}}",
};

export function getPlaceholderValues(caseData: Case): Record<string, string> {
  const deceased = caseData.deceased ?? {};
  const contact = caseData.contact ?? {};
  const deceasedName = [deceased.firstName, deceased.lastName].filter(Boolean).join(" ") || "—";
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—";

  return {
    [PLACEHOLDERS.deceased_name]: deceasedName,
    [PLACEHOLDERS.deceased_firstName]: deceased.firstName ?? "",
    [PLACEHOLDERS.deceased_lastName]: deceased.lastName ?? "",
    [PLACEHOLDERS.deceased_birthDate]: deceased.birthDate ?? "",
    [PLACEHOLDERS.deceased_deathDate]: deceased.deathDate ?? "",
    [PLACEHOLDERS.deceased_deathPlace]: deceased.deathPlace ?? "",
    [PLACEHOLDERS.deceased_address]: deceased.address ?? "",
    [PLACEHOLDERS.contact_name]: contactName,
    [PLACEHOLDERS.contact_firstName]: contact.firstName ?? "",
    [PLACEHOLDERS.contact_lastName]: contact.lastName ?? "",
    [PLACEHOLDERS.contact_phone]: contact.phone ?? "",
    [PLACEHOLDERS.contact_email]: contact.email ?? "",
    [PLACEHOLDERS.contact_address]: contact.address ?? "",
    [PLACEHOLDERS.contact_relation]: contact.relation ?? "",
    [PLACEHOLDERS.case_name]: caseData.name ?? "",
  };
}

export function replacePlaceholders(
  text: string,
  values: Record<string, string>
): string {
  let result = text;
  for (const [placeholder, value] of Object.entries(values)) {
    result = result.split(placeholder).join(value);
  }
  return result;
}

/** Build placeholder values from case wizard form data (for checklist templates at case creation) */
export function getPlaceholderValuesFromFormData(data: {
  deceased?: { firstName?: string; lastName?: string; birthDate?: string; deathDate?: string; deathPlace?: string; address?: string };
  contact?: { firstName?: string; lastName?: string; phone?: string; email?: string; address?: string; relation?: string };
  name?: string;
}): Record<string, string> {
  const deceased = data.deceased ?? {};
  const contact = data.contact ?? {};
  const deceasedName = [deceased.firstName, deceased.lastName].filter(Boolean).join(" ") || "—";
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "—";
  const caseName = (data.name ?? [deceased.lastName, deceased.firstName].filter(Boolean).join(", ")) || "—";

  return {
    [PLACEHOLDERS.deceased_name]: deceasedName,
    [PLACEHOLDERS.deceased_firstName]: deceased.firstName ?? "",
    [PLACEHOLDERS.deceased_lastName]: deceased.lastName ?? "",
    [PLACEHOLDERS.deceased_birthDate]: deceased.birthDate ?? "",
    [PLACEHOLDERS.deceased_deathDate]: deceased.deathDate ?? "",
    [PLACEHOLDERS.deceased_deathPlace]: deceased.deathPlace ?? "",
    [PLACEHOLDERS.deceased_address]: deceased.address ?? "",
    [PLACEHOLDERS.contact_name]: contactName,
    [PLACEHOLDERS.contact_firstName]: contact.firstName ?? "",
    [PLACEHOLDERS.contact_lastName]: contact.lastName ?? "",
    [PLACEHOLDERS.contact_phone]: contact.phone ?? "",
    [PLACEHOLDERS.contact_email]: contact.email ?? "",
    [PLACEHOLDERS.contact_address]: contact.address ?? "",
    [PLACEHOLDERS.contact_relation]: contact.relation ?? "",
    [PLACEHOLDERS.case_name]: caseName,
  };
}

/** Replace placeholders in checklist items */
export function replacePlaceholdersInChecklists(
  checklists: { title: string; items: { text: string; completed: boolean }[] }[],
  values: Record<string, string>
): { title: string; items: { text: string; completed: boolean }[] }[] {
  return checklists.map((list) => ({
    title: replacePlaceholders(list.title, values),
    items: list.items.map((item) => ({
      ...item,
      text: replacePlaceholders(item.text, values),
    })),
  }));
}
