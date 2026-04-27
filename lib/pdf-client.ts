import { saveAs } from "file-saver";
import type { Language } from "./types";

interface DownloadPDFOptions {
  languages: Language[];
  includeBranding: boolean;
  /** User-picked photos (in click order). Empty array = no photos.
   *  Omit entirely to let the server use the first 5 by default. */
  selectedPhotos?: string[];
  /** Override the downloaded filename. Defaults to server-suggested filename. */
  filename?: string;
}

export async function downloadPDF(
  propertyId: string,
  options: DownloadPDFOptions,
): Promise<void> {
  const { languages, includeBranding, selectedPhotos, filename } = options;

  const res = await fetch("/api/pdf/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propertyId,
      languages,
      includeBranding,
      ...(selectedPhotos ? { selectedPhotos } : {}),
    }),
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
