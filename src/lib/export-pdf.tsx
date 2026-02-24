/**
 * Export letter/communication content as PDF.
 * Uses @react-pdf/renderer for client-side PDF generation.
 */

import { pdf } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#333" },
  header: {
    borderBottom: 1,
    borderBottomColor: "#ebe8e1",
    paddingBottom: 20,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 24, color: "#064e3b" },
  subtitle: { fontSize: 10, color: "#7a857e", textTransform: "uppercase", letterSpacing: 2 },
  address: { fontSize: 10, color: "#666", textAlign: "right", lineHeight: 1.5 },
  heading: { fontSize: 18, color: "#064e3b", marginBottom: 10, borderBottom: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
  text: { marginBottom: 8, lineHeight: 1.6 },
});

function LetterPDF({ subject, content }: { subject: string; content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>minten & walter</Text>
            <Text style={styles.subtitle}>bestattungen</Text>
          </View>
          <View>
            <Text style={styles.address}>Annaberger Straße 133</Text>
            <Text style={styles.address}>53175 Bonn</Text>
            <Text style={styles.address}>0228 620 58 15</Text>
          </View>
        </View>

        {subject && (
          <Text style={styles.heading}>{subject}</Text>
        )}
        <Text style={{ ...styles.text, marginBottom: 20 }}>
          {new Date().toLocaleDateString("de-DE")}
        </Text>

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.text}>
            {p.replace(/\n/g, " ")}
          </Text>
        ))}
      </Page>
    </Document>
  );
}

export async function exportLetterAsPDF(
  subject: string,
  content: string,
  filename?: string
): Promise<void> {
  const blob = await pdf(<LetterPDF subject={subject} content={content} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `Brief_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface ChecklistItem {
  title: string;
  items: { text: string; completed: boolean }[];
}

function ChecklistPDF({ caseName, checklists }: { caseName: string; checklists: ChecklistItem[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>minten & walter</Text>
            <Text style={styles.subtitle}>bestattungen</Text>
          </View>
        </View>
        <Text style={styles.heading}>Checkliste: {caseName}</Text>
        <Text style={{ ...styles.text, marginBottom: 20 }}>
          {new Date().toLocaleDateString("de-DE")}
        </Text>
        {checklists.map((list, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text style={{ ...styles.text, fontWeight: "bold", marginBottom: 8 }}>{list.title}</Text>
            {list.items.map((item, j) => (
              <Text key={j} style={styles.text}>
                {item.completed ? "☑" : "☐"} {item.text}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function exportChecklistAsPDF(
  checklists: ChecklistItem[],
  caseName: string,
  filename?: string
): Promise<void> {
  const blob = await pdf(<ChecklistPDF caseName={caseName} checklists={checklists} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `Checkliste_${caseName.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
