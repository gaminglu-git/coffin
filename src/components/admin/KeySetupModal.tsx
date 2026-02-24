"use client";

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  generateKeyPair,
  exportPublicKey,
  storePrivateKey,
} from "@/lib/messenger-crypto";
import { upsertIdentityKey } from "@/app/actions/messenger-keys";

interface KeySetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function KeySetupModal({ open, onComplete }: KeySetupModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      await storePrivateKey(privateKey);
      const publicKeyBase64 = await exportPublicKey(publicKey);
      const result = await upsertIdentityKey(publicKeyBase64);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Schlüssel konnten nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={24} className="text-mw-green" />
            Sichere Kommunikation einrichten
          </DialogTitle>
          <DialogDescription>
            Für Ende-zu-Ende-verschlüsselte Nachrichten wird ein Schlüsselpaar auf diesem Gerät erzeugt.
            Der private Schlüssel bleibt lokal gespeichert, der öffentliche Schlüssel wird zum Server übertragen.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        )}
        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleSetup}
            disabled={loading}
            className="bg-mw-green hover:bg-mw-green-dark"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Wird eingerichtet...
              </>
            ) : (
              "Schlüssel erstellen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
