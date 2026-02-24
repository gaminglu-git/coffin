"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, Zap, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { createCaseAction } from "@/app/actions/cases";
import { listChecklistTemplates } from "@/app/actions/templates";
import { caseWizardSchema, type CaseWizardFormData } from "@/lib/validations/case";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChecklistTemplate } from "@/types";

const BURIAL_PRESETS: Record<string, { title: string; items: { text: string; completed: boolean }[] }[]> = {
    Erdbestattung: [
        { title: "Behörden & Dokumente", items: [{ text: "Totenschein beim Arzt", completed: false }, { text: "Stammbuch", completed: false }] },
        { title: "Beisetzung & Feier (Erde)", items: [{ text: "Friedhofsamt", completed: false }, { text: "Erdsarg bestellt", completed: false }] }
    ],
    Feuerbestattung: [
        { title: "Behörden & Dokumente", items: [{ text: "Totenschein beim Arzt", completed: false }, { text: "Stammbuch", completed: false }] },
        { title: "Kremation & Feier (Feuer)", items: [{ text: "Krematorium", completed: false }, { text: "Schmuckurne", completed: false }] }
    ],
    Seebestattung: [
        { title: "Behörden & Dokumente", items: [{ text: "Totenschein beim Arzt", completed: false }] },
        { title: "Kremation & Reederei", items: [{ text: "Krematorium", completed: false }, { text: "Reederei", completed: false }] }
    ],
    "Baumbestattung / Friedwald": [
        { title: "Behörden & Dokumente", items: [{ text: "Totenschein beim Arzt", completed: false }] },
        { title: "Kremation & Wald", items: [{ text: "Krematorium", completed: false }, { text: "Friedwald", completed: false }] }
    ],
    "Noch unklar": [
        { title: "Behörden & Erste Schritte", items: [{ text: "Beratungstermin vereinbaren", completed: false }] }
    ]
};

const defaultValues: CaseWizardFormData = {
    wishes: { burialType: "Erdbestattung", specialWishes: "" },
    deceased: { firstName: "", lastName: "", birthDate: "", deathDate: "", deathPlace: "", religion: "", maritalStatus: "", address: "" },
    contact: { firstName: "", lastName: "", phone: "", email: "", relation: "", address: "" },
    checklists: BURIAL_PRESETS["Erdbestattung"]
};

