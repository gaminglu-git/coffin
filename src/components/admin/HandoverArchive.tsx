"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type HandoverEntry = {
  id: string;
  text: string;
  author: string;
  caseId: string | null;
  createdAt: string;
};

type CaseOption = { id: string; name: string };

interface HandoverArchiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HandoverArchive({ open, onOpenChange }: HandoverArchiveProps) {
  const [entries, setEntries] = useState<HandoverEntry[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("handover_logs")
      .select("id, text, author, case_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("HandoverArchive fetch error:", error);
      setEntries([]);
    } else {
      setEntries(
        (data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          text: r.text as string,
          author: (r.author as string) ?? "Unbekannt",
          caseId: (r.case_id as string | null) ?? null,
          createdAt: r.created_at as string,
        }))
      );
    }
    setLoading(false);
  }, []);

  const fetchCases = useCallback(async () => {
    const { data } = await supabase
      .from("cases")
      .select("id, name")
      .order("name");
    setCases(
      (data ?? []).map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
      }))
    );
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchCases();
      fetchEntries();
    }
  }, [open, fetchEntries, fetchCases]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive size={20} className="text-mw-green" />
            Altes Übergabebuch (Archiv)
          </DialogTitle>
          <DialogDescription>
            Historische Einträge aus dem früheren Übergabebuch. Nur Lesezugriff.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-center text-gray-400 py-8">Laden...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-center text-gray-400 italic py-8">
              Keine archivierten Einträge.
            </p>
          ) : (
            entries.map((msg) => (
              <div
                key={msg.id}
                className="bg-gray-50 p-4 rounded-xl border flex flex-col"
              >
                <div className="font-bold text-xs text-mw-green mb-1">
                  {msg.author}
                  {msg.caseId && (
                    <span className="text-[10px] text-mw-green-light font-normal ml-1">
                      · {cases.find((c) => c.id === msg.caseId)?.name ?? msg.caseId}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    · {new Date(msg.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
