"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Trash2, ArrowDownLeft, ArrowUpRight, Printer, Send, FileText, Paperclip } from "lucide-react";
import {
  listCommunications,
  createCommunication,
  deleteCommunication,
  uploadCommunicationDocument,
  getCommunicationDocumentSignedUrl,
} from "@/app/actions/communications";
import { listContacts } from "@/app/actions/contacts";
import { listEmployees } from "@/app/actions/employees";
import { listLetterTemplates, listEmailTemplates } from "@/app/actions/templates";
import { getCaseById } from "@/app/actions/cases";
import type {
  Communication,
  CommunicationType,
  CommunicationDirection,
  LetterTemplate,
  EmailTemplate,
} from "@/types";
import { supabase } from "@/lib/supabase";
import { getPlaceholderValues, replacePlaceholders } from "@/lib/template-placeholders";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { TemplateManager } from "@/components/admin/TemplateManager";

const TYPE_LABELS: Record<CommunicationType, string> = {
  email: "E-Mail",
  letter: "Brief",
  phone: "Telefon",
  other: "Sonstiges",
};

const DIRECTION_LABELS: Record<CommunicationDirection, string> = {
  incoming: "Eingehend",
  outgoing: "Ausgehend",
};

type CaseOption = { id: string; name: string };
type EmployeeOption = { id: string; display_name: string };