export function CaseWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const [step, setStep] = useState(1);
    const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
    const [checklistSource, setChecklistSource] = useState<"preset" | string>("preset"); // "preset" or template id

    const {
        watch,
        setValue,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CaseWizardFormData>({
        resolver: zodResolver(caseWizardSchema),
        defaultValues,
    });

    const caseData = watch();

    useEffect(() => {
        if (open) listChecklistTemplates().then(setChecklistTemplates);
    }, [open]);

    useEffect(() => {
        if (checklistSource === "preset") {
            const burialType = caseData.wishes?.burialType;
            if (burialType && BURIAL_PRESETS[burialType]) {
                setValue("checklists", JSON.parse(JSON.stringify(BURIAL_PRESETS[burialType])));
            }
        } else {
            const t = checklistTemplates.find((c) => c.id === checklistSource);
            if (t) {
                const checklists = t.items.map((g) => ({
                    title: g.title,
                    items: g.items.map((it) => ({ text: it.text, completed: false })),
                }));
                setValue("checklists", checklists);
            }
        }
    }, [caseData.wishes?.burialType, checklistSource, checklistTemplates, setValue]);

    const submit = async (data: CaseWizardFormData) => {
        const result = await createCaseAction(data);

        if (result.success) {
            onOpenChange(false);
            setStep(1);
            reset(defaultValues);
            window.dispatchEvent(new CustomEvent('fetch-cases'));
            alert(`Fall erfolgreich angelegt. \nDie Familien-PIN lautet: ${result.familyPin}`);
        } else {
            alert(`Fehler beim Speichern: ${result.error}\nBitte stellen Sie sicher, dass das SQL-Schema in Supabase ausgeführt wurde.`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-5xl p-0 overflow-hidden bg-mw-offwhite rounded-3xl border-0 flex flex-col max-h-[min(90vh,100dvh)]">
                <DialogHeader className="p-4 sm:p-6 md:p-8 border-b border-gray-200 bg-white shrink-0">
                    <DialogTitle className="text-2xl font-serif text-mw-green">Neuen Sterbefall aufnehmen</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">Schritt {step} von 2</p>
                </DialogHeader>

                <form onSubmit={handleSubmit(submit)} className="flex flex-col min-h-0 flex-1">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-h-0">
                        {step === 1 && (
                            <div className="space-y-10 animate-in slide-in-from-right-4">
                                <section>
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">1. Wünsche & Bestattungsart</h3>
                                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                                        <div>
                                            <Label className="flex items-center gap-1 text-xs font-bold text-mw-green mb-2 uppercase">
                                                <Zap size={14} className="text-yellow-500" /> Art der Bestattung
                                            </Label>
                                            <select
                                                className="w-full p-3 border-2 border-mw-green/20 rounded-xl font-medium outline-none"
                                                {...register("wishes.burialType")}
                                            >
                                                <option value="Erdbestattung">Erdbestattung</option>
                                                <option value="Feuerbestattung">Feuerbestattung</option>
                                                <option value="Seebestattung">Seebestattung</option>
                                                <option value="Baumbestattung / Friedwald">Baumbestattung / Friedwald</option>
                                                <option value="Noch unklar">Noch unklar</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-500 mb-1">Besondere Wünsche</Label>
                                            <textarea
                                                rows={3}
                                                className="w-full p-3 border border-gray-300 rounded-xl outline-none"
                                                {...register("wishes.specialWishes")}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">2. Verstorbene Person</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-500 mb-1">Vorname</Label>
                                            <Input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-xl"
                                                {...register("deceased.firstName")}
                                                aria-invalid={!!errors.deceased?.firstName}
                                            />
                                            {errors.deceased?.firstName && (
                                                <p className="text-xs text-red-600 mt-1">{errors.deceased.firstName.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-500 mb-1">Nachname</Label>
                                            <Input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-xl"
                                                {...register("deceased.lastName")}
                                                aria-invalid={!!errors.deceased?.lastName}
                                            />
                                            {errors.deceased?.lastName && (
                                                <p className="text-xs text-red-600 mt-1">{errors.deceased.lastName.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="block text-xs font-medium text-gray-500 mb-1">Sterbedatum</Label>
                                            <Input
                                                type="date"
                                                className="w-full p-3 border border-gray-300 rounded-xl"
                                                {...register("deceased.deathDate")}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 border border-blue-100">
                                    <Info size={20} className="mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-sm">Checklisten</h4>
                                        <p className="text-xs mt-1">
                                            {checklistSource === "preset"
                                                ? <>Standard basierend auf: <strong>{caseData.wishes?.burialType}</strong></>
                                                : <>Benutzerdefinierte Vorlage</>}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                        <h3 className="text-lg font-medium text-gray-800">Checklisten</h3>
                                        <select
                                            value={checklistSource}
                                            onChange={(e) => setChecklistSource(e.target.value)}
                                            className="p-2 rounded-lg border border-gray-200 text-sm bg-white"
                                        >
                                            <option value="preset">Standard ({caseData.wishes?.burialType})</option>
                                            {checklistTemplates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-6">
                                        {caseData.checklists?.map((list: { title: string; items: { text: string; completed: boolean }[] }, listIndex: number) => (
                                            <div key={listIndex} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-4 gap-4">
                                                    <span className="font-bold text-gray-800 w-full">{list.title}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {list.items.map((item: { text: string; completed: boolean }, itemIndex: number) => (
                                                        <div key={itemIndex} className="flex items-center gap-2 group">
                                                            <div className="w-4 h-4 rounded border border-gray-300 shrink-0 mt-0.5"></div>
                                                            <span className="text-sm p-1.5 flex-1">{item.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                        {step === 1 ? (
                            <button type="button" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-gray-500 px-4 py-3 sm:py-2 hover:bg-gray-100 rounded-lg transition font-medium">Abbrechen</button>
                        ) : (
                            <button type="button" onClick={() => setStep(1)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 px-4 py-3 sm:py-2 hover:bg-gray-100 rounded-lg transition font-medium"><ChevronLeft size={16} /> Zurück</button>
                        )}
                        {step === 1 ? (
                            <button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto bg-mw-green text-white px-6 py-3 rounded-xl hover:bg-mw-green-dark flex items-center justify-center gap-2 font-medium transition">Weiter <ChevronRight size={18} /></button>
                        ) : (
                            <button type="submit" className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 font-medium shadow-lg transition"><CheckCircle size={18} /> Fall anlegen</button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
