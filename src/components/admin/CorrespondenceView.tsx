"use client";

import { useState } from "react";
import { Users, Mail } from "lucide-react";
import { ContactView } from "@/components/admin/ContactView";
import { CommunicationView } from "@/components/admin/CommunicationView";

type CorrespondenceSubTab = "contacts" | "communications";

export function CorrespondenceView() {
  const [subTab, setSubTab] = useState<CorrespondenceSubTab>("contacts");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setSubTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            subTab === "contacts"
              ? "bg-white text-mw-green shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Users size={18} /> Adressbuch
        </button>
        <button
          onClick={() => setSubTab("communications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            subTab === "communications"
              ? "bg-white text-mw-green shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Mail size={18} /> Kommunikation
        </button>
      </div>
      {subTab === "contacts" && <ContactView />}
      {subTab === "communications" && <CommunicationView />}
    </div>
  );
}
