"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteEditor } from "@/components/admin/WebsiteEditor";
import { VeranstaltungenSettings } from "@/components/admin/VeranstaltungenSettings";
import { VeranstaltungenList } from "@/components/admin/VeranstaltungenList";
import { CompanySettingsForm } from "@/components/admin/CompanySettingsForm";
import { FileText, Calendar, Palette } from "lucide-react";

type WebsiteTab = "inhalt" | "veranstaltungen" | "whitelabel";

const SUB_TABS: { id: WebsiteTab; label: string; icon: typeof FileText }[] = [
  { id: "inhalt", label: "Inhalt", icon: FileText },
  { id: "veranstaltungen", label: "Veranstaltungen", icon: Calendar },
  { id: "whitelabel", label: "Whitelabel", icon: Palette },
];

function getInitialTab(searchParams: URLSearchParams): WebsiteTab {
  const tab = searchParams.get("tab");
  return tab === "veranstaltungen" || tab === "whitelabel" ? tab : "inhalt";
}

export function UnternehmenWebsiteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<WebsiteTab>(() =>
    getInitialTab(searchParams)
  );

  useEffect(() => {
    setActiveTab(getInitialTab(searchParams));
  }, [searchParams]);

  const handleTabChange = (tab: WebsiteTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Vertikale Sidebar für Website-Sub-Navigation */}
      <nav
        className="shrink-0 w-48 bg-white border-r border-gray-200 py-4 flex flex-col gap-0.5"
        aria-label="Website-Bereich"
      >
        {SUB_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`
                flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                transition-colors duration-200 text-left
                border-l-2 -ml-px
                ${isActive
                  ? "text-mw-green border-mw-green bg-mw-green-light/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent"
                }
              `}
            >
              <Icon size={18} className="shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Content-Bereich */}
      <div className="flex-1 min-w-0 min-h-[500px] overflow-hidden flex flex-col">
        {activeTab === "inhalt" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <WebsiteEditor />
          </div>
        )}
        {activeTab === "veranstaltungen" && (
          <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 bg-[#f3f4f6] gap-8">
            <VeranstaltungenSettings />
            <VeranstaltungenList />
          </div>
        )}
        {activeTab === "whitelabel" && (
          <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
            <CompanySettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}
