"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ListChecks, Package } from "lucide-react";
import {
  getLeistungenGroupedByCategory,
  createLeistungAction,
  updateLeistungAction,
  deleteLeistungAction,
} from "@/app/actions/leistungen";
import { getInventoryItems, uploadProductImage } from "@/app/actions/inventory";
import { getProductImageUrl } from "@/lib/storage-url";
import type { Leistung, LeistungCategory, InventoryItem, LeistungType, LeistungPriceType } from "@/types";
import { formatLeistungPriceDisplay } from "@/lib/leistung-price";
import { DynamicParametersField } from "./DynamicParametersField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeistungenList() {
  const [grouped, setGrouped] = useState<
    { category: LeistungCategory; leistungen: Leistung[] }[]
  >([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLeistung, setEditLeistung] = useState<Leistung | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupedData, itemsData] = await Promise.all([
        getLeistungenGroupedByCategory({}),
        getInventoryItems({}),
      ]);
      setGrouped(groupedData);
      setInventoryItems(itemsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [createCategory, setCreateCategory] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPriceEuro, setCreatePriceEuro] = useState(0);
  const [createPriceType, setCreatePriceType] = useState<LeistungPriceType>("fixed");
  const [createUnitLabel, setCreateUnitLabel] = useState("");
  const [createParentId, setCreateParentId] = useState<string>("__none__");
  const [createLeistungType, setCreateLeistungType] = useState<LeistungType>("sonstiges");
  const [createInventoryItemId, setCreateInventoryItemId] = useState<string>("__none__");
  const [createIsPublic, setCreateIsPublic] = useState(true);
  const [createImageStoragePath, setCreateImageStoragePath] = useState<string | null>(null);
  const [createParameters, setCreateParameters] = useState<Record<string, string | number | boolean>>({});
  const [createImageUploading, setCreateImageUploading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceEuro, setEditPriceEuro] = useState(0);
  const [editPriceType, setEditPriceType] = useState<LeistungPriceType>("fixed");
  const [editUnitLabel, setEditUnitLabel] = useState("");
  const [editParentId, setEditParentId] = useState<string>("__none__");
  const [editLeistungType, setEditLeistungType] = useState<LeistungType>("sonstiges");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editInventoryItemId, setEditInventoryItemId] = useState<string>("__none__");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editImageStoragePath, setEditImageStoragePath] = useState<string | null>(null);
  const [editParameters, setEditParameters] = useState<Record<string, string | number | boolean>>({});
  const [editImageUploading, setEditImageUploading] = useState(false);

  useEffect(() => {
    if (editLeistung) {
      setEditTitle(editLeistung.title);
      setEditDescription(editLeistung.description ?? "");
      setEditPriceEuro(editLeistung.priceCents / 100);
      setEditPriceType((editLeistung.priceType as LeistungPriceType) ?? "fixed");
      setEditUnitLabel(editLeistung.unitLabel ?? "");
      setEditParentId(editLeistung.parentId ?? "__none__");
      setEditLeistungType(editLeistung.leistungType);
      setEditCategoryId(editLeistung.categoryId ?? "");
      setEditInventoryItemId(editLeistung.inventoryItemId ?? "__none__");
      setEditIsPublic(editLeistung.isPublic);
      setEditImageStoragePath(editLeistung.imageStoragePath ?? null);
      setEditParameters(editLeistung.parameters ?? {});
    }
  }, [editLeistung]);

  const filteredInventoryForCreate =
    createLeistungType === "ausstattung_sarg"
      ? inventoryItems.filter((i) => i.category?.name === "Särge")
      : createLeistungType === "ausstattung_urne"
        ? inventoryItems.filter((i) => i.category?.name === "Urnen")
        : inventoryItems;

  const filteredInventoryForEdit =
    editLeistungType === "ausstattung_sarg"
      ? inventoryItems.filter((i) => i.category?.name === "Särge")
      : editLeistungType === "ausstattung_urne"
        ? inventoryItems.filter((i) => i.category?.name === "Urnen")
        : inventoryItems;

  const createLinkedItem = createInventoryItemId && createInventoryItemId !== "__none__"
    ? inventoryItems.find((i) => i.id === createInventoryItemId)
    : null;
  const editLinkedItem = editInventoryItemId && editInventoryItemId !== "__none__"
    ? inventoryItems.find((i) => i.id === editInventoryItemId)
    : null;

  const parentOptions = grouped.flatMap(({ leistungen }) =>
    leistungen.filter((l) => !l.parentId)
  );

  useEffect(() => {
    if (createLinkedItem) {
      setCreateTitle(createLinkedItem.title);
      setCreateDescription(createLinkedItem.description ?? "");
    }
  }, [createInventoryItemId]);

  useEffect(() => {
    if (createInventoryItemId !== "__none__" && !filteredInventoryForCreate.some((i) => i.id === createInventoryItemId)) {
      setCreateInventoryItemId("__none__");
    }
  }, [createLeistungType, createInventoryItemId, filteredInventoryForCreate]);

  useEffect(() => {
    if (editInventoryItemId !== "__none__" && !filteredInventoryForEdit.some((i) => i.id === editInventoryItemId)) {
      setEditInventoryItemId("__none__");
    }
  }, [editLeistungType, editInventoryItemId, filteredInventoryForEdit]);

  const handleCreateLeistung = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("title", createTitle);
    formData.set("description", createDescription);
    formData.set("priceCents", String(Math.round(createPriceEuro * 100)));
    formData.set("priceType", createPriceType);
    formData.set("unitLabel", createUnitLabel || "");
    formData.set("parentId", createParentId === "__none__" ? "" : createParentId);
    formData.set("leistungType", createLeistungType);
    formData.set("categoryId", createCategory || "");
    formData.set("inventoryItemId", createInventoryItemId === "__none__" ? "" : createInventoryItemId);
    formData.set("isPublic", createIsPublic ? "true" : "false");
    if (createImageStoragePath) formData.set("imageStoragePath", createImageStoragePath);
    formData.set("parameters", JSON.stringify(createParameters));
    const result = await createLeistungAction(formData);
    if (result.success) {
      setCreateDialogOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreatePriceEuro(0);
      setCreatePriceType("fixed");
      setCreateUnitLabel("");
      setCreateParentId("__none__");
      setCreateLeistungType("sonstiges");
      setCreateCategory("");
      setCreateInventoryItemId("__none__");
      setCreateIsPublic(true);
      setCreateImageStoragePath(null);
      setCreateParameters({});
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleUpdateLeistung = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLeistung) return;
    const formData = new FormData();
    formData.set("title", editTitle);
    formData.set("description", editDescription);
    formData.set("priceCents", String(Math.round(editPriceEuro * 100)));
    formData.set("priceType", editPriceType);
    formData.set("unitLabel", editUnitLabel || "");
    formData.set("parentId", editParentId === "__none__" ? "" : editParentId);
    formData.set("leistungType", editLeistungType);
    formData.set("categoryId", editCategoryId || "");
    formData.set("inventoryItemId", editInventoryItemId === "__none__" ? "" : editInventoryItemId);
    formData.set("isPublic", editIsPublic ? "true" : "false");
    formData.set("imageStoragePath", editImageStoragePath ?? "");
    formData.set("parameters", JSON.stringify(editParameters));
    const result = await updateLeistungAction(editLeistung.id, formData);
    if (result.success) {
      setEditDialogOpen(false);
      setEditLeistung(null);
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteLeistung = async (l: Leistung) => {
    if (!confirm(`Leistung „${l.title}“ wirklich löschen?`)) return;
    const result = await deleteLeistungAction(l.id);
    if (result.success) loadData();
    else alert(result.error);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <h2 className="text-xl sm:text-2xl font-serif text-gray-800">
          Leistungen (Vorsorge)
        </h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-mw-green text-white hover:bg-mw-green-dark">
              <Plus size={18} className="mr-2" /> Neue Leistung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Leistung anlegen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLeistung} className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  placeholder="z.B. Feuerbestattung"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="priceEuro">Preis (€) *</Label>
                {createLinkedItem?.priceCents != null ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Wird vom Produkt übernommen: {(createLinkedItem.priceCents / 100).toLocaleString("de-DE")} €
                  </p>
                ) : (
                  <Input
                    id="priceEuro"
                    type="number"
                    min={0}
                    step={0.01}
                    value={createPriceEuro || ""}
                    onChange={(e) => setCreatePriceEuro(parseFloat(e.target.value) || 0)}
                    placeholder="z.B. 450"
                    required={!createLinkedItem}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="createPriceType">Preistyp</Label>
                <Select value={createPriceType} onValueChange={(v) => setCreatePriceType(v as LeistungPriceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fester Preis</SelectItem>
                    <SelectItem value="per_unit">Pro Einheit</SelectItem>
                    <SelectItem value="min_price">Ab X (Mindestpreis)</SelectItem>
                    <SelectItem value="on_request">Auf Anfrage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(createPriceType === "per_unit" || createPriceType === "min_price") && (
                <div>
                  <Label htmlFor="createUnitLabel">Einheitenbezeichnung</Label>
                  <Input
                    id="createUnitLabel"
                    value={createUnitLabel}
                    onChange={(e) => setCreateUnitLabel(e.target.value)}
                    placeholder="z.B. Stück, Tag, km"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="createParentId">Übergeordnete Leistung (Weitere Leistung)</Label>
                <Select value={createParentId} onValueChange={setCreateParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keine (Hauptleistung)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Keine (Hauptleistung)</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leistungType">Typ</Label>
                <Select value={createLeistungType} onValueChange={(v) => setCreateLeistungType(v as LeistungType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bestattungsart">Bestattungsart</SelectItem>
                    <SelectItem value="ausstattung_sarg">Ausstattung (Sarg)</SelectItem>
                    <SelectItem value="ausstattung_urne">Ausstattung (Urne)</SelectItem>
                    <SelectItem value="rahmen">Rahmen der Abschiednahme</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="categoryId">Kategorie</Label>
                <Select value={createCategory || "__none__"} onValueChange={(v) => setCreateCategory(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Keine Kategorie</SelectItem>
                    {grouped.map(({ category }) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="inventoryItemId">Lager-Produkt (optional)</Label>
                <Select value={createInventoryItemId} onValueChange={setCreateInventoryItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Produkt verknüpft" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Kein Produkt</SelectItem>
                    {filteredInventoryForCreate.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Produktbild (optional)</Label>
                {createImageStoragePath && (
                  <div className="mt-2 mb-2">
                    <img
                      src={getProductImageUrl(createImageStoragePath) ?? ""}
                      alt="Vorschau"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-red-600"
                      onClick={() => setCreateImageStoragePath(null)}
                    >
                      Bild entfernen
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCreateImageUploading(true);
                    try {
                      const fd = new FormData();
                      fd.set("file", file);
                      const result = await uploadProductImage(fd);
                      if (result.success && result.data) {
                        setCreateImageStoragePath(result.data.storagePath);
                      } else {
                        alert("error" in result ? result.error : "Upload fehlgeschlagen");
                      }
                    } finally {
                      setCreateImageUploading(false);
                      e.target.value = "";
                    }
                  }}
                  disabled={createImageUploading}
                  className="mt-1"
                />
                {createImageUploading && (
                  <p className="text-sm text-gray-500 mt-1">Wird hochgeladen...</p>
                )}
              </div>
              <DynamicParametersField
                key="create"
                value={createParameters}
                onChange={setCreateParameters}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPublic"
                  checked={createIsPublic}
                  onCheckedChange={(c) => setCreateIsPublic(!!c)}
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Im Vorsorgeformular anzeigen
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Anlegen</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6]">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            Lade Leistungen...
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            <ListChecks size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Noch keine Kategorien oder Leistungen.</p>
            <p className="text-sm mt-2">
              Führen Sie die Datenbank-Migration aus, um Standard-Leistungen zu laden.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, leistungen }) => (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-mw-green/10 border-b border-gray-200 px-4 py-3">
                  <h3 className="font-medium text-gray-800">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {leistungen.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      Keine Leistungen in dieser Kategorie.
                    </div>
                  ) : (
                    leistungen.map((l) => {
                      const imagePath =
                        l.imageStoragePath ?? l.inventoryItem?.imageStoragePath;
                      const imageUrl = imagePath
                        ? getProductImageUrl(imagePath)
                        : null;
                      return (
                      <div
                        key={l.id}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={24} className="text-gray-500" />
                            )}
                          </div>
                          <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{l.title}</span>
                            {l.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Öffentlich
                              </Badge>
                            )}
                          </div>
                          {l.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {l.description}
                            </p>
                          )}
                          <p className="text-sm font-medium text-mw-green mt-1">
                            {formatLeistungPriceDisplay(l)}
                          </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditLeistung(l);
                              setEditDialogOpen(true);
                            }}
                            aria-label="Bearbeiten"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLeistung(l)}
                            aria-label="Löschen"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leistung bearbeiten</DialogTitle>
          </DialogHeader>
          {editLeistung && (
            <form onSubmit={handleUpdateLeistung} className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Titel *</Label>
                <Input
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Beschreibung</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="editPriceEuro">Preis (€) *</Label>
                {editLinkedItem?.priceCents != null ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Wird vom Produkt übernommen: {(editLinkedItem.priceCents / 100).toLocaleString("de-DE")} €
                  </p>
                ) : (
                  <Input
                    id="editPriceEuro"
                    type="number"
                    min={0}
                    step={0.01}
                    value={editPriceEuro || ""}
                    onChange={(e) => setEditPriceEuro(parseFloat(e.target.value) || 0)}
                    placeholder="z.B. 450"
                    required={!editLinkedItem}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="editPriceType">Preistyp</Label>
                <Select value={editPriceType} onValueChange={(v) => setEditPriceType(v as LeistungPriceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fester Preis</SelectItem>
                    <SelectItem value="per_unit">Pro Einheit</SelectItem>
                    <SelectItem value="min_price">Ab X (Mindestpreis)</SelectItem>
                    <SelectItem value="on_request">Auf Anfrage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editPriceType === "per_unit" || editPriceType === "min_price") && (
                <div>
                  <Label htmlFor="editUnitLabel">Einheitenbezeichnung</Label>
                  <Input
                    id="editUnitLabel"
                    value={editUnitLabel}
                    onChange={(e) => setEditUnitLabel(e.target.value)}
                    placeholder="z.B. Stück, Tag, km"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="editParentId">Übergeordnete Leistung (Weitere Leistung)</Label>
                <Select value={editParentId} onValueChange={setEditParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keine (Hauptleistung)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Keine (Hauptleistung)</SelectItem>
                    {parentOptions
                      .filter((p) => p.id !== editLeistung?.id)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editLeistungType">Typ</Label>
                <Select value={editLeistungType} onValueChange={(v) => setEditLeistungType(v as LeistungType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bestattungsart">Bestattungsart</SelectItem>
                    <SelectItem value="ausstattung_sarg">Ausstattung (Sarg)</SelectItem>
                    <SelectItem value="ausstattung_urne">Ausstattung (Urne)</SelectItem>
                    <SelectItem value="rahmen">Rahmen der Abschiednahme</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCategoryId">Kategorie</Label>
                <Select value={editCategoryId || "__none__"} onValueChange={(v) => setEditCategoryId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Keine Kategorie</SelectItem>
                    {grouped.map(({ category }) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editInventoryItemId">Lager-Produkt (optional)</Label>
                <Select value={editInventoryItemId} onValueChange={setEditInventoryItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Produkt verknüpft" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Kein Produkt</SelectItem>
                    {filteredInventoryForEdit.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Produktbild (optional)</Label>
                {editImageStoragePath && (
                  <div className="mt-2 mb-2">
                    <img
                      src={getProductImageUrl(editImageStoragePath) ?? ""}
                      alt="Vorschau"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-red-600"
                      onClick={() => setEditImageStoragePath(null)}
                    >
                      Bild entfernen
                    </Button>
                  </div>
                )}
                {!editImageStoragePath && editLinkedItem?.imageStoragePath && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Verknüpftes Produkt hat Bild. Eigenes Bild hochladen, um es zu überschreiben.
                  </p>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setEditImageUploading(true);
                    try {
                      const fd = new FormData();
                      fd.set("file", file);
                      const result = await uploadProductImage(fd);
                      if (result.success && result.data) {
                        setEditImageStoragePath(result.data.storagePath);
                      } else {
                        alert("error" in result ? result.error : "Upload fehlgeschlagen");
                      }
                    } finally {
                      setEditImageUploading(false);
                      e.target.value = "";
                    }
                  }}
                  disabled={editImageUploading}
                  className="mt-1"
                />
                {editImageUploading && (
                  <p className="text-sm text-gray-500 mt-1">Wird hochgeladen...</p>
                )}
              </div>
              <DynamicParametersField
                key={editLeistung?.id ?? "edit"}
                value={editParameters}
                onChange={setEditParameters}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="editIsPublic"
                  checked={editIsPublic}
                  onCheckedChange={(c) => setEditIsPublic(!!c)}
                />
                <Label htmlFor="editIsPublic" className="cursor-pointer">
                  Im Vorsorgeformular anzeigen
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit">Speichern</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
