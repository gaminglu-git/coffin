"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LeistungenTabNav() {
  const pathname = usePathname();
  const isLager = pathname.startsWith("/admin/leistungen/lager");
  const isLeistungen = pathname === "/admin/leistungen" || pathname === "/admin/leistungen/";

  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-4 sm:px-6 shrink-0">
      <Link
        href="/admin/leistungen"
        className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
          isLeistungen
            ? "border-mw-green text-mw-green"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Leistungen
      </Link>
      <Link
        href="/admin/leistungen/lager"
        className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
          isLager
            ? "border-mw-green text-mw-green"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Lager
      </Link>
    </div>
  );
}
