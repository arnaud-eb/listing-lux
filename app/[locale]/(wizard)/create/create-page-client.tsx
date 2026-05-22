"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhotoUploader from "@/components/create/PhotoUploader";
import StepperInput from "@/components/create/StepperInput";
import FeatureChips from "@/components/create/FeatureChips";
import LocalitySelector from "@/components/create/LocalitySelector";
import type { LocalityOption } from "@/lib/localities/types";
import GenerateBar from "@/components/create/GenerateBar";
import ListingKindToggle from "@/components/create/ListingKindToggle";
import ClearableClassSelect from "@/components/create/ClearableClassSelect";
import NumberField from "@/components/create/NumberField";
import { saveProperty } from "./actions";
import { usePropertyForm, isFormDirty } from "./use-property-form";
import { propertyFormSchema } from "@/lib/schemas/property";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

function blockNonNumeric(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
}

interface CreatePageClientProps {
  /** Server-fetched dropdown options (lib/localities listForDropdown). Raw
   *  nameLocalized so the cmdk filter matches across all locales. */
  localityOptions: LocalityOption[];
}

export default function CreatePageClient({ localityOptions }: CreatePageClientProps) {
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

  const isDirty = isFormDirty(form);
  const todayIso = new Date().toISOString().slice(0, 10);
  const availabilityInPast =
    form.listingKind === "rent" &&
    form.availabilityDate !== "" &&
    form.availabilityDate < todayIso;

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
    if (availabilityInPast) {
      toast.error(t("availabilityDatePastError"));
      return;
    }

    const data = toFormData();

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
            <div className="sticky top-28 max-lg:static">
              <PhotoUploader
                photos={photos}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
                onUpdateRoomType={handleUpdatePhotoRoomType}
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-navy-deep mb-6">
                  {t("essentialsTitle")}
                </h2>

                <div className="flex flex-col gap-5">
                  <ListingKindToggle
                    value={form.listingKind}
                    onChange={(v) => updateField("listingKind", v)}
                    label={t("listingKindLabel")}
                    saleLabel={t("listingKindSale")}
                    rentLabel={t("listingKindRent")}
                  />

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="sqm">{t("sizeLabel")}</Label>
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
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="asking-eur">
                        {form.listingKind === "rent"
                          ? t("rentPriceLabel")
                          : t("priceLabel")}
                      </Label>
                      <Input
                        id="asking-eur"
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          form.listingKind === "rent"
                            ? t("rentPricePlaceholder")
                            : t("pricePlaceholder")
                        }
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        value={formatNumber(form.price)}
                        onChange={(e) =>
                          updateField(
                            "price",
                            parseFormattedNumber(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="charges-monthly">
                        {t("chargesMonthlyLabel")}
                      </Label>
                      <Input
                        id="charges-monthly"
                        type="text"
                        inputMode="numeric"
                        placeholder={t("chargesMonthlyPlaceholder")}
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        value={formatNumber(form.chargesMonthly)}
                        onChange={(e) =>
                          updateField(
                            "chargesMonthly",
                            parseFormattedNumber(e.target.value),
                          )
                        }
                      />
                    </div>

                    {form.listingKind === "rent" && (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="availability-date">
                          {t("availabilityDateLabel")}
                        </Label>
                        <Input
                          id="availability-date"
                          type="date"
                          min={todayIso}
                          value={form.availabilityDate}
                          onChange={(e) =>
                            updateField("availabilityDate", e.target.value)
                          }
                          aria-invalid={availabilityInPast || undefined}
                          aria-describedby={
                            availabilityInPast
                              ? "availability-date-error"
                              : undefined
                          }
                        />
                        {availabilityInPast && (
                          <p
                            id="availability-date-error"
                            className="text-2xs text-red-500"
                            role="alert"
                          >
                            {t("availabilityDatePastError")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <LocalitySelector
                    value={form.neighborhood}
                    onChange={(v) => updateField("neighborhood", v)}
                    options={localityOptions}
                    sqm={typeof form.sqm === "number" ? form.sqm : 0}
                    propertyType={form.propertyType}
                    listingKind={form.listingKind}
                  />

                  <FeatureChips
                    features={form.features}
                    onChange={updateFeatures}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-navy-deep mb-1 flex items-baseline gap-2">
                  {t("moreDetailsTitle")}
                  <span className="text-xs font-normal text-gray-500">
                    {t("moreDetailsHint")}
                  </span>
                </h2>

                <div className="flex flex-col gap-5 mt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <NumberField
                      id="year-built"
                      label={t("yearBuiltLabel")}
                      placeholder={t("yearBuiltPlaceholder")}
                      value={form.yearBuilt}
                      onChange={(v) => updateField("yearBuilt", v)}
                      min={1800}
                      max={2100}
                    />
                    <NumberField
                      id="floors-total"
                      label={t("floorsTotalLabel")}
                      placeholder={t("floorsTotalPlaceholder")}
                      value={form.floorsTotal}
                      onChange={(v) => updateField("floorsTotal", v)}
                      min={1}
                    />
                    <NumberField
                      id="floor-of-unit"
                      label={t("floorOfUnitLabel")}
                      placeholder={t("floorOfUnitPlaceholder")}
                      value={form.floorOfUnit}
                      onChange={(v) => updateField("floorOfUnit", v)}
                      allowNegative
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ClearableClassSelect
                      id="cpe-class"
                      label={t("cpeClassLabel")}
                      placeholder={t("cpeClassPlaceholder")}
                      value={form.cpeClass}
                      onChange={(v) => updateField("cpeClass", v)}
                      clearLabel={t("cpeClassNone")}
                    />
                    <ClearableClassSelect
                      id="thermal-class"
                      label={t("thermalClassLabel")}
                      placeholder={t("thermalClassPlaceholder")}
                      value={form.thermalInsulationClass}
                      onChange={(v) => updateField("thermalInsulationClass", v)}
                      clearLabel={t("thermalClassNone")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="address">{t("addressLabel")}</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder={t("addressPlaceholder")}
                      value={form.address ?? ""}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                    <p className="text-2xs text-gray-500">
                      {t("addressHelper")}
                    </p>
                  </div>
                </div>
              </div>

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
