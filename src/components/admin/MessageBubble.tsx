"use client";

interface MessageBubbleProps {
  text: string;
  senderName: string;
  isOwn: boolean;
  createdAt: string;
}

export function MessageBubble({ text, senderName, isOwn, createdAt }: MessageBubbleProps) {
  const date = new Date(createdAt);
  const timeStr = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex flex-col max-w-[80%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
    >
      <div
        className={`rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-mw-green text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-mw-green mb-0.5">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
      </div>
      <span className="text-[10px] text-gray-400 mt-0.5">{timeStr}</span>
    </div>
  );
}
