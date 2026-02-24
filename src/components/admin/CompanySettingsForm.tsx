"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/app/actions/company-settings";

export function CompanySettingsForm() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getCompanySettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = <K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    const result = await saveCompanySettings(settings);
    setSaving(false);
    if (result.success) {
      setMessage({ ok: true, msg: "Einstellungen gespeichert." });
    } else {
      setMessage({ ok: false, msg: result.error ?? "Fehler beim Speichern" });
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-mw-green" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-serif text-gray-800">Whitelabel-Einstellungen</h2>
        <p className="text-sm text-gray-500 mt-1">
          Anzeigename, Farben und Logo für die öffentliche Website anpassen.
        </p>
      </div>

      <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Anzeigename</Label>
          <Input
            id="displayName"
            value={settings.displayName}
            onChange={(e) => updateSetting("displayName", e.target.value)}
            placeholder="z.B. liebevoll bestatten"
            className="max-w-md"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Unterzeile / Tagline</Label>
          <Input
            id="tagline"
            value={settings.tagline}
            onChange={(e) => updateSetting("tagline", e.target.value)}
            placeholder="z.B. minten & walter · Bonn"
            className="max-w-md"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primärfarbe</Label>
            <div className="flex gap-2">
              <input
                id="primaryColor"
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                placeholder="#047857"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
            <div className="flex gap-2">
              <input
                id="secondaryColor"
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input
                value={settings.secondaryColor}
                onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                placeholder="#b45309"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo-URL</Label>
          <Input
            id="logoUrl"
            value={settings.logoUrl}
            onChange={(e) => updateSetting("logoUrl", e.target.value)}
            placeholder="https://..."
            className="max-w-md"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="faviconUrl">Favicon-URL</Label>
          <Input
            id="faviconUrl"
            value={settings.faviconUrl}
            onChange={(e) => updateSetting("faviconUrl", e.target.value)}
            placeholder="https://..."
            className="max-w-md"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.msg}
        </p>
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
        <span className="ml-2">Speichern</span>
      </Button>
    </div>
  );
}
