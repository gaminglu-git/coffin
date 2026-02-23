import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Inbound email webhook for e.g. Resend, Mailgun, or custom forwarding.
 * POST body (JSON):
 * - from: string
 * - subject: string
 * - text?: string (plain body)
 * - html?: string (HTML body)
 * - caseId?: string (optional - will try to parse from subject if missing)
 * - attachments?: Array<{ filename: string; content: string }> (base64)
 *
 * Case ID parsing: looks for UUID in subject, e.g. "Re: Fall abc12345-1234-..."
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-inbound-secret");
    const expectedSecret = process.env.INBOUND_EMAIL_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const from = String(body.from ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const text = String(body.text ?? body.plain_text ?? "").trim();
    const html = String(body.html ?? "").trim();
    const content = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "(kein Inhalt)";

    let caseId = body.caseId ?? body.case_id ?? null;
    if (!caseId && subject) {
      const match = subject.match(UUID_REGEX);
      if (match) caseId = match[0];
    }

    if (!caseId) {
      return NextResponse.json(
        { error: "caseId required (in body or as UUID in subject)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: caseExists } = await admin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (!caseExists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: comm, error: insertError } = await admin
      .from("communications")
      .insert({
        case_id: caseId,
        type: "email",
        direction: "incoming",
        subject: subject || null,
        content,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("inbound-email insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const first = attachments[0];
    if (first?.content && comm?.id) {
      const filename = String(first.filename ?? first.name ?? "attachment").trim();
      const ext = filename.split(".").pop() || "bin";
      const path = `${comm.id}/${crypto.randomUUID()}.${ext}`;
      const buf = Buffer.from(first.content, "base64");

      const { error: uploadError } = await admin.storage
        .from("correspondence-docs")
        .upload(path, buf, {
          contentType: first.contentType ?? first.type ?? "application/octet-stream",
          upsert: false,
        });

      if (!uploadError) {
        await admin
          .from("communications")
          .update({ storage_path: path })
          .eq("id", comm.id);
      }
    }

    return NextResponse.json({
      success: true,
      communicationId: comm?.id,
      caseId,
    });
  } catch (err) {
    console.error("inbound-email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
