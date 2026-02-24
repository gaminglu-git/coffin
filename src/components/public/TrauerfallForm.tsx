"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { createTrauerfallCaseAction } from "@/app/actions/cases";
import { trauerfallConfigSchema, type TrauerfallConfigFormData } from "@/lib/validations/trauerfall";
import { FormSuccessModal } from "@/components/public/FormSuccessModal";

const URGENCY_OPTIONS = [
  { value: "Sofort", label: "Sofort" },
  { value: "Heute", label: "Heute" },
  { value: "Diese Woche", label: "Diese Woche" },
  { value: "Unklar", label: "Unklar" },
] as const;

const defaultValues: TrauerfallConfigFormData = {
  urgency: "Heute",
  deceased: { firstName: "", lastName: "", deathPlace: "", deathDate: "" },
  contact: { firstName: "", lastName: "", phone: "", email: "" },
};

export function TrauerfallForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ familyPin: string; summary: string } | null>(null);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TrauerfallConfigFormData>({
    resolver: zodResolver(trauerfallConfigSchema),
    defaultValues,
  });

  const config = watch();

  const submitForm = async (data: TrauerfallConfigFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createTrauerfallCaseAction(data);

      if (result.success) {
        onOpenChange(false);
        reset(defaultValues);
        setSuccessData({
          familyPin: result.familyPin,
          summary: `Dringlichkeit: ${data.urgency}`,
        });
      } else {
        alert(`Es gab einen Fehler beim Absenden:\n${result.error}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error inserting trauerfall case:", error);
      alert(`Es gab einen Fehler beim Absenden:\n${err?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-md md:max-w-lg max-h-[min(90dvh,90vh)] flex flex-col overflow-hidden bg-stone-50 rounded-2xl sm:rounded-4xl border-0 gap-0 p-0">
        <DialogHeader className="p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] border-b border-stone-200 bg-white shrink-0">
          <DialogTitle className="text-xl font-serif text-emerald-900">Trauerfall – Sofort anfragen</DialogTitle>
          <p className="text-sm text-stone-500 mt-1">Wir melden uns schnellstmöglich bei Ihnen.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} autoComplete="on" className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
            <div>
              <Label className="text-xs font-medium text-stone-500 mb-2 block">Dringlichkeit</Label>
              <div className="flex flex-wrap gap-2">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("urgency", opt.value)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition touch-manipulation ${
                      config.urgency === opt.value
                        ? "bg-emerald-900 text-white"
                        : "bg-white border border-stone-200 text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
              <div>
              <Label htmlFor="trauerfall-deceased-firstname" className="text-xs font-medium text-stone-500 mb-1 block">
                Vorname Verstorbene/r
              </Label>
              <Input
                id="trauerfall-deceased-firstname"
                autoComplete="section-trauerfall-deceased given-name"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("deceased.firstName")}
                aria-invalid={!!errors.deceased?.firstName}
              />
              {errors.deceased?.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.deceased.firstName.message}</p>
              )}
              </div>
              <div>
                <Label htmlFor="trauerfall-deceased-lastname" className="text-xs font-medium text-stone-500 mb-1 block">
                Nachname Verstorbene/r
              </Label>
              <Input
                id="trauerfall-deceased-lastname"
                autoComplete="section-trauerfall-deceased family-name"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("deceased.lastName")}
                aria-invalid={!!errors.deceased?.lastName}
                />
                {errors.deceased?.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.deceased.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trauerfall-deathplace" className="text-xs font-medium text-stone-500 mb-1 block">
                Sterbeort
              </Label>
              <Input
                id="trauerfall-deathplace"
                autoComplete="section-trauerfall address-level2"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                placeholder="z.B. Bonn"
                {...register("deceased.deathPlace")}
              />
            </div>
            <div>
              <Label htmlFor="trauerfall-deathdate" className="text-xs font-medium text-stone-500 mb-1 block">
                Sterbedatum
              </Label>
              <Input
                id="trauerfall-deathdate"
                type="date"
                autoComplete="section-trauerfall off"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("deceased.deathDate")}
              />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-3">Ihre Kontaktdaten</p>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trauerfall-contact-firstname" className="text-xs font-medium text-stone-500 mb-1 block">
                  Vorname
                </Label>
                <Input
                  id="trauerfall-contact-firstname"
                  autoComplete="section-trauerfall-contact given-name"
                  className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                  {...register("contact.firstName")}
                  aria-invalid={!!errors.contact?.firstName}
                />
                {errors.contact?.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contact.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="trauerfall-contact-lastname" className="text-xs font-medium text-stone-500 mb-1 block">
                  Nachname
                </Label>
                <Input
                  id="trauerfall-contact-lastname"
                  autoComplete="section-trauerfall-contact family-name"
                  className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                  {...register("contact.lastName")}
                  aria-invalid={!!errors.contact?.lastName}
                />
                {errors.contact?.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contact.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="trauerfall-contact-phone" className="text-xs font-medium text-stone-500 mb-1 block">
                Telefon
              </Label>
              <Input
                id="trauerfall-contact-phone"
                type="tel"
                autoComplete="section-trauerfall-contact tel"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("contact.phone")}
                aria-invalid={!!errors.contact?.phone}
              />
              {errors.contact?.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.phone.message}</p>
              )}
            </div>
            <div className="mt-4">
              <Label htmlFor="trauerfall-contact-email" className="text-xs font-medium text-stone-500 mb-1 block">
                E-Mail
              </Label>
              <Input
                id="trauerfall-contact-email"
                type="email"
                autoComplete="section-trauerfall-contact email"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("contact.email")}
                aria-invalid={!!errors.contact?.email}
              />
              {errors.contact?.email && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.email.message}</p>
              )}
            </div>
          </div>

          </div>
          <div className="shrink-0 p-4 sm:p-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-stone-200 bg-white rounded-b-2xl sm:rounded-b-4xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] bg-emerald-900 text-white py-3 rounded-full hover:bg-emerald-950 disabled:bg-stone-400 touch-manipulation"
            >
              <Send size={18} className="mr-2 inline" /> {isSubmitting ? "Wird gesendet..." : "Anfrage absenden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <FormSuccessModal
      open={!!successData}
      onOpenChange={(o) => !o && setSuccessData(null)}
      familyPin={successData?.familyPin ?? ""}
      summary={successData?.summary}
      caseType="trauerfall"
    />
    </>
  );
}
