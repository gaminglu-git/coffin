"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ParameterValue = string | number | boolean;

interface ParameterEntry {
  key: string;
  value: ParameterValue;
  type: "string" | "number" | "boolean";
}

interface DynamicParametersFieldProps {
  value: Record<string, ParameterValue>;
  onChange: (value: Record<string, ParameterValue>) => void;
  label?: string;
}

function valueToEntry(v: ParameterValue): ParameterEntry["type"] {
  return typeof v === "boolean"
    ? "boolean"
    : typeof v === "number"
      ? "number"
      : "string";
}

function entriesToParams(entries: ParameterEntry[]): Record<string, ParameterValue> {
  const result: Record<string, ParameterValue> = {};
  for (const { key, value } of entries) {
    if (key.trim()) {
      result[key.trim()] = value;
    }
  }
  return result;
}

export function DynamicParametersField({
  value,
  onChange,
  label = "Zusätzliche Parameter",
}: DynamicParametersFieldProps) {
  const [entries, setEntries] = useState<ParameterEntry[]>(() =>
    Object.entries(value ?? {}).map(([k, v]) => ({
      key: k,
      value: v,
      type: valueToEntry(v),
    }))
  );

  const updateEntry = (index: number, updates: Partial<ParameterEntry>) => {
    const next = [...entries];
    next[index] = { ...next[index]!, ...updates };
    setEntries(next);
    onChange(entriesToParams(next));
  };

  const removeEntry = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    onChange(entriesToParams(next));
  };

  const addEntry = () => {
    const next = [...entries, { key: "", value: "", type: "string" as const }];
    setEntries(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEntry}
          className="h-8"
        >
          <Plus size={14} className="mr-1" /> Parameter hinzufügen
        </Button>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Keine Parameter. Klicken Sie auf „Parameter hinzufügen“, um z.B. Material, Maße oder andere Attribute anzulegen.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50/50"
            >
              <Input
                placeholder="Name (z.B. Material)"
                value={entry.key}
                onChange={(e) => updateEntry(index, { key: e.target.value })}
                className="flex-1 min-w-[100px] max-w-[140px]"
              />
              {entry.type === "boolean" ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!entry.value}
                    onCheckedChange={(c) =>
                      updateEntry(index, { value: !!c })
                    }
                  />
                  <span className="text-sm text-muted-foreground">Ja/Nein</span>
                </div>
              ) : (
                <Input
                  placeholder={
                    entry.type === "number" ? "Zahl" : "Wert"
                  }
                  type={entry.type === "number" ? "number" : "text"}
                  value={
                    entry.type === "number" && typeof entry.value === "number"
                      ? entry.value
                      : String(entry.value ?? "")
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (entry.type === "number") {
                      const n = parseFloat(v);
                      updateEntry(index, {
                        value: isNaN(n) ? 0 : n,
                      });
                    } else {
                      updateEntry(index, { value: v });
                    }
                  }}
                  className="flex-1 min-w-[100px] max-w-[140px]"
                />
              )}
              <Select
                value={entry.type}
                onValueChange={(v) => {
                  const type = v as "string" | "number" | "boolean";
                  let newValue: ParameterValue =
                    type === "boolean"
                      ? false
                      : type === "number"
                        ? 0
                        : "";
                  updateEntry(index, { type, value: newValue });
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">Text</SelectItem>
                  <SelectItem value="number">Zahl</SelectItem>
                  <SelectItem value="boolean">Ja/Nein</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(index)}
                aria-label="Parameter entfernen"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
