"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { MessageBubble } from "@/components/admin/MessageBubble";
import {
  listMessages,
  sendMessage,
  getChannelForGroupKeys,
  getGroupKeyForChannel,
} from "@/app/actions/messenger";
import { getIdentityKeys } from "@/app/actions/messenger-keys";
import { getCurrentEmployee } from "@/app/actions/employees";
import {
  getPrivateKey,
  importPublicKey,
  deriveSharedSecret,
  encrypt,
  decrypt,
  decryptGroupKey,
  decryptWithGroupKey,
  encryptWithGroupKey,
} from "@/lib/messenger-crypto";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { MessengerChannel, MessengerMessage } from "@/app/actions/messenger";

interface ChatPanelProps {
  channel: MessengerChannel | null;
  onDecryptionError?: (msg: string) => void;
}

type DecryptedMessage = {
  id: string;
  text: string;
  senderName: string;
  isOwn: boolean;
  createdAt: string;
};

export function ChatPanel({ channel, onDecryptionError }: ChatPanelProps) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<{ id: string } | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const decryptMessages = useCallback(
    async (
      raw: MessengerMessage[],
      ch: MessengerChannel
    ): Promise<DecryptedMessage[]> => {
      const emp = await getCurrentEmployee();
      if (!emp) return [];

      const result: DecryptedMessage[] = [];

      if (ch.type === "direct") {
        const other = ch.members.find((m) => m.employeeId !== emp.id);
        if (!other) return [];
        const myPrivate = await getPrivateKey();
        const keys = await getIdentityKeys([other.employeeId]);
        const otherPubB64 = keys[other.employeeId];
        if (!myPrivate || !otherPubB64) {
          onDecryptionError?.("Schlüssel des Gesprächspartners nicht verfügbar.");
          return raw.map((m) => ({
            id: m.id,
            text: "[Nicht entschlüsselbar]",
            senderName: m.senderName,
            isOwn: m.senderId === emp.id,
            createdAt: m.createdAt,
          }));
        }
        const otherPub = await importPublicKey(otherPubB64);
        const sharedSecret = await deriveSharedSecret(myPrivate, otherPub);

        for (const m of raw) {
          try {
            const text = await decrypt(
              m.encryptedContent,
              m.nonce,
              sharedSecret
            );
            result.push({
              id: m.id,
              text,
              senderName: m.senderName,
              isOwn: m.senderId === emp.id,
              createdAt: m.createdAt,
            });
          } catch {
            result.push({
              id: m.id,
              text: "[Entschlüsselung fehlgeschlagen]",
              senderName: m.senderName,
              isOwn: m.senderId === emp.id,
              createdAt: m.createdAt,
            });
          }
        }
      } else {
        const groupKeyRow = await getGroupKeyForChannel(ch.id);
        if (!groupKeyRow) {
          onDecryptionError?.("Gruppenschlüssel nicht verfügbar.");
          return raw.map((m) => ({
            id: m.id,
            text: "[Nicht entschlüsselbar]",
            senderName: m.senderName,
            isOwn: m.senderId === emp.id,
            createdAt: m.createdAt,
          }));
        }
        const chInfo = await getChannelForGroupKeys(ch.id);
        if (!chInfo?.createdById) {
          onDecryptionError?.("Gruppenersteller unbekannt.");
          return raw.map((m) => ({
            id: m.id,
            text: "[Nicht entschlüsselbar]",
            senderName: m.senderName,
            isOwn: m.senderId === emp.id,
            createdAt: m.createdAt,
          }));
        }
        const creatorKeys = await getIdentityKeys([chInfo.createdById]);
        const creatorPubB64 = creatorKeys[chInfo.createdById];
        const myPrivate = await getPrivateKey();
        if (!creatorPubB64 || !myPrivate) {
          onDecryptionError?.("Schlüssel nicht verfügbar.");
          return raw.map((m) => ({
            id: m.id,
            text: "[Nicht entschlüsselbar]",
            senderName: m.senderName,
            isOwn: m.senderId === emp.id,
            createdAt: m.createdAt,
          }));
        }
        const creatorPub = await importPublicKey(creatorPubB64);
        const groupKey = await decryptGroupKey(
          groupKeyRow.encryptedGroupKey,
          groupKeyRow.nonce,
          creatorPub,
          myPrivate
        );

        for (const m of raw) {
          try {
            const text = await decryptWithGroupKey(
              m.encryptedContent,
              m.nonce,
              groupKey
            );
            result.push({
              id: m.id,
              text,
              senderName: m.senderName,
              isOwn: m.senderId === emp.id,
              createdAt: m.createdAt,
            });
          } catch {
            result.push({
              id: m.id,
              text: "[Entschlüsselung fehlgeschlagen]",
              senderName: m.senderName,
              isOwn: m.senderId === emp.id,
              createdAt: m.createdAt,
            });
          }
        }
      }

      return result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },
    [onDecryptionError]
  );

  const fetchAndDecrypt = useCallback(async () => {
    if (!channel) return;
    setLoading(true);
    try {
      const raw = await listMessages(channel.id);
      const dec = await decryptMessages(raw, channel);
      setMessages(dec);
    } finally {
      setLoading(false);
    }
  }, [channel, decryptMessages]);

  useEffect(() => {
    getCurrentEmployee().then(setCurrentEmployee);
  }, []);

  useEffect(() => {
    fetchAndDecrypt();
  }, [fetchAndDecrypt]);

  useRealtimeTable(
    {
      table: "messenger_messages",
      filter: channel ? `channel_id=eq.${channel.id}` : undefined,
    },
    fetchAndDecrypt,
    channel ? `messenger-${channel.id}` : "messenger-none"
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !input.trim() || !currentEmployee) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      if (channel.type === "direct") {
        const other = channel.members.find((m) => m.employeeId !== currentEmployee.id);
        if (!other) return;
        const myPrivate = await getPrivateKey();
        const keys = await getIdentityKeys([other.employeeId]);
        const otherPubB64 = keys[other.employeeId];
        if (!myPrivate || !otherPubB64) {
          onDecryptionError?.("Schlüssel des Gesprächspartners nicht verfügbar.");
          return;
        }
        const otherPub = await importPublicKey(otherPubB64);
        const sharedSecret = await deriveSharedSecret(myPrivate, otherPub);
        const { ciphertext, nonce } = await encrypt(text, sharedSecret);
        const result = await sendMessage(channel.id, ciphertext, nonce);
        if (!result.success) {
          onDecryptionError?.(result.error ?? "Senden fehlgeschlagen.");
        }
      } else {
        const groupKeyRow = await getGroupKeyForChannel(channel.id);
        if (!groupKeyRow) {
          onDecryptionError?.("Gruppenschlüssel nicht verfügbar.");
          return;
        }
        const chInfo = await getChannelForGroupKeys(channel.id);
        if (!chInfo?.createdById) return;
        const creatorKeys = await getIdentityKeys([chInfo.createdById]);
        const creatorPubB64 = creatorKeys[chInfo.createdById];
        const myPrivate = await getPrivateKey();
        if (!creatorPubB64 || !myPrivate) return;
        const creatorPub = await importPublicKey(creatorPubB64);
        const groupKey = await decryptGroupKey(
          groupKeyRow.encryptedGroupKey,
          groupKeyRow.nonce,
          creatorPub,
          myPrivate
        );
        const { ciphertext, nonce } = await encryptWithGroupKey(text, groupKey);
        const result = await sendMessage(channel.id, ciphertext, nonce);
        if (!result.success) {
          onDecryptionError?.(result.error ?? "Senden fehlgeschlagen.");
        }
      }
    } finally {
      setSending(false);
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Wähle einen Chat oder starte einen neuen.
      </div>
    );
  }

  const channelLabel =
    channel.type === "group"
      ? channel.name ?? "Gruppe"
      : channel.members
          .filter((m) => m.employeeId !== currentEmployee?.id)
          .map((m) => m.displayName)
          .join(", ") || "Chat";

  return (
    <div className="flex-1 flex flex-col bg-white rounded-r-2xl border-l border-gray-100 min-w-0">
      <div className="p-4 border-b border-gray-100 shrink-0">
        <h3 className="font-medium text-mw-green">{channelLabel}</h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Laden...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 italic">
            Noch keine Nachrichten.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              text={m.text}
              senderName={m.senderName}
              isOwn={m.isOwn}
              createdAt={m.createdAt}
            />
          ))
        )}
      </div>
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-gray-100 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht eingeben..."
          className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-mw-green text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-mw-green text-white p-3 rounded-xl hover:bg-mw-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
