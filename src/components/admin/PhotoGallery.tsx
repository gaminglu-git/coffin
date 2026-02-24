"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, UploadCloud, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PhotoViewer } from "@/components/admin/PhotoViewer";
import {
  deleteFamilyPhoto,
  updateFamilyPhoto,
  uploadFamilyPhoto,
} from "@/app/actions/family-photos";

export interface GalleryPhoto {
  id: string;
  url?: string;
  storagePath: string;
  uploadedByName: string;
  caption?: string | null;
  createdAt: string;
}

interface PhotoGalleryProps {
  caseId: string;
  photos: GalleryPhoto[];
  onUpdate: () => void;
}

export function PhotoGallery({ caseId, photos, onUpdate }: PhotoGalleryProps) {
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editUploadedBy, setEditUploadedBy] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openEdit = (photo: GalleryPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPhoto(photo);
    setEditCaption(photo.caption ?? "");
    setEditUploadedBy(photo.uploadedByName);
  };

  const handleSaveEdit = async () => {
    if (!editingPhoto) return;
    const result = await updateFamilyPhoto(editingPhoto.id, {
      caption: editCaption || null,
      uploaded_by_name: editUploadedBy,
    });
    if (result.success) {
      setEditingPhoto(null);
      if (viewerIndex !== null && photos[viewerIndex]?.id === editingPhoto.id) {
        setViewerIndex(null);
      }
      onUpdate();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (photo: GalleryPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Dieses Bild wirklich löschen?")) return;
    setDeletingId(photo.id);
    const result = await deleteFamilyPhoto(photo.id, photo.storagePath);
    setDeletingId(null);
    if (result.success) {
      if (viewerIndex !== null) {
        const idx = photos.findIndex((p) => p.id === photo.id);
        if (idx === viewerIndex) setViewerIndex(null);
        else if (idx < viewerIndex) setViewerIndex((i) => (i ?? 0) - 1);
      }
      onUpdate();
    } else {
      alert(result.error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("uploaded_by_name", "Team");
    formData.set("caption", "");

    const result = await uploadFamilyPhoto(caseId, formData);
    setUploading(false);
    e.target.value = "";

    if (result.success) {
      onUpdate();
    } else {
      setUploadError(result.error ?? "Upload fehlgeschlagen");
    }
  };

  const openViewer = (index: number) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-medium text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          <ImageIcon size={18} className="text-mw-green shrink-0" /> Lieblingsbilder
        </h3>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-mw-green hover:text-mw-green-dark font-medium">
            <UploadCloud size={14} className="sm:w-4 sm:h-4" />
            {uploading ? "Wird hochgeladen..." : "Bild hinzufügen"}
          </span>
        </label>
      </div>

      {uploadError && (
        <p className="text-sm text-red-600 mb-2 bg-red-50 p-2 rounded-lg">
          {uploadError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {!photos?.length ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white">
            <ImageIcon size={40} className="mb-3 opacity-50 sm:w-12 sm:h-12" />
            <p className="text-sm text-center mb-4">
              Noch keine Lieblingsbilder vorhanden.
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <UploadCloud size={16} />
              Bild hochladen
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer"
                onClick={() => openViewer(index)}
              >
                {photo.url && (
                  <Image
                    src={photo.url}
                    alt={photo.caption || `Foto von ${photo.uploadedByName}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 25vw, 16vw"
                  />
                )}
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => openEdit(photo, e)}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/90 text-gray-700 hover:bg-white transition"
                    title="Bearbeiten"
                  >
                    <Pencil size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(photo, e)}
                    disabled={deletingId === photo.id}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white transition disabled:opacity-50"
                    title="Löschen"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-1.5 sm:p-2 pointer-events-none">
                  <p className="text-white text-[10px] sm:text-xs font-medium truncate">
                    {photo.uploadedByName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {viewerIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={closeViewer}
          onPrev={() => setViewerIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() =>
            setViewerIndex((i) => Math.min(photos.length - 1, (i ?? 0) + 1))
          }
          onEdit={(p) => {
            closeViewer();
            openEdit(p);
          }}
          onDelete={(p) => handleDelete(p)}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(o) => !o && setEditingPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bild bearbeiten</DialogTitle>
          </DialogHeader>
          {editingPhoto && (
            <div className="space-y-4 py-4">
              <div className="flex gap-4">
                {editingPhoto.url ? (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg border overflow-hidden">
                    <Image
                      src={editingPhoto.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg border bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={24} />
                  </div>
                )}
                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hochgeladen von
                    </label>
                    <input
                      type="text"
                      value={editUploadedBy}
                      onChange={(e) => setEditUploadedBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="z.B. Maria, Thomas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung (optional)
                    </label>
                    <input
                      type="text"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Kurze Bildbeschreibung"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhoto(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} className="bg-mw-green hover:bg-mw-green-dark">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
