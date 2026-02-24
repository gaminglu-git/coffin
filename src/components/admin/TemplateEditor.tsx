"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { PlaceholderExtension } from "@/lib/placeholder-extension";

function htmlToTemplateText(html: string): string {
  if (!html || html === "<p></p>") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

function templateTextToHtml(text: string): string {
  if (!text) return "<p></p>";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function TemplateEditor({
  value,
  onChange,
  placeholder = "Tippen Sie @ für Platzhalter (z.B. @deceased_name)...",
  minHeight = "150px",
  className = "",
}: TemplateEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Placeholder.configure({ placeholder }),
      PlaceholderExtension,
    ],
    content: templateTextToHtml(value),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-3 focus:outline-none min-w-0",
        style: `min-height: ${minHeight}`,
      },
      handleDOMEvents: {
        blur: () => {
          const html = editor?.getHTML() ?? "";
          onChange(htmlToTemplateText(html));
        },
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(htmlToTemplateText(e.getHTML()));
    },
  });

  // Sync value when it changes externally (e.g. template switch)
  useEffect(() => {
    if (!editor) return;
    const current = htmlToTemplateText(editor.getHTML());
    if (value !== current) editor.commands.setContent(templateTextToHtml(value));
  }, [value, editor]);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}
    >
      <EditorContent editor={editor} />
      <p className="text-[10px] text-gray-400 px-3 pb-2">
        Tippen Sie <kbd className="px-1 py-0.5 bg-gray-100 rounded">@</kbd> für
        Platzhalter (Verstorbener, Kontakt, Fall)
      </p>
    </div>
  );
}
