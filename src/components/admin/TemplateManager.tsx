"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Mail, Plus, Trash2, Edit2, X } from "lucide-react";
import {
  listLetterTemplates,
  listEmailTemplates,
  createLetterTemplate,
  createEmailTemplate,
  updateLetterTemplate,
  updateEmailTemplate,
  deleteLetterTemplate,
  deleteEmailTemplate,
} from "@/app/actions/templates";
import type { LetterTemplate, EmailTemplate } from "@/types";

type TabType = "letters" | "emails";

export function TemplateManager() {
  const [tab, setTab] = useState<TabType>("letters");
  const [letterTemplates, setLetterTemplates] = useState<LetterTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLetter, setEditingLetter] = useState<LetterTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [isCreatingLetter, setIsCreatingLetter] = useState(false);
  const [isCreatingEmail, setIsCreatingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const [letters, emails] = await Promise.all([
      listLetterTemplates(),
      listEmailTemplates(),
    ]);
    setLetterTemplates(letters);
    setEmailTemplates(emails);
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

  const templates = tab === "letters" ? letterTemplates : emailTemplates;
  const isEditing = tab === "letters" ? !!editingLetter : !!editingEmail;
  const isCreating = tab === "letters" ? isCreatingLetter : isCreatingEmail;

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
      </div>

      <p className="text-xs text-gray-500">
        Platzhalter: {"{{deceased_name}}"}, {"{{contact_name}}"}, {"{{contact_email}}"}, {"{{case_name}}"}, etc.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}

      {!isEditing && !isCreating && (
        <button
          onClick={() => (tab === "letters" ? setIsCreatingLetter(true) : setIsCreatingEmail(true))}
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
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {t.body.replace(/\n/g, " ")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    tab === "letters"
                      ? setEditingLetter(t as LetterTemplate)
                      : setEditingEmail(t as EmailTemplate)
                  }
                  className="p-2 text-gray-400 hover:text-mw-green rounded-lg"
                  aria-label="Bearbeiten"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    tab === "letters" ? handleDeleteLetter(t.id) : handleDeleteEmail(t.id)
                  }
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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Inhalt mit Platzhaltern wie {{deceased_name}}"
        rows={6}
        className="w-full p-2 rounded-lg border text-sm resize-none"
        required
      />
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
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Inhalt mit Platzhaltern wie {{deceased_name}}"
        rows={6}
        className="w-full p-2 rounded-lg border text-sm resize-none"
        required
      />
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
