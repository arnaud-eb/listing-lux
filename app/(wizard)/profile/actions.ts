"use server";

import { createServiceClient } from "@/lib/supabase.server";
import { getSessionId } from "@/lib/session";
import { agentProfileSchema, type AgentProfileInput } from "@/lib/schemas/profile";
import type { AgentProfile } from "@/lib/types";

export async function getAgentProfile(): Promise<AgentProfile | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_profiles")
    .select("id, full_name, agency_name, phone, email, logo_url, agency_address, agency_website")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return null;
  return data as AgentProfile;
}

export async function upsertAgentProfile(
  input: AgentProfileInput,
): Promise<AgentProfile> {
  const parsed = agentProfileSchema.safeParse(input);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    throw new Error("No session — please reload the page");
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agent_profiles")
    .upsert(
      {
        session_id: sessionId,
        full_name: parsed.data.full_name,
        agency_name: parsed.data.agency_name || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email,
        agency_address: parsed.data.agency_address || null,
        agency_website: parsed.data.agency_website || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )
    .select("id, full_name, agency_name, phone, email, logo_url, agency_address, agency_website")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save profile: ${error?.message}`);
  }

  return data as AgentProfile;
}

export async function uploadAgentLogo(
  formData: FormData,
): Promise<{ logoUrl: string }> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    throw new Error("No session — please reload the page");
  }

  const file = formData.get("logo") as File;
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  // Validate file
  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Logo must be PNG or JPG");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Logo must be under 2MB");
  }

  const supabase = createServiceClient();
  const path = `${sessionId}/logo${file.type === "image/png" ? ".png" : ".jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from("agent-logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("agent-logos")
    .getPublicUrl(path);

  const logoUrl = urlData.publicUrl;

  // Update profile with logo URL
  await supabase
    .from("agent_profiles")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  return { logoUrl };
}

export async function removeAgentLogo(): Promise<void> {
  const sessionId = await getSessionId();
  if (!sessionId) return;

  const supabase = createServiceClient();

  // Remove from storage (try both extensions)
  await supabase.storage.from("agent-logos").remove([
    `${sessionId}/logo.png`,
    `${sessionId}/logo.jpg`,
  ]);

  // Clear from profile
  await supabase
    .from("agent_profiles")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("session_id", sessionId);
}
