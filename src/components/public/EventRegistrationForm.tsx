"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { registerForEvent } from "@/app/actions/events";
import {
  eventRegistrationSchema,
  type EventRegistrationFormData,
} from "@/lib/validations/event-registration";
import type { EventInstance } from "@/lib/recurrence";

const defaultValues: EventRegistrationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

function formatEventLabel(inst: EventInstance): string {
  const start = new Date(inst.startAt);
  return start.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type EventRegistrationFormProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  instance: EventInstance;
};

export function EventRegistrationForm({
  open,
  onOpenChange,
  instance,
}: EventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventRegistrationFormData>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues,
  });

  const submitForm = async (data: EventRegistrationFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerForEvent(
        instance.eventId,
        instance.startAt,
        data
      );

      if (result.success) {
        onOpenChange(false);
        reset(defaultValues);
        setSuccess(true);
      } else {
        alert(`Es gab einen Fehler beim Anmelden:\n${result.error}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error registering for event:", error);
      alert(
        `Es gab einen Fehler beim Anmelden:\n${err?.message || "Unbekannter Fehler"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-md md:max-w-lg max-h-[min(90dvh,90vh)] flex flex-col overflow-hidden bg-stone-50 rounded-2xl sm:rounded-4xl border-0 gap-0 p-0">
          <DialogHeader className="p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] border-b border-stone-200 bg-white shrink-0">
            <DialogTitle className="text-xl font-serif text-emerald-900">
              Anmelden
            </DialogTitle>
            <p className="text-sm text-stone-500 mt-1">
              {instance.event.name} – {formatEventLabel(instance)}
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(submitForm)}
            autoComplete="on"
            className="flex flex-col min-h-0 flex-1 overflow-hidden"
          >
            <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="reg-firstname"
                    className="text-xs font-medium text-stone-500 mb-1 block"
                  >
                    Vorname
                  </Label>
                  <Input
                    id="reg-firstname"
                    autoComplete="section-registration given-name"
                    className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                    {...register("firstName")}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="reg-lastname"
                    className="text-xs font-medium text-stone-500 mb-1 block"
                  >
                    Nachname
                  </Label>
                  <Input
                    id="reg-lastname"
                    autoComplete="section-registration family-name"
                    className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                    {...register("lastName")}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="reg-email"
                  className="text-xs font-medium text-stone-500 mb-1 block"
                >
                  E-Mail
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="section-registration email"
                  className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="reg-phone"
                  className="text-xs font-medium text-stone-500 mb-1 block"
                >
                  Telefon (optional)
                </Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  autoComplete="section-registration tel"
                  className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                  {...register("phone")}
                />
              </div>

              <div>
                <Label
                  htmlFor="reg-notes"
                  className="text-xs font-medium text-stone-500 mb-1 block"
                >
                  Nachricht (optional)
                </Label>
                <textarea
                  id="reg-notes"
                  rows={3}
                  autoComplete="section-registration off"
                  className="w-full p-3 border border-stone-300 rounded-xl text-base resize-y min-h-[80px]"
                  placeholder="Anmerkungen oder Fragen..."
                  {...register("notes")}
                  aria-invalid={!!errors.notes}
                />
                {errors.notes && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 p-4 sm:p-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-stone-200 bg-white rounded-b-2xl sm:rounded-b-4xl">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] bg-emerald-900 text-white py-3 rounded-full hover:bg-emerald-950 disabled:bg-stone-400 touch-manipulation"
              >
                <Send size={18} className="mr-2 inline" />{" "}
                {isSubmitting ? "Wird gesendet..." : "Anmelden"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={success} onOpenChange={(o) => !o && setSuccess(false)}>
        <DialogContent className="max-w-md bg-stone-50 rounded-2xl sm:rounded-4xl border-0 gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 sm:p-8 border-b border-stone-200 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle
                className="w-10 h-10 text-emerald-600 shrink-0"
                aria-hidden
              />
              <DialogTitle className="text-xl font-serif text-emerald-900">
                Ihre Anmeldung wurde übermittelt
              </DialogTitle>
            </div>
            <p className="text-sm text-stone-600 mt-2">
              Sie erhalten eine Bestätigung per E-Mail.
            </p>
          </DialogHeader>
          <div className="p-6 sm:p-8">
            <Button
              type="button"
              onClick={() => setSuccess(false)}
              className="w-full bg-emerald-900 text-white hover:bg-emerald-950"
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
