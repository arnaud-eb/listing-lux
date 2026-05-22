/**
 * Parser for STATEC / Observatoire de l'Habitat "Prix annoncés des logements"
 * workbooks (data.public.lu, CC0) — both the by-commune and the by-quartier
 * (Luxembourg-Ville) files.
 *
 * Layout (verified against the 2025 apartment + house files of both datasets):
 *   preamble : 1-4 title / reading-note rows
 *   header   : first cell is "Commune" or "Quartier"; the €/m² column header
 *              contains "m²"
 *   data     : one row per locality — [name, nbOffers, avgPrice, avgPricePerSqm]
 *   footer   : "Moyenne nationale", "Total d'offres", "Source : …", and — in the
 *              quartier file — a "Luxembourg-Ville" city-total row
 *
 * Localities with fewer than 30 listings are suppressed by STATEC and carry "*"
 * instead of a price — those come back with pricePerSqm: null.
 */

// xlsx@0.18.5 carries known CVEs (prototype pollution, ReDoS) that require a
// malicious workbook to exploit. Accepted: devDependency, runs only in CI /
// locally, and parses CC0 government files fetched over HTTPS from data.public.lu
// — never attacker-controlled input.
import * as XLSX from "xlsx";

export interface StatecPriceRow {
  /** Commune or quartier name, exactly as STATEC spells it. */
  name: string;
  /** Mean asking €/m². null when STATEC suppressed it (<30 listings). */
  pricePerSqm: number | null;
}

/** Trailing rows in the STATEC files that aren't localities. */
function isSummaryRow(name: string): boolean {
  // "Luxembourg-Ville" is the city-total row at the foot of the quartier file.
  return /^(moyenne|total|source|luxembourg-ville)\b/i.test(name.trim());
}

export function parseStatecXls(filePath: string): StatecPriceRow[] {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error(`No sheet in ${filePath}`);
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  }) as unknown[][];

  const headerIdx = rows.findIndex((r) => {
    const c = typeof r[0] === "string" ? r[0].trim().toLowerCase() : "";
    return c === "commune" || c === "quartier";
  });
  if (headerIdx === -1) {
    throw new Error(`No "Commune"/"Quartier" header row in ${filePath}`);
  }
  const priceCol = rows[headerIdx].findIndex(
    (c) => typeof c === "string" && c.toLowerCase().includes("m²"),
  );
  if (priceCol === -1) {
    throw new Error(`No €/m² column (header containing "m²") in ${filePath}`);
  }

  const out: StatecPriceRow[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    const name = typeof row[0] === "string" ? row[0].trim() : "";
    if (!name || isSummaryRow(name)) continue;
    const raw = row[priceCol];
    const pricePerSqm =
      typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    out.push({ name, pricePerSqm });
  }
  return out;
}
