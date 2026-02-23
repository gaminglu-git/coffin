"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, Pencil, Building2, User } from "lucide-react";
import { listContacts, createContact, updateContact, deleteContact } from "@/app/actions/contacts";
import type { Correspondence, CorrespondenceKind } from "@/types";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type CaseOption = { id: string; name: string };

const KIND_LABELS: Record<CorrespondenceKind, string> = {
  person: "Person",
  company: "Firma",
};

export function ContactView() {
  const [contacts, setContacts] = useState<Correspondence[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "case" | "firm">("all");
  const [caseFilter, setCaseFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formKind, setFormKind] = useState<CorrespondenceKind>("person");
  const [formCaseId, setFormCaseId] = useState<string>("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchContacts = useCallback(async () => {
    let params: { caseId?: string; caseOnly?: boolean; firmWideOnly?: boolean } | undefined;
    if (filter === "case" && caseFilter) {
      params = { caseId: caseFilter };
    } else if (filter === "case") {
      params = { caseOnly: true };
    } else if (filter === "firm") {
      params = { firmWideOnly: true };
    }
    const data = await listContacts(params);
    setContacts(data);
  }, [filter, caseFilter]);

  const fetchCases = useCallback(async () => {
    const { data } = await supabase
      .from("cases")
      .select("id, name")
      .order("name");
    setCases((data ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchCases()]);
      setLoading(false);
    };
    load();
  }, [fetchContacts, fetchCases]);

  useRealtimeTable({ table: "correspondences" }, fetchContacts);

  const resetForm = () => {
    setFormKind("person");
    setFormCaseId("");
    setFormDisplayName("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormCompanyName("");
    setFormNotes("");
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openEdit = (c: Correspondence) => {
    setEditingId(c.id);
    setFormKind(c.kind);
    setFormCaseId(c.caseId ?? "");
    setFormDisplayName(c.displayName);
    setFormEmail(c.email ?? "");
    setFormPhone(c.phone ?? "");
    setFormAddress(c.address ?? "");
    setFormCompanyName(c.companyName ?? "");
    setFormNotes(c.notes ?? "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formDisplayName.trim()) {
      setFormError("Name ist erforderlich.");
      return;
    }

    if (editingId) {
      const result = await updateContact(editingId, {
        kind: formKind,
        caseId: formCaseId || null,
        displayName: formDisplayName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        companyName: formCompanyName.trim() || null,
        notes: formNotes.trim() || null,
      });
      if (result.success) {
        resetForm();
        fetchContacts();
      } else {
        setFormError(result.error);
      }
    } else {
      const result = await createContact({
        kind: formKind,
        caseId: formCaseId || null,
        displayName: formDisplayName.trim(),
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        companyName: formCompanyName.trim() || null,
        notes: formNotes.trim() || null,
      });
      if (result.success) {
        resetForm();
        fetchContacts();
      } else {
        setFormError(result.error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kontakt wirklich löschen? Verknüpfte Kommunikation bleibt erhalten.")) return;
    const result = await deleteContact(id);
    if (result.success) fetchContacts();
  };

  const getCaseName = (caseId: string | null) =>
    caseId ? cases.find((c) => c.id === caseId)?.name ?? caseId : "Firmenweit";

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !search ||
      c.displayName.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.companyName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "case" | "firm")}
            className="p-2 rounded-xl border border-gray-200 bg-white text-sm"
          >
            <option value="all">Alle Kontakte</option>
            <option value="case">Nur Fall-Kontakte</option>
            <option value="firm">Nur firmenweit</option>
          </select>
          {filter === "case" && (
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
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="p-2 rounded-xl border border-gray-200 bg-white text-sm w-40"
          />
        </div>
        <button
          onClick={() => {
            resetForm();
            setFormDisplayName("");
            setIsFormOpen(true);
          }}
          className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex gap-2 transition shadow-sm"
        >
          <Plus size={18} /> Neuer Kontakt
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <h3 className="font-medium text-mw-green flex items-center gap-2">
            <Users size={18} /> {editingId ? "Kontakt bearbeiten" : "Neuer Kontakt"}
          </h3>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Art</label>
              <select
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as CorrespondenceKind)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {(Object.keys(KIND_LABELS) as CorrespondenceKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fall (optional – leer = firmenweit)</label>
              <select
                value={formCaseId}
                onChange={(e) => setFormCaseId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">— Firmenweit —</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="Name oder Firmenname"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            {formKind === "person" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Firma (optional)</label>
                <input
                  type="text"
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  placeholder="Firma"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">E-Mail</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="E-Mail"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefon</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Adresse</label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Adresse"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notizen</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notizen"
                rows={2}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-mw-green text-white px-4 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={resetForm}
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
            <Users size={18} /> Adressbuch
          </h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-gray-400 text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm italic">
              Keine Kontakte gefunden.
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
                      {c.kind === "company" ? (
                        <Building2 size={16} className="text-mw-green shrink-0" />
                      ) : (
                        <User size={16} className="text-mw-green shrink-0" />
                      )}
                      <span className="font-medium text-gray-800">{c.displayName}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {KIND_LABELS[c.kind]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getCaseName(c.caseId)}
                      </span>
                    </div>
                    {(c.email || c.phone) && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {[c.email, c.phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {c.companyName && c.kind === "person" && (
                      <p className="text-xs text-gray-500 mt-0.5">{c.companyName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 text-gray-300 hover:text-mw-green opacity-0 group-hover:opacity-100 transition"
                      aria-label="Bearbeiten"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
