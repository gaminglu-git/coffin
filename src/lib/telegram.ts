/**
 * Telegram Bot API integration for sending form submission notifications to employees.
 * Setup: Create bot via @BotFather, add to group or get chat IDs.
 * Config from DB (install wizard) or env vars.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

export type TelegramNotificationPayload = {
  caseType: "vorsorge" | "trauerfall" | "beratung";
  contactName: string;
  contactEmail: string;
  familyPin: string;
  extra?: string;
};

export type TelegramConfigOverride = {
  telegramBotToken?: string;
  telegramChatIds?: string;
};

function getTelegramConfig(override?: TelegramConfigOverride | null) {
  const token = override?.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = override?.telegramChatIds ?? process.env.TELEGRAM_CHAT_IDS;

  if (!token || !chatIds) return null;

  const idList = chatIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (idList.length === 0) return null;

  return { token, chatIds: idList };
}

function formatMessage(payload: TelegramNotificationPayload): string {
  const caseTypeLabel =
    payload.caseType === "vorsorge"
      ? "Vorsorge"
      : payload.caseType === "trauerfall"
        ? "Trauerfall"
        : "Beratung";

  let text = `🔔 *Neuer ${caseTypeLabel}* eingegangen\n\n`;
  text += `👤 ${payload.contactName}\n`;
  text += `📧 ${payload.contactEmail}\n`;
  text += `🔑 Familien-PIN: ${payload.familyPin}`;
  if (payload.extra) {
    text += `\n\n${payload.extra}`;
  }
  return text;
}

/**
 * Sends a Telegram message to configured chat IDs when a form is submitted.
 * Fails silently if Telegram is not configured.
 * @param configOverride - Optional config from DB (install wizard)
 */
export async function sendTelegramNotification(
  payload: TelegramNotificationPayload,
  configOverride?: TelegramConfigOverride | null
): Promise<void> {
  const config = getTelegramConfig(configOverride);
  if (!config) return;

  const text = formatMessage(payload);
  const url = `${TELEGRAM_API_BASE}/bot${config.token}/sendMessage`;

  for (const chatId of config.chatIds) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(
          `[Telegram] Failed to send to ${chatId}:`,
          res.status,
          errBody
        );
      }
    } catch (err) {
      console.error(`[Telegram] Error sending to ${chatId}:`, err);
    }
  }
}
