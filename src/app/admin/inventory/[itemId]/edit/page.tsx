import { InventoryItemForm } from "@/components/admin/InventoryItemForm";
import { getInventoryItemById, getCategories, getLocations } from "@/app/actions/inventory";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const [item, categories, locations] = await Promise.all([
    getInventoryItemById(itemId),
    getCategories(),
    getLocations(),
  ]);

  if (!item) {
    return (
      <div className="p-6">
        <p className="text-red-600">Artikel nicht gefunden.</p>
        <Link href="/admin/inventory" className="text-mw-green mt-2 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 shrink-0">
        <Link
          href={`/admin/inventory/${itemId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={18} /> Zurück zum Artikel
        </Link>
        <h2 className="text-xl font-serif text-gray-800">Artikel bearbeiten</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
        <InventoryItemForm
          categories={categories}
          locations={locations}
          item={item}
        />
      </div>
    </div>
  );
}
