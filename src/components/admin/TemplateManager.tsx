"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Mail, Plus, Trash2, Edit2, X, CheckCircle } from "lucide-react";
import {
  listLetterTemplates,
  listEmailTemplates,
  listChecklistTemplates,
  createLetterTemplate,
  createEmailTemplate,
  createChecklistTemplate,
  updateLetterTemplate,
  updateEmailTemplate,
  updateChecklistTemplate,
  deleteLetterTemplate,
  deleteEmailTemplate,
  deleteChecklistTemplate,
} from "@/app/actions/templates";
import type { LetterTemplate, EmailTemplate, ChecklistTemplate } from "@/types";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import { PlaceholderInput } from "@/components/admin/PlaceholderInput";

type TabType = "letters" | "emails" | "checklists";

export function TemplateManager() {
  const [tab, setTab] = useState<TabType>("letters");
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLetter, setEditingLetter] = useState<LetterTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
  const [isCreatingLetter, setIsCreatingLetter] = useState(false);
  const [isCreatingEmail, setIsCreatingEmail] = useState(false);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const [letters, emails, checklists] = await Promise.all([
      listLetterTemplates(),
      listEmailTemplates(),
      listChecklistTemplates(),
    ]);
    setLetterTemplates(letters);
    setEmailTemplates(emails);
    setChecklistTemplates(checklists);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveLetter = async (data: { name: string; subject?: string | null; body: string }) => {
    setError(null);
    const result = editingLetter
      ? await updateLetterTemplate(editingLetter.id, data)
      : await createLetterTemplate(data);
    if (result.success) {
      setEditingLetter(null);
      setIsCreatingLetter(false);
      fetchTemplates();
    } else {
      setError(result.error);
    }
  };

  const handleSaveEmail = async (data: { name: string; subject: string; body: string }) => {
    setError(null);
    const result = editingEmail
      ? await updateEmailTemplate(editingEmail.id, data)
      : await createEmailTemplate(data);
    if (result.success) {
      setEditingEmail(null);
      setIsCreatingEmail(false);
      fetchTemplates();
    } else {
      setError(result.error);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (!confirm("Vorlage wirklich löschen?")) return;
    const result = await deleteLetterTemplate(id);
    if (result.success) {
      setEditingLetter(null);
      fetchTemplates();
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm("Vorlage wirklich löschen?")) return;
    const result = await deleteEmailTemplate(id);
    if (result.success) {
      setEditingEmail(null);
      fetchTemplates();
    }
  };

  const handleSaveChecklist = async (data: { name: string; burialType?: string | null; items: { title: string; items: { text: string }[] }[] }) => {
    setError(null);
    const result = editingChecklist
      ? await updateChecklistTemplate(editingChecklist.id, data)
      : await createChecklistTemplate(data);
    if (result.success) {
      setEditingChecklist(null);
      setIsCreatingChecklist(false);
      fetchTemplates();
    } else {
      setError(result.error);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm("Vorlage wirklich löschen?")) return;
    const result = await deleteChecklistTemplate(id);
    if (result.success) {
      setEditingChecklist(null);
      fetchTemplates();
    }
  };

  const templates = tab === "letters" ? letterTemplates : tab === "emails" ? emailTemplates : checklistTemplates;
  const isEditing = tab === "letters" ? !!editingLetter : tab === "emails" ? !!editingEmail : !!editingChecklist;
  const isCreating = tab === "letters" ? isCreatingLetter : tab === "emails" ? isCreatingEmail : isCreatingChecklist;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setTab("letters")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            tab === "letters" ? "bg-mw-green text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FileText size={16} /> Briefvorlagen
        </button>
        <button
          onClick={() => setTab("emails")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            tab === "emails" ? "bg-mw-green text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Mail size={16} /> E-Mail-Vorlagen
        </button>
        <button
          onClick={() => setTab("checklists")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            tab === "checklists" ? "bg-mw-green text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <CheckCircle size={16} /> Checklist-Vorlagen
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Tippen Sie <kbd className="px-1 py-0.5 bg-gray-100 rounded">@</kbd> für Platzhalter (Verstorbener, Kontakt, Fall)
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}

      {!isEditing && !isCreating && (
        <button
          onClick={() => {
            if (tab === "letters") setIsCreatingLetter(true);
            else if (tab === "emails") setIsCreatingEmail(true);
            else setIsCreatingChecklist(true);
          }}
          className="flex items-center gap-2 bg-mw-green text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-mw-green-dark"
        >
          <Plus size={16} /> Neue Vorlage
        </button>
      )}

      {(isEditing || isCreating) && tab === "letters" && (
        <LetterTemplateForm
          template={editingLetter}
          onSave={handleSaveLetter}
          onCancel={() => {
            setEditingLetter(null);
            setIsCreatingLetter(false);
          }}
        />
      )}

      {(isEditing || isCreating) && tab === "emails" && (
        <EmailTemplateForm
          template={editingEmail}
          onSave={handleSaveEmail}
          onCancel={() => {
            setEditingEmail(null);
            setIsCreatingEmail(false);
          }}
        />
      )}

      {(isEditing || isCreating) && tab === "checklists" && (
        <ChecklistTemplateForm
          template={editingChecklist}
          onSave={handleSaveChecklist}
          onCancel={() => {
            setEditingChecklist(null);
            setIsCreatingChecklist(false);
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Laden...</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800">{t.name}</p>
                {"subject" in t && t.subject && (
                  <p className="text-xs text-gray-500 mt-0.5">{t.subject}</p>
                )}
                {"subject" in t && !t.subject && "subject" in t && (
                  <p className="text-xs text-gray-500 mt-0.5">{(t as EmailTemplate).subject}</p>
                )}
                {"items" in t && (
                  <p className="text-sm text-gray-600 mt-1">
                    {(t as ChecklistTemplate).items.length} Gruppe(n)
                  </p>
                )}
                {!("items" in t) && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {(t as LetterTemplate | EmailTemplate).body?.replace(/\n/g, " ") ?? ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (tab === "letters") setEditingLetter(t as LetterTemplate);
                    else if (tab === "emails") setEditingEmail(t as EmailTemplate);
                    else setEditingChecklist(t as ChecklistTemplate);
                  }}
                  className="p-2 text-gray-400 hover:text-mw-green rounded-lg"
                  aria-label="Bearbeiten"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (tab === "letters") handleDeleteLetter(t.id);
                    else if (tab === "emails") handleDeleteEmail(t.id);
                    else handleDeleteChecklist(t.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                  aria-label="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && !isCreating && (
            <p className="text-sm text-gray-400 italic">Keine Vorlagen vorhanden.</p>
          )}
        </div>
      )}
    </div>
  );
}

function LetterTemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template: LetterTemplate | null;
  onSave: (data: { name: string; subject?: string | null; body: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject ?? "");
      setBody(template.body);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    onSave({ name: name.trim(), subject: subject.trim() || null, body: body.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-mw-green">
          {template ? "Vorlage bearbeiten" : "Neue Briefvorlage"}
        </h4>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name der Vorlage"
        className="w-full p-2 rounded-lg border text-sm"
        required
      />
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Betreff (optional)"
        className="w-full p-2 rounded-lg border text-sm"
      />
      <TemplateEditor value={body} onChange={setBody} minHeight="180px" />
      <div className="flex gap-2">
        <button type="submit" className="bg-mw-green text-white px-4 py-2 rounded-lg text-sm font-medium">
          Speichern
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function EmailTemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template: EmailTemplate | null;
  onSave: (data: { name: string; subject: string; body: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !body.trim()) return;
    onSave({ name: name.trim(), subject: subject.trim(), body: body.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-mw-green">
          {template ? "Vorlage bearbeiten" : "Neue E-Mail-Vorlage"}
        </h4>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name der Vorlage"
        className="w-full p-2 rounded-lg border text-sm"
        required
      />
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Betreff"
        className="w-full p-2 rounded-lg border text-sm"
        required
      />
      <TemplateEditor value={body} onChange={setBody} minHeight="180px" />
      <div className="flex gap-2">
        <button type="submit" className="bg-mw-green text-white px-4 py-2 rounded-lg text-sm font-medium">
          Speichern
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function ChecklistTemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template: ChecklistTemplate | null;
  onSave: (data: { name: string; burialType?: string | null; items: { title: string; items: { text: string }[] }[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [burialType, setBurialType] = useState(template?.burialType ?? "");
  const [items, setItems] = useState<{ title: string; items: { text: string }[] }[]>(
    template?.items?.length ? JSON.parse(JSON.stringify(template.items)) : [{ title: "", items: [{ text: "" }] }]
  );

  useEffect(() => {
    if (template) {
      setName(template.name);
      setBurialType(template.burialType ?? "");
      setItems(template.items?.length ? JSON.parse(JSON.stringify(template.items)) : [{ title: "", items: [{ text: "" }] }]);
    }
  }, [template]);

  const addGroup = () => setItems((prev) => [...prev, { title: "", items: [{ text: "" }] }]);
  const removeGroup = (gi: number) => setItems((prev) => prev.filter((_, i) => i !== gi));
  const addItem = (gi: number) =>
    setItems((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, items: [...g.items, { text: "" }] } : g))
    );
  const removeItem = (gi: number, ii: number) =>
    setItems((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g
      )
    );
  const setGroupTitle = (gi: number, title: string) =>
    setItems((prev) => prev.map((g, i) => (i === gi ? { ...g, title } : g)));
  const setItemText = (gi: number, ii: number, text: string) =>
    setItems((prev) =>
      prev.map((g, i) =>
        i === gi
          ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, text } : it)) }
          : g
      )
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = items
      .map((g) => ({
        title: g.title.trim(),
        items: g.items.map((it) => ({ text: it.text.trim() })).filter((it) => it.text),
      }))
      .filter((g) => g.title || g.items.length > 0);
    if (!name.trim() || cleaned.length === 0) return;
    onSave({ name: name.trim(), burialType: burialType.trim() || null, items: cleaned });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-mw-green">
          {template ? "Checklist-Vorlage bearbeiten" : "Neue Checklist-Vorlage"}
        </h4>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name der Vorlage"
        className="w-full p-2 rounded-lg border text-sm"
        required
      />
      <select
        value={burialType}
        onChange={(e) => setBurialType(e.target.value)}
        className="w-full p-2 rounded-lg border text-sm"
      >
        <option value="">— Bestattungsart (optional) —</option>
        <option value="Erdbestattung">Erdbestattung</option>
        <option value="Feuerbestattung">Feuerbestattung</option>
        <option value="Seebestattung">Seebestattung</option>
        <option value="Baumbestattung / Friedwald">Baumbestattung / Friedwald</option>
        <option value="Noch unklar">Noch unklar</option>
      </select>
      <p className="text-xs text-gray-500">
        Tippen Sie <kbd className="px-1 py-0.5 bg-gray-100 rounded">@</kbd> in Aufgabentexten für Platzhalter
      </p>
      {items.map((group, gi) => (
        <div key={gi} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={group.title}
              onChange={(e) => setGroupTitle(gi, e.target.value)}
              placeholder="Gruppentitel (z.B. Behörden & Dokumente)"
              className="flex-1 p-2 rounded-lg border text-sm mr-2"
            />
            <button type="button" onClick={() => removeGroup(gi)} className="p-2 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={16} />
            </button>
          </div>
          {group.items.map((item, ii) => (
            <div key={ii} className="flex gap-2 items-center">
              <PlaceholderInput
                value={item.text}
                onChange={(v) => setItemText(gi, ii, v)}
                placeholder="Aufgabe (z.B. Totenschein beim Arzt)"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(gi, ii)}
                className="p-2 text-gray-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addItem(gi)}
            className="text-xs text-mw-green hover:underline"
          >
            + Aufgabe hinzufügen
          </button>
        </div>
      ))}
      <button type="button" onClick={addGroup} className="text-sm text-mw-green hover:underline flex items-center gap-1">
        <Plus size={14} /> Gruppe hinzufügen
      </button>
      <div className="flex gap-2">
        <button type="submit" className="bg-mw-green text-white px-4 py-2 rounded-lg text-sm font-medium">
          Speichern
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
          Abbrechen
        </button>
      </div>
    </form>
  );
}
