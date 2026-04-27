"use client";

import { useState } from "react";
import { toast } from "sonner";
import BrandingForm from "@/components/profile/BrandingForm";
import { useBeforeUnload } from "@/lib/hooks/use-before-unload";
import type { AgentProfile } from "@/lib/types";

interface ProfileClientProps {
  profile: AgentProfile | null;
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  // Lifted from BrandingForm so the browser-level beforeunload guard
  // activates only when there are unsaved edits. This is the catastrophic-
  // loss case (tab close, refresh, external URL); App Router has no API
  // for blocking internal Link navigation.
  const [isDirty, setIsDirty] = useState(false);
  useBeforeUnload(isDirty);

  return (
    <BrandingForm
      profile={profile}
      alwaysExpanded
      showClearAll
      submitLabel="Save Changes"
      onDirtyChange={setIsDirty}
      onSuccess={() => {
        toast.success("Profile saved");
      }}
    />
  );
}
