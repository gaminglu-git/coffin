/**
 * WhatsApp Cloud API integration for sending form submission notifications to employees.
 * Uses Meta's official WhatsApp Business Platform API.
 *
 * Setup: Configure WHATSAPP_* env vars. Create and approve a template in Meta Business Manager.
 * Suggested template body: "Neuer {{1}} eingegangen von {{2}} ({{3}}). Familien-PIN: {{4}}"
 * Template parameters: [caseType, contactName, contactEmail, familyPin]
 */

const CLOUD_API_BASE = "https://graph.facebook.com";

export type WhatsAppNotificationPayload = {
  caseType: "vorsorge" | "trauerfall" | "beratung";
  contactName: string;
  contactEmail: string;
  familyPin: string;
  /** Optional extra context, e.g. urgency or estimated price */
  extra?: string;
};

export type WhatsAppConfigOverride = {
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappRecipientPhoneNumbers?: string;
  whatsappTemplateName?: string;
};

function getWhatsAppConfig(override?: WhatsAppConfigOverride | null) {
  const token = override?.whatsappAccessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = override?.whatsappPhoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipients = override?.whatsappRecipientPhoneNumbers ?? process.env.WHATSAPP_RECIPIENT_PHONE_NUMBERS;
  const templateName = override?.whatsappTemplateName ?? process.env.WHATSAPP_TEMPLATE_NAME ?? "new_form_submission";
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  if (!token || !phoneNumberId || !recipients) {
    return null;
  }

  const recipientList = recipients
    .split(",")
    .map((n) => n.trim().replace(/^\+/, ""))
    .filter(Boolean);

  if (recipientList.length === 0) return null;

  return {
    token,
    phoneNumberId,
    recipientList,
    templateName,
    apiVersion,
  };
}

/**
 * Sends a WhatsApp template message to configured employees when a form is submitted.
 * Fails silently if WhatsApp is not configured.
 * @param configOverride - Optional config from DB (install wizard)
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppNotificationPayload,
  configOverride?: WhatsAppConfigOverride | null
): Promise<void> {
  const config = getWhatsAppConfig(configOverride);
  if (!config) return;

  const caseTypeLabel =
    payload.caseType === "vorsorge"
      ? "Vorsorge"
      : payload.caseType === "trauerfall"
        ? "Trauerfall"
        : "Beratung";

  const contactDisplay = payload.extra
    ? `${payload.contactName} (${payload.extra})`
    : payload.contactName;

  const bodyParams = [
    caseTypeLabel,
    contactDisplay,
    payload.contactEmail,
    payload.familyPin,
  ];

  const messageBody = {
    messaging_product: "whatsapp",
    type: "template",
    template: {
      name: config.templateName,
      language: { code: "de" },
      components: [
        {
          type: "body",
          parameters: bodyParams.map((text) => ({
            type: "text",
            text: String(text).slice(0, 1024),
          })),
        },
      ],
    },
  };

  const url = `${CLOUD_API_BASE}/${config.apiVersion}/${config.phoneNumberId}/messages`;

  for (const to of config.recipientList) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...messageBody,
          to,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(
          `[WhatsApp] Failed to send to ${to}:`,
          res.status,
          errBody
        );
      }
    } catch (err) {
      console.error(`[WhatsApp] Error sending to ${to}:`, err);
    }
  }
}
