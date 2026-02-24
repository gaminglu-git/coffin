"use client";

import { useState, useEffect } from "react";
import {
  getCompanySettings,
  saveCompanySettings,
  type EventsDisplayMode,
} from "@/app/actions/company-settings";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VeranstaltungenSettings() {
  const [eventsMode, setEventsMode] = useState<EventsDisplayMode>("next_days");
  const [eventsLimit, setEventsLimit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getCompanySettings().then((companySettings) => {
      setEventsMode(companySettings.eventsDisplayMode);
      setEventsLimit(companySettings.eventsDisplayLimit);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveCompanySettings({
      eventsDisplayMode: eventsMode,
      eventsDisplayLimit: eventsLimit,
    });
    setSaving(false);
    setMessage(result.success ? "Gespeichert." : (result.error ?? "Fehler"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-mw-green" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-serif text-gray-800">
          Veranstaltungstermine
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Steuert, welche Termine von Veranstaltungen auf /termine erscheinen
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Modus</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventsMode"
                  checked={eventsMode === "next_n"}
                  onChange={() => setEventsMode("next_n")}
                  className="rounded-full border-gray-300 text-mw-green focus:ring-mw-green"
                />
                <span className="text-sm">Nächste N Veranstaltungstermine</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventsMode"
                  checked={eventsMode === "next_days"}
                  onChange={() => setEventsMode("next_days")}
                  className="rounded-full border-gray-300 text-mw-green focus:ring-mw-green"
                />
                <span className="text-sm">
                  Alle Veranstaltungstermine in den nächsten X Tagen
                </span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventsLimit" className="text-sm font-medium">
              {eventsMode === "next_n"
                ? "Anzahl Veranstaltungstermine"
                : "Anzahl Tage"}
            </Label>
            <Input
              id="eventsLimit"
              type="number"
              min={1}
              max={365}
              value={eventsLimit}
              onChange={(e) =>
                setEventsLimit(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-24"
            />
          </div>
        </div>

        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-mw-green hover:bg-mw-green-dark"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span className="ml-2">Einstellungen speichern</span>
        </Button>
      </div>
    </div>
  );
}
