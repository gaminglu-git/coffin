"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, QrCode as QrCodeIcon, Briefcase } from "lucide-react";
import { getInventoryItemById, createQrCodeAction } from "@/app/actions/inventory";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { ScanHistory } from "./ScanHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem, QrCode } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  in_stock: "Auf Lager",
  in_use: "In Benutzung",
  checked_out: "Ausgeliehen",
};

const DELIVERY_LABELS: Record<string, string> = {
  reserved: "Reserviert",
  assigned: "Zugewiesen",
  delivered: "Geliefert",
};

const STATUS_COLORS: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-yellow-100 text-yellow-800 border-yellow-200",
  checked_out: "bg-orange-100 text-orange-800 border-orange-200",
};

interface InventoryItemDetailProps {
  itemId: string;
}

export function InventoryItemDetail({ itemId }: InventoryItemDetailProps) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingQr, setCreatingQr] = useState(false);

  const loadItem = async () => {
    setLoading(true);
    const data = await getInventoryItemById(itemId);
    setItem(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const handleCreateQr = async () => {
    setCreatingQr(true);
    const result = await createQrCodeAction(itemId);
    setCreatingQr(false);
    if (result.success) {
      await loadItem();
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Lade Artikel...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6">
        <p className="text-red-600">Artikel nicht gefunden.</p>
        <Link href="/admin/inventory" className="text-mw-green mt-2 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const qrCode = item.qrCodes?.[0] as QrCode | undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 shrink-0">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={18} /> Zurück zur Übersicht
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif text-gray-800">{item.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              {item.sequentialId && (
                <span className="font-mono text-sm text-gray-500">
                  {item.sequentialId}
                </span>
              )}
              <Badge className={STATUS_COLORS[item.status] ?? "bg-gray-100"}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Badge>
            </div>
            {item.description && (
              <p className="mt-2 text-gray-600">{item.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {item.category && (
                <span className="flex items-center gap-1">
                  <Package size={14} /> {item.category.name}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {item.location.name}
                </span>
              )}
              {item.caseId && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1 text-mw-green hover:text-mw-green-dark"
                >
                  <Briefcase size={14} /> Fall verknüpft
                  {item.deliveryStatus && ` (${DELIVERY_LABELS[item.deliveryStatus] ?? item.deliveryStatus})`}
                </Link>
              )}
            </div>
          </div>
          <Link href={`/admin/inventory/${itemId}/edit`}>
            <Button variant="outline">Bearbeiten</Button>
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6] space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <QrCodeIcon size={18} /> QR-Code
          </h3>
          {qrCode ? (
            <QRCodeDisplay qrCode={qrCode} itemTitle={item.title} />
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Noch kein QR-Code für diesen Artikel. Erstellen Sie einen, um ihn per Scan zu verfolgen.
              </p>
              <Button onClick={handleCreateQr} disabled={creatingQr}>
                {creatingQr ? "Erstelle..." : "QR-Code erstellen"}
              </Button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-4">Scan-Historie</h3>
          <ScanHistory itemId={itemId} />
        </div>
      </div>
    </div>
  );
}
