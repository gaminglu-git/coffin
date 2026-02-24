"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryItemSchema, type InventoryItemFormData } from "@/lib/validations/inventory";
import {
  createInventoryItemAction,
  updateInventoryItemAction,
  uploadProductImage,
} from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductImageUrl } from "@/lib/storage-url";
import { DynamicParametersField } from "./DynamicParametersField";
import type { InventoryCategory, InventoryItem, InventoryLocation } from "@/types";

interface InventoryItemFormProps {
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  item?: InventoryItem | null;
  onSuccess?: () => void;
}

export function InventoryItemForm({
  categories,
  locations,
  item,
  onSuccess,
}: InventoryItemFormProps) {
  const router = useRouter();
  const isEdit = !!item;

  const [imageUploading, setImageUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      status: item?.status ?? "in_stock",
      categoryId: item?.categoryId ?? null,
      locationId: item?.locationId ?? null,
      priceCents: item?.priceCents ?? null,
      imageStoragePath: item?.imageStoragePath ?? null,
      parameters: item?.parameters ?? {},
    },
  });

  const categoryId = watch("categoryId");
  const locationId = watch("locationId");
  const imageStoragePath = watch("imageStoragePath");
  const parameters = watch("parameters");

  const NONE_VALUE = "__none__";
  const categorySelectValue = categoryId ?? NONE_VALUE;
  const locationSelectValue = locationId ?? NONE_VALUE;

  const onImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadProductImage(fd);
      if (result.success && result.data) {
        setValue("imageStoragePath", result.data.storagePath);
      } else {
        alert("error" in result ? result.error : "Upload fehlgeschlagen");
      }
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (data: InventoryItemFormData) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description ?? "");
    formData.set("status", data.status);
    formData.set("categoryId", data.categoryId ?? "");
    formData.set("locationId", data.locationId ?? "");
    if (data.priceCents != null) formData.set("priceCents", String(data.priceCents));
    if (data.imageStoragePath) formData.set("imageStoragePath", data.imageStoragePath);
    formData.set("parameters", JSON.stringify(data.parameters ?? {}));

    const result = isEdit
      ? await updateInventoryItemAction(item!.id, formData)
      : await createInventoryItemAction(formData);

    if (result.success) {
      onSuccess?.();
      const data = (result as { data?: InventoryItem }).data;
      if (isEdit && item) {
        router.push(`/admin/leistungen/lager/${item.id}`);
      } else if (data?.id) {
        router.push(`/admin/leistungen/lager/${data.id}`);
      } else {
        router.push("/admin/leistungen/lager");
      }
    } else {
      alert((result as { error: string }).error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div>
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="z.B. Eichensarg Modell X"
          className="mt-1"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Optionale Details..."
          className="mt-1"
          rows={3}
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select
          value={watch("status")}
          onValueChange={(v) => setValue("status", v as "in_stock" | "in_use" | "checked_out")}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_stock">Auf Lager</SelectItem>
            <SelectItem value="in_use">In Benutzung</SelectItem>
            <SelectItem value="checked_out">Ausgeliehen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Kategorie</Label>
        <Select
          value={categorySelectValue}
          onValueChange={(v) => setValue("categoryId", v === NONE_VALUE ? null : v)}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Keine Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Keine Kategorie</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Lagerort</Label>
        <Select
          value={locationSelectValue}
          onValueChange={(v) => setValue("locationId", v === NONE_VALUE ? null : v)}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Kein Lagerort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Kein Lagerort</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="priceEuro">Preis (€, optional)</Label>
        <Controller
          name="priceCents"
          control={control}
          render={({ field }) => (
            <Input
              id="priceEuro"
              type="number"
              min={0}
              step={0.01}
              value={field.value != null ? field.value / 100 : ""}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(v === "" || isNaN(parseFloat(v)) ? null : Math.round(parseFloat(v) * 100));
              }}
              placeholder="z.B. 450"
              className="mt-1"
            />
          )}
        />
      </div>
      <div>
        <Label>Produktbild (optional)</Label>
        {imageStoragePath && (
          <div className="mt-2 mb-2">
            <img
              src={getProductImageUrl(imageStoragePath) ?? ""}
              alt="Vorschau"
              className="h-24 w-24 object-cover rounded-lg border border-gray-200"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 text-red-600"
              onClick={() => setValue("imageStoragePath", null)}
            >
              Bild entfernen
            </Button>
          </div>
        )}
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onImageSelect}
          disabled={imageUploading}
          className="mt-1"
        />
        {imageUploading && (
          <p className="text-sm text-gray-500 mt-1">Wird hochgeladen...</p>
        )}
      </div>
      <DynamicParametersField
        key={item?.id ?? "new"}
        value={parameters ?? {}}
        onChange={(v) => setValue("parameters", v)}
      />
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Speichern..." : isEdit ? "Aktualisieren" : "Anlegen"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
