"use client";

import { useState, useEffect } from "react";
import { Send, Mail, MessageCircle, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getNotificationSettings,
  saveNotificationSettings,
  testNotificationChannel,
  type NotificationSettings,
} from "@/app/actions/notification-settings";

type ChannelTab = "telegram" | "email" | "whatsapp";

const CHANNEL_TABS: { id: ChannelTab; label: string; icon: React.ReactNode }[] = [
  { id: "telegram", label: "Telegram", icon: <MessageCircle size={18} /> },
  { id: "email", label: "E-Mail", icon: <Mail size={18} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <Send size={18} /> },
];

export function NotificationSetupWizard() {
  const [activeTab, setActiveTab] = useState<ChannelTab>("telegram");
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getNotificationSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setTestResult(null);
    const result = await saveNotificationSettings(settings);
    setSaving(false);
    if (result.success) {
      setTestResult({ ok: true, msg: "Einstellungen gespeichert." });
    } else {
      setTestResult({ ok: false, msg: result.error ?? "Fehler beim Speichern" });
    }
  };

  const handleTest = async () => {
    if (!settings || (activeTab !== "telegram" && activeTab !== "email")) return;
    setTesting(true);
    setTestResult(null);
    const result = await testNotificationChannel(activeTab, settings);
    setTesting(false);
    setTestResult({
      ok: result.success,
      msg: result.success ? "Test-Nachricht gesendet!" : (result.error ?? "Fehler"),
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-mw-green" />
      </div>
    );
  }

  const isTelegramConfigured = !!(settings.telegramBotToken?.trim() && settings.telegramChatIds?.trim());
  const isEmailConfigured = !!(settings.resendApiKey?.trim() && settings.emailNotifyRecipients?.trim());
  const isWhatsAppConfigured = !!(
    settings.whatsappAccessToken?.trim() &&
    settings.whatsappPhoneNumberId?.trim() &&
    settings.whatsappRecipientPhoneNumbers?.trim()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-serif text-gray-800">Formular-Benachrichtigungen einrichten</h2>
        <p className="text-sm text-gray-500 mt-1">
          Mitarbeiter werden informiert, wenn Vorsorge-, Trauerfall- oder Beratungsformulare eingereicht werden.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {CHANNEL_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              setTestResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === id
                ? "bg-mw-green text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {icon}
            {label}
            {(id === "telegram" && isTelegramConfigured) ||
            (id === "email" && isEmailConfigured) ||
            (id === "whatsapp" && isWhatsAppConfigured) ? (
              <CheckCircle size={14} className="opacity-80" />
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "telegram" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Schritt 1: Bot erstellen</p>
            <p className="mb-2">
              Öffnen Sie Telegram und suchen Sie <strong>@BotFather</strong>. Senden Sie <code>/newbot</code> und folgen Sie den Anweisungen. Kopieren Sie den Token.
            </p>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              @BotFather öffnen <ExternalLink size={14} />
            </a>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram-token">Bot-Token</Label>
            <Input
              id="telegram-token"
              type="password"
              placeholder="123456789:ABCdef..."
              value={settings.telegramBotToken}
              onChange={(e) => updateSetting("telegramBotToken", e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Schritt 2: Chat-ID ermitteln</p>
            <p>
              Fügen Sie den Bot zu einer Gruppe hinzu oder chatten Sie mit ihm. Rufen Sie dann{" "}
              <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> auf – die <code>chat.id</code> ist Ihre Chat-ID (bei Gruppen negativ, z.B. -1001234567890).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram-chatids">Chat-IDs (kommagetrennt)</Label>
            <Input
              id="telegram-chatids"
              placeholder="-1001234567890, 123456789"
              value={settings.telegramChatIds}
              onChange={(e) => updateSetting("telegramChatIds", e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
      )}

      {activeTab === "email" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Resend einrichten</p>
            <p className="mb-2">
              Erstellen Sie einen kostenlosen Account auf{" "}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">
                resend.com
              </a>
              . Verifizieren Sie Ihre Domain und erstellen Sie einen API-Key.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resend-key">Resend API-Key</Label>
            <Input
              id="resend-key"
              type="password"
              placeholder="re_..."
              value={settings.resendApiKey}
              onChange={(e) => updateSetting("resendApiKey", e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-recipients">Empfänger (kommagetrennt)</Label>
            <Input
              id="email-recipients"
              type="email"
              placeholder="team@firma.de, admin@firma.de"
              value={settings.emailNotifyRecipients}
              onChange={(e) => updateSetting("emailNotifyRecipients", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-from">Absender (optional)</Label>
            <Input
              id="email-from"
              placeholder="Benachrichtigungen <noreply@ihre-domain.de>"
              value={settings.emailNotifyFrom}
              onChange={(e) => updateSetting("emailNotifyFrom", e.target.value)}
            />
          </div>
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-2">Meta Developer Account erforderlich</p>
            <p>
              WhatsApp benötigt einen Meta Developer Account und genehmigte Nachrichten-Templates. Einfacher: Nutzen Sie{" "}
              <button
                type="button"
                onClick={() => setActiveTab("telegram")}
                className="underline font-medium"
              >
                Telegram
              </button>{" "}
              oder{" "}
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className="underline font-medium"
              >
                E-Mail
              </button>
              .
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-token">Access Token</Label>
            <Input
              id="wa-token"
              type="password"
              placeholder="EAA..."
              value={settings.whatsappAccessToken}
              onChange={(e) => updateSetting("whatsappAccessToken", e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-phone-id">Phone Number ID</Label>
            <Input
              id="wa-phone-id"
              placeholder="123456789012345"
              value={settings.whatsappPhoneNumberId}
              onChange={(e) => updateSetting("whatsappPhoneNumberId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-recipients">Empfänger-Nummern (kommagetrennt, mit Ländervorwahl)</Label>
            <Input
              id="wa-recipients"
              placeholder="49123456789, 49987654321"
              value={settings.whatsappRecipientPhoneNumbers}
              onChange={(e) => updateSetting("whatsappRecipientPhoneNumbers", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-template">Template-Name (optional)</Label>
            <Input
              id="wa-template"
              placeholder="new_form_submission"
              value={settings.whatsappTemplateName}
              onChange={(e) => updateSetting("whatsappTemplateName", e.target.value)}
            />
          </div>
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-lg text-sm ${
            testResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {testResult.ok ? <CheckCircle size={18} className="inline mr-2" /> : null}
          {testResult.msg}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-mw-green hover:bg-mw-green-dark"
        >
          {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          Speichern
        </Button>
        {(activeTab === "telegram" && isTelegramConfigured) || (activeTab === "email" && isEmailConfigured) ? (
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
            Test senden
          </Button>
        ) : null}
      </div>
    </div>
  );
}
