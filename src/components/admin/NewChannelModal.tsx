"use client";

import { useState, useEffect } from "react";
import { Users, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listEmployees, type Employee } from "@/app/actions/employees";
import { getCurrentEmployee } from "@/app/actions/employees";
import {
  getOrCreateDirectChannel,
  createGroupChannel,
  storeGroupKeys,
} from "@/app/actions/messenger";
import { getIdentityKeys } from "@/app/actions/messenger-keys";
import {
  generateGroupKey,
  exportGroupKey,
  encryptGroupKeyForMember,
  importPublicKey,
} from "@/lib/messenger-crypto";
import { getPrivateKey } from "@/lib/messenger-crypto";

type Mode = "direct" | "group";

interface NewChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated: (channelId: string, otherEmployee?: { id: string; displayName: string }) => void | Promise<void>;
}

export function NewChannelModal({
  open,
  onOpenChange,
  onChannelCreated,
}: NewChannelModalProps) {
  const [mode, setMode] = useState<Mode>("direct");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      listEmployees().then(setEmployees);
      getCurrentEmployee().then(setCurrentEmployee);
      setSelectedId("");
      setGroupName("");
      setSelectedIds(new Set());
      setError(null);
    }
  }, [open]);

  const others = employees.filter((e) => e.id !== currentEmployee?.id);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "direct") {
        if (!selectedId) {
          setError("Bitte einen Mitarbeiter auswählen.");
          return;
        }
        const result = await getOrCreateDirectChannel(selectedId);
        if (result.success && "channelId" in result && result.channelId) {
          const other = others.find((e) => e.id === selectedId);
          onChannelCreated(result.channelId, other ? { id: other.id, displayName: other.display_name } : undefined);
          onOpenChange(false);
        } else if (!result.success) {
          setError(result.error ?? "Fehler beim Erstellen.");
        }
      } else {
        if (!groupName.trim()) {
          setError("Bitte einen Gruppennamen eingeben.");
          return;
        }
        if (selectedIds.size === 0) {
          setError("Bitte mindestens einen Mitarbeiter auswählen.");
          return;
        }
        const memberIds = Array.from(selectedIds);
        const result = await createGroupChannel(groupName.trim(), memberIds);
        if (result.success && "channelId" in result && result.channelId) {
          try {
            const myPrivateKey = await getPrivateKey();
            const allMemberIds = currentEmployee
              ? [currentEmployee.id, ...memberIds]
              : memberIds;
            const identityKeys = await getIdentityKeys(allMemberIds);
            if (myPrivateKey && Object.keys(identityKeys).length > 0) {
              const groupKey = await generateGroupKey();
              const groupKeyRaw = await exportGroupKey(groupKey);
              const keysToStore: {
                employeeId: string;
                encryptedGroupKey: string;
                nonce: string;
              }[] = [];
              for (const empId of Object.keys(identityKeys)) {
                const pubKey = await importPublicKey(identityKeys[empId]!);
                const { encrypted, nonce } = await encryptGroupKeyForMember(
                  groupKeyRaw,
                  pubKey,
                  myPrivateKey
                );
                keysToStore.push({
                  employeeId: empId,
                  encryptedGroupKey: encrypted,
                  nonce,
                });
              }
              if (keysToStore.length > 0) {
                await storeGroupKeys(result.channelId, keysToStore);
              }
            }
          } catch (e) {
            console.error("Group key setup error:", e);
          }
          onChannelCreated(result.channelId, undefined);
          onOpenChange(false);
        } else if (!result.success) {
          setError(result.error ?? "Fehler beim Erstellen.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Chat</DialogTitle>
          <DialogDescription>
            Direktnachricht mit einem Mitarbeiter oder neue Gruppe erstellen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition ${
              mode === "direct"
                ? "border-mw-green bg-mw-green/10 text-mw-green"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <User size={18} /> Direktnachricht
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition ${
              mode === "group"
                ? "border-mw-green bg-mw-green/10 text-mw-green"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Users size={18} /> Gruppe
          </button>
        </div>

        {mode === "direct" && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-600">Mitarbeiter auswählen:</p>
            {others.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setSelectedId(emp.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border transition ${
                  selectedId === emp.id
                    ? "border-mw-green bg-mw-green/10"
                    : "border-gray-200 hover:border-gray-100"
                }`}
              >
                {emp.display_name}
              </button>
            ))}
          </div>
        )}

        {mode === "group" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Gruppenname</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="z.B. Team Trauerfeier"
                className="rounded-xl"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Mitglieder:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {others.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggleMember(emp.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{emp.display_name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={
              loading ||
              (mode === "direct" && !selectedId) ||
              (mode === "group" && (!groupName.trim() || selectedIds.size === 0))
            }
            className="bg-mw-green hover:bg-mw-green-dark"
          >
            {loading ? "Wird erstellt..." : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
