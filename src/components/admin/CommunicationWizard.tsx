"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, ChevronRight, ChevronLeft, Send, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import {
  createCommunication,
  uploadCommunicationDocument,
} from "@/app/actions/communications";
import { getCaseById } from "@/app/actions/cases";
import type {
  CommunicationType,
  CommunicationDirection,
  LetterTemplate,
  EmailTemplate,
} from "@/types";
import { getPlaceholderValues, replacePlaceholders } from "@/lib/template-placeholders";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { exportLetterAsPDF } from "@/lib/export-pdf";
import { exportLetterAsExcel } from "@/lib/export-excel";
import { exportLetterAsDocx } from "@/lib/export-docx";

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

interface CommunicationWizardProps {
  initialType?: CommunicationType;
  cases: CaseOption[];
  contacts: { id: string; displayName: string }[];
  tasks: { id: string; title: string }[];
  appointments: { id: string; title: string; date: string }[];
  letterTemplates: LetterTemplate[];
  emailTemplates: EmailTemplate[];
  onSuccess: () => void;
  onCancel: () => void;
  fetchTasksForCase: (caseId: string) => Promise<void>;
  fetchAppointmentsForCase: (caseId: string) => Promise<void>;
}

export function CommunicationWizard({
  initialType,
  cases,
  contacts,
  tasks,
  appointments,
  letterTemplates,
  emailTemplates,
  onSuccess,
  onCancel,
  fetchTasksForCase,
  fetchAppointmentsForCase,
}: CommunicationWizardProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [formCaseId, setFormCaseId] = useState("");
  const [formCorrespondenceId, setFormCorrespondenceId] = useState("");
  const [formTaskId, setFormTaskId] = useState("");
  const [formAppointmentId, setFormAppointmentId] = useState("");
  const [formType, setFormType] = useState<CommunicationType>(initialType ?? "email");
  const [formDirection, setFormDirection] = useState<CommunicationDirection>("incoming");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const [selectedLetterTemplateId, setSelectedLetterTemplateId] = useState("");
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState("");
  const [showLetterExportChoice, setShowLetterExportChoice] = useState(false);

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
    }
  }, [formCaseId, fetchTasksForCase, fetchAppointmentsForCase]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!formCaseId) {
      setError("Bitte einen Fall auswählen.");
      return;
    }

    const result = await createCommunication({
      correspondenceId: formCorrespondenceId || null,
      caseId: formCaseId,
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
      if (formType === "email" && formDirection === "outgoing" && (formSubject || formContent)) {
        const caseData = formCaseId ? await getCaseById(formCaseId) : null;
        const to = caseData?.contact?.email ?? "";
        const subject = encodeURIComponent(formSubject || "");
        const body = encodeURIComponent(formContent || "");
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        onSuccess();
      } else if (formType === "letter") {
        setShowLetterExportChoice(true);
      } else {
        onSuccess();
      }
    } else if (!result.success) {
      setError(result.error ?? "Fehler beim Speichern.");
    }
  };

  const handleExportPDF = () => {
    const caseName = cases.find((c) => c.id === formCaseId)?.name ?? "Brief";
    exportLetterAsPDF(formSubject, formContent, `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  };

  const handleExportExcel = () => {
    const caseName = cases.find((c) => c.id === formCaseId)?.name ?? "Brief";
    exportLetterAsExcel(formSubject, formContent, `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
  };

  const handleExportWord = () => {
    const caseName = cases.find((c) => c.id === formCaseId)?.name ?? "Brief";
    exportLetterAsDocx(formSubject, formContent, `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.docx`);
  };

  const handleLetterExportAndClose = (exportFn: () => void) => {
    exportFn();
    onSuccess();
  };

  const canProceedStep1 = formCaseId && formType && formDirection;
  const isLetterOrEmail = formType === "letter" || formType === "email";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? "bg-mw-green text-white" : "bg-gray-200 text-gray-500"}`}>
          1
        </div>
        <span className="text-sm font-medium text-gray-600">Fall & Typ</span>
        <ChevronRight size={16} className="text-gray-400" />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? "bg-mw-green text-white" : "bg-gray-200 text-gray-500"}`}>
          2
        </div>
        <span className="text-sm font-medium text-gray-600">Inhalt</span>
        <ChevronRight size={16} className="text-gray-400" />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 3 ? "bg-mw-green text-white" : "bg-gray-200 text-gray-500"}`}>
          3
        </div>
        <span className="text-sm font-medium text-gray-600">Aktion</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <Mail size={18} /> Schritt 1: Fall & Typ
          </h3>
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
              >
                <option value="">Bitte wählen...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
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
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Typ</label>
              {initialType ? (
                <div className="p-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-700">
                  {TYPE_LABELS[formType]}
                </div>
              ) : (
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
                    <option key={k} value={k}>{TYPE_LABELS[k]}</option>
                  ))}
                </select>
              )}
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
                  <option key={k} value={k}>{DIRECTION_LABELS[k]}</option>
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
                  <option key={t.id} value={t.id}>{t.title}</option>
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              Weiter <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <FileText size={18} /> Schritt 2: Inhalt
          </h3>
          {formDirection === "outgoing" && isLetterOrEmail && (
            <div>
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
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  : emailTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
              </select>
            </div>
          )}
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
            {isLetterOrEmail ? (
              <TemplateEditor value={formContent} onChange={setFormContent} minHeight="180px" />
            ) : (
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Kurze Notiz oder Inhalt..."
                rows={4}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm resize-none"
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dokument anhängen (optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
              className="w-full p-2 rounded-xl border border-gray-200 text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-mw-green file:text-white"
            />
            {formFile && <p className="text-xs text-gray-500 mt-1">{formFile.name}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex items-center gap-2"
            >
              Weiter <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {step === 3 && showLetterExportChoice ? (
        <div className="space-y-4">
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <FileText size={18} /> Brief gespeichert
          </h3>
          <p className="text-sm text-gray-600">Exportieren als:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleLetterExportAndClose(handleExportPDF)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <FileDown size={16} /> PDF
            </button>
            <button
              type="button"
              onClick={() => handleLetterExportAndClose(handleExportWord)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <FileText size={16} /> Word (DOCX)
            </button>
            <button
              type="button"
              onClick={() => handleLetterExportAndClose(handleExportExcel)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <FileSpreadsheet size={16} /> Excel (XLS)
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium"
            >
              Fertig
            </button>
          </div>
        </div>
      ) : step === 3 ? (
        <div className="space-y-4">
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <Send size={18} /> Schritt 3: Aktion wählen
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
            <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium">
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
