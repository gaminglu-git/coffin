"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer, CheckCircle, MessageSquare, Heart, X, Key, ImageIcon } from "lucide-react";
import { Case } from "@/types";
import { supabase } from "@/lib/supabase";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// PDF Styles
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#333" },
    header: { borderBottom: 1, borderBottomColor: "#ebe8e1", paddingBottom: 20, marginBottom: 30, flexDirection: "row", justifyContent: "space-between" },
    title: { fontSize: 24, color: "#4a554e" },
    subtitle: { fontSize: 10, color: "#7a857e", textTransform: "uppercase", letterSpacing: 2 },
    address: { fontSize: 10, color: "#666", textAlign: "right", lineHeight: 1.5 },
    heading: { fontSize: 18, color: "#4a554e", marginBottom: 10, borderBottom: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
    text: { marginBottom: 5, lineHeight: 1.5 },
    bold: { fontWeight: "bold" },
    table: { marginTop: 20 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 15, marginTop: 15, borderTopWidth: 2, borderTopColor: "#4a554e" },
    totalText: { fontSize: 16, color: "#4a554e", fontWeight: "bold" },
    footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 10, color: "#888", borderTop: 1, borderTopColor: "#eee", paddingTop: 10 }
});

const QuotePDF = ({ currentCase, extractedPrice }: { currentCase: Case; extractedPrice: string }) => (
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

            <Text style={styles.heading}>Unverbindliches Angebot</Text>
            <Text style={{ ...styles.text, marginBottom: 20 }}>Datum: {new Date().toLocaleDateString("de-DE")}</Text>

            <View style={{ backgroundColor: "#f8f6f3", padding: 15, borderRadius: 5, marginBottom: 30 }}>
                <Text style={styles.text}><Text style={styles.bold}>Für:</Text> {currentCase.name.replace("VORSORGE: ", "")}</Text>
                <Text style={styles.text}><Text style={styles.bold}>Bestattungsart:</Text> {currentCase.wishes?.burialType || "Wird noch besprochen"}</Text>
                {currentCase.wishes?.specialWishes && (
                    <Text style={styles.text}><Text style={styles.bold}>Details & Wünsche:</Text> {currentCase.wishes.specialWishes}</Text>
                )}
            </View>

            <Text style={styles.heading}>Kostenübersicht</Text>
            <View style={styles.table}>
                <View style={styles.row}>
                    <Text style={styles.bold}>Leistung</Text>
                    <Text style={styles.bold}>Geschätzter Preis</Text>
                </View>
                <View style={styles.row}>
                    <Text>Grundleistungen (Beratung, Überführung, Versorgung)</Text>
                    <Text>ab 1.450,00 €</Text>
                </View>
                <View style={styles.row}>
                    <Text>Bestattungsleistungen & Ausstattung (Sarg/Urne, Feier)</Text>
                    <Text>Individuell gem. Wünschen</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalText}>Voraussichtliche Gesamtsumme</Text>
                    <Text style={styles.totalText}>~ {extractedPrice}</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Bitte beachten Sie: Dies ist eine erste, unverbindliche Kostenschätzung. Fremdkosten werden nach tatsächlichem Aufwand abgerechnet.
            </Text>
        </Page>
    </Document>
);

