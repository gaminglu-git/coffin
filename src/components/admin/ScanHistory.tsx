"use client";

import { useState, useEffect } from "react";
import { getScansByItemId } from "@/app/actions/inventory";
import type { InventoryScan } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface ScanHistoryProps {
  itemId: string;
}

export function ScanHistory({ itemId }: ScanHistoryProps) {
  const [scans, setScans] = useState<InventoryScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScansByItemId(itemId).then((data) => {
      setScans(data);
      setLoading(false);
    });
  }, [itemId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Lade Scan-Historie...</p>;
  }

  if (scans.length === 0) {
    return (
      <p className="text-sm text-gray-500">Noch keine Scans für diesen Artikel.</p>
    );
  }

  return (
    <ul className="space-y-2 max-h-48 overflow-y-auto">
      {scans.map((scan) => (
        <li
          key={scan.id}
          className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
        >
          <span className="text-gray-600">
            {formatDistanceToNow(new Date(scan.scannedAt), {
              addSuffix: true,
              locale: de,
            })}
          </span>
          {scan.userAgent && (
            <span className="text-gray-400 text-xs truncate max-w-[200px]">
              {scan.userAgent}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
