"use client";

import { EmployeeManagement } from "@/components/admin/EmployeeManagement";

export default function UnternehmenPersonalPage() {
  return (
    <div className="flex flex-col h-full overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-serif text-gray-800">HR / Personal</h2>
        <p className="text-sm text-gray-500 mt-1">Mitarbeiter, Rechte und E-Mail-Konten verwalten</p>
      </div>
      <EmployeeManagement />
    </div>
  );
}
