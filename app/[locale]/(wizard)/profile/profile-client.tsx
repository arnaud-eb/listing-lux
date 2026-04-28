"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import BrandingForm from "@/components/profile/BrandingForm";
import { useBeforeUnload } from "@/lib/hooks/use-before-unload";
import type { AgentProfile } from "@/lib/types";

interface ProfileClientProps {
  profile: AgentProfile | null;
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [isDirty, setIsDirty] = useState(false);
  useBeforeUnload(isDirty);
  const t = useTranslations("wizard.profile");
  const tBranding = useTranslations("wizard.branding");

  return (
    <BrandingForm
      profile={profile}
      alwaysExpanded
      showClearAll
      submitLabel={tBranding("saveChanges")}
      onDirtyChange={setIsDirty}
      onSuccess={() => {
        toast.success(t("toastProfileSaved"));
      }}
    />
  );
}
