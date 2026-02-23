"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentEmployee } from "@/app/actions/employees";
import type { Employee } from "@/app/actions/employees";

type HandoverEntry = {
  id: string;
  text: string;
  author: string;
  authorId: string | null;
  createdAt: string;
};

export function HandoverLog() {
  const [entries, setEntries] = useState<HandoverEntry[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("handover_logs")
      .select("id, text, author, author_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("HandoverLog fetch error:", error);
      setEntries([]);
    } else {
      setEntries(
        (data ?? []).map((r: any) => ({
          id: r.id,
          text: r.text,
          author: r.author ?? "Unbekannt",
          authorId: r.author_id,
          createdAt: r.created_at,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getCurrentEmployee().then(setCurrentEmployee);
    fetchEntries();
    const handleRefresh = () => fetchEntries();
    window.addEventListener("fetch-cases", handleRefresh);
    return () => window.removeEventListener("fetch-cases", handleRefresh);
  }, [fetchEntries]);

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentEmployee) return;

    const { error } = await supabase.from("handover_logs").insert({
      text: newMessage.trim(),
      author: currentEmployee.display_name,
      author_id: currentEmployee.id,
    });

    if (!error) {
      setNewMessage("");
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
        className="flex gap-3 mt-auto shrink-0"
      >
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
