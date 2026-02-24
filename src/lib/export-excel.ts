/**
 * Export content as Excel (xlsx).
 * Uses SheetJS (xlsx) for client-side Excel generation.
 * Dynamically imported to reduce initial bundle size.
 */

export async function exportLetterAsExcel(
  subject: string,
  content: string,
  filename?: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    ["Betreff", subject],
    ["Datum", new Date().toLocaleDateString("de-DE")],
    [],
    ["Inhalt", content],
  ]);
  ws["!cols"] = [{ wch: 15 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Brief");
  XLSX.writeFile(wb, filename ?? `Brief_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface ChecklistItem {
  title: string;
  items: { text: string; completed: boolean }[];
}

export async function exportChecklistAsExcel(
  checklists: ChecklistItem[],
  caseName: string,
  filename?: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const rows: (string | boolean)[][] = [
    ["Checkliste", caseName],
    ["Exportiert am", new Date().toLocaleDateString("de-DE")],
    [],
    ["Gruppe", "Aufgabe", "Erledigt"],
  ];
  for (const list of checklists) {
    for (const item of list.items) {
      rows.push([list.title, item.text, item.completed ? "Ja" : "Nein"]);
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 25 }, { wch: 50 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checkliste");
  XLSX.writeFile(wb, filename ?? `Checkliste_${caseName.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
}
