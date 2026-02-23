"use client";

import { useState, useEffect, use } from "react";

import { useRouter } from "next/navigation";
import { LogOut, Clock, CheckCircle, Heart, FileText, Send, UploadCloud, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CircularPhotoGallery } from "@/components/family/CircularPhotoGallery";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const KANBAN_COLUMNS = [
    { id: "Neu", title: "Neu / Erstkontakt" },
    { id: "In Planung", title: "In Planung" },
    { id: "Behörden & Orga", title: "Behörden & Orga" },
    { id: "Trauerfeier", title: "Trauerfeier" },
    { id: "Abgeschlossen", title: "Abgeschlossen" },
];

export default function FamilyPortal({ params }: { params: Promise<{ caseId: string }> }) {
    const router = useRouter();
    const { caseId: pin } = use(params);

    const [newMemory, setNewMemory] = useState("");
    const [uploadedByName, setUploadedByName] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCaseData = async () => {
            if (!pin) return;

            const { data, error } = await supabase
                .from("cases")
                .select("*, memories(*), family_photos(*)")
                .eq("family_pin", pin)
                .single();

            if (error || !data) {
                router.push("/family");
                return;
            }
            if (data.memories) {
                data.memories.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            if (data.family_photos) {
                data.family_photos = data.family_photos.map((p: any) => ({
                    ...p,
                    url: supabase.storage.from("family-files").getPublicUrl(p.storage_path).data.publicUrl,
                }));
            }
            setCaseData(data);
            setLoading(false);
        };

        fetchCaseData();

        // Subscribe to real-time updates for this case
        const channel = supabase
            .channel(`case-updates-${pin}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'cases',
                    filter: `family_pin=eq.${pin}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload);
                    setCaseData((current: any) => ({
                        ...current,
                        ...payload.new
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pin, router]);

    const handleLogout = () => {
        router.push("/");
    };

    const submitMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemory.trim() || !caseData) return;

        const { data, error } = await supabase.from("memories").insert({
            case_id: caseData.id,
            text: newMemory
        }).select().single();

        if (!error && data) {
            setCaseData({
                ...caseData,
                memories: [data, ...caseData.memories]
            });
            setNewMemory("");
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !caseData) return;

        const name = uploadedByName.trim() || "Anonym";
        if (!name) {
            alert("Bitte geben Sie Ihren Namen ein.");
            return;
        }

        if (!IMAGE_TYPES.includes(file.type)) {
            alert("Nur Bilder (JPG, PNG, WebP, GIF) sind erlaubt.");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert("Max. 10MB pro Bild.");
            e.target.value = "";
            return;
        }

        setUploadingPhoto(true);
        const fileExt = file.name.split(".").pop() || "jpg";
        const storagePath = `${caseData.id}/photos/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("family-files").upload(storagePath, file);
        if (uploadError) {
            alert(`Fehler beim Upload: ${uploadError.message}`);
            setUploadingPhoto(false);
            e.target.value = "";
            return;
        }

        const { data: photoData, error: insertError } = await supabase
            .from("family_photos")
            .insert({ case_id: caseData.id, storage_path: storagePath, uploaded_by_name: name })
            .select()
            .single();

        if (insertError) {
            alert(`Fehler beim Speichern: ${insertError.message}`);
            setUploadingPhoto(false);
            e.target.value = "";
            return;
        }

        const { data: urlData } = supabase.storage.from("family-files").getPublicUrl(storagePath);
        setCaseData({
            ...caseData,
            family_photos: [
                { ...photoData, url: urlData.publicUrl },
                ...(caseData.family_photos || []),
            ],
        });
        setUploadingPhoto(false);
        e.target.value = "";
    };

    if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="animate-pulse text-emerald-900">Lade Fall-Daten...</div></div>;

    const statusIndex = KANBAN_COLUMNS.findIndex((c) => c.id === caseData.status);
    const progressPercent = Math.max(10, (statusIndex / (KANBAN_COLUMNS.length - 1)) * 100);

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
            <nav className="bg-white border-b border-stone-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="font-serif text-xl text-emerald-900">liebevoll bestatten</h1>
                    <p className="text-[10px] tracking-widest text-stone-500 uppercase">Angehörigen portal</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="text-stone-500 hover:text-red-500 text-sm font-medium flex items-center gap-2 bg-stone-100 transition border-none shadow-none">
                    <LogOut size={16} /> Abmelden
                </Button>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <header className="mb-12 text-center">
                    <h2 className="text-3xl sm:text-4xl font-serif text-emerald-900 mb-4">Übersicht & Planung</h2>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        Für <strong>{caseData.name.replace("VORSORGE: ", "")}</strong>.
                    </p>
                </header>

                {/* Lieblingsbilder – direkt unter dem Header */}
                {caseData.family_photos && caseData.family_photos.length > 0 && (
                    <div className="mb-12">
                        <CircularPhotoGallery
                            photos={caseData.family_photos.map((p: any) => ({
                                id: p.id,
                                url: p.url,
                                caption: p.caption,
                                uploadedBy: p.uploaded_by_name,
                            }))}
                            groupByPerson={false}
                            height={500}
                            bend={2}
                            textColor="#064e3b"
                            borderRadius={0.05}
                            scrollSpeed={2}
                            scrollEase={0.05}
                        />
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Timeline Status Tracker */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                            <h3 className="font-medium text-emerald-900 mb-6 flex items-center gap-2">
                                <Clock size={20} /> Aktueller Status
                            </h3>
                            <div className="relative">
                                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-stone-100"></div>
                                <div
                                    className="absolute left-3.5 top-2 w-0.5 bg-emerald-600 transition-all duration-1000"
                                    style={{ height: `${progressPercent}%` }}
                                ></div>
                                <div className="space-y-6 relative z-10">
                                    {KANBAN_COLUMNS.map((col, index) => {
                                        const isPast = index < statusIndex;
                                        const isCurrent = index === statusIndex;
                                        return (
                                            <div
                                                key={col.id}
                                                className={`flex items-center gap-4 ${isPast ? "opacity-50" : isCurrent ? "opacity-100" : "opacity-30"}`}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isCurrent
                                                        ? "bg-white border-emerald-600 text-emerald-600"
                                                        : isPast
                                                            ? "bg-emerald-600 border-emerald-600 text-white"
                                                            : "bg-white border-stone-300 text-stone-300"
                                                        }`}
                                                >
                                                    {isPast ? <CheckCircle size={14} /> : index + 1}
                                                </div>
                                                <div>
                                                    <span className={`block text-sm ${isCurrent ? "font-bold text-emerald-900" : "font-medium text-stone-500"}`}>
                                                        {col.title}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        {/* Memory Wiki */}
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-serif text-emerald-900 flex items-center gap-2 mb-2">
                                        <Heart size={24} className="text-emerald-600" /> Erinnerungen & Anekdoten
                                    </h3>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                                {caseData.memories.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 border-2 border-dashed border-stone-200 rounded-2xl">
                                        <FileText size={48} className="mb-4 opacity-50" />
                                        <p className="text-center text-sm">Noch keine Einträge vorhanden.</p>
                                    </div>
                                ) : (
                                    caseData.memories.map((mem: any) => (
                                        <div key={mem.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-xs text-emerald-600">Familien-Eintrag</span>
                                                <span className="text-xs text-stone-400">{new Date(mem.created_at).toLocaleDateString("de-DE")}</span>
                                            </div>
                                            <p className="text-stone-700 text-sm whitespace-pre-wrap">{mem.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-stone-100 pt-6">
                                <form onSubmit={submitMemory}>
                                    <textarea
                                        rows={3}
                                        placeholder="Z.B. Papa hat den Garten geliebt..."
                                        className="w-full p-4 border border-stone-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none mb-4 text-sm resize-none"
                                        value={newMemory}
                                        onChange={(e) => setNewMemory(e.target.value)}
                                        required
                                    />
                                    <Button type="submit" disabled={!newMemory.trim()} className="bg-emerald-900 text-white px-6 py-3 rounded-full hover:bg-emerald-950 transition font-medium flex items-center gap-2 shadow-sm w-full md:w-auto disabled:bg-stone-400">
                                        <Send size={16} /> Sicher abspeichern
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Lieblingsbilder */}
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                            <h3 className="text-xl font-serif text-emerald-900 flex items-center gap-2 mb-2">
                                <ImageIcon size={24} className="text-emerald-600" /> Lieblingsbilder
                            </h3>
                            <p className="text-sm text-stone-600 mb-6">
                                Laden Sie Ihre Lieblingsbilder hoch – sie werden als Galerie unter Ihrem Namen angezeigt.
                            </p>

                            <div className="space-y-4 mb-6">
                                <label className="block text-sm font-medium text-stone-700">Ihr Name (z.B. Vorname oder Spitzname)</label>
                                <input
                                    type="text"
                                    value={uploadedByName}
                                    onChange={(e) => setUploadedByName(e.target.value)}
                                    placeholder="Maria, Thomas, Oma..."
                                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                />
                            </div>

                            <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center bg-stone-50 relative transition-all hover:bg-white hover:border-emerald-500">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    onChange={handlePhotoUpload}
                                    disabled={uploadingPhoto}
                                    title="Bilder hochladen"
                                />
                                {uploadingPhoto ? (
                                    <div className="animate-pulse text-emerald-900">Wird hochgeladen...</div>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="mx-auto text-stone-400 mb-4" />
                                        <p className="text-sm font-medium text-stone-700">Klicken oder Bild hierher ziehen</p>
                                        <p className="text-xs text-stone-400 mt-2">JPG, PNG, WebP, GIF – max. 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
