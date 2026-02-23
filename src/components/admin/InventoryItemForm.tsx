"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryItemSchema, type InventoryItemFormData } from "@/lib/validations/inventory";
import { createInventoryItemAction, updateInventoryItemAction } from "@/app/actions/inventory";
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

  const {
    register,
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
    },
  });

  const categoryId = watch("categoryId");
  const locationId = watch("locationId");

  const NONE_VALUE = "__none__";
  const categorySelectValue = categoryId ?? NONE_VALUE;
  const locationSelectValue = locationId ?? NONE_VALUE;

  const onSubmit = async (data: InventoryItemFormData) => {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description ?? "");
    formData.set("status", data.status);
    formData.set("categoryId", data.categoryId ?? "");
    formData.set("locationId", data.locationId ?? "");

    const result = isEdit
      ? await updateInventoryItemAction(item!.id, formData)
      : await createInventoryItemAction(formData);

    if (result.success) {
      onSuccess?.();
      const data = (result as { data?: InventoryItem }).data;
      if (isEdit && item) {
        router.push(`/admin/inventory/${item.id}`);
      } else if (data?.id) {
        router.push(`/admin/inventory/${data.id}`);
      } else {
        router.push("/admin/inventory");
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
