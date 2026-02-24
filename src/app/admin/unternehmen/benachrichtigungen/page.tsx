"use client";

import { NotificationSetupWizard } from "@/components/admin/NotificationSetupWizard";

export default function UnternehmenBenachrichtigungenPage() {
  return (
    <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-serif text-gray-800">Benachrichtigungen</h2>
        <p className="text-sm text-gray-500 mt-1">Telegram, E-Mail und WhatsApp für Formular-Einreichungen einrichten</p>
      </div>
      <NotificationSetupWizard />
    </div>
  );
}
