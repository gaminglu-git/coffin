"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package, MapPin, Scan } from "lucide-react";
import { getInventoryItems, getCategories, getLocations } from "@/app/actions/inventory";
import type { InventoryItem, InventoryCategory, InventoryLocation } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CodeScanner } from "./CodeScanner";

const STATUS_LABELS: Record<string, string> = {
  in_stock: "Auf Lager",
  in_use: "In Benutzung",
  checked_out: "Ausgeliehen",
};

const STATUS_COLORS: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-yellow-100 text-yellow-800 border-yellow-200",
  checked_out: "bg-orange-100 text-orange-800 border-orange-200",
};

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, categoriesData, locationsData] = await Promise.all([
        getInventoryItems({
          status: statusFilter !== "all" ? statusFilter : undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
          locationId: locationFilter !== "all" ? locationFilter : undefined,
        }),
        getCategories(),
        getLocations(),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
      setLocations(locationsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, locationFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <h2 className="text-xl sm:text-2xl font-serif text-gray-800">Lager / Inventar</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Lagerort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Orte</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <button className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium flex gap-2 transition">
                <Scan size={18} /> Scannen
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>QR-Code scannen</DialogTitle>
              </DialogHeader>
              <CodeScanner onScan={() => {}} />
            </DialogContent>
          </Dialog>
          <Link
            href="/admin/inventory/new"
            className="bg-mw-green text-white px-6 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex gap-2 transition shadow-sm"
          >
            <Plus size={18} /> Neuer Artikel
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            Lade Inventar...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Noch keine Artikel im Lager.</p>
            <Link
              href="/admin/inventory/new"
              className="inline-block mt-4 text-mw-green font-medium hover:underline"
            >
              Ersten Artikel anlegen
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/inventory/${item.id}`}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-mw-green/30 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      {item.sequentialId && (
                        <span className="font-mono">{item.sequentialId}</span>
                      )}
                      {item.category && (
                        <span className="flex items-center gap-1">
                          <Package size={12} /> {item.category.name}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {item.location.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[item.status] ?? "bg-gray-100"}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
