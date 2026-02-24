/**
 * Email notifications for form submissions via Resend API.
 * Setup: Resend account, verify domain.
 * Config from DB (install wizard) or env vars. Free tier: 100 emails/day, 3000/month.
 */

const RESEND_API_BASE = "https://api.resend.com";

export type EmailNotificationPayload = {
  caseType: "vorsorge" | "trauerfall" | "beratung";
  contactName: string;
  contactEmail: string;
  familyPin: string;
  extra?: string;
};

export type EmailConfigOverride = {
  resendApiKey?: string;
  emailNotifyRecipients?: string;
  emailNotifyFrom?: string;
};

function getEmailConfig(override?: EmailConfigOverride | null) {
  const apiKey = override?.resendApiKey ?? process.env.RESEND_API_KEY;
  const to = override?.emailNotifyRecipients ?? process.env.EMAIL_NOTIFY_RECIPIENTS;
  const from = override?.emailNotifyFrom ?? process.env.EMAIL_NOTIFY_FROM ?? "Benachrichtigungen <onboarding@resend.dev>";

  if (!apiKey || !to) return null;

  const recipientList = to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipientList.length === 0) return null;

  return { apiKey, to: recipientList, from };
}

function getEmailSendConfig(override?: EmailConfigOverride | null) {
  const apiKey = override?.resendApiKey ?? process.env.RESEND_API_KEY;
  const from = override?.emailNotifyFrom ?? process.env.EMAIL_NOTIFY_FROM ?? "Benachrichtigungen <onboarding@resend.dev>";
  if (!apiKey) return null;
  return { apiKey, from };
}

function formatEmailContent(payload: EmailNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const caseTypeLabel =
    payload.caseType === "vorsorge"
      ? "Vorsorge"
      : payload.caseType === "trauerfall"
        ? "Trauerfall"
        : "Beratung";

  const subject = `Neuer ${caseTypeLabel}: ${payload.contactName}`;

  let body = `Neuer ${caseTypeLabel} eingegangen\n\n`;
  body += `Kontakt: ${payload.contactName}\n`;
  body += `E-Mail: ${payload.contactEmail}\n`;
  body += `Familien-PIN: ${payload.familyPin}`;
  if (payload.extra) {
    body += `\n\n${payload.extra}`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
  <h2 style="color: #065f46;">Neuer ${caseTypeLabel} eingegangen</h2>
  <p><strong>Kontakt:</strong> ${escapeHtml(payload.contactName)}</p>
  <p><strong>E-Mail:</strong> ${escapeHtml(payload.contactEmail)}</p>
  <p><strong>Familien-PIN:</strong> <code>${escapeHtml(payload.familyPin)}</code></p>
  ${payload.extra ? `<p><strong>Zusatz:</strong> ${escapeHtml(payload.extra)}</p>` : ""}
</body>
</html>`.trim();

  return { subject, html, text: body };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends an email to configured recipients when a form is submitted.
 * Uses Resend API. Fails silently if not configured.
 * @param configOverride - Optional config from DB (install wizard)
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload,
  configOverride?: EmailConfigOverride | null
): Promise<void> {
  const config = getEmailConfig(configOverride);
  if (!config) return;

  const { subject, html, text } = formatEmailContent(payload);

  try {
    const res = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Email] Failed to send:", res.status, errBody);
    }
  } catch (err) {
    console.error("[Email] Error:", err);
  }
}

export type CustomerConfirmationPayload = {
  contactEmail: string;
  contactName: string;
  familyPin: string;
  caseType: "vorsorge" | "trauerfall" | "beratung";
  summary?: string;
};

function formatCustomerConfirmationContent(payload: CustomerConfirmationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const caseTypeLabel =
    payload.caseType === "vorsorge"
      ? "Vorsorge"
      : payload.caseType === "trauerfall"
        ? "Trauerfall"
        : "Beratung";

  const subject = "Ihre Anfrage ist bei uns eingegangen – Minten & Walter";

  let body = `Guten Tag ${payload.contactName},\n\n`;
  body += `vielen Dank für Ihre ${caseTypeLabel}-Anfrage. Wir haben Ihre Nachricht erhalten und melden uns zeitnah bei Ihnen.\n\n`;
  body += `Ihre Familien-PIN für das Familienportal: ${payload.familyPin}\n\n`;
  body += `Bitte bewahren Sie diesen Code sicher auf. Sie benötigen ihn für den Zugang zum Familienportal.\n\n`;
  body += `Mit freundlichen Grüßen\nIhr Team von Minten & Walter Bestattungen\n\n`;
  body += `0228 620 58 15\ninfo@minten-walter.de`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <p>Guten Tag ${escapeHtml(payload.contactName)},</p>
  <p>vielen Dank für Ihre ${escapeHtml(caseTypeLabel)}-Anfrage. Wir haben Ihre Nachricht erhalten und melden uns zeitnah bei Ihnen.</p>
  <p><strong>Ihre Familien-PIN für das Familienportal:</strong> <code style="background:#f5f5f5;padding:4px 8px;border-radius:4px;font-size:1.1em;">${escapeHtml(payload.familyPin)}</code></p>
  <p>Bitte bewahren Sie diesen Code sicher auf. Sie benötigen ihn für den Zugang zum Familienportal.</p>
  <p>Mit freundlichen Grüßen<br>Ihr Team von Minten & Walter Bestattungen</p>
  <p style="color:#666;font-size:0.9em;">0228 620 58 15 · info@minten-walter.de</p>
</body>
</html>`.trim();

  return { subject, html, text: body };
}

/**
 * Sends a confirmation email to the customer when their form submission is received.
 * Uses Resend API. Fails silently if not configured.
 */
export async function sendCustomerConfirmationEmail(
  payload: CustomerConfirmationPayload,
  configOverride?: EmailConfigOverride | null
): Promise<void> {
  const config = getEmailSendConfig(configOverride);
  if (!config) return;

  const { subject, html, text } = formatCustomerConfirmationContent(payload);

  try {
    const res = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [payload.contactEmail],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Email] Customer confirmation failed:", res.status, errBody);
    }
  } catch (err) {
    console.error("[Email] Customer confirmation error:", err);
  }
}
