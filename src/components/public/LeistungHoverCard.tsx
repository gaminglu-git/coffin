"use client";

import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getProductImageUrl } from "@/lib/storage-url";
import { formatLeistungPriceDisplay } from "@/lib/leistung-price";
import type { Leistung } from "@/types";

const HOVER_DELAY_MS = 200;
const CLOSE_DELAY_MS = 150;

interface LeistungHoverCardProps {
  leistung: Leistung;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function LeistungHoverCard({
  leistung,
  children,
  side = "top",
}: LeistungHoverCardProps) {
  const [open, setOpen] = useState(false);
  const openTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
  const closeTimerRef = { current: null as ReturnType<typeof setTimeout> | null };

  const scheduleOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }, []);

  const scheduleClose = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, []);

  const imagePath =
    leistung.imageStoragePath ?? leistung.inventoryItem?.imageStoragePath;
  const imageUrl = imagePath ? getProductImageUrl(imagePath) : null;
  const priceDisplay = formatLeistungPriceDisplay(leistung);
  const params = leistung.parameters
    ? Object.entries(leistung.parameters).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          className="cursor-pointer"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="center"
        className="w-72 p-0 overflow-hidden"
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
      >
        <div className="flex flex-col">
          {imageUrl && (
            <div className="aspect-video w-full bg-stone-100">
              <img
                src={imageUrl}
                alt={leistung.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-3 space-y-2">
            <h4 className="font-medium text-stone-900">{leistung.title}</h4>
            {leistung.description && (
              <p className="text-sm text-stone-600 line-clamp-3">
                {leistung.description}
              </p>
            )}
            {params.length > 0 && (
              <ul className="text-xs text-stone-500 space-y-0.5">
                {params.map(([key, val]) => (
                  <li key={key}>
                    <span className="capitalize">{key}:</span>{" "}
                    {String(val)}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm font-bold text-emerald-900 pt-1">
              {priceDisplay}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
