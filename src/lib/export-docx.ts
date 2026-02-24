/**
 * Export letter/communication content as Word (docx).
 * Uses docx package for client-side Word generation.
 * Dynamically imported to reduce initial bundle size.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

export async function exportLetterAsDocx(
  subject: string,
  content: string,
  filename?: string
): Promise<void> {
  const paragraphs: Paragraph[] = [];

  if (subject) {
    paragraphs.push(
      new Paragraph({
        text: subject,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("de-DE"),
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  const contentParagraphs = content.split(/\n\n+/).filter(Boolean);
  for (const p of contentParagraphs) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p.replace(/\n/g, " "),
            size: 24, // 12pt
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `Brief_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ChecklistItem {
  title: string;
  items: { text: string; completed: boolean }[];
}

export async function exportChecklistAsDocx(
  checklists: ChecklistItem[],
  caseName: string,
  filename?: string
): Promise<void> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: `Checkliste: ${caseName}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("de-DE"),
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const list of checklists) {
    paragraphs.push(
      new Paragraph({
        text: list.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    );
    for (const item of list.items) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.completed ? "☑" : "☐"} ${item.text}`,
              size: 24,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `Checkliste_${caseName.replace(/[^a-z0-9]/gi, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
