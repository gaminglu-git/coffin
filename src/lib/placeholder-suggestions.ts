/**
 * Placeholder suggestions for @-dropdown in template editor.
 * Maps human-readable labels to {{placeholder}} keys used by replacePlaceholders.
 */

export interface PlaceholderSuggestion {
  id: string;
  label: string;
  placeholder: string; // e.g. "{{deceased_name}}"
  category: string;
}

export const PLACEHOLDER_CATEGORIES = {
  deceased: "Verstorbener",
  contact: "Kontakt",
  case: "Fall",
} as const;

export const PLACEHOLDER_SUGGESTIONS: PlaceholderSuggestion[] = [
  { id: "deceased_name", label: "Name Verstorbener", placeholder: "{{deceased_name}}", category: "deceased" },
  { id: "deceased_firstName", label: "Vorname Verstorbener", placeholder: "{{deceased_firstName}}", category: "deceased" },
  { id: "deceased_lastName", label: "Nachname Verstorbener", placeholder: "{{deceased_lastName}}", category: "deceased" },
  { id: "deceased_birthDate", label: "Geburtsdatum", placeholder: "{{deceased_birthDate}}", category: "deceased" },
  { id: "deceased_deathDate", label: "Sterbedatum", placeholder: "{{deceased_deathDate}}", category: "deceased" },
  { id: "deceased_deathPlace", label: "Sterbeort", placeholder: "{{deceased_deathPlace}}", category: "deceased" },
  { id: "deceased_address", label: "Adresse Verstorbener", placeholder: "{{deceased_address}}", category: "deceased" },
  { id: "contact_name", label: "Name Kontakt", placeholder: "{{contact_name}}", category: "contact" },
  { id: "contact_firstName", label: "Vorname Kontakt", placeholder: "{{contact_firstName}}", category: "contact" },
  { id: "contact_lastName", label: "Nachname Kontakt", placeholder: "{{contact_lastName}}", category: "contact" },
  { id: "contact_phone", label: "Telefon Kontakt", placeholder: "{{contact_phone}}", category: "contact" },
  { id: "contact_email", label: "E-Mail Kontakt", placeholder: "{{contact_email}}", category: "contact" },
  { id: "contact_address", label: "Adresse Kontakt", placeholder: "{{contact_address}}", category: "contact" },
  { id: "contact_relation", label: "Verwandtschaft", placeholder: "{{contact_relation}}", category: "contact" },
  { id: "case_name", label: "Fallname", placeholder: "{{case_name}}", category: "case" },
];

/** Filter suggestions by query (case-insensitive, matches label or id) */
export function filterPlaceholderSuggestions(query: string): PlaceholderSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return PLACEHOLDER_SUGGESTIONS;
  return PLACEHOLDER_SUGGESTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
  );
}
