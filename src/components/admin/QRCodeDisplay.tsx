"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import type { QrCode } from "@/types";

interface QRCodeDisplayProps {
  qrCode: QrCode;
  itemTitle?: string;
  size?: number;
}

function getQrUrl(qrId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/qr/${qrId}`;
}

export function QRCodeDisplay({
  qrCode,
  itemTitle,
  size = 128,
}: QRCodeDisplayProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const url = getQrUrl(qrCode.id);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printRef.current) return;
    const qrHtml = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code ${itemTitle ?? qrCode.id}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; text-align: center; }
            .qr { margin: 16px auto; display: inline-block; }
            .url { font-size: 12px; color: #666; word-break: break-all; margin-top: 8px; }
          </style>
        </head>
        <body>
          ${itemTitle ? `<h2>${itemTitle}</h2>` : ""}
          <div class="qr">${qrHtml}</div>
          <p class="url">${url}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="inline-block p-4 bg-white rounded-xl border border-gray-200">
      <div ref={printRef} className="flex justify-center">
        <QRCodeSVG value={url} size={size} level="M" includeMargin />
      </div>
      {itemTitle && (
        <p className="text-sm font-medium mt-2 text-gray-700 truncate max-w-[140px]">
          {itemTitle}
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        onClick={handlePrint}
      >
        Drucken
      </Button>
    </div>
  );
}
