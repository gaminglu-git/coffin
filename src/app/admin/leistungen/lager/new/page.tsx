import { InventoryItemForm } from "@/components/admin/InventoryItemForm";
import { getCategories, getLocations } from "@/app/actions/inventory";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewInventoryItemPage() {
  const [categories, locations] = await Promise.all([
    getCategories(),
    getLocations(),
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 shrink-0">
        <Link
          href="/admin/leistungen/lager"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={18} /> Zurück zur Übersicht
        </Link>
        <h2 className="text-xl font-serif text-gray-800">Neuer Artikel</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
        <InventoryItemForm categories={categories} locations={locations} />
      </div>
    </div>
  );
}
