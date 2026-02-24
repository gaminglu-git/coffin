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

const defaultValues: BeratungConfigFormData = {
  contact: { firstName: "", lastName: "", email: "", phone: "" },
  message: "",
};

export function BeratungForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        alert(`Ihre Anfrage wurde sicher an uns übermittelt.\nIhre Familien-PIN für das Portal ist: ${result.familyPin}`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md p-0 overflow-hidden bg-stone-50 rounded-2xl border-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 border-b border-stone-200 bg-white">
          <DialogTitle className="text-xl font-serif text-emerald-900">Beratung anfragen</DialogTitle>
          <p className="text-sm text-stone-500 mt-1">Wir melden uns zeitnah bei Ihnen.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="p-4 sm:p-6 space-y-4">
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

          <div>
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

          <div>
            <Label htmlFor="contact.phone" className="text-xs font-medium text-stone-500 mb-1 block">
              Telefon (optional)
            </Label>
            <Input
              id="contact.phone"
              type="tel"
              autoComplete="tel"
              className="w-full p-3 border border-stone-300 rounded-xl"
              {...register("contact.phone")}
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-xs font-medium text-stone-500 mb-1 block">
              Ihr Anliegen
            </Label>
            <textarea
              id="message"
              rows={4}
              className="w-full p-3 border border-stone-300 rounded-xl text-base resize-y min-h-[100px]"
              placeholder="Bitte beschreiben Sie kurz Ihr Anliegen..."
              {...register("message")}
              aria-invalid={!!errors.message}
            />
            {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
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
