"use client";

import { useRef, useState } from "react";
import { PLACEHOLDER_SUGGESTIONS } from "@/lib/placeholder-suggestions";

interface PlaceholderInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PlaceholderInput({
  value,
  onChange,
  placeholder = "Text (z.B. @ für Platzhalter)",
  className = "",
}: PlaceholderInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    const atIndex = v.lastIndexOf("@");
    if (atIndex >= 0) {
      setFilter(v.slice(atIndex + 1).toLowerCase());
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (placeholder: string) => {
    const v = value;
    const atIndex = v.lastIndexOf("@");
    const before = atIndex >= 0 ? v.slice(0, atIndex) : v;
    const after = v.slice(atIndex + 1 + filter.length);
    onChange(before + placeholder + after);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const filtered = filter
    ? PLACEHOLDER_SUGGESTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(filter) ||
          s.id.toLowerCase().includes(filter)
      )
    : PLACEHOLDER_SUGGESTIONS;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onFocus={() => {
          if (value.includes("@")) {
            const atIndex = value.lastIndexOf("@");
            setFilter(value.slice(atIndex + 1).toLowerCase());
            setShowDropdown(true);
          }
        }}
        placeholder={placeholder}
        className={`w-full p-2 rounded-lg border text-sm ${className}`}
      />
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {filtered.slice(0, 10).map((s) => (
            <button
              key={s.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-mw-green/10 flex flex-col gap-0.5"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s.placeholder);
              }}
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-xs text-gray-500">{s.placeholder}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">Keine Treffer</p>
          )}
        </div>
      )}
    </div>
  );
}
