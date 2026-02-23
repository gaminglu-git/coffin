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
