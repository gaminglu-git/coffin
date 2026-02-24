"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentEmployee } from "@/app/actions/employees";
import type { Employee } from "@/app/actions/employees";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type HandoverEntry = {
  id: string;
  text: string;
  author: string;
  authorId: string | null;
  caseId: string | null;
  createdAt: string;
};

type CaseOption = { id: string; name: string };

export function HandoverLog() {
  const [entries, setEntries] = useState<HandoverEntry[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("handover_logs")
      .select("id, text, author, author_id, case_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("HandoverLog fetch error:", error);
      setEntries([]);
    } else {
      setEntries(
        (data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          text: r.text as string,
          author: (r.author as string) ?? "Unbekannt",
          authorId: (r.author_id as string | null) ?? null,
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
      (data ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
    );
  }, []);

  useEffect(() => {
    getCurrentEmployee().then(setCurrentEmployee);
    fetchCases();
    fetchEntries();
    const handleRefresh = () => {
      fetchEntries();
      fetchCases();
    };
    window.addEventListener("fetch-cases", handleRefresh);
    return () => window.removeEventListener("fetch-cases", handleRefresh);
  }, [fetchEntries, fetchCases]);

  useRealtimeTable({ table: "handover_logs" }, () => {
    fetchEntries();
  });

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentEmployee) return;

    const { error } = await supabase.from("handover_logs").insert({
      text: newMessage.trim(),
      author: currentEmployee.display_name,
      author_id: currentEmployee.id,
      case_id: selectedCaseId || null,
    });

    if (!error) {
      setNewMessage("");
      setSelectedCaseId("");
      fetchEntries();
    } else {
      console.error("HandoverLog insert error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("handover_logs").delete().eq("id", id);
    if (!error) fetchEntries();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {loading ? (
          <p className="text-sm text-center text-gray-400">Laden...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-center text-gray-400 italic">
            Noch keine Einträge im Übergabebuch.
          </p>
        ) : (
          entries.map((msg) => (
            <div
              key={msg.id}
              className="bg-gray-50 p-4 rounded-xl border relative group flex flex-col"
            >
              <button
                className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition"
                onClick={() => handleDelete(msg.id)}
              >
                <Trash2 size={14} />
              </button>
              <div className="font-bold text-xs text-mw-green mb-1">
                {msg.author}{" "}
                {msg.caseId && (
                  <span className="text-[10px] text-mw-green-light font-normal ml-1">
                    · {cases.find((c) => c.id === msg.caseId)?.name ?? msg.caseId}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 font-normal ml-1">
                  • {new Date(msg.createdAt).toLocaleString("de-DE")}
                </span>
              </div>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={handleAddMessage}
        className="flex flex-col sm:flex-row gap-3 mt-auto shrink-0"
      >
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="sm:w-48 p-3 border border-gray-200 rounded-xl outline-none focus:border-mw-green text-sm bg-white"
          title="Fall (optional)"
        >
          <option value="">Allgemein</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Neue Notiz eintragen..."
          className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-mw-green"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
          disabled={!currentEmployee}
        />
        <button
          type="submit"
          disabled={!currentEmployee}
          className="bg-mw-green text-white px-6 py-3 rounded-xl hover:bg-mw-green-dark transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
