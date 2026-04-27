"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
} from "@/app/(wizard)/profile/actions";
import PhoneInput from "@/components/profile/PhoneInput";
import { normalizeWebsite } from "@/lib/url";
import {
  EMAIL_INVALID_MESSAGE,
  hasNoBranding,
  isValidEmail,
} from "@/lib/schemas/profile";

/**
 * Stable id used by the wizard's sticky footer to associate an out-of-form
 * submit button via the native `form="…"` attribute. Exported so callers
 * can reuse it without hard-coding the string.
 */
export const BRANDING_FORM_ID = "branding-form";

interface BrandingFormProps {
  profile?: AgentProfile | null;
  /** Called after successful save — Dialog dismisses, Page shows toast, etc. */
  onSuccess?: (profile: AgentProfile) => void;
  /** Show "Skip" link for inline PDF flow */
  showSkip?: boolean;
  onSkip?: () => void;
  /** When true, all fields are always expanded (profile page). When false, uses progressive disclosure (dialog). */
  alwaysExpanded?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
  /**
   * When true, the inline Save/Skip footer is omitted. The caller renders
   * submit controls (typically inside a sticky dialog footer) and points
   * them at this form via the native HTML `form="branding-form"` attribute.
   * Default: false (profile page keeps its inline submit button).
   */
  hideActions?: boolean;
  /**
   * Notified whenever the in-flight save state changes. Lets external submit
   * controls (used with `hideActions`) reflect loading state and stay
   * disabled while a save is pending.
   */
  onPendingChange?: (pending: boolean) => void;
  /**
   * Notified whenever the form's submittability changes. Lets external submit
   * controls disable themselves until at least one field has changed and any
   * provided email is well-formatted.
   */
  onValidityChange?: (canSubmit: boolean) => void;
  /**
   * Notified whenever the form transitions between clean and dirty.
   * Consumers (profile page → useBeforeUnload, PDF wizard → discard guard)
   * subscribe to know when unsaved changes exist.
   */
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * When true, render a "Clear all" button next to Save Changes that empties
   * every field locally (the user must still click Save to persist). Used on
   * /profile; not shown in the PDF wizard's branding step where it would be
   * confusing.
   */
  showClearAll?: boolean;
}

/**
 * Snapshot the seven editable string fields off a profile so we can compare
 * later for dirty-detection. Trims happen at compare time, not here, so the
 * snapshot reflects the saved state exactly.
 */
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
  submitLabel = "Save Profile",
  hideActions = false,
  onPendingChange,
  onValidityChange,
  onDirtyChange,
  showClearAll = false,
}: BrandingFormProps) {
  // Snapshot of the saved values — the dirty-detection baseline. Lives in
  // state (not a ref) so that updating it on profile change forces a
  // re-render and the `isDirty` memo recomputes. With a ref, when the
  // server returns the same content the user just typed, all setX setters
  // see equal values (Object.is) and React skips the re-render — leaving
  // isDirty stuck on its previous value (the dot would never clear).
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

  // Re-sync when the parent passes a different `profile` (e.g. after a
  // successful save the parent may pass back the saved profile, or the
  // /profile page may re-render with fresh server data after revalidate).
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
          // Auto-prepend https:// if missing — users shouldn't have to type it.
          agency_website: normalizeWebsite(agencyWebsite),
          // First-time users: profile row doesn't exist yet when uploadAgentLogo
          // runs, so its UPDATE is a no-op. Pass the client-side logoUrl here
          // so the profile is created with the logo on first save.
          logo_url: logoUrl || null,
        });
        onSuccess?.(saved);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save profile");
      }
    });
  }

  // Clear All targets PERSISTED data — show it only when the saved profile
  // contains branding. Typing into a fresh first-time form isn't destructive
  // (the user can just backspace), and the confirmation dialog's "Click
  // Save Changes after to remove your branding from new PDFs" copy only
  // makes sense when there's actual saved branding to remove.
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
      toast.error("Logo must be PNG or JPG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { logoUrl: url } = await uploadAgentLogo(formData);
      setLogoUrl(url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
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
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
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
        <Label htmlFor="profile-name">Full Name</Label>
        <Input
          id="profile-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Arnaud Depierreux"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">Email</Label>
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
          placeholder="e.g. agent@agency.lu"
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
        <Label htmlFor="profile-agency">Agency Name</Label>
        <Input
          id="profile-agency"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder="e.g. Unicorn Real Estate"
        />
      </div>

      {/* Collapsible "More details" section — collapsed by default in dialog, always open on profile page */}
      {!alwaysExpanded && (
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-deep transition-colors cursor-pointer py-1"
        >
          <ChevronDown
            className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
          {moreOpen ? "Less details" : "More details (phone, address, logo)"}
        </button>
      )}

      {(alwaysExpanded || moreOpen) && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-phone">Phone</Label>
            <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-address">Agency Address</Label>
            <Input
              id="profile-address"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              placeholder="e.g. 1 Rue de Clausen, Luxembourg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-website">Agency Website</Label>
            <Input
              id="profile-website"
              type="text"
              inputMode="url"
              value={agencyWebsite}
              onChange={(e) => setAgencyWebsite(e.target.value)}
              placeholder="e.g. www.agency.lu"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Agency Logo</Label>
            {logoUrl ? (
              <div className="flex items-start gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
                {/* 128×128 chip with object-contain so landscape, square,
                    and portrait logos all read correctly without cropping. */}
                <div className="size-32 shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="Agency logo"
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
                    Replace
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
                    Remove
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
                {isUploadingLogo ? "Uploading..." : "Upload logo (PNG, JPG, max 2MB)"}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoUpload}
              className="hidden"
              aria-label="Upload agency logo"
            />
          </div>
        </div>
      )}

      {/* Actions — hidden when the caller renders its own submit controls
          (e.g. wizard sticky footer using form="branding-form") */}
      {!hideActions && (
        <div className="flex items-center justify-between pt-2">
          {showSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Skip — Generate without branding
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
              Clear all
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
                aria-label="Saving"
              />
            )}
            {submitLabel}
          </Button>
        </div>
      )}

      <ConfirmDiscardDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        onConfirm={handleClearAll}
        title="Clear all branding fields?"
        description="Every field will be emptied. Click Save Changes after to remove your branding from new PDFs."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
      />
    </form>
  );
}
