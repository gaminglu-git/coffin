"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/app/actions/employees";

export type MessengerChannel = {
  id: string;
  type: "direct" | "group";
  name: string | null;
  caseId: string | null;
  createdById: string | null;
  createdAt: string;
  members: { employeeId: string; displayName: string }[];
  lastMessageAt?: string;
};

export type MessengerMessage = {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  encryptedContent: string;
  nonce: string;
  createdAt: string;
};

export type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export async function listChannels(): Promise<MessengerChannel[]> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) return [];

    const { data: memberships, error: memErr } = await supabase
      .from("messenger_channel_members")
      .select("channel_id")
      .eq("employee_id", employee.id);

    if (memErr || !memberships?.length) return [];

    const channelIds = memberships.map((m) => m.channel_id);

    const { data: channels, error: chErr } = await supabase
      .from("messenger_channels")
      .select("id, type, name, case_id, created_by_id, created_at")
      .in("id", channelIds)
      .order("created_at", { ascending: false });

    if (chErr || !channels?.length) return [];

    const { data: allMembers } = await supabase
      .from("messenger_channel_members")
      .select("channel_id, employee_id")
      .in("channel_id", channelIds);

    const { data: employees } = await supabase
      .from("employees")
      .select("id, display_name")
      .in(
        "id",
        [...new Set((allMembers ?? []).map((m) => m.employee_id))]
      );

    const empMap = new Map(
      (employees ?? []).map((e) => [e.id, e.display_name as string])
    );

    const { data: lastMessages } = await supabase
      .from("messenger_messages")
      .select("channel_id, created_at")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false });

    const lastByChannel = new Map<string, string>();
    for (const m of lastMessages ?? []) {
      if (!lastByChannel.has(m.channel_id)) {
        lastByChannel.set(m.channel_id, m.created_at as string);
      }
    }

    const membersByChannel = new Map<string, { employeeId: string; displayName: string }[]>();
    for (const m of allMembers ?? []) {
      const list = membersByChannel.get(m.channel_id) ?? [];
      list.push({
        employeeId: m.employee_id,
        displayName: empMap.get(m.employee_id) ?? "Unbekannt",
      });
      membersByChannel.set(m.channel_id, list);
    }

    return channels.map((c) => ({
      id: c.id,
      type: c.type as "direct" | "group",
      name: c.name as string | null,
      caseId: c.case_id as string | null,
      createdById: c.created_by_id as string | null,
      createdAt: c.created_at as string,
      members: membersByChannel.get(c.id) ?? [],
      lastMessageAt: lastByChannel.get(c.id),
    }));
  } catch {
    return [];
  }
}

export async function getOrCreateDirectChannel(
  otherEmployeeId: string
): Promise<ActionResult & { channelId?: string }> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }
    if (otherEmployeeId === employee.id) {
      return { success: false, error: "Du kannst nicht mit dir selbst chatten." };
    }

    const { data: existing } = await supabase
      .from("messenger_channel_members")
      .select("channel_id")
      .eq("employee_id", employee.id);

    if (existing?.length) {
      for (const m of existing) {
        const { data: other } = await supabase
          .from("messenger_channel_members")
          .select("channel_id")
          .eq("channel_id", m.channel_id)
          .eq("employee_id", otherEmployeeId)
          .maybeSingle();

        if (other) {
          const { data: ch } = await supabase
            .from("messenger_channels")
            .select("id")
            .eq("id", m.channel_id)
            .eq("type", "direct")
            .single();

          if (ch) {
            return { success: true, channelId: ch.id };
          }
        }
      }
    }

    const admin = createAdminClient();
    const { data: newChannel, error: insertErr } = await admin
      .from("messenger_channels")
      .insert({
        type: "direct",
        name: null,
        case_id: null,
        created_by_id: null,
      })
      .select("id")
      .single();

    if (insertErr || !newChannel) {
      return { success: false, error: insertErr?.message ?? "Channel konnte nicht erstellt werden." };
    }

    const { error: membersErr } = await admin.from("messenger_channel_members").insert([
      { channel_id: newChannel.id, employee_id: employee.id },
      { channel_id: newChannel.id, employee_id: otherEmployeeId },
    ]);

    if (membersErr) {
      await admin.from("messenger_channels").delete().eq("id", newChannel.id);
      return { success: false, error: membersErr.message };
    }

    return { success: true, channelId: newChannel.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function createGroupChannel(
  name: string,
  employeeIds: string[],
  caseId?: string | null
): Promise<ActionResult & { channelId?: string }> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }

    const memberIds = [...new Set([employee.id, ...employeeIds])];
    if (memberIds.length < 2) {
      return { success: false, error: "Gruppe braucht mindestens 2 Mitglieder." };
    }

    const admin = createAdminClient();
    const { data: newChannel, error: insertErr } = await admin
      .from("messenger_channels")
      .insert({
        type: "group",
        name: name.trim(),
        case_id: caseId ?? null,
        created_by_id: employee.id,
      })
      .select("id")
      .single();

    if (insertErr || !newChannel) {
      return { success: false, error: insertErr?.message ?? "Channel konnte nicht erstellt werden." };
    }

    await admin.from("messenger_channel_members").insert(
      memberIds.map((eid) => ({
        channel_id: newChannel.id,
        employee_id: eid,
      }))
    );

    return { success: true, channelId: newChannel.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function listMessages(
  channelId: string,
  limit = 50,
  before?: string
): Promise<MessengerMessage[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("messenger_messages")
      .select("id, channel_id, sender_id, encrypted_content, nonce, created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      console.error("listMessages error:", error);
      return [];
    }

    const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))];
    const { data: employees } = await supabase
      .from("employees")
      .select("id, display_name")
      .in("id", senderIds);

    const empMap = new Map(
      (employees ?? []).map((e) => [e.id, e.display_name as string])
    );

    return (data ?? []).map((m) => ({
      id: m.id,
      channelId: m.channel_id,
      senderId: m.sender_id,
      senderName: empMap.get(m.sender_id) ?? "Unbekannt",
      encryptedContent: m.encrypted_content,
      nonce: m.nonce,
      createdAt: m.created_at,
    }));
  } catch {
    return [];
  }
}

