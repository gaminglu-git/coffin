"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const CircularGallery = dynamic(() => import("./CircularGallery"), { ssr: false });

export interface FamilyPhoto {
    id: string;
    url: string;
    caption?: string | null;
    uploadedBy: string;
}

interface CircularPhotoGalleryProps {
    photos: FamilyPhoto[];
    /** Group by person - each person gets their own gallery */
    groupByPerson?: boolean;
    /** Container height in px */
    height?: number;
    /** Bend/curvature (1-3 typical) */
    bend?: number;
    /** Text color on images */
    textColor?: string;
    /** Border radius (0-0.1) */
    borderRadius?: number;
    /** Scroll speed */
    scrollSpeed?: number;
    /** Scroll ease */
    scrollEase?: number;
    className?: string;
}

export function CircularPhotoGallery({
    photos,
    groupByPerson = true,
    height = 500,
    bend = 2,
    textColor = "#064e3b",
    borderRadius = 0.05,
    scrollSpeed = 2,
    scrollEase = 0.05,
    className,
}: CircularPhotoGalleryProps) {
    if (photos.length === 0) {
        return (
            <div className={cn("text-center py-12 text-gray-400 text-sm", className)}>
                Noch keine Lieblingsbilder.
            </div>
        );
    }

    if (groupByPerson) {
        const byPerson = photos.reduce<Record<string, FamilyPhoto[]>>((acc, p) => {
            const name = p.uploadedBy || "Unbekannt";
            if (!acc[name]) acc[name] = [];
            acc[name].push(p);
            return acc;
        }, {});

        return (
            <div className={cn("space-y-16", className)}>
                {Object.entries(byPerson).map(([name, personPhotos]) => {
                    const items = personPhotos.map((p) => ({
                        image: p.url,
                        text: p.caption || name,
                    }));

                    return (
                        <div key={name} className="text-center">
                            {/* Name oben */}
                            <h4 className="text-lg font-semibold text-emerald-900 mb-6 uppercase tracking-wider">
                                {name}
                            </h4>
                            {/* Circular Gallery darunter - WebGL bent carousel */}
                            <div
                                style={{ height: `${height}px`, position: "relative" }}
                                className="w-full rounded-2xl overflow-hidden"
                            >
                                <CircularGallery
                                    items={items}
                                    bend={bend}
                                    textColor={textColor}
                                    borderRadius={borderRadius}
                                    scrollSpeed={scrollSpeed}
                                    scrollEase={scrollEase}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    const items = photos.map((p) => {
        const name = p.uploadedBy || "Anonym";
        return {
            image: p.url,
            text: `eingereicht von ${name}`,
            boldPart: name,
        };
    });

    return (
        <div className={cn("text-center", className)}>
            <div
                style={{ height: `${height}px`, position: "relative" }}
                className="w-full rounded-2xl overflow-hidden"
            >
                <CircularGallery
                    items={items}
                    bend={bend}
                    textColor={textColor}
                    borderRadius={borderRadius}
                    scrollSpeed={scrollSpeed}
                    scrollEase={scrollEase}
                />
            </div>
        </div>
    );
}
