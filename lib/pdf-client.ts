import { saveAs } from "file-saver";
import type { Language } from "./types";

export async function downloadPDF(
  propertyId: string,
  languages: Language[],
  includeBranding: boolean,
  filename?: string,
): Promise<void> {
  const res = await fetch("/api/pdf/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId, languages, includeBranding }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "PDF generation failed" }));
    throw new Error(error.error ?? "PDF generation failed");
  }

  const blob = await res.blob();

  // Use filename from Content-Disposition header if available, otherwise fallback
  const disposition = res.headers.get("Content-Disposition");
  const serverFilename = disposition?.match(/filename="(.+)"/)?.[1];

  saveAs(blob, filename ?? serverFilename ?? `ListingLux-${propertyId}.pdf`);
}