export async function sendMessage(
  channelId: string,
  encryptedContent: string,
  nonce: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }

    const { error } = await supabase.from("messenger_messages").insert({
      channel_id: channelId,
      sender_id: employee.id,
      encrypted_content: encryptedContent,
      nonce,
    });

    if (error) {
      console.error("sendMessage error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function addGroupMember(
  channelId: string,
  employeeId: string,
  encryptedGroupKey: string,
  nonce: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }

    const { data: channel } = await supabase
      .from("messenger_channels")
      .select("type")
      .eq("id", channelId)
      .single();

    if (!channel || channel.type !== "group") {
      return { success: false, error: "Nur Gruppen können erweitert werden." };
    }

    const admin = createAdminClient();
    await admin.from("messenger_channel_members").insert({
      channel_id: channelId,
      employee_id: employeeId,
    });

    await admin.from("messenger_group_keys").insert({
      channel_id: channelId,
      employee_id: employeeId,
      encrypted_group_key: encryptedGroupKey,
      nonce,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

export async function getChannelForGroupKeys(
  channelId: string
): Promise<{
  id: string;
  type: string;
  createdById: string | null;
  members: string[];
} | null> {
  try {
    const supabase = await createClient();
    const { data: ch } = await supabase
      .from("messenger_channels")
      .select("id, type, created_by_id")
      .eq("id", channelId)
      .single();

    if (!ch) return null;

    const { data: members } = await supabase
      .from("messenger_channel_members")
      .select("employee_id")
      .eq("channel_id", channelId);

    return {
      id: ch.id,
      type: ch.type as string,
      createdById: ch.created_by_id as string | null,
      members: (members ?? []).map((m) => m.employee_id),
    };
  } catch {
    return null;
  }
}

export async function getGroupKeyForChannel(
  channelId: string
): Promise<{ encryptedGroupKey: string; nonce: string } | null> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) return null;

    const { data, error } = await supabase
      .from("messenger_group_keys")
      .select("encrypted_group_key, nonce")
      .eq("channel_id", channelId)
      .eq("employee_id", employee.id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      encryptedGroupKey: data.encrypted_group_key,
      nonce: data.nonce,
    };
  } catch {
    return null;
  }
}

export async function storeGroupKeys(
  channelId: string,
  keys: { employeeId: string; encryptedGroupKey: string; nonce: string }[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const employee = await getCurrentEmployee();
    if (!employee) {
      return { success: false, error: "Nicht eingeloggt." };
    }

    const admin = createAdminClient();
    const rows = keys.map((k) => ({
      channel_id: channelId,
      employee_id: k.employeeId,
      encrypted_group_key: k.encryptedGroupKey,
      nonce: k.nonce,
    }));

    const { error } = await admin.from("messenger_group_keys").insert(rows);

    if (error) {
      console.error("storeGroupKeys error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}
