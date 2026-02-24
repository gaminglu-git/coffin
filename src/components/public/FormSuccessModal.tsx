"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";

export type FormSuccessCaseType = "vorsorge" | "trauerfall" | "beratung";

export type FormSuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyPin: string;
  summary?: string;
  caseType: FormSuccessCaseType;
};

const DOWNLOAD_FILENAME = "Familien-Code-Minten-Walter.txt";

function downloadFamilyCode(familyPin: string) {
  const content = [
    "Familien-Code für das Familienportal",
    "Minten & Walter Bestattungen",
    "",
    `Ihr Code: ${familyPin}`,
    "",
    "Bitte bewahren Sie diesen Code sicher auf. Sie benötigen ihn für den Zugang zum Familienportal.",
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = DOWNLOAD_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FormSuccessModal({
  open,
  onOpenChange,
  familyPin,
  summary,
  caseType,
}: FormSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-stone-50 rounded-2xl sm:rounded-4xl border-0 gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 sm:p-8 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0" aria-hidden />
            <DialogTitle className="text-xl font-serif text-emerald-900">
              Ihre Anfrage wurde sicher übermittelt
            </DialogTitle>
          </div>
          {summary && (
            <p className="text-sm text-stone-600 mt-2">{summary}</p>
          )}
        </DialogHeader>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-stone-200">
            <p className="text-xs font-medium text-stone-500 mb-1">Ihre Familien-PIN für das Portal</p>
            <p className="text-2xl font-mono font-bold text-emerald-900 tracking-wider">{familyPin}</p>
          </div>

          <p className="text-sm text-stone-600">
            Bitte bewahren Sie den Code sicher auf.
          </p>

          <p className="text-sm text-stone-500">
            Der Code wird Ihnen zusätzlich per E-Mail zugesandt.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadFamilyCode(familyPin)}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Download size={18} className="mr-2" />
              Code herunterladen
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-emerald-900 text-white hover:bg-emerald-950"
            >
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
