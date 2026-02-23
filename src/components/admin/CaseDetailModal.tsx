"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Printer, CheckCircle, MessageSquare, Heart, X, Key, ImageIcon, Mail, CalendarDays, Send } from "lucide-react";
import { PhotoGallery } from "@/components/admin/PhotoGallery";
import { listCommunications, createCommunication } from "@/app/actions/communications";
import { listContacts } from "@/app/actions/contacts";
import { listEmployees, getCurrentEmployee } from "@/app/actions/employees";
import { Case, Task, Appointment, Communication } from "@/types";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
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

const TYPE_LABELS: Record<string, string> = { email: "E-Mail", letter: "Brief", phone: "Telefon", other: "Sonstiges" };
const DIR_LABELS: Record<string, string> = { incoming: "Eingehend", outgoing: "Ausgehend" };

function CaseCommunicationsTab({
    caseId,
    communications,
    contacts,
    caseTasks,
    caseAppointments,
    onUpdate,
}: {
    caseId: string;
    communications: Communication[];
    contacts: { id: string; displayName: string }[];
    caseTasks: Task[];
    caseAppointments: Appointment[];
    onUpdate: () => void;
}) {
    const [employees, setEmployees] = useState<{ id: string; display_name: string }[]>([]);
    const [type, setType] = useState<"email" | "letter" | "phone" | "other">("email");
    const [direction, setDirection] = useState<"incoming" | "outgoing">("incoming");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [correspondenceId, setCorrespondenceId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [taskId, setTaskId] = useState("");
    const [appointmentId, setAppointmentId] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        listEmployees().then((list) =>
            setEmployees(list.map((e) => ({ id: e.id, display_name: e.display_name })))
        );
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const result = await createCommunication({
            caseId,
            correspondenceId: correspondenceId || null,
            employeeId: employeeId || null,
            taskId: taskId || null,
            appointmentId: appointmentId || null,
            type,
            direction,
            subject: subject.trim() || null,
            content: content.trim() || null,
        });
        if (result.success) {
            setSubject("");
            setContent("");
            setCorrespondenceId("");
            setEmployeeId("");
            setTaskId("");
            setAppointmentId("");
            onUpdate();
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="font-medium text-mw-green text-sm">Neue Kommunikation</h4>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <select value={type} onChange={(e) => setType(e.target.value as "email" | "letter" | "phone" | "other")} className="p-2 rounded-lg border text-sm">
                        {(Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[]).map((k) => <option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
                    </select>
                    <select value={direction} onChange={(e) => setDirection(e.target.value as "incoming" | "outgoing")} className="p-2 rounded-lg border text-sm">
                        <option value="incoming">{DIR_LABELS.incoming}</option>
                        <option value="outgoing">{DIR_LABELS.outgoing}</option>
                    </select>
                </div>
                <select value={correspondenceId} onChange={(e) => setCorrespondenceId(e.target.value)} className="w-full p-2 rounded-lg border text-sm">
                    <option value="">Kontakt (optional)</option>
                    {contacts.map((c) => (
                        <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                </select>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Betreff" className="w-full p-2 rounded-lg border text-sm" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Inhalt / Notiz" rows={2} className="w-full p-2 rounded-lg border text-sm resize-none" />
                <div className="grid grid-cols-2 gap-2">
                    <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="p-2 rounded-lg border text-sm">
                        <option value="">Mitarbeiter (optional)</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                    </select>
                    <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="p-2 rounded-lg border text-sm">
                        <option value="">Aufgabe (optional)</option>
                        {caseTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                    <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} className="p-2 rounded-lg border text-sm">
                        <option value="">Termin (optional)</option>
                        {caseAppointments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                </div>
                <button type="submit" className="bg-mw-green text-white px-3 py-2 rounded-lg text-sm font-medium">Hinzufügen</button>
            </form>
            {communications.length === 0 ? (
                <p className="text-sm text-center text-gray-400 italic">Keine Kommunikation für diesen Fall.</p>
            ) : (
                <div className="space-y-2">
                    {communications.map((c) => (
                        <div key={c.id} className="p-3 rounded-xl bg-white border border-gray-100 text-sm">
                            <div className="flex gap-2 flex-wrap mb-1">
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{TYPE_LABELS[c.type]}</span>
                                <span className="text-xs text-gray-500">{DIR_LABELS[c.direction]}</span>
                                {c.correspondenceId && contacts.find((x) => x.id === c.correspondenceId) && (
                                    <span className="text-xs text-mw-green">
                                        {contacts.find((x) => x.id === c.correspondenceId)!.displayName}
                                    </span>
                                )}
                                {c.employeeId && employees.find((e) => e.id === c.employeeId) && (
                                    <span className="text-xs text-gray-600">
                                        {employees.find((e) => e.id === c.employeeId)!.display_name}
                                    </span>
                                )}
                            </div>
                            {c.subject && <p className="font-medium text-gray-800">{c.subject}</p>}
                            {c.content && <p className="text-gray-600 mt-0.5">{c.content}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString("de-DE")}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function CaseDetailModal({ activeCaseId, onClose }: { activeCaseId: string | null; onClose: () => void }) {
    const [currentCase, setCurrentCase] = useState<Case | null>(null);
    const [caseTasks, setCaseTasks] = useState<Task[]>([]);
    const [caseAppointments, setCaseAppointments] = useState<Appointment[]>([]);
    const [caseCommunications, setCaseCommunications] = useState<Communication[]>([]);
    const [caseContacts, setCaseContacts] = useState<{ id: string; displayName: string }[]>([]);

    const fetchCaseData = useCallback(async () => {
        if (!activeCaseId) return;
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
    }, [activeCaseId]);

    const fetchCaseLinkedData = useCallback(async () => {
        if (!activeCaseId) return;
        const [tasksRes, apptsRes] = await Promise.all([
            supabase.from("tasks").select("*").eq("case_id", activeCaseId).order("created_at", { ascending: false }),
            supabase.from("appointments").select("*").eq("case_id", activeCaseId).order("appointment_date", { ascending: true }),
        ]);
        if (tasksRes.data) {
            setCaseTasks(tasksRes.data.map((t: any) => ({
                id: t.id,
                title: t.title,
                assignee: t.assignee ?? "Alle",
                assigneeId: t.assignee_id,
                dueDate: t.due_date,
                completed: t.completed,
                createdAt: t.created_at,
                caseId: t.case_id,
            })));
        }
        if (apptsRes.data) {
            setCaseAppointments(apptsRes.data.map((a: any) => ({
                id: a.id,
                title: a.title,
                date: a.appointment_date,
                createdAt: a.created_at,
                caseId: a.case_id,
            })));
        }
        const [comms, contactsList] = await Promise.all([
            listCommunications({ caseId: activeCaseId }),
            listContacts({ caseId: activeCaseId }),
        ]);
        setCaseCommunications(comms);
        setCaseContacts(contactsList.map((c) => ({ id: c.id, displayName: c.displayName })));
    }, [activeCaseId]);

    useEffect(() => {
        if (!activeCaseId) {
            setCurrentCase(null);
            setCaseTasks([]);
            setCaseAppointments([]);
            setCaseCommunications([]);
            setCaseContacts([]);
            return;
        }
        fetchCaseData();
        fetchCaseLinkedData();
    }, [activeCaseId, fetchCaseData, fetchCaseLinkedData]);

    const refetchCaseData = useCallback(() => {
        if (activeCaseId) {
            fetchCaseData();
            fetchCaseLinkedData();
        }
    }, [activeCaseId, fetchCaseData, fetchCaseLinkedData]);

    useRealtimeTable(
        { table: "tasks" },
        refetchCaseData,
        `case-detail-tasks-${activeCaseId ?? "none"}`
    );
    useRealtimeTable(
        { table: "appointments" },
        refetchCaseData,
        `case-detail-appointments-${activeCaseId ?? "none"}`
    );
    useRealtimeTable(
        { table: "communications" },
        refetchCaseData,
        `case-detail-communications-${activeCaseId ?? "none"}`
    );
    useRealtimeTable(
        { table: "cases", filter: activeCaseId ? `id=eq.${activeCaseId}` : undefined },
        () => activeCaseId && fetchCaseData(),
        `case-detail-cases-${activeCaseId ?? "none"}`
    );
    useRealtimeTable(
        { table: "notes", filter: activeCaseId ? `case_id=eq.${activeCaseId}` : undefined },
        () => activeCaseId && fetchCaseData(),
        `case-detail-notes-${activeCaseId ?? "none"}`
    );

    const [newNote, setNewNote] = useState("");
    const [currentAuthor, setCurrentAuthor] = useState<string>("Team");
    const [rightTab, setRightTab] = useState<"notes" | "memories" | "gallery" | "correspondences">("notes");

    useEffect(() => {
        getCurrentEmployee().then((emp) => emp && setCurrentAuthor(emp.display_name));
    }, []);

    const addCaseNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseId || !newNote.trim()) return;
        const { error } = await supabase
            .from("notes")
            .insert({ case_id: activeCaseId, text: newNote.trim(), author: currentAuthor });
        if (!error) {
            setNewNote("");
            fetchCaseData();
        } else {
            console.error("Failed to add note:", error);
        }
    };

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

    const rightTabs = [
        { id: "notes" as const, label: "Notizen", icon: MessageSquare },
        { id: "memories" as const, label: "Erinnerungen", icon: Heart },
        { id: "gallery" as const, label: "Galerie", icon: ImageIcon },
        { id: "correspondences" as const, label: "Kommunikation", icon: Mail },
    ] as const;

    return (
        <Dialog open={!!activeCaseId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="!max-w-[calc(100vw-1rem)] sm:!max-w-6xl w-[calc(100vw-1rem)] sm:w-[min(calc(100vw-2rem),72rem)] p-0 overflow-hidden bg-mw-offwhite rounded-2xl sm:rounded-3xl border-0 max-h-[min(95dvh,90vh)] flex flex-col">
                {/* Header – responsive, kompakt auf Mobile */}
                <DialogHeader className="p-3 sm:p-4 md:p-6 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-white shrink-0 z-10 min-w-0">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="bg-mw-green p-2 sm:p-3 rounded-lg sm:rounded-xl text-white shrink-0">
                            <FileText size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-base sm:text-xl md:text-2xl font-serif text-gray-800 break-words leading-tight">
                                {currentCase.name}
                            </DialogTitle>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                                <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 sm:py-1 rounded-md font-medium border border-gray-200">
                                    {currentCase.status}
                                </span>
                                <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 sm:py-1 rounded-md font-bold flex items-center gap-1 border border-blue-200" title="Code für das Angehörigen-Portal">
                                    <Key size={10} className="sm:w-3 sm:h-3" /> PIN: {currentCase.familyPin || "Keiner"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={generateAndDownloadPDF}
                            className="bg-white border border-mw-green text-mw-green px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-mw-sand-light transition flex items-center gap-1.5 sm:gap-2"
                        >
                            <Printer size={14} className="sm:w-4 sm:h-4" /> Angebot als PDF
                        </button>
                        <button onClick={onClose} className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full transition">
                            <X size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
                    {/* Left: Details & Aufgaben – scrollbar auf Mobile */}
                    <div className="w-full lg:w-[min(45%,420px)] shrink-0 lg:shrink p-4 sm:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 min-h-0">
                        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm mb-6 sm:mb-8">
                            <h3 className="font-medium text-mw-green mb-3 sm:mb-4 border-b pb-2 flex justify-between items-center text-sm sm:text-base">
                                Informationen <span className="bg-mw-offwhite text-gray-500 text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded border">{currentCase.wishes?.burialType || "-"}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 sm:gap-x-8 text-sm min-w-0">
                                <div>
                                    <span className="block text-gray-400 text-[10px] sm:text-xs">Verstorben:</span>
                                    <span className="font-medium">{currentCase.deceased?.firstName || currentCase.deceased?.lastName ? `${currentCase.deceased.firstName} ${currentCase.deceased.lastName}` : "Keine Angabe"}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 text-[10px] sm:text-xs">Ansprechpartner:</span>
                                    <span className="font-medium">{currentCase.contact?.firstName || currentCase.contact?.lastName ? `${currentCase.contact.firstName} ${currentCase.contact.lastName}` : "Keine Angabe"}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-base sm:text-lg font-medium text-mw-green mb-4 sm:mb-6 flex items-center gap-2">
                            <CheckCircle size={18} className="sm:w-5 sm:h-5" /> Aufgaben
                        </h3>
                        {caseTasks.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2">Aufgaben (DB)</h4>
                                <div className="space-y-1.5">
                                    {caseTasks.map((t) => (
                                        <div key={t.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${t.completed ? "bg-gray-100 opacity-70" : "bg-white border border-gray-100"}`}>
                                            <CheckCircle size={14} className={t.completed ? "text-green-500 shrink-0" : "text-gray-300 shrink-0"} />
                                            <span className={t.completed ? "line-through text-gray-500" : "text-gray-800"}>{t.title}</span>
                                            {t.dueDate && <span className="text-[10px] text-gray-400 ml-auto">{new Date(t.dueDate).toLocaleDateString("de-DE")}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {caseAppointments.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h4 className="font-medium text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-1"><CalendarDays size={14} /> Termine</h4>
                                <div className="space-y-1.5">
                                    {caseAppointments.map((a) => (
                                        <div key={a.id} className="p-2 rounded-lg text-sm bg-white border border-gray-100">
                                            <span className="font-medium text-gray-800">{a.title}</span>
                                            <span className="text-[10px] text-gray-500 block">{new Date(a.date).toLocaleDateString("de-DE")} · {new Date(a.date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {currentCase.checklists?.map((list, listIndex) => {
                            const completedCount = list.items.filter((i) => i.completed).length;
                            const progress = list.items.length === 0 ? 0 : (completedCount / list.items.length) * 100;
                            return (
                                <div key={listIndex} className="mb-6 sm:mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="font-medium text-gray-700 text-sm sm:text-base">{list.title}</h4>
                                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-3 sm:mb-4 overflow-hidden">
                                        <div className="bg-mw-green h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        {list.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className={`flex items-start gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer transition text-sm ${item.completed ? "bg-gray-100" : "hover:bg-white border border-transparent hover:border-gray-200 shadow-sm"}`}>
                                                <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${item.completed ? "bg-green-500 border-green-500" : "border-gray-400 bg-white"}`}>
                                                    {item.completed && <CheckCircle size={10} className="text-white sm:w-3.5 sm:h-3.5" />}
                                                </div>
                                                <span className={`${item.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Tabs – Notizen | Erinnerungen | Galerie */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f3f4f6]">
                        <div className="flex border-b border-gray-200 bg-white shrink-0">
                            {rightTabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setRightTab(id)}
                                    className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition border-b-2 -mb-px ${
                                        rightTab === id
                                            ? "border-mw-green text-mw-green bg-mw-offwhite/50"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon size={16} className="sm:w-4 sm:h-4 shrink-0" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                            {rightTab === "notes" && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {currentCase.notes?.length === 0 ? (
                                            <p className="text-sm text-center text-gray-400 mt-8 italic">Noch keine Notizen.</p>
                                        ) : (
                                            currentCase.notes?.map((note) => (
                                                <div key={note.id} className={`p-3 rounded-xl border border-gray-100 text-sm ${note.author === "System" ? "bg-blue-50/50" : "bg-white shadow-sm"}`}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-xs text-mw-green">{note.author}</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-700">{note.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={addCaseNote} className="flex gap-2 p-4 bg-white border-t border-gray-200 shrink-0">
                                        <input
                                            type="text"
                                            placeholder="Interne Notiz hinzufügen..."
                                            className="flex-1 p-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-mw-green min-w-0"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark transition shrink-0">
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            )}

                            {rightTab === "memories" && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {currentCase.memories?.length === 0 ? (
                                        <p className="text-sm text-center text-gray-400 mt-8 italic">Die Familie hat noch keine Erinnerungen hochgeladen.</p>
                                    ) : (
                                        currentCase.memories?.map((mem) => (
                                            <div key={mem.id} className="p-4 rounded-xl bg-white shadow-sm border border-gray-100">
                                                <p className="text-gray-700 font-serif italic mb-2 text-sm">"{mem.text}"</p>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(mem.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {rightTab === "gallery" && (
                                <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4">
                                    <PhotoGallery
                                        caseId={currentCase.id}
                                        photos={(currentCase.familyPhotos ?? []).map((p) => ({
                                            id: p.id,
                                            url: p.url,
                                            storagePath: p.storagePath,
                                            uploadedByName: p.uploadedByName,
                                            caption: p.caption,
                                            createdAt: p.createdAt,
                                        }))}
                                        onUpdate={fetchCaseData}
                                    />
                                </div>
                            )}

                            {rightTab === "correspondences" && (
                                <CaseCommunicationsTab
                                    caseId={currentCase.id}
                                    communications={caseCommunications}
                                    contacts={caseContacts}
                                    caseTasks={caseTasks}
                                    caseAppointments={caseAppointments}
                                    onUpdate={fetchCaseLinkedData}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
