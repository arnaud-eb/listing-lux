"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Upload, Trash2, Loader2, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConfirmDiscardDialog from "@/components/shared/ConfirmDiscardDialog";
import type { AgentProfile } from "@/lib/types";
import {
  upsertAgentProfile,
  uploadAgentLogo,
  removeAgentLogo,
} from "@/app/[locale]/(wizard)/profile/actions";
import PhoneInput from "@/components/profile/PhoneInput";
import { normalizeWebsite } from "@/lib/url";
import {
  EMAIL_INVALID_MESSAGE,
  hasNoBranding,
  isValidEmail,
} from "@/lib/schemas/profile";

export const BRANDING_FORM_ID = "branding-form";

interface BrandingFormProps {
  profile?: AgentProfile | null;
  onSuccess?: (profile: AgentProfile) => void;
  showSkip?: boolean;
  onSkip?: () => void;
  alwaysExpanded?: boolean;
  submitLabel?: string;
  hideActions?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onValidityChange?: (canSubmit: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  showClearAll?: boolean;
}

function snapshotInitialValues(profile?: AgentProfile | null) {
  return {
    fullName: profile?.full_name ?? "",
    email: profile?.email ?? "",
    agencyName: profile?.agency_name ?? "",
    phone: profile?.phone ?? "",
    agencyAddress: profile?.agency_address ?? "",
    agencyWebsite: profile?.agency_website ?? "",
    logoUrl: profile?.logo_url ?? "",
  };
}

export default function BrandingForm({
  profile,
  onSuccess,
  showSkip,
  onSkip,
  alwaysExpanded = false,
  submitLabel,
  hideActions = false,
  onPendingChange,
  onValidityChange,
  onDirtyChange,
  showClearAll = false,
}: BrandingFormProps) {
  const t = useTranslations("wizard.branding");
  const resolvedSubmitLabel = submitLabel ?? t("saveProfile");

  const [initialValues, setInitialValues] = useState(() =>
    snapshotInitialValues(profile),
  );

  const [fullName, setFullName] = useState(initialValues.fullName);
  const [email, setEmail] = useState(initialValues.email);
  const [agencyName, setAgencyName] = useState(initialValues.agencyName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [agencyAddress, setAgencyAddress] = useState(
    initialValues.agencyAddress,
  );
  const [agencyWebsite, setAgencyWebsite] = useState(
    initialValues.agencyWebsite,
  );
  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl);
  const [emailTouched, setEmailTouched] = useState(false);
  const [moreOpen, setMoreOpen] = useState(alwaysExpanded);
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = snapshotInitialValues(profile);
    setInitialValues(next);
    setFullName(next.fullName);
    setEmail(next.email);
    setAgencyName(next.agencyName);
    setPhone(next.phone);
    setAgencyAddress(next.agencyAddress);
    setAgencyWebsite(next.agencyWebsite);
    setLogoUrl(next.logoUrl);
    setEmailTouched(false);
  }, [profile]);

  const trimmedEmail = email.trim();
  const emailIsValid = isValidEmail(trimmedEmail);
  const emailError = emailTouched && !emailIsValid ? EMAIL_INVALID_MESSAGE : null;

  const isDirty = useMemo(() => {
    return (
      fullName.trim() !== initialValues.fullName ||
      trimmedEmail !== initialValues.email ||
      agencyName.trim() !== initialValues.agencyName ||
      phone.trim() !== initialValues.phone ||
      agencyAddress.trim() !== initialValues.agencyAddress ||
      agencyWebsite.trim() !== initialValues.agencyWebsite ||
      logoUrl !== initialValues.logoUrl
    );
  }, [
    initialValues,
    fullName,
    trimmedEmail,
    agencyName,
    phone,
    agencyAddress,
    agencyWebsite,
    logoUrl,
  ]);

  const canSubmit = isDirty && emailIsValid;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    onValidityChange?.(canSubmit);
  }, [canSubmit, onValidityChange]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const saved = await upsertAgentProfile({
          full_name: fullName.trim() || undefined,
          email: trimmedEmail || undefined,
          agency_name: agencyName.trim() || undefined,
          phone: phone.trim() || undefined,
          agency_address: agencyAddress.trim() || undefined,
          agency_website: normalizeWebsite(agencyWebsite),
          logo_url: logoUrl || null,
        });
        onSuccess?.(saved);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("toastSaveFailed"));
      }
    });
  }

  const hasSavedBranding = !hasNoBranding(profile);

  function handleClearAll() {
    setFullName("");
    setEmail("");
    setAgencyName("");
    setPhone("");
    setAgencyAddress("");
    setAgencyWebsite("");
    setLogoUrl("");
    setEmailTouched(false);
    setClearConfirmOpen(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(t("toastLogoTypeInvalid"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("toastLogoTooLarge"));
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { logoUrl: url } = await uploadAgentLogo(formData);
      setLogoUrl(url);
      toast.success(t("toastLogoUploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastUploadFailed"));
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    setIsUploadingLogo(true);
    try {
      await removeAgentLogo();
      setLogoUrl("");
      toast.success(t("toastLogoRemoved"));
    } catch {
      toast.error(t("toastLogoRemoveFailed"));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  return (
    <form
      id={BRANDING_FORM_ID}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">{t("fullName")}</Label>
        <Input
          id="profile-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("fullNamePlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">{t("email")}</Label>
        <Input
          id="profile-email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "profile-email-error" : undefined}
          placeholder={t("emailPlaceholder")}
        />
        {emailError && (
          <p
            id="profile-email-error"
            role="alert"
            className="text-2xs text-red-500 mt-1"
          >
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-agency">{t("agencyName")}</Label>
        <Input
          id="profile-agency"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder={t("agencyNamePlaceholder")}
        />
      </div>

      {!alwaysExpanded && (
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-deep transition-colors cursor-pointer py-1"
        >
          <ChevronDown
            className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
          {moreOpen ? t("moreDetailsClose") : t("moreDetailsOpen")}
        </button>
      )}

      {(alwaysExpanded || moreOpen) && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-phone">{t("phone")}</Label>
            <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-address">{t("agencyAddress")}</Label>
            <Input
              id="profile-address"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              placeholder={t("agencyAddressPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-website">{t("agencyWebsite")}</Label>
            <Input
              id="profile-website"
              type="text"
              inputMode="url"
              value={agencyWebsite}
              onChange={(e) => setAgencyWebsite(e.target.value)}
              placeholder={t("agencyWebsitePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("agencyLogo")}</Label>
            {logoUrl ? (
              <div className="flex items-start gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
                <div className="size-32 shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={t("altAgencyLogo")}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </div>
                <div className="flex gap-2 max-sm:self-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="gap-1.5 rounded-lg border-gray-300 shadow-none"
                  >
                    <Upload className="size-3.5" />
                    {t("replace")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                    className="gap-1.5 rounded-lg border-gray-300 hover:text-red-600 shadow-none"
                  >
                    <Trash2 className="size-3.5" />
                    {t("remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gold/40 hover:text-gray-500 transition-colors cursor-pointer"
              >
                {isUploadingLogo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isUploadingLogo ? t("uploading") : t("uploadCta")}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="hidden"
              aria-label={t("ariaUploadLogo")}
            />
          </div>
        </div>
      )}

      {!hideActions && (
        <div className="flex items-center justify-between pt-2">
          {showSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {t("skipLink")}
            </button>
          ) : showClearAll && hasSavedBranding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setClearConfirmOpen(true)}
              disabled={isPending}
              className="gap-1.5 rounded-lg border-gray-300 hover:text-red-600 shadow-none"
            >
              <Eraser className="size-3.5" />
              {t("clearAll")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            disabled={!canSubmit || isPending}
            className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none"
          >
            {isPending && (
              <div
                className="size-4 border-2 border-navy-deep border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
                role="status"
                aria-label={t("ariaSaving")}
              />
            )}
            {resolvedSubmitLabel}
          </Button>
        </div>
      )}

      <ConfirmDiscardDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        onConfirm={handleClearAll}
        title={t("clearDialogTitle")}
        description={t("clearDialogDescription")}
        confirmLabel={t("clearDialogConfirm")}
        cancelLabel={t("clearDialogCancel")}
      />
    </form>
  );
}
