"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";

export interface ViewerPhoto {
  id: string;
  url?: string;
  storagePath: string;
  uploadedByName: string;
  caption?: string | null;
  createdAt: string;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit?: (photo: ViewerPhoto) => void;
  onDelete?: (photo: ViewerPhoto) => void;
}

export function PhotoViewer({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}: PhotoViewerProps) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    if (!photo?.url) return;
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = `bild-${photo.id}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 shrink-0">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(photo)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              title="Bearbeiten"
            >
              <Pencil size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(photo)}
              className="p-2 rounded-lg bg-white/10 text-red-400 hover:bg-red-500/20 transition"
              title="Löschen"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
            title="Herunterladen"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
            title="Schließen"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-4 relative">
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10"
            title="Vorheriges Bild"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition z-10"
            title="Nächstes Bild"
          >
            <ChevronRight size={28} />
          </button>
        )}
        {photo.url ? (
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={photo.url}
                alt={photo.caption || `Foto von ${photo.uploadedByName}`}
                fill
                className="object-contain"
                sizes="100vw"
                draggable={false}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Caption bar */}
      <div className="p-3 sm:p-4 bg-black/50 shrink-0">
        <p className="text-white font-medium text-sm">{photo.uploadedByName}</p>
        {photo.caption && (
          <p className="text-white/80 text-sm mt-0.5">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}
