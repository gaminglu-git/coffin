"use client";

import { useState, useEffect, useCallback } from "react";
import { KeySetupModal } from "@/components/admin/KeySetupModal";
import { NewChannelModal } from "@/components/admin/NewChannelModal";
import { ChannelList } from "@/components/admin/ChannelList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { HandoverArchive } from "@/components/admin/HandoverArchive";
import { listChannels } from "@/app/actions/messenger";
import { hasIdentityKey } from "@/app/actions/messenger-keys";
import { getCurrentEmployee } from "@/app/actions/employees";
import type { MessengerChannel } from "@/app/actions/messenger";

export function MessengerView() {
  const [channels, setChannels] = useState<MessengerChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<MessengerChannel | null>(
    null
  );
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(
    null
  );
  const [needsKeySetup, setNeedsKeySetup] = useState<boolean | null>(null);
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    const data = await listChannels();
    setChannels(data);
  }, []);

  useEffect(() => {
    getCurrentEmployee().then((emp) => {
      setCurrentEmployeeId(emp?.id ?? null);
    });
  }, []);

  useEffect(() => {
    hasIdentityKey().then((has) => {
      setNeedsKeySetup(!has);
    });
  }, []);

  useEffect(() => {
    if (!needsKeySetup) {
      fetchChannels();
    }
  }, [needsKeySetup, fetchChannels]);

  const handleKeySetupComplete = () => {
    setNeedsKeySetup(false);
    fetchChannels();
  };

  const handleChannelCreated = async (
    channelId: string,
    otherEmployee?: { id: string; displayName: string }
  ) => {
    const data = await listChannels();
    let ch = data.find((c) => c.id === channelId);
    if (!ch && otherEmployee) {
      ch = {
        id: channelId,
        type: "direct" as const,
        name: null,
        caseId: null,
        createdById: null,
        createdAt: new Date().toISOString(),
        members: [
          { employeeId: otherEmployee.id, displayName: otherEmployee.displayName },
          ...(currentEmployeeId ? [{ employeeId: currentEmployeeId, displayName: "Du" }] : []),
        ],
      };
      setChannels([ch!, ...data.filter((c) => c.id !== channelId)]);
    } else {
      setChannels(data);
    }
    if (ch) setSelectedChannel(ch);
  };

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const sorted = [...channels].sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      setSelectedChannel(sorted[0] ?? null);
    }
  }, [channels, selectedChannel]);

  if (needsKeySetup === null) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  if (needsKeySetup) {
    return (
      <>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-600 text-center">
            Um den Messenger zu nutzen, musst du zuerst deine Schlüssel für die
            Ende-zu-Ende-Verschlüsselung einrichten.
          </p>
          <KeySetupModal open={true} onComplete={handleKeySetupComplete} />
        </div>
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsArchiveOpen(true)}
          className="text-sm text-gray-500 hover:text-mw-green transition"
        >
          Altes Übergabebuch anzeigen
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[70vh] overflow-hidden">
      {decryptionError && (
        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-2 flex justify-between items-center">
          <span>{decryptionError}</span>
          <button
            type="button"
            onClick={() => setDecryptionError(null)}
            className="text-amber-600 hover:underline"
          >
            Schließen
          </button>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannel?.id ?? null}
          currentEmployeeId={currentEmployeeId}
          onSelect={setSelectedChannel}
          onNewChat={() => setIsNewChannelOpen(true)}
        />
        <ChatPanel
          channel={selectedChannel}
          onDecryptionError={setDecryptionError}
        />
      </div>
      </div>
      <NewChannelModal
        open={isNewChannelOpen}
        onOpenChange={setIsNewChannelOpen}
        onChannelCreated={handleChannelCreated}
      />
      <HandoverArchive open={isArchiveOpen} onOpenChange={setIsArchiveOpen} />
    </div>
  );
}
