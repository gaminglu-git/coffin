"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationSettings = {
  telegramBotToken: string;
  telegramChatIds: string;
  resendApiKey: string;
  emailNotifyRecipients: string;
  emailNotifyFrom: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappRecipientPhoneNumbers: string;
  whatsappTemplateName: string;
};

const KEYS = {
  telegramBotToken: "telegram_bot_token",
  telegramChatIds: "telegram_chat_ids",
  resendApiKey: "resend_api_key",
  emailNotifyRecipients: "email_notify_recipients",
  emailNotifyFrom: "email_notify_from",
  whatsappAccessToken: "whatsapp_access_token",
  whatsappPhoneNumberId: "whatsapp_phone_number_id",
  whatsappRecipientPhoneNumbers: "whatsapp_recipient_phone_numbers",
  whatsappTemplateName: "whatsapp_template_name",
} as const;

function getEnvFallback(): NotificationSettings {
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatIds: process.env.TELEGRAM_CHAT_IDS ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    emailNotifyRecipients: process.env.EMAIL_NOTIFY_RECIPIENTS ?? "",
    emailNotifyFrom:
      process.env.EMAIL_NOTIFY_FROM ?? "Benachrichtigungen <onboarding@resend.dev>",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    whatsappRecipientPhoneNumbers:
      process.env.WHATSAPP_RECIPIENT_PHONE_NUMBERS ?? "",
    whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "new_form_submission",
  };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const env = getEnvFallback();
  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("notification_settings")
      .select("key, value");

    if (!rows?.length) return env;

    const db: Record<string, string> = {};
    for (const r of rows) {
      db[r.key] = r.value ?? "";
    }

    return {
      telegramBotToken: db[KEYS.telegramBotToken] ?? env.telegramBotToken,
      telegramChatIds: db[KEYS.telegramChatIds] ?? env.telegramChatIds,
      resendApiKey: db[KEYS.resendApiKey] ?? env.resendApiKey,
      emailNotifyRecipients:
        db[KEYS.emailNotifyRecipients] ?? env.emailNotifyRecipients,
      emailNotifyFrom: db[KEYS.emailNotifyFrom] ?? env.emailNotifyFrom,
      whatsappAccessToken: db[KEYS.whatsappAccessToken] ?? env.whatsappAccessToken,
      whatsappPhoneNumberId:
        db[KEYS.whatsappPhoneNumberId] ?? env.whatsappPhoneNumberId,
      whatsappRecipientPhoneNumbers:
        db[KEYS.whatsappRecipientPhoneNumbers] ??
        env.whatsappRecipientPhoneNumbers,
      whatsappTemplateName:
        db[KEYS.whatsappTemplateName] ?? env.whatsappTemplateName,
    };
  } catch {
    return env;
  }
}

const SETTING_TO_DB_KEY: Record<keyof NotificationSettings, string> = {
  telegramBotToken: KEYS.telegramBotToken,
  telegramChatIds: KEYS.telegramChatIds,
  resendApiKey: KEYS.resendApiKey,
  emailNotifyRecipients: KEYS.emailNotifyRecipients,
  emailNotifyFrom: KEYS.emailNotifyFrom,
  whatsappAccessToken: KEYS.whatsappAccessToken,
  whatsappPhoneNumberId: KEYS.whatsappPhoneNumberId,
  whatsappRecipientPhoneNumbers: KEYS.whatsappRecipientPhoneNumbers,
  whatsappTemplateName: KEYS.whatsappTemplateName,
};

export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();

    for (const [settingKey, value] of Object.entries(settings)) {
      if (value === undefined) continue;
      const dbKey = SETTING_TO_DB_KEY[settingKey as keyof NotificationSettings];
      if (!dbKey) continue;

      const { error } = await admin
        .from("notification_settings")
        .upsert(
          { key: dbKey, value: String(value).trim(), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) {
        console.error("saveNotificationSettings error:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function testNotificationChannel(
  channel: "telegram" | "email",
  settings: Pick<NotificationSettings, "telegramBotToken" | "telegramChatIds" | "resendApiKey" | "emailNotifyRecipients" | "emailNotifyFrom">
): Promise<{ success: boolean; error?: string }> {
  if (channel === "telegram") {
    if (!settings.telegramBotToken?.trim() || !settings.telegramChatIds?.trim()) {
      return { success: false, error: "Bot-Token und Chat-IDs erforderlich" };
    }
    const chatIds = settings.telegramChatIds.split(",").map((s) => s.trim()).filter(Boolean);
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatIds[0],
          text: "✅ Test-Benachrichtigung von liebevoll bestatten – Formular-Anbindung funktioniert.",
          parse_mode: "Markdown",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Telegram: ${res.status} – ${body.slice(0, 200)}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Netzwerkfehler" };
    }
  }

  if (channel === "email") {
    if (!settings.resendApiKey?.trim() || !settings.emailNotifyRecipients?.trim()) {
      return { success: false, error: "API-Key und Empfänger erforderlich" };
    }
    const to = settings.emailNotifyRecipients.split(",").map((s) => s.trim()).filter(Boolean);
    const from = settings.emailNotifyFrom?.trim() || "Benachrichtigungen <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: to.slice(0, 1),
          subject: "Test – Formular-Benachrichtigung",
          html: "<p>✅ Test-Benachrichtigung von liebevoll bestatten – Formular-Anbindung funktioniert.</p>",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Resend: ${res.status} – ${body.slice(0, 200)}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Netzwerkfehler" };
    }
  }

  return { success: false, error: "Unbekannter Kanal" };
}
