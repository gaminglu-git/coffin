"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface CodeScannerProps {
  onScan: (value: string) => void;
  onError?: (error: string) => void;
}

export function CodeScanner({ onScan, onError }: CodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || d.id })));
          setSelectedCamera(devices[0]!.id);
        } else {
          setError("Keine Kamera gefunden");
        }
      })
      .catch((err) => {
        setError(err?.message ?? "Kamera-Zugriff fehlgeschlagen");
      });
      return () => {
        scannerRef.current?.stop().catch(() => {});
      };
  }, []);

  const startScanning = async () => {
    if (!containerRef.current || !selectedCamera) return;
    setError(null);
    const scanner = new Html5Qrcode("code-scanner-container");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          const qrId = decodedText.match(/\/qr\/([a-zA-Z0-9]+)/)?.[1];
          if (qrId) {
            window.location.href = `/qr/${qrId}`;
          } else {
            onScan(decodedText);
          }
          scanner.stop().catch(() => {});
          setIsScanning(false);
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scanner konnte nicht gestartet werden";
      setError(msg);
      onError?.(msg);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="code-scanner-container"
        ref={containerRef}
        className="w-full max-w-md mx-auto rounded-xl overflow-hidden border border-gray-200 bg-black min-h-[300px]"
      />
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      {cameras.length > 1 && !isScanning && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Kamera</label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex justify-center gap-2">
        {isScanning ? (
          <Button variant="outline" onClick={stopScanning}>
            <CameraOff size={18} className="mr-2" /> Stoppen
          </Button>
        ) : (
          <Button onClick={startScanning} disabled={!selectedCamera && cameras.length === 0}>
            <Camera size={18} className="mr-2" /> Scanner starten
          </Button>
        )}
      </div>
    </div>
  );
}
