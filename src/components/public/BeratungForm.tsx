"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { createBeratungCaseAction } from "@/app/actions/cases";
import { beratungConfigSchema, type BeratungConfigFormData } from "@/lib/validations/beratung";
import { FormSuccessModal } from "@/components/public/FormSuccessModal";

const defaultValues: BeratungConfigFormData = {
  contact: { firstName: "", lastName: "", email: "", phone: "" },
  message: "",
};

export function BeratungForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ familyPin: string; summary?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BeratungConfigFormData>({
    resolver: zodResolver(beratungConfigSchema),
    defaultValues,
  });

  const submitForm = async (data: BeratungConfigFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createBeratungCaseAction(data);

      if (result.success) {
        onOpenChange(false);
        reset(defaultValues);
        setSuccessData({
          familyPin: result.familyPin,
          summary: "Beratungsanfrage",
        });
      } else {
        alert(`Es gab einen Fehler beim Absenden:\n${result.error}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error inserting beratung case:", error);
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
          <DialogTitle className="text-xl font-serif text-emerald-900">Beratung anfragen</DialogTitle>
          <p className="text-sm text-stone-500 mt-1">Wir melden uns zeitnah bei Ihnen.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} autoComplete="on" className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="beratung-firstname" className="text-xs font-medium text-stone-500 mb-1 block">
                Vorname
              </Label>
              <Input
                id="beratung-firstname"
                autoComplete="section-beratung given-name"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("contact.firstName")}
                aria-invalid={!!errors.contact?.firstName}
              />
              {errors.contact?.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="beratung-lastname" className="text-xs font-medium text-stone-500 mb-1 block">
                Nachname
              </Label>
              <Input
                id="beratung-lastname"
                autoComplete="section-beratung family-name"
                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                {...register("contact.lastName")}
                aria-invalid={!!errors.contact?.lastName}
              />
              {errors.contact?.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.contact.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="beratung-email" className="text-xs font-medium text-stone-500 mb-1 block">
              E-Mail
            </Label>
            <Input
              id="beratung-email"
              type="email"
              autoComplete="section-beratung email"
              className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
              {...register("contact.email")}
              aria-invalid={!!errors.contact?.email}
            />
            {errors.contact?.email && (
              <p className="text-xs text-red-600 mt-1">{errors.contact.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="beratung-phone" className="text-xs font-medium text-stone-500 mb-1 block">
              Telefon (optional)
            </Label>
            <Input
              id="beratung-phone"
              type="tel"
              autoComplete="section-beratung tel"
              className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
              {...register("contact.phone")}
            />
          </div>

          <div>
            <Label htmlFor="beratung-message" className="text-xs font-medium text-stone-500 mb-1 block">
              Ihr Anliegen
            </Label>
            <textarea
              id="beratung-message"
              rows={4}
              autoComplete="section-beratung off"
              className="w-full p-3 border border-stone-300 rounded-xl text-base resize-y min-h-[100px]"
              placeholder="Bitte beschreiben Sie kurz Ihr Anliegen..."
              {...register("message")}
              aria-invalid={!!errors.message}
            />
            {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
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
      caseType="beratung"
    />
    </>
  );
}
