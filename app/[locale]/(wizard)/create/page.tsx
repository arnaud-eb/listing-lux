"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhotoUploader from "@/components/create/PhotoUploader";
import StepperInput from "@/components/create/StepperInput";
import FeatureChips from "@/components/create/FeatureChips";
import NeighborhoodSelector from "@/components/create/NeighborhoodSelector";
import GenerateBar from "@/components/create/GenerateBar";
import { saveProperty } from "./actions";
import { usePropertyForm } from "./use-property-form";
import { propertyFormSchema } from "@/lib/schemas/property";
import { CPE_CLASSES, type CpeClass } from "@/lib/constants";
import { RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

/** Block non-numeric keys that HTML number inputs allow (e, E, +, -) */
function blockNonNumeric(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
}

export default function CreatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const t = useTranslations("wizard.create");

  const {
    form,
    updateField,
    updateFeatures,
    photos,
    readyPhotoCount,
    inFlightPhotoCount,
    hasRequiredFields,
    canGenerate,
    handleAddPhotos,
    handleRemovePhoto,
    handleUpdatePhotoRoomType,
    reset,
    toFormData,
    clearDraft,
  } = usePropertyForm();

  // Dirty check: has the user entered anything worth protecting?
  const isDirty =
    photos.length > 0 ||
    form.sqm !== "" ||
    form.price !== "" ||
    form.neighborhood !== "" ||
    form.address !== "" ||
    Object.values(form.features).some(Boolean);

  function handleResetClick() {
    if (isDirty) {
      setResetConfirmOpen(true);
    } else {
      reset();
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canGenerate) return;

    const data = toFormData();

    // Client-side Zod validation
    const result = propertyFormSchema.safeParse(data);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      const firstError = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`)
        .at(0);
      toast.error(firstError ?? t("validationError"));
      return;
    }

    startTransition(async () => {
      const { id } = await saveProperty(result.data);
      clearDraft();
      router.push(`/listing/${id}`);
    });
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="container mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8 relative">
          <h1 className="font-serif text-3xl font-bold text-navy-deep">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetClick}
            className="text-gray-400 hover:text-red-500 hover:bg-gray-50 border-gray-200 shadow-none mt-3 lg:absolute lg:right-0 lg:top-2"
          >
            <RotateCcw className="size-3" />
            {t("startOver")}
          </Button>
        </div>

        <ConfirmDeleteDialog
          open={resetConfirmOpen}
          onOpenChange={setResetConfirmOpen}
          onConfirm={() => {
            reset();
            setResetConfirmOpen(false);
          }}
          title={t("startOverDialogTitle")}
          description={t("startOverDialogDescription")}
          confirmLabel={t("startOver")}
        />

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">
            {/* Left column: Photos */}
            <div className="sticky top-28 max-lg:static">
              <PhotoUploader
                photos={photos}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
                onUpdateRoomType={handleUpdatePhotoRoomType}
              />
            </div>

            {/* Right column: Form */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-navy-deep mb-6">
                  {t("propertyDetails")}
                </h2>

                <div className="flex flex-col gap-5">
                  {/* Bedrooms & Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <StepperInput
                      id="bedrooms"
                      label={t("bedroomsLabel")}
                      value={form.bedrooms}
                      onChange={(v) => updateField("bedrooms", v)}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <StepperInput
                      id="bathrooms"
                      label={t("bathroomsLabel")}
                      value={form.bathrooms}
                      onChange={(v) => updateField("bathrooms", v)}
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>

                  {/* Size */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sqm">
                      {t("sizeLabel")}{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="sqm"
                      type="number"
                      placeholder={t("sizePlaceholder")}
                      value={form.sqm}
                      onChange={(e) =>
                        updateField(
                          "sqm",
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      onKeyDown={blockNonNumeric}
                      min={1}
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="asking-eur">
                      {t("priceLabel")}{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="asking-eur"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("pricePlaceholder")}
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      value={formatNumber(form.price)}
                      onChange={(e) =>
                        updateField("price", parseFormattedNumber(e.target.value))
                      }
                      required
                    />
                  </div>

                  {/* Neighborhood */}
                  <NeighborhoodSelector
                    value={form.neighborhood}
                    onChange={(v) => updateField("neighborhood", v)}
                    sqm={typeof form.sqm === "number" ? form.sqm : 0}
                  />

                  {/* Address (optional) */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="address">{t("addressLabel")}</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder={t("addressPlaceholder")}
                      value={form.address ?? ""}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                    <p className="text-2xs text-gray-400">
                      {t("addressHelper")}
                    </p>
                  </div>

                  {/* Energy passport (CPE) — optional. Pre-fills from a CPE certificate
                      photo if one was uploaded; agent can override. Stacks on mobile —
                      the labels "Thermal insulation class" / "Classe d'isolation thermique"
                      are too long for a 360px-wide column and the placeholders bleed
                      across each other. Each Select gets a trailing X (clear) when a
                      value is selected, since Radix Select disallows a `<SelectItem
                      value="">` for "no selection". */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ClearableClassSelect
                      id="cpe-class"
                      label={t("cpeClassLabel")}
                      placeholder={t("cpeClassPlaceholder")}
                      value={form.cpeClass}
                      onChange={(v) => updateField("cpeClass", v)}
                      clearLabel={t("cpeClassClear")}
                    />
                    <ClearableClassSelect
                      id="thermal-class"
                      label={t("thermalClassLabel")}
                      placeholder={t("thermalClassPlaceholder")}
                      value={form.thermalInsulationClass}
                      onChange={(v) =>
                        updateField("thermalInsulationClass", v)
                      }
                      clearLabel={t("thermalClassClear")}
                    />
                  </div>

                  {/* Features */}
                  <FeatureChips
                    features={form.features}
                    onChange={updateFeatures}
                  />
                </div>
              </div>

              {/* Generate bar — submit button lives here */}
              <GenerateBar
                readyPhotoCount={readyPhotoCount}
                inFlightPhotoCount={inFlightPhotoCount}
                hasRequiredFields={hasRequiredFields}
                isLoading={isPending}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Optional CPE-class Select with an inline X button to clear the value. Sits inside
 * the SelectTrigger area; its `pointerDown` is stopped so Radix Select doesn't open.
 */
interface ClearableClassSelectProps {
  id: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  value: CpeClass | "";
  onChange: (next: CpeClass | "") => void;
}

function ClearableClassSelect({
  id,
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
}: ClearableClassSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Select
          value={value || undefined}
          onValueChange={(v) => onChange(v as CpeClass)}
        >
          <SelectTrigger
            id={id}
            // Reserve right-side space when clear is visible (X + chevron).
            className={value ? "h-10 pr-14" : "h-10"}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {CPE_CLASSES.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <button
            type="button"
            aria-label={clearLabel}
            // Radix Select listens on pointerDown — stop here so clearing
            // doesn't simultaneously open the dropdown.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange("")}
            className="absolute right-8 top-1/2 -translate-y-1/2 size-6 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
