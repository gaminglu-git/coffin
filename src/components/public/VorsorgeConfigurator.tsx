"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { createVorsorgeCaseAction } from "@/app/actions/cases";
import { vorsorgeConfigSchema, type VorsorgeConfigFormData } from "@/lib/validations/vorsorge";

const PRICING = {
    baseFee: 1450,
    burialType: { Erdbestattung: 0, Feuerbestattung: 350, Seebestattung: 1150, "Baumbestattung / Friedwald": 350 },
    coffinUrn: { Standard: 450, "Natur / Bio": 750, Individuell: 950 },
    ceremony: { "Keine Feier": 0, "Im kleinen Kreis": 350, "Große Trauerfeier": 850 },
};

const defaultValues: VorsorgeConfigFormData = {
    burialType: "Feuerbestattung",
    coffinUrn: "Natur / Bio",
    ceremony: "Im kleinen Kreis",
    contact: { firstName: "", lastName: "", email: "" },
};

export function VorsorgeConfigurator({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        watch,
        setValue,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VorsorgeConfigFormData>({
        resolver: zodResolver(vorsorgeConfigSchema),
        defaultValues,
    });

    const config = watch();

    const estimatedPrice =
        PRICING.baseFee +
        (PRICING.burialType[config.burialType as keyof typeof PRICING.burialType] || 0) +
        (PRICING.coffinUrn[config.coffinUrn as keyof typeof PRICING.coffinUrn] || 0) +
        (PRICING.ceremony[config.ceremony as keyof typeof PRICING.ceremony] || 0);

    const submitForm = async (data: VorsorgeConfigFormData) => {
        setIsSubmitting(true);
        try {
            const result = await createVorsorgeCaseAction(data, estimatedPrice);

            if (result.success) {
                onOpenChange(false);
                setStep(1);
                alert(`Ihre Anfrage wurde sicher an uns übermittelt.\nIhre Familien-PIN für das Portal ist: ${result.familyPin}`);
            } else {
                alert(`Es gab einen Fehler beim Absenden:\n${result.error}\nBitte stellen Sie sicher, dass das SQL-Schema in Supabase ausgeführt wurde.`);
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error('Error inserting case:', error);
            alert(`Es gab einen Fehler beim Absenden:\n${err?.message || "Unbekannter Fehler"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const OptionCard = ({ title, desc, price, selected, onClick }: { title: string; desc: string; price: number; selected: boolean; onClick: () => void }) => (
        <div
            onClick={onClick}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer flex flex-col h-full min-w-0 transition-all ${selected ? "border-mw-green bg-mw-sand-light" : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                }`}
        >
            <div className="flex justify-between items-start mb-2 gap-3 min-w-0">
                <h4 className={`font-medium leading-snug wrap-break-word min-w-0 flex-1 ${selected ? "text-mw-green" : "text-gray-800"}`}>{title}</h4>
                {selected && <CheckCircle size={20} className="text-mw-green shrink-0 mt-0.5" />}
            </div>
            <p className="text-xs text-gray-500 mb-4 flex-1 min-w-0 wrap-break-word">{desc}</p>
            <div className="mt-auto shrink-0">
                <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block whitespace-nowrap">+{price} €</span>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-4xl p-0 overflow-hidden bg-mw-offwhite rounded-3xl border-0 gap-0 flex flex-col max-h-[min(90vh,100dvh)]">
                <DialogHeader className="p-4 sm:p-6 border-b border-gray-200 bg-white shrink-0">
                    <DialogTitle className="text-2xl font-serif text-mw-green">Vorsorge Konfigurator</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">Schritt {step} von 4</p>
                </DialogHeader>

                <form onSubmit={handleSubmit(submitForm)} className="flex flex-col min-h-0 flex-1">
                    <div className="flex flex-col md:flex-row min-h-0 flex-1 overflow-hidden">
                        <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0 shrink-0 md:shrink">
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <h3 className="text-xl font-medium text-gray-800 mb-6">Bestattungsart</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.keys(PRICING.burialType).map((key) => (
                                            <OptionCard
                                                key={key}
                                                title={key}
                                                desc="Kurze Beschreibung hier."
                                                price={PRICING.burialType[key as keyof typeof PRICING.burialType]}
                                                selected={config.burialType === key}
                                                onClick={() => setValue("burialType", key as VorsorgeConfigFormData["burialType"])}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <h3 className="text-xl font-medium text-gray-800 mb-6">Wahl der Ausstattung</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.keys(PRICING.coffinUrn).map((key) => (
                                            <OptionCard
                                                key={key}
                                                title={key}
                                                desc="Ausstattungs-Details."
                                                price={PRICING.coffinUrn[key as keyof typeof PRICING.coffinUrn]}
                                                selected={config.coffinUrn === key}
                                                onClick={() => setValue("coffinUrn", key as VorsorgeConfigFormData["coffinUrn"])}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <h3 className="text-xl font-medium text-gray-800 mb-6">Rahmen der Abschiednahme</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.keys(PRICING.ceremony).map((key) => (
                                            <OptionCard
                                                key={key}
                                                title={key}
                                                desc="Rahmen-Details."
                                                price={PRICING.ceremony[key as keyof typeof PRICING.ceremony]}
                                                selected={config.ceremony === key}
                                                onClick={() => setValue("ceremony", key as VorsorgeConfigFormData["ceremony"])}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === 4 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 min-w-0">
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">Ihre Konfiguration</h3>
                                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 mb-6 min-w-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                            <div>
                                                <Label htmlFor="firstName" className="text-xs font-medium text-gray-500 mb-1">Vorname</Label>
                                                <Input
                                                    id="firstName"
                                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                                    {...register("contact.firstName")}
                                                    aria-invalid={!!errors.contact?.firstName}
                                                />
                                                {errors.contact?.firstName && (
                                                    <p className="text-xs text-red-600 mt-1">{errors.contact.firstName.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="lastName" className="block text-xs font-medium text-gray-500 mb-1">Nachname</Label>
                                                <Input
                                                    id="lastName"
                                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                                    {...register("contact.lastName")}
                                                    aria-invalid={!!errors.contact?.lastName}
                                                />
                                                {errors.contact?.lastName && (
                                                    <p className="text-xs text-red-600 mt-1">{errors.contact.lastName.message}</p>
                                                )}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-1">E-Mail Adresse</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                                    {...register("contact.email")}
                                                    aria-invalid={!!errors.contact?.email}
                                                />
                                                {errors.contact?.email && (
                                                    <p className="text-xs text-red-600 mt-1">{errors.contact.email.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-1/3 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-4 sm:p-6 flex flex-col justify-between min-w-0 shrink-0">
                            <div className="min-w-0">
                                <h3 className="font-serif text-xl text-mw-green mb-4 sm:mb-6">Kostenschätzung</h3>
                                <div className="space-y-4 text-sm text-gray-600 border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
                                    <div className="flex justify-between gap-2 sm:gap-4 min-w-0">
                                        <span className="shrink-0">Basis (Begleitung)</span>
                                        <span className="font-medium shrink-0">{PRICING.baseFee} €</span>
                                    </div>
                                    <div className="flex justify-between gap-2 sm:gap-4 min-w-0">
                                        <span className="truncate min-w-0" title={config.burialType}>{config.burialType}</span>
                                        <span className="font-medium shrink-0">+{PRICING.burialType[config.burialType as keyof typeof PRICING.burialType] || 0} €</span>
                                    </div>
                                    <div className="flex justify-between gap-2 sm:gap-4 min-w-0">
                                        <span className="truncate min-w-0" title={config.coffinUrn}>Ausstattung: {config.coffinUrn}</span>
                                        <span className="font-medium shrink-0">+{PRICING.coffinUrn[config.coffinUrn as keyof typeof PRICING.coffinUrn] || 0} €</span>
                                    </div>
                                    <div className="flex justify-between gap-2 sm:gap-4 min-w-0">
                                        <span className="truncate min-w-0" title={config.ceremony}>{config.ceremony}</span>
                                        <span className="font-medium shrink-0">+{PRICING.ceremony[config.ceremony as keyof typeof PRICING.ceremony] || 0} €</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end gap-2 min-w-0">
                                    <span className="text-gray-800 font-medium shrink-0">Summe (ca.)*</span>
                                    <span className="text-xl sm:text-2xl font-serif text-mw-green font-bold shrink-0 text-right">{estimatedPrice.toLocaleString("de-DE")} €</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-3xl flex justify-between items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
                        {step > 1 ? (
                            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-gray-600">
                                <ChevronLeft size={16} /> Zurück
                            </Button>
                        ) : (
                            <div />
                        )}
                        {step < 4 ? (
                            <Button type="button" onClick={() => setStep(step + 1)} className="bg-mw-green text-white px-6 py-3 rounded-xl hover:bg-mw-green-dark">
                                Weiter <ChevronRight size={18} />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400"
                            >
                                <Send size={18} className="mr-2" /> {isSubmitting ? "Wird gesendet..." : "Unverbindlich anfragen"}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
