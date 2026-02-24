"use client";

import { User, Users } from "lucide-react";
import type { MessengerChannel } from "@/app/actions/messenger";

interface ChannelListProps {
  channels: MessengerChannel[];
  selectedChannelId: string | null;
  currentEmployeeId: string | null;
  onSelect: (channel: MessengerChannel) => void;
  onNewChat: () => void;
}

export function ChannelList({
  channels,
  selectedChannelId,
  currentEmployeeId,
  onSelect,
  onNewChat,
}: ChannelListProps) {
  const getChannelLabel = (ch: MessengerChannel) => {
    if (ch.type === "group") return ch.name ?? "Gruppe";
    const other = ch.members.find((m) => m.employeeId !== currentEmployeeId);
    return other?.displayName ?? "Chat";
  };

  return (
    <div className="w-64 shrink-0 flex flex-col bg-white rounded-l-2xl border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full py-2.5 px-4 bg-mw-green text-white rounded-xl hover:bg-mw-green-dark transition text-sm font-medium"
        >
          + Neuer Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 italic">Keine Chats</p>
        ) : (
          <div className="py-2">
            {channels.map((ch) => {
              const isSelected = selectedChannelId === ch.id;
              const label = getChannelLabel(ch);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelect(ch)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isSelected ? "bg-mw-green/10 text-mw-green" : "hover:bg-gray-50"
                  }`}
                >
                  {ch.type === "direct" ? (
                    <User size={18} className="shrink-0 text-gray-500" />
                  ) : (
                    <Users size={18} className="shrink-0 text-gray-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{label}</p>
                    {ch.lastMessageAt && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(ch.lastMessageAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
