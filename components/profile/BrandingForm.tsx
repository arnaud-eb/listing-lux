"use client";

import { useState, useTransition, useRef } from "react";
import { ChevronDown, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { AgentProfile } from "@/lib/types";
import { upsertAgentProfile, uploadAgentLogo, removeAgentLogo } from "@/app/(wizard)/profile/actions";
import PhoneInput from "@/components/profile/PhoneInput";

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
}

export default function BrandingForm({
  profile,
  onSuccess,
  showSkip,
  onSkip,
  alwaysExpanded = false,
  submitLabel = "Save Profile",
}: BrandingFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [agencyAddress, setAgencyAddress] = useState(profile?.agency_address ?? "");
  const [agencyWebsite, setAgencyWebsite] = useState(profile?.agency_website ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [moreOpen, setMoreOpen] = useState(alwaysExpanded);
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = fullName.trim().length >= 2 && email.includes("@");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const saved = await upsertAgentProfile({
          full_name: fullName.trim(),
          email: email.trim(),
          agency_name: agencyName.trim() || undefined,
          phone: phone.trim() || undefined,
          agency_address: agencyAddress.trim() || undefined,
          agency_website: agencyWebsite.trim() || undefined,
        });
        onSuccess?.(saved);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save profile");
      }
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
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
      // Reset file input
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Always visible: Name, Email, Agency Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">
          Full Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="profile-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Arnaud Depierreux"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">
          Email <span className="text-red-400">*</span>
        </Label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. agent@agency.lu"
          required
        />
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
            <PhoneInput
              id="profile-phone"
              value={phone}
              onChange={setPhone}
            />
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
              type="url"
              value={agencyWebsite}
              onChange={(e) => setAgencyWebsite(e.target.value)}
              placeholder="https://www.agency.lu"
            />
          </div>

          {/* Logo upload */}
          <div className="flex flex-col gap-1.5">
            <Label>Agency Logo</Label>
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Agency logo"
                  className="size-16 rounded-lg border border-gray-200 object-contain bg-gray-50"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="shadow-none"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploadingLogo}
                    className="text-red-500 hover:text-red-600 shadow-none"
                  >
                    <Trash2 className="size-3" />
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {showSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Skip — Generate without branding
          </button>
        )}
        <Button
          type="submit"
          disabled={!canSubmit || isPending}
          className="gap-1.5 rounded-lg bg-gold text-navy-deep hover:bg-gold/90 shadow-none ml-auto"
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
    </form>
  );
}
