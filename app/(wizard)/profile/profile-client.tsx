"use client";

import { toast } from "sonner";
import BrandingForm from "@/components/profile/BrandingForm";
import type { AgentProfile } from "@/lib/types";

interface ProfileClientProps {
  profile: AgentProfile | null;
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  return (
    <BrandingForm
      profile={profile}
      alwaysExpanded
      submitLabel="Save Changes"
      onSuccess={() => {
        toast.success("Profile saved");
      }}
    />
  );
}
