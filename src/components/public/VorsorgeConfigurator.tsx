"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { createVorsorgeCaseAction } from "@/app/actions/cases";
import { getLeistungenGroupedByCategory } from "@/app/actions/leistungen";
import { vorsorgeConfigSchema, type VorsorgeConfigFormData } from "@/lib/validations/vorsorge";
import { computeLeistungPrice, formatLeistungPriceDisplay } from "@/lib/leistung-price";
import { FormSuccessModal } from "@/components/public/FormSuccessModal";
import { LeistungHoverCard } from "@/components/public/LeistungHoverCard";
import type { Leistung } from "@/types";

const BASE_FEE = 1850;

const defaultValues: VorsorgeConfigFormData = {
  selectedLeistungen: [],
  contact: { firstName: "", lastName: "", email: "" },
};

export function VorsorgeConfigurator({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    familyPin: string;
    summary?: string;
  } | null>(null);
  const [grouped, setGrouped] = useState<
    { category: { id: string; name: string; description: string | null }; leistungen: Leistung[] }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const loadLeistungen = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeistungenGroupedByCategory({ isPublic: true });
      setGrouped(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadLeistungen();
  }, [open, loadLeistungen]);

  const {
    watch,
    setValue,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VorsorgeConfigFormData>({
    resolver: zodResolver(vorsorgeConfigSchema),
    defaultValues,
  });

  const config = watch();
  const selectedLeistungen = config.selectedLeistungen ?? [];

  const totalSteps = grouped.length + 1;
  const currentCategory = step <= grouped.length ? grouped[step - 1] : null;

  const getQuantity = (leistungId: string) =>
    selectedLeistungen.find((s) => s.leistungId === leistungId)?.quantity ?? 1;

  const setQuantity = (leistungId: string, quantity: number) => {
    const next = selectedLeistungen.map((s) =>
      s.leistungId === leistungId ? { ...s, quantity: Math.max(1, quantity) } : s
    );
    const existing = next.find((s) => s.leistungId === leistungId);
    if (!existing) {
      next.push({ leistungId, quantity: Math.max(1, quantity) });
    } else if (existing.quantity !== quantity) {
      const idx = next.findIndex((s) => s.leistungId === leistungId);
      next[idx] = { ...next[idx]!, quantity: Math.max(1, quantity) };
    }
    setValue("selectedLeistungen", next);
  };

  const isSelected = (leistungId: string) =>
    selectedLeistungen.some((s) => s.leistungId === leistungId);

  const toggleMainSelection = (categoryId: string, leistungId: string) => {
    const parents = (currentCategory?.leistungen ?? []).filter((l) => !l.parentId);
    const otherParentIds = parents.filter((l) => l.id !== leistungId).map((l) => l.id);
    const next = selectedLeistungen.filter(
      (s) => !otherParentIds.includes(s.leistungId)
    );
    if (isSelected(leistungId)) {
      const childIds = (currentCategory?.leistungen ?? [])
        .filter((l) => l.parentId === leistungId)
        .map((l) => l.id);
      setValue(
        "selectedLeistungen",
        next.filter((s) => !childIds.includes(s.leistungId) && s.leistungId !== leistungId)
      );
    } else {
      const idx = next.findIndex((s) => s.leistungId === leistungId);
      if (idx >= 0) return;
      setValue("selectedLeistungen", [...next, { leistungId, quantity: 1 }]);
    }
  };

  const toggleChildSelection = (leistungId: string) => {
    if (isSelected(leistungId)) {
      setValue(
        "selectedLeistungen",
        selectedLeistungen.filter((s) => s.leistungId !== leistungId)
      );
    } else {
      setValue("selectedLeistungen", [
        ...selectedLeistungen,
        { leistungId, quantity: 1 },
      ]);
    }
  };

  const selectedLeistungRecords = selectedLeistungen.flatMap((s) => {
    const l = grouped.flatMap((g) => g.leistungen).find((l) => l.id === s.leistungId);
    return l ? [{ leistung: l, quantity: s.quantity }] : [];
  });

  const estimatedPrice =
    BASE_FEE +
    selectedLeistungRecords.reduce((sum, { leistung, quantity }) => {
      const cents = computeLeistungPrice(leistung, quantity);
      return sum + (cents ?? 0) / 100;
    }, 0);

  const getSelectedMainForCategory = (categoryId: string) => {
    const cat = grouped.find((g) => g.category.id === categoryId);
    if (!cat) return undefined;
    const parents = cat.leistungen.filter((l) => !l.parentId);
    return parents.find((p) => isSelected(p.id))?.id;
  };

  const canProceed = true;

  const selectedLeistungenFiltered = selectedLeistungen.filter((s) =>
    /^[0-9a-f-]{36}$/i.test(s.leistungId)
  );

  const submitForm = async (data: VorsorgeConfigFormData) => {
    const payload: VorsorgeConfigFormData = {
      ...data,
      selectedLeistungen: selectedLeistungenFiltered,
    };
    setIsSubmitting(true);
    try {
      const result = await createVorsorgeCaseAction(payload, estimatedPrice);
      if (result.success) {
        onOpenChange(false);
        setStep(1);
        reset(defaultValues);
        setSuccessData({ familyPin: result.familyPin, summary: undefined });
      } else {
        alert(
          `Es gab einen Fehler beim Absenden:\n${result.error}\nBitte stellen Sie sicher, dass das SQL-Schema in Supabase ausgeführt wurde.`
        );
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error inserting case:", error);
      alert(
        `Es gab einen Fehler beim Absenden:\n${err?.message || "Unbekannter Fehler"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionCard = ({
    leistung,
    selected,
    onClick,
    isChild,
  }: {
    leistung: Leistung;
    selected: boolean;
    onClick: () => void;
    isChild?: boolean;
  }) => {
    const priceDisplay = formatLeistungPriceDisplay(leistung, getQuantity(leistung.id));
    const isPerUnit = leistung.priceType === "per_unit";

    return (
      <LeistungHoverCard leistung={leistung} side="top">
        <div
          onClick={!isChild ? onClick : undefined}
          role={!isChild ? "button" : undefined}
          tabIndex={!isChild ? -1 : undefined}
          aria-pressed={!isChild ? selected : undefined}
          aria-label={
            !isChild
              ? `${leistung.title}, ${priceDisplay}`
              : undefined
          }
          onKeyDown={
            !isChild
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                  }
                }
              : undefined
          }
          className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col min-h-[72px] sm:min-h-0 sm:h-full min-w-0 transition-all touch-manipulation active:scale-[0.98] select-none ${
            selected
              ? "border-emerald-900 bg-stone-50"
              : "border-stone-200 bg-white hover:border-stone-300 active:bg-stone-50 shadow-sm"
          } ${isChild ? "" : "cursor-pointer"}`}
        >
          {isChild ? (
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected}
                onCheckedChange={() => toggleChildSelection(leistung.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-stone-800">{leistung.title}</h4>
                <p className="text-xs text-stone-500 mt-1">
                  {leistung.description ?? "—"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {isPerUnit && selected ? (
                    <>
                      <Input
                        type="number"
                        min={1}
                        value={getQuantity(leistung.id)}
                        onChange={(e) =>
                          setQuantity(
                            leistung.id,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-20 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm text-stone-600">
                        {leistung.unitLabel ?? "Stück"}
                      </span>
                    </>
                  ) : null}
                  <span className="text-sm font-bold text-stone-700 bg-stone-100 px-2 py-1 rounded">
                    +{priceDisplay}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                onClick={onClick}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2 gap-3 min-w-0">
                  <h4
                    className={`font-medium leading-snug wrap-break-word min-w-0 flex-1 ${
                      selected ? "text-emerald-900" : "text-stone-800"
                    }`}
                  >
                    {leistung.title}
                  </h4>
                  {selected && (
                    <CheckCircle
                      size={20}
                      className="text-emerald-900 shrink-0 mt-0.5"
                    />
                  )}
                </div>
                <p className="text-xs text-stone-500 mb-4 flex-1 min-w-0 wrap-break-word">
                  {leistung.description ?? "—"}
                </p>
              </div>
              <div className="mt-auto shrink-0">
                <span className="text-sm font-bold text-stone-700 bg-stone-100 px-2 py-1 rounded inline-block whitespace-nowrap">
                  +{priceDisplay}
                </span>
              </div>
            </>
          )}
        </div>
      </LeistungHoverCard>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-auto sm:max-w-2xl md:max-w-4xl p-0 overflow-hidden bg-stone-50 rounded-2xl sm:rounded-4xl border-0 gap-0 flex flex-col h-[95dvh] sm:h-auto sm:max-h-[min(90vh,100dvh)]">
          <DialogHeader className="p-4 sm:p-6 border-b border-stone-200 bg-white shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
            <DialogTitle className="text-2xl font-serif text-emerald-900">
              Vorsorge Konfigurator
            </DialogTitle>
            <p className="text-sm text-stone-500 mt-1">
              Schritt {step} von {totalSteps}
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(submitForm)}
            autoComplete="on"
            className="flex flex-col min-h-0 flex-1 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row min-h-0 flex-1 overflow-hidden">
              <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden min-h-0 flex-1 overscroll-contain">
                {loading ? (
                  <div className="flex justify-center items-center py-16 text-stone-500">
                    Lade Optionen...
                  </div>
                ) : (
                  <>
                    {currentCategory && step <= grouped.length && (
                      <div className="space-y-6 animate-in slide-in-from-right-4">
                        <h3 className="text-xl font-medium text-stone-800 mb-6">
                          {currentCategory.category.name}
                        </h3>
                        <div className="space-y-4">
                          {currentCategory.leistungen
                            .filter((l) => !l.parentId)
                            .map((l) => (
                              <div key={l.id} className="space-y-3">
                                <OptionCard
                                  leistung={l}
                                  selected={isSelected(l.id)}
                                  onClick={() =>
                                    toggleMainSelection(
                                      currentCategory.category.id,
                                      l.id
                                    )
                                  }
                                />
                                {currentCategory.leistungen
                                  .filter((c) => c.parentId === l.id)
                                  .map((child) => (
                                    <div
                                      key={child.id}
                                      className="ml-4 pl-4 border-l-2 border-stone-200"
                                    >
                                      <OptionCard
                                        leistung={child}
                                        selected={isSelected(child.id)}
                                        onClick={() =>
                                          toggleChildSelection(child.id)
                                        }
                                        isChild
                                      />
                                    </div>
                                  ))}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {step === totalSteps && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 min-w-0">
                        <h3 className="text-xl font-medium text-stone-800 mb-2">
                          Ihre Konfiguration
                        </h3>
                        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 mb-6 min-w-0">
                          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4 min-w-0">
                            <div>
                              <Label
                                htmlFor="vorsorge-firstname"
                                className="text-xs font-medium text-stone-500 mb-1"
                              >
                                Vorname
                              </Label>
                              <Input
                                id="vorsorge-firstname"
                                autoComplete="section-vorsorge given-name"
                                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                                {...register("contact.firstName")}
                                aria-invalid={!!errors.contact?.firstName}
                              />
                              {errors.contact?.firstName && (
                                <p className="text-xs text-red-600 mt-1">
                                  {
                                    errors.contact.firstName.message
                                  }
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor="vorsorge-lastname"
                                className="block text-xs font-medium text-stone-500 mb-1"
                              >
                                Nachname
                              </Label>
                              <Input
                                id="vorsorge-lastname"
                                autoComplete="section-vorsorge family-name"
                                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                                {...register("contact.lastName")}
                                aria-invalid={!!errors.contact?.lastName}
                              />
                              {errors.contact?.lastName && (
                                <p className="text-xs text-red-600 mt-1">
                                  {
                                    errors.contact.lastName.message
                                  }
                                </p>
                              )}
                            </div>
                            <div className="min-[360px]:col-span-2">
                              <Label
                                htmlFor="vorsorge-email"
                                className="block text-xs font-medium text-stone-500 mb-1"
                              >
                                E-Mail Adresse
                              </Label>
                              <Input
                                id="vorsorge-email"
                                type="email"
                                inputMode="email"
                                autoComplete="section-vorsorge email"
                                className="w-full p-3 text-base border border-stone-300 rounded-xl min-h-[44px]"
                                {...register("contact.email")}
                                aria-invalid={!!errors.contact?.email}
                              />
                              {errors.contact?.email && (
                                <p className="text-xs text-red-600 mt-1">
                                  {errors.contact.email.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="w-full md:w-1/3 bg-stone-100 border-t md:border-t-0 md:border-l border-stone-200 p-4 sm:p-6 flex flex-col justify-between min-w-0 shrink-0">
                <div className="min-w-0">
                  <h3 className="font-serif text-xl text-emerald-900 mb-4 sm:mb-6">
                    Kostenschätzung
                  </h3>
                  <div className="space-y-4 text-sm text-stone-600 border-b border-stone-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
                    <div className="flex justify-between gap-2 sm:gap-4 min-w-0">
                      <span className="shrink-0">
                        Basis (Beratung + Abholung)
                      </span>
                      <span className="font-medium shrink-0">
                        {BASE_FEE.toLocaleString("de-DE")} €
                      </span>
                    </div>
                    {selectedLeistungRecords.map(({ leistung, quantity }) => {
                      const cents = computeLeistungPrice(leistung, quantity);
                      const display =
                        cents != null
                          ? `+${(cents / 100).toLocaleString("de-DE")} €`
                          : "auf Anfrage";
                      return (
                        <div
                          key={leistung.id}
                          className="flex justify-between gap-2 sm:gap-4 min-w-0"
                        >
                          <span
                            className="truncate min-w-0"
                            title={leistung.title}
                          >
                            {leistung.title}
                            {quantity > 1 && leistung.priceType === "per_unit"
                              ? ` × ${quantity}`
                              : ""}
                          </span>
                          <span className="font-medium shrink-0">
                            {display}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-end gap-2 min-w-0">
                    <span className="text-stone-800 font-medium shrink-0">
                      Summe (ca.)*
                    </span>
                    <span className="text-xl sm:text-2xl font-serif text-emerald-900 font-bold shrink-0 text-right">
                      {estimatedPrice.toLocaleString("de-DE")} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-stone-200 bg-white rounded-b-2xl sm:rounded-b-4xl flex justify-between items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 text-stone-600 min-h-[44px] min-w-[44px] touch-manipulation -ml-2"
                >
                  <ChevronLeft size={16} /> Zurück
                </Button>
              ) : (
                <div />
              )}
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed}
                  className="bg-emerald-900 text-white px-6 py-3 min-h-[44px] rounded-full hover:bg-emerald-950 active:scale-[0.98] touch-manipulation flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-900 text-white px-6 py-3 min-h-[44px] rounded-full hover:bg-emerald-950 disabled:bg-stone-400 active:scale-[0.98] touch-manipulation flex-1 sm:flex-initial justify-center"
                >
                  <Send size={18} className="mr-2" />{" "}
                  {isSubmitting
                    ? "Wird gesendet..."
                    : "Unverbindlich anfragen"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <FormSuccessModal
        open={!!successData}
        onOpenChange={(o) => !o && setSuccessData(null)}
        familyPin={successData?.familyPin ?? ""}
        summary={successData?.summary}
        caseType="vorsorge"
      />
    </>
  );
}
