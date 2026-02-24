import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Entfernt VORSORGE:/TRAUERFALL:/BERATUNG: aus dem Fallnamen (für Anzeige) */
export function stripCaseTypePrefix(name: string): string {
  return name.replace(/^(VORSORGE|TRAUERFALL|BERATUNG):\s*/i, "").trim();
}