export function CommunicationView() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [contacts, setContacts] = useState<{ id: string; displayName: string }[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [appointments, setAppointments] = useState<{ id: string; title: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseFilter, setCaseFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const [formCaseId, setFormCaseId] = useState("");
  const [formCorrespondenceId, setFormCorrespondenceId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formTaskId, setFormTaskId] = useState("");
  const [formAppointmentId, setFormAppointmentId] = useState("");
  const [formType, setFormType] = useState<CommunicationType>("email");
  const [formDirection, setFormDirection] = useState<CommunicationDirection>("incoming");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedLetterTemplateId, setSelectedLetterTemplateId] = useState("");
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");

  const fetchCommunications = useCallback(async () => {
    const data = await listCommunications(caseFilter ? { caseId: caseFilter } : undefined);
    setCommunications(data);
  }, [caseFilter]);

  const fetchContacts = useCallback(async () => {
    const data = await listContacts();
    setContacts(data.map((c) => ({ id: c.id, displayName: c.displayName })));
  }, []);

  const fetchCases = useCallback(async () => {
    const { data } = await supabase
      .from("cases")
      .select("id, name")
      .order("name");
    setCases((data ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
  }, []);

  const fetchEmployees = useCallback(async () => {
    const data = await listEmployees();
    setEmployees(
      data.map((e: { id: string; display_name: string }) => ({
        id: e.id,
        display_name: e.display_name,
      }))
    );
  }, []);

  const fetchTasksForCase = useCallback(async (caseId: string) => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    setTasks((data ?? []).map((t: { id: string; title: string }) => ({ id: t.id, title: t.title })));
  }, []);

  const fetchAppointmentsForCase = useCallback(async (caseId: string) => {
    const { data } = await supabase
      .from("appointments")
      .select("id, title, appointment_date")
      .eq("case_id", caseId)
      .order("appointment_date", { ascending: true });
    setAppointments(
      (data ?? []).map((a: { id: string; title: string; appointment_date: string }) => ({
        id: a.id,
        title: a.title,
        date: a.appointment_date,
      }))
    );
  }, []);

  const fetchTemplates = useCallback(async () => {
    const [letters, emails] = await Promise.all([
      listLetterTemplates(),
      listEmailTemplates(),
    ]);
    setLetterTemplates(letters);
    setEmailTemplates(emails);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCommunications(), fetchCases(), fetchEmployees(), fetchContacts(), fetchTemplates()]);
      setLoading(false);
    };
    load();
  }, [fetchCommunications, fetchCases, fetchEmployees, fetchContacts, fetchTemplates]);

  useRealtimeTable({ table: "communications" }, fetchCommunications);

  const applyTemplate = useCallback(async () => {
    if (!formCaseId) return;
    const caseData = await getCaseById(formCaseId);
    if (!caseData) return;
    const values = getPlaceholderValues(caseData);

    if (formType === "letter" && selectedLetterTemplateId) {
      const t = letterTemplates.find((x) => x.id === selectedLetterTemplateId);
      if (t) {
        setFormSubject(replacePlaceholders(t.subject ?? "", values));
        setFormContent(replacePlaceholders(t.body, values));
      }
    } else if (formType === "email" && selectedEmailTemplateId) {
      const t = emailTemplates.find((x) => x.id === selectedEmailTemplateId);
      if (t) {
        setFormSubject(replacePlaceholders(t.subject, values));
        setFormContent(replacePlaceholders(t.body, values));
      }
    }
  }, [formCaseId, formType, selectedLetterTemplateId, selectedEmailTemplateId, letterTemplates, emailTemplates]);

  useEffect(() => {
    if (formCaseId && ((formType === "letter" && selectedLetterTemplateId) || (formType === "email" && selectedEmailTemplateId))) {
      applyTemplate();
    }
  }, [formCaseId, formType, selectedLetterTemplateId, selectedEmailTemplateId, applyTemplate]);

  useEffect(() => {
    if (formCaseId) {
      fetchTasksForCase(formCaseId);
      fetchAppointmentsForCase(formCaseId);
    } else {
      setTasks([]);
      setAppointments([]);
    }
  }, [formCaseId, fetchTasksForCase, fetchAppointmentsForCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formCaseId) {
      setFormError("Bitte einen Fall auswählen.");
      return;
    }

    const result = await createCommunication({
      correspondenceId: formCorrespondenceId || null,
      caseId: formCaseId,
      employeeId: formEmployeeId || null,
      taskId: formTaskId || null,
      appointmentId: formAppointmentId || null,
      type: formType,
      direction: formDirection,
      subject: formSubject.trim() || null,
      content: formContent.trim() || null,
    });

    if (result.success && result.id) {
      if (formFile && formFile.size > 0) {
        const fd = new FormData();
        fd.set("file", formFile);
        await uploadCommunicationDocument(result.id, fd);
      }
      setFormCaseId("");
      setFormCorrespondenceId("");
      setFormEmployeeId("");
      setFormTaskId("");
      setFormAppointmentId("");
      setFormSubject("");
      setFormContent("");
      setFormFile(null);
      setIsFormOpen(false);
      fetchCommunications();
    } else if (!result.success) {
      setFormError(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kommunikation wirklich löschen?")) return;
    const result = await deleteCommunication(id);
    if (result.success) fetchCommunications();
  };

  const handleAttachDocument = async (communicationId: string, file: File) => {
    if (!file || file.size === 0) return;
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadCommunicationDocument(communicationId, fd);
    if (result.success) fetchCommunications();
  };

  const getCaseName = (caseId: string) => cases.find((c) => c.id === caseId)?.name ?? caseId;
  const getEmployeeName = (employeeId: string | null | undefined) =>
    employeeId ? employees.find((e) => e.id === employeeId)?.display_name ?? null : null;
  const getContactName = (correspondenceId: string | null | undefined) =>
    correspondenceId ? contacts.find((c) => c.id === correspondenceId)?.displayName ?? null : null;

  const filtered = caseFilter
    ? communications.filter((c) => c.caseId === caseFilter)
    : communications;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-500">Filter:</label>
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="p-2 rounded-xl border border-gray-200 bg-white text-sm"
            >
              <option value="">Alle Fälle</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm text-mw-green hover:underline flex items-center gap-1"
          >
            <FileText size={14} /> Vorlagen verwalten
          </button>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex gap-2 transition shadow-sm"
        >
          <Plus size={18} /> Neue Kommunikation
        </button>
      </div>

      {showTemplates && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-mw-green mb-4 flex items-center gap-2">
            <FileText size={18} /> Vorlagen verwalten
          </h3>
          <TemplateManager />
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <Mail size={18} /> Neue Kommunikation
          </h3>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fall *</label>
              <select
                value={formCaseId}
                onChange={(e) => {
                  setFormCaseId(e.target.value);
                  setFormTaskId("");
                  setFormAppointmentId("");
                }}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
                required
              >
                <option value="">Bitte wählen...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kontakt (optional)</label>
              <select
                value={formCorrespondenceId}
                onChange={(e) => setFormCorrespondenceId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">— Kein Kontakt —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Typ</label>
              <select
                value={formType}
                onChange={(e) => {
                  setFormType(e.target.value as CommunicationType);
                  setSelectedLetterTemplateId("");
                  setSelectedEmailTemplateId("");
                }}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {(Object.keys(TYPE_LABELS) as CommunicationType[]).map((k) => (
                  <option key={k} value={k}>
                    {TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Richtung</label>
              <select
                value={formDirection}
                onChange={(e) => {
                  setFormDirection(e.target.value as CommunicationDirection);
                  setSelectedLetterTemplateId("");
                  setSelectedEmailTemplateId("");
                }}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {(Object.keys(DIRECTION_LABELS) as CommunicationDirection[]).map((k) => (
                  <option key={k} value={k}>
                    {DIRECTION_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            {formDirection === "outgoing" && (formType === "letter" || formType === "email") && (
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Vorlage (optional)</label>
                <select
                  value={formType === "letter" ? selectedLetterTemplateId : selectedEmailTemplateId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (formType === "letter") setSelectedLetterTemplateId(val);
                    else setSelectedEmailTemplateId(val);
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
                >
                  <option value="">— Keine Vorlage —</option>
                  {formType === "letter"
                    ? letterTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    : emailTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mitarbeiter (optional)</label>
              <select
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">—</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Aufgabe (optional)</label>
              <select
                value={formTaskId}
                onChange={(e) => setFormTaskId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">—</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Termin (optional)</label>
              <select
                value={formAppointmentId}
                onChange={(e) => setFormAppointmentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">—</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({new Date(a.date).toLocaleDateString("de-DE")})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Betreff</label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="z.B. Rückfrage zur Trauerfeier"
              className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inhalt / Notiz</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Kurze Notiz oder Inhalt..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dokument anhängen (optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
              className="w-full p-2 rounded-xl border border-gray-200 text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-mw-green file:text-white"
            />
            {formFile && (
              <p className="text-xs text-gray-500 mt-1">{formFile.name}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium"
            >
              Speichern
            </button>
            {formDirection === "outgoing" && formType === "letter" && (formSubject || formContent) && (
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html><html><head><title>${formSubject || "Brief"}</title>
                      <style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:20px;font-size:12pt;line-height:1.6;}</style>
                      </head><body>
                      <h2>${formSubject || ""}</h2>
                      <pre style="white-space:pre-wrap;font-family:inherit;">${formContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                      </body></html>`);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
              >
                <Printer size={16} /> Drucken
              </button>
            )}
            {formDirection === "outgoing" && formType === "email" && (formSubject || formContent) && (
              <button
                type="button"
                onClick={async () => {
                  const caseData = formCaseId ? await getCaseById(formCaseId) : null;
                  const to = caseData?.contact?.email ?? "";
                  const subject = encodeURIComponent(formSubject || "");
                  const body = encodeURIComponent(formContent || "");
                  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
                  window.location.href = mailto;
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
              >
                <Send size={16} /> E-Mail öffnen
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <Mail size={18} /> Kommunikations-Übersicht
          </h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-gray-400 text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm italic">
              Keine Kommunikation gefunden.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-gray-50/50 flex justify-between items-start gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-mw-green-light">
                        {getCaseName(c.caseId)}
                      </span>
                      {getContactName(c.correspondenceId) && (
                        <span className="text-xs text-gray-600">
                          {getContactName(c.correspondenceId)}
                        </span>
                      )}
                      {getEmployeeName(c.employeeId) && (
                        <span className="text-xs text-gray-600">
                          {getEmployeeName(c.employeeId)}
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {TYPE_LABELS[c.type]}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-0.5">
                        {c.direction === "incoming" ? (
                          <ArrowDownLeft size={12} />
                        ) : (
                          <ArrowUpRight size={12} />
                        )}
                        {DIRECTION_LABELS[c.direction]}
                      </span>
                    </div>
                    {c.subject && (
                      <p className="font-medium text-sm mt-1 text-gray-800">{c.subject}</p>
                    )}
                    {c.content && (
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{c.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {c.storagePath ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await getCommunicationDocumentSignedUrl(c.storagePath!);
                            if ("url" in res) window.open(res.url, "_blank");
                          }}
                          className="text-xs text-mw-green hover:underline flex items-center gap-1"
                        >
                          <Paperclip size={12} /> Dokument anzeigen
                        </button>
                      ) : (
                        <label className="text-xs text-gray-500 hover:text-mw-green cursor-pointer flex items-center gap-1">
                          <Paperclip size={12} />
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAttachDocument(c.id, f);
                              e.target.value = "";
                            }}
                          />
                          Scan anhängen
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(c.createdAt).toLocaleDateString("de-DE")} ·{" "}
                      {new Date(c.createdAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                    aria-label="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
