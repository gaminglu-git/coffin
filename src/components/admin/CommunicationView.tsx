"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Trash2, ArrowDownLeft, ArrowUpRight, FileText, Paperclip, Phone, MoreHorizontal, ChevronDown } from "lucide-react";
import {
  listCommunications,
  deleteCommunication,
  uploadCommunicationDocument,
  getCommunicationDocumentSignedUrl,
} from "@/app/actions/communications";
import { listContacts } from "@/app/actions/contacts";
import { listEmployees } from "@/app/actions/employees";
import { listLetterTemplates, listEmailTemplates } from "@/app/actions/templates";
import type {
  Communication,
  CommunicationType,
  CommunicationDirection,
  LetterTemplate,
  EmailTemplate,
} from "@/types";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { TemplateManager } from "@/components/admin/TemplateManager";
import { CommunicationWizard } from "@/components/admin/CommunicationWizard";
import { CommunicationDetailModal } from "@/components/admin/CommunicationDetailModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
type ContactOption = { id: string; displayName: string; email?: string | null };

export function CommunicationView() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [appointments, setAppointments] = useState<{ id: string; title: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseFilter, setCaseFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialTypeForWizard, setInitialTypeForWizard] = useState<CommunicationType | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const fetchCommunications = useCallback(async () => {
    const data = await listCommunications(caseFilter ? { caseId: caseFilter } : undefined);
    setCommunications(data);
  }, [caseFilter]);

  const fetchContacts = useCallback(async () => {
    const data = await listContacts();
    setContacts(data.map((c) => ({ id: c.id, displayName: c.displayName, email: c.email })));
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
        <Popover open={typePickerOpen} onOpenChange={setTypePickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex gap-2 transition shadow-sm"
            >
              <Plus size={18} /> Neue Kommunikation <ChevronDown size={16} className="opacity-80" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="flex flex-col gap-0.5">
              {(Object.keys(TYPE_LABELS) as CommunicationType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTypePickerOpen(false);
                    setInitialTypeForWizard(t);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-gray-100 transition"
                >
                  {t === "phone" && <Phone size={18} className="text-mw-green" />}
                  {t === "email" && <Mail size={18} className="text-mw-green" />}
                  {t === "letter" && <FileText size={18} className="text-mw-green" />}
                  {t === "other" && <MoreHorizontal size={18} className="text-mw-green" />}
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {showTemplates && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-mw-green mb-4 flex items-center gap-2">
            <FileText size={18} /> Vorlagen verwalten
          </h3>
          <TemplateManager />
        </div>
      )}

      {isFormOpen && initialTypeForWizard && (
        <CommunicationWizard
          initialType={initialTypeForWizard}
          cases={cases}
          contacts={contacts}
          tasks={tasks}
          appointments={appointments}
          letterTemplates={letterTemplates}
          emailTemplates={emailTemplates}
          onSuccess={() => {
            setIsFormOpen(false);
            setInitialTypeForWizard(null);
            fetchCommunications();
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setInitialTypeForWizard(null);
          }}
          fetchTasksForCase={fetchTasksForCase}
          fetchAppointmentsForCase={fetchAppointmentsForCase}
        />
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCommunication(c)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedCommunication(c)}
                  className="p-4 hover:bg-gray-50/50 flex justify-between items-start gap-4 group cursor-pointer"
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
                    <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
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

      <CommunicationDetailModal
        communication={selectedCommunication}
        caseName={selectedCommunication ? getCaseName(selectedCommunication.caseId) : ""}
        contactEmail={
          selectedCommunication?.correspondenceId
            ? contacts.find((x) => x.id === selectedCommunication.correspondenceId)?.email ?? null
            : null
        }
        onClose={() => setSelectedCommunication(null)}
      />
    </div>
  );
}
