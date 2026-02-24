"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  FileText,
  FileDown,
  FileSpreadsheet,
  Paperclip,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { getCaseById } from "@/app/actions/cases";
import { getCommunicationDocumentSignedUrl } from "@/app/actions/communications";
import { exportLetterAsPDF } from "@/lib/export-pdf";
import { exportLetterAsExcel } from "@/lib/export-excel";
import { exportLetterAsDocx } from "@/lib/export-docx";
import type {
  Communication,
  CommunicationType,
  CommunicationDirection,
} from "@/types";

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

interface CommunicationDetailModalProps {
  communication: Communication | null;
  caseName: string;
  contactEmail: string | null;
  onClose: () => void;
}

export function CommunicationDetailModal({
  communication,
  caseName,
  contactEmail,
  onClose,
}: CommunicationDetailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!communication) return;
    if (contactEmail) {
      setRecipientEmail(contactEmail);
      return;
    }
    getCaseById(communication.caseId).then((c) => {
      setRecipientEmail(c?.contact?.email ?? null);
    });
  }, [communication, contactEmail]);

  if (!communication) return null;

  const subject = communication.subject ?? "";
  const content = communication.content ?? "";
  const isLetterOrEmail =
    communication.type === "letter" || communication.type === "email";

  const handleMailto = () => {
    const to = recipientEmail || "";
    const subjectEnc = encodeURIComponent(subject);
    const bodyEnc = encodeURIComponent(content);
    window.location.href = `mailto:${to}?subject=${subjectEnc}&body=${bodyEnc}`;
  };

  const handleExportPDF = () => {
    exportLetterAsPDF(
      subject,
      content,
      `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.pdf`
    );
  };

  const handleExportExcel = () => {
    exportLetterAsExcel(
      subject,
      content,
      `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.xlsx`
    );
  };

  const handleExportWord = () => {
    exportLetterAsDocx(
      subject,
      content,
      `Brief_${caseName.replace(/[^a-z0-9]/gi, "_")}.docx`
    );
  };

  const handleOpenDocument = async () => {
    if (!communication.storagePath) return;
    const res = await getCommunicationDocumentSignedUrl(communication.storagePath);
    if ("url" in res) window.open(res.url, "_blank");
  };

  return (
    <Dialog open={!!communication} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-mw-green">
            <Mail size={20} />
            Kommunikation öffnen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-mw-green-light">{caseName}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
              {TYPE_LABELS[communication.type]}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              {communication.direction === "incoming" ? (
                <ArrowDownLeft size={12} />
              ) : (
                <ArrowUpRight size={12} />
              )}
              {DIRECTION_LABELS[communication.direction]}
            </span>
          </div>

          {subject && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Betreff</p>
              <p className="font-medium text-gray-800">{subject}</p>
            </div>
          )}

          {content && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Inhalt</p>
              <div className="text-sm text-gray-600 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 max-h-48 overflow-y-auto">
                {content}
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400">
            {new Date(communication.createdAt).toLocaleDateString("de-DE")} ·{" "}
            {new Date(communication.createdAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Aktionen */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-medium text-gray-600">Aktionen</p>
            <div className="flex flex-wrap gap-2">
              {communication.type === "email" &&
                communication.direction === "outgoing" &&
                (subject || content) && (
                  <button
                    type="button"
                    onClick={handleMailto}
                    disabled={!recipientEmail}
                    className="bg-mw-green text-white px-4 py-2 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail size={16} /> E-Mail öffnen
                  </button>
                )}

              {communication.type === "letter" && (subject || content) && (
                <>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <FileDown size={16} /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <FileText size={16} /> Word
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                </>
              )}

              {communication.storagePath && (
                <button
                  type="button"
                  onClick={handleOpenDocument}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                >
                  <Paperclip size={16} /> Dokument anzeigen
                </button>
              )}

              {!isLetterOrEmail &&
                !communication.storagePath &&
                !(communication.type === "email" && communication.direction === "outgoing") && (
                  <p className="text-sm text-gray-500 italic">
                    Keine Aktionen verfügbar.
                  </p>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
