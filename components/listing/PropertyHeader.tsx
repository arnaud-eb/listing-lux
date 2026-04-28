"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Check, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PriceDisplay from "@/components/shared/PriceDisplay";
import { getActiveMarket, getNeighborhoodBySlug } from "@/lib/markets";
import { formatNumber, parseFormattedNumber } from "@/lib/format";
import { updateProperty } from "@/app/[locale]/(wizard)/listing/[listingId]/actions";
import { toast } from "sonner";
import type { Property } from "@/lib/types";

interface PropertyHeaderProps {
  property: Property;
  onUpdate: (updated: Property) => void;
  onEditingChange?: (editing: boolean) => void;
}

export default function PropertyHeader({ property, onUpdate, onEditingChange }: PropertyHeaderProps) {
  const market = getActiveMarket();
  const neighborhoods = market.areas.flatMap((a) => a.neighborhoods);
  const t = useTranslations("wizard.listing.propertyHeader");

  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [draft, setDraft] = useState({
    property_type: property.property_type,
    neighborhood: property.neighborhood,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqm: property.sqm,
    price: property.price,
    address: property.address ?? "",
  });
  const [bedsInput, setBedsInput] = useState(String(property.bedrooms));
  const [bathsInput, setBathsInput] = useState(String(property.bathrooms));
  const [sqmInput, setSqmInput] = useState(String(property.sqm));
  const [priceInput, setPriceInput] = useState(formatNumber(property.price));

  const neighborhoodName =
    getNeighborhoodBySlug(property.neighborhood)?.name ??
    property.neighborhood.replace(/-/g, " ");

  function handleEdit() {
    onEditingChange?.(true);
    setDraft({
      property_type: property.property_type,
      neighborhood: property.neighborhood,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqm: property.sqm,
      price: property.price,
      address: property.address ?? "",
    });
    setBedsInput(String(property.bedrooms));
    setBathsInput(String(property.bathrooms));
    setSqmInput(String(property.sqm));
    setPriceInput(formatNumber(property.price));
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    onEditingChange?.(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProperty(property.id, {
          ...draft,
          address: draft.address.trim() || null,
        });
        onUpdate({
          ...property,
          ...draft,
          address: draft.address.trim() || null,
        });
        setEditing(false);
        onEditingChange?.(false);
        toast.success(t("toastUpdated"));
      } catch {
        toast.error(t("toastFailed"));
      }
    });
  }

  if (editing) {
    return (
      <>
        {/* Top action bar — mirrors listing generator edit mode */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">
            {t("label")}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-1.5 rounded-lg text-gray-500"
            >
              <X className="size-3.5" />
              {t("discard")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
            >
              <Check className="size-3.5" />
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>

        {/* Title row: type + neighborhood selects */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={draft.property_type}
            onValueChange={(v) => setDraft((d) => ({ ...d, property_type: v }))}
          >
            <SelectTrigger className="h-9 w-40 capitalize font-semibold text-navy-deep border-dashed border-gold bg-gold/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {market.propertyTypes.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-gray-400 text-sm">{t("in")}</span>
          <Select
            value={draft.neighborhood}
            onValueChange={(v) => setDraft((d) => ({ ...d, neighborhood: v }))}
          >
            <SelectTrigger className="h-9 w-52 border-dashed border-gold bg-gold/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods.map((n) => (
                <SelectItem key={n.slug} value={n.slug}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats row: bed, bath, sqm, price */}
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2 mt-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t("bedShort")}</label>
            <Input
              type="text"
              inputMode="numeric"
              value={bedsInput}
              className="h-9 w-16 shadow-none border-dashed border-gold bg-gold/5"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setBedsInput(raw);
                const n = parseInt(raw, 10);
                if (!isNaN(n)) setDraft((d) => ({ ...d, bedrooms: n }));
              }}
              onBlur={() => setBedsInput(String(draft.bedrooms))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t("bathShort")}</label>
            <Input
              type="text"
              inputMode="numeric"
              value={bathsInput}
              className="h-9 w-16 shadow-none border-dashed border-gold bg-gold/5"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setBathsInput(raw);
                const n = parseInt(raw, 10);
                if (!isNaN(n)) setDraft((d) => ({ ...d, bathrooms: n }));
              }}
              onBlur={() => setBathsInput(String(draft.bathrooms))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t("sqmShort")}</label>
            <Input
              type="text"
              inputMode="numeric"
              value={sqmInput}
              className="h-9 w-24 shadow-none border-dashed border-gold bg-gold/5"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setSqmInput(raw);
                const n = parseInt(raw, 10);
                if (!isNaN(n)) setDraft((d) => ({ ...d, sqm: n }));
              }}
              onBlur={() => setSqmInput(String(draft.sqm))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t("priceLabel")}</label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={priceInput}
              className="h-9 w-32 shadow-none border-dashed border-gold bg-gold/5"
              onChange={(e) => {
                setPriceInput(e.target.value);
                const parsed = parseFormattedNumber(e.target.value);
                if (parsed !== "")
                  setDraft((d) => ({ ...d, price: parsed as number }));
              }}
              onBlur={() => {
                if (draft.price) setPriceInput(formatNumber(draft.price));
              }}
            />
          </div>
        </div>

        {/* Address row */}
        <div className="flex flex-col gap-1 mt-3">
          <label className="text-xs text-gray-500">{t("addressLabel")}</label>
          <Input
            type="text"
            value={draft.address}
            placeholder={t("addressPlaceholder")}
            className="h-9 shadow-none border-dashed border-gold bg-gold/5 max-w-sm"
            onChange={(e) =>
              setDraft((d) => ({ ...d, address: e.target.value }))
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-navy-deep capitalize">
        {property.property_type} {t("in")} {neighborhoodName}
      </h1>
      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
        <span>
          {property.bedrooms}{" "}
          {property.bedrooms === 1 ? t("bedSingular") : t("bedPlural")}
        </span>
        <span>·</span>
        <span>
          {property.bathrooms}{" "}
          {property.bathrooms === 1 ? t("bathSingular") : t("bathPlural")}
        </span>
        <span>·</span>
        <span>{property.sqm} m²</span>
        <span>·</span>
        <PriceDisplay
          amount={property.price}
          className="font-semibold text-navy-deep"
        />
        <button
          type="button"
          onClick={handleEdit}
          className="ml-1 text-gray-400 hover:text-navy-deep transition-colors cursor-pointer"
          aria-label={t("ariaEdit")}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      {property.address && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400">
          <MapPin className="size-3.5 shrink-0" />
          <span>{property.address}</span>
        </div>
      )}
    </>
  );
}
