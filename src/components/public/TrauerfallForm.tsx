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
        alert(`Ihre Anfrage wurde sicher an uns übermittelt.\nIhre Familien-PIN für das Portal ist: ${result.familyPin}`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md p-0 overflow-hidden bg-stone-50 rounded-2xl border-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 border-b border-stone-200 bg-white">
          <DialogTitle className="text-xl font-serif text-emerald-900">Trauerfall – Sofort anfragen</DialogTitle>
          <p className="text-sm text-stone-500 mt-1">Wir melden uns schnellstmöglich bei Ihnen.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="p-4 sm:p-6 space-y-6">
          <div>
            <Label className="text-xs font-medium text-stone-500 mb-2 block">Dringlichkeit</Label>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("urgency", opt.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deceased.firstName" className="text-xs font-medium text-stone-500 mb-1 block">
                Vorname Verstorbene/r
              </Label>
              <Input
                id="deceased.firstName"
                className="w-full p-3 border border-stone-300 rounded-xl"
                {...register("deceased.firstName")}
                aria-invalid={!!errors.deceased?.firstName}
              />
              {errors.deceased?.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.deceased.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="deceased.lastName" className="text-xs font-medium text-stone-500 mb-1 block">
                Nachname Verstorbene/r
              </Label>
              <Input
                id="deceased.lastName"
                className="w-full p-3 border border-stone-300 rounded-xl"
                {...register("deceased.lastName")}
                aria-invalid={!!errors.deceased?.lastName}
              />
              {errors.deceased?.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.deceased.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deceased.deathPlace" className="text-xs font-medium text-stone-500 mb-1 block">
                Sterbeort
              </Label>
              <Input
                id="deceased.deathPlace"
                className="w-full p-3 border border-stone-300 rounded-xl"
                placeholder="z.B. Bonn"
                {...register("deceased.deathPlace")}
              />
            </div>
            <div>
              <Label htmlFor="deceased.deathDate" className="text-xs font-medium text-stone-500 mb-1 block">
                Sterbedatum
              </Label>
              <Input
                id="deceased.deathDate"
                type="date"
                className="w-full p-3 border border-stone-300 rounded-xl"
                {...register("deceased.deathDate")}
              />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-3">Ihre Kontaktdaten</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact.firstName" className="text-xs font-medium text-stone-500 mb-1 block">
                  Vorname
                </Label>
                <Input
                  id="contact.firstName"
                  autoComplete="given-name"
                  className="w-full p-3 border border-stone-300 rounded-xl"
                  {...register("contact.firstName")}
                  aria-invalid={!!errors.contact?.firstName}
                />
                {errors.contact?.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contact.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contact.lastName" className="text-xs font-medium text-stone-500 mb-1 block">
                  Nachname
                </Label>
                <Input
                  id="contact.lastName"
                  autoComplete="family-name"
                  className="w-full p-3 border border-stone-300 rounded-xl"
                  {...register("contact.lastName")}
                  aria-invalid={!!errors.contact?.lastName}
                />
                {errors.contact?.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contact.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="contact.phone" className="text-xs font-medium text-stone-500 mb-1 block">
                Telefon
              </Label>
              <Input
                id="contact.phone"
                type="tel"
                autoComplete="tel"
                className="w-full p-3 border border-stone-300 rounded-xl"
                {...register("contact.phone")}
                aria-invalid={!!errors.contact?.phone}
              />
              {errors.contact?.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.phone.message}</p>
              )}
            </div>
            <div className="mt-4">
              <Label htmlFor="contact.email" className="text-xs font-medium text-stone-500 mb-1 block">
                E-Mail
              </Label>
              <Input
                id="contact.email"
                type="email"
                autoComplete="email"
                className="w-full p-3 border border-stone-300 rounded-xl"
                {...register("contact.email")}
                aria-invalid={!!errors.contact?.email}
              />
              {errors.contact?.email && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.email.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-900 text-white py-3 rounded-full hover:bg-emerald-950 disabled:bg-stone-400"
          >
            <Send size={18} className="mr-2 inline" /> {isSubmitting ? "Wird gesendet..." : "Anfrage absenden"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
