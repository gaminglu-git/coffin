/**
 * Unified form notification dispatcher.
 * Sends to all configured channels (WhatsApp, Telegram, Email) in parallel.
 * Each channel no-ops if not configured.
 * Config from DB (install wizard) or env vars.
 */

import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendEmailNotification, sendCustomerConfirmationEmail } from "@/lib/email-notify";
import { getNotificationSettings } from "@/app/actions/notification-settings";

export type FormNotificationPayload = {
  caseType: "vorsorge" | "trauerfall" | "beratung";
  contactName: string;
  contactEmail: string;
  familyPin: string;
  extra?: string;
};

/**
 * Sends form submission notifications to all configured channels.
 * Runs in parallel; errors are logged but do not affect other channels.
 * Uses config from DB (install wizard) or env vars.
 */
export async function sendFormNotification(
  payload: FormNotificationPayload
): Promise<void> {
  const config = await getNotificationSettings();

  await Promise.allSettled([
    sendWhatsAppNotification(payload, config),
    sendTelegramNotification(payload, config),
    sendEmailNotification(payload, config),
    sendCustomerConfirmationEmail(
      {
        contactEmail: payload.contactEmail,
        contactName: payload.contactName,
        familyPin: payload.familyPin,
        caseType: payload.caseType,
        summary: payload.extra,
      },
      config
    ),
  ]);
}
