/**
 * Export letter/communication content as PDF.
 * Uses @react-pdf/renderer - dynamically imported to reduce initial bundle size.
 */

import type { ChecklistItem } from "./export-excel";

export async function exportLetterAsPDF(
  subject: string,
  content: string,
  filename?: string
): Promise<void> {
  const { exportLetterAsPDFImpl } = await import("./export-pdf-impl");
  return exportLetterAsPDFImpl(subject, content, filename);
}

export async function exportChecklistAsPDF(
  checklists: ChecklistItem[],
  caseName: string,
  filename?: string
): Promise<void> {
  const { exportChecklistAsPDFImpl } = await import("./export-pdf-impl");
  return exportChecklistAsPDFImpl(checklists, caseName, filename);
}
