"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Bell, Globe } from "lucide-react";

const TABS = [
  { href: "/admin/unternehmen/personal", label: "HR / Personal", shortLabel: "Personal", icon: Users },
  { href: "/admin/unternehmen/benachrichtigungen", label: "Benachrichtigungen", shortLabel: "Benachr.", icon: Bell },
  { href: "/admin/unternehmen/website", label: "Website", shortLabel: "Website", icon: Globe },
] as const;

export function UnternehmenTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 bg-white border-b border-gray-200 shadow-sm"
      aria-label="Unternehmen-Bereich"
    >
      <div className="px-3 sm:px-6">
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scroll-smooth -mx-1 px-1 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          {TABS.map(({ href, label, shortLabel, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 px-3 py-3.5 sm:px-5 sm:py-3.5
                  text-sm font-medium whitespace-nowrap rounded-t-lg
                  transition-colors duration-200
                  min-w-0 sm:min-w-0
                  ${isActive
                    ? "bg-mw-sand text-mw-green border-b-2 border-mw-green -mb-px shadow-[0_-1px_3px_rgba(0,0,0,0.04)]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/80 border-b-2 border-transparent -mb-px"
                  }
                `}
              >
                <Icon size={18} className="shrink-0 text-current" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