export function CaseDetailModal({ activeCaseId, onClose }: { activeCaseId: string | null; onClose: () => void }) {
    const [currentCase, setCurrentCase] = useState<Case | null>(null);

    useEffect(() => {
        if (!activeCaseId) {
            setCurrentCase(null);
            return;
        }

        const fetchCaseData = async () => {
            const { data, error } = await supabase
                .from("cases")
                .select("*, notes(*), memories(*), family_photos(*)")
                .eq("id", activeCaseId)
                .single();

            if (data && !error) {
                if (data.notes) data.notes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                if (data.memories) data.memories.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                const familyPhotos = data.family_photos?.map((p: any) => ({
                    id: p.id,
                    storagePath: p.storage_path,
                    url: supabase.storage.from("family-files").getPublicUrl(p.storage_path).data.publicUrl,
                    uploadedByName: p.uploaded_by_name,
                    caption: p.caption,
                    createdAt: p.created_at,
                })) || [];

                setCurrentCase({
                    id: data.id,
                    name: data.name,
                    status: data.status,
                    createdAt: data.created_at,
                    familyPin: data.family_pin,
                    wishes: data.wishes,
                    deceased: data.deceased,
                    contact: data.contact,
                    checklists: data.checklists,
                    notes: data.notes?.map((n: any) => ({ id: n.id, text: n.text, author: n.author, createdAt: n.created_at })) || [],
                    memories: data.memories?.map((m: any) => ({ id: m.id, text: m.text, createdAt: m.created_at })) || [],
                    familyPhotos,
                });
            }
        };
        fetchCaseData();
    }, [activeCaseId]);

    const [newNote, setNewNote] = useState("");

    if (!currentCase) return null;

    let extractedPrice = "Auf Anfrage";
    if (currentCase.wishes?.specialWishes) {
        const match = currentCase.wishes.specialWishes.match(/Kostenschätzung:\s*([0-9.,]+)\s*€/);
        if (match) extractedPrice = match[1] + " €";
    }

    const generateAndDownloadPDF = async () => {
        try {
            const blob = await pdf(<QuotePDF currentCase={currentCase} extractedPrice={extractedPrice} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Angebot_${currentCase.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation failed", err);
            alert("Fehler bei der PDF-Erstellung.");
        }
    };

    return (
        <Dialog open={!!activeCaseId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl lg:max-w-6xl p-0 overflow-hidden bg-mw-offwhite rounded-3xl border-0 max-h-[min(90vh,100dvh)] flex flex-col">
                <DialogHeader className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shrink-0 z-10 min-w-0">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="bg-mw-green p-3 rounded-xl text-white">
                            <FileText size={28} />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-xl sm:text-2xl font-serif text-gray-800 wrap-break-word">{currentCase.name}</DialogTitle>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium border border-gray-200">{currentCase.status}</span>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 border border-blue-200" title="Code für das Angehörigen-Portal">
                                    <Key size={12} /> PIN: {currentCase.familyPin || "Keiner"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                        <button
                            onClick={generateAndDownloadPDF}
                            className="bg-white border border-mw-green text-mw-green px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mw-sand-light transition flex items-center gap-2 shadow-sm"
                        >
                            <Printer size={16} /> Angebot als PDF
                        </button>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full transition">
                            <X size={20} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
                    {/* Left Column: Details & Checklists */}
                    <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto border-r border-gray-200 min-w-0 min-h-0">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
                            <h3 className="font-medium text-mw-green mb-4 border-b pb-2 flex justify-between items-center">
                                Informationen <span className="bg-mw-offwhite text-gray-500 text-xs px-2 py-1 rounded border">{currentCase.wishes?.burialType || "-"}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 sm:gap-x-8 text-sm min-w-0">
                                <div>
                                    <span className="block text-gray-400 text-xs">Verstorben:</span>
                                    <span className="font-medium">{currentCase.deceased?.firstName || currentCase.deceased?.lastName ? `${currentCase.deceased.firstName} ${currentCase.deceased.lastName}` : "Keine Angabe"}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-xs">Ansprechpartner:</span>
                                    <span className="font-medium">{currentCase.contact?.firstName || currentCase.contact?.lastName ? `${currentCase.contact.firstName} ${currentCase.contact.lastName}` : "Keine Angabe"}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-medium text-mw-green mb-6 flex items-center gap-2">
                            <CheckCircle size={20} /> Aufgaben
                        </h3>
                        {currentCase.checklists?.map((list, listIndex) => {
                            const completedCount = list.items.filter((i) => i.completed).length;
                            const progress = list.items.length === 0 ? 0 : (completedCount / list.items.length) * 100;
                            return (
                                <div key={listIndex} className="mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="font-medium text-gray-700">{list.title}</h4>
                                        <span className="text-xs text-gray-500 font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                                        <div className="bg-mw-green h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="space-y-2">
                                        {list.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${item.completed ? "bg-gray-100" : "hover:bg-white border border-transparent hover:border-gray-200 shadow-sm"}`}>
                                                <div className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${item.completed ? "bg-green-500 border-green-500" : "border-gray-400 bg-white"}`}>
                                                    {item.completed && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <span className={`text-sm ${item.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Notes & Memories */}
                    <div className="w-full lg:w-1/2 flex flex-col min-h-0 min-w-0 bg-[#f3f4f6]">
                        {/* Notes */}
                        <div className="flex-1 flex flex-col min-h-0 border-b border-gray-200">
                            <div className="p-4 bg-white border-b border-gray-200">
                                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-mw-green" /> Interne Team-Notizen
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {currentCase.notes?.map((note) => (
                                    <div key={note.id} className={`p-3 rounded-xl border border-gray-100 ${note.author === "System" ? "bg-blue-50/50" : "bg-white shadow-sm"}`}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-xs text-mw-green">{note.author}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{note.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Memories */}
                        <div className="flex-1 flex flex-col min-h-0 border-b border-gray-200">
                            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                    <Heart size={18} className="text-red-400" /> Erinnerungen der Angehörigen
                                </h3>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Vom Family Portal</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {currentCase.memories?.length === 0 ? (
                                    <p className="text-sm text-center text-gray-400 mt-8 italic">Die Familie hat noch keine Erinnerungen hochgeladen.</p>
                                ) : (
                                    currentCase.memories?.map((mem) => (
                                        <div key={mem.id} className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 relative">
                                            <p className="text-sm text-gray-700 font-serif italic mb-2">"{mem.text}"</p>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(mem.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Lieblingsbilder */}
                        <div className="flex-1 flex flex-col min-h-0 bg-mw-offwhite">
                            <div className="p-4 bg-white border-b border-gray-200">
                                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                    <ImageIcon size={18} className="text-mw-green" /> Lieblingsbilder
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {!currentCase.familyPhotos?.length ? (
                                    <p className="text-sm text-center text-gray-400 mt-4 italic">Noch keine Lieblingsbilder hochgeladen.</p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {currentCase.familyPhotos.map((photo) => (
                                            <a
                                                key={photo.id}
                                                href={photo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-mw-green transition"
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={photo.caption || `Foto von ${photo.uploadedByName}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
