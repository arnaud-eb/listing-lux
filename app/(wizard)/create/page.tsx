"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
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
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

/** Block non-numeric keys that HTML number inputs allow (e, E, +, -) */
function blockNonNumeric(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
}


const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
  { value: "villa", label: "Villa" },
];

export default function CreatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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
      toast.error(firstError ?? "Please check your input and try again.");
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
            Create New Listing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provide the property details and high-resolution images to generate
            your luxury AI listing.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetClick}
            className="text-gray-400 hover:text-red-500 hover:bg-gray-50 border-gray-200 shadow-none mt-3 lg:absolute lg:right-0 lg:top-2"
          >
            <RotateCcw className="size-3" />
            Start Over
          </Button>
        </div>

        <ConfirmDeleteDialog
          open={resetConfirmOpen}
          onOpenChange={setResetConfirmOpen}
          onConfirm={() => {
            reset();
            setResetConfirmOpen(false);
          }}
          title="Start over?"
          description="This will clear all the details and photos you've added. This action cannot be undone."
          confirmLabel="Start Over"
        />

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">
            {/* Left column: Photos */}
            <div className="sticky top-28 max-lg:static">
              <PhotoUploader
                photos={photos}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
              />
            </div>

            {/* Right column: Form */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-navy-deep mb-6">
                  Property Details
                </h2>

                <div className="flex flex-col gap-5">
                  {/* Property type */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="property-type">Property Type</Label>
                    <Select
                      value={form.propertyType}
                      onValueChange={(v) => updateField("propertyType", v)}
                    >
                      <SelectTrigger id="property-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bedrooms & Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <StepperInput
                      id="bedrooms"
                      label="Bedrooms"
                      value={form.bedrooms}
                      onChange={(v) => updateField("bedrooms", v)}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <StepperInput
                      id="bathrooms"
                      label="Bathrooms"
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
                      Size (m²) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="sqm"
                      type="number"
                      placeholder="e.g. 120"
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
                    <Label htmlFor="price">
                      Asking Price (€) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 850.000"
                      autoComplete="off"
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
                    <Label htmlFor="address">Property Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="e.g. 12 Rue de Clausen, Luxembourg"
                      value={form.address ?? ""}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                    <p className="text-2xs text-gray-400">Optional — included in PDF and social media exports</p>
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
