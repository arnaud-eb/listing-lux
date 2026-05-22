/**
 * Resolves + downloads the STATEC asking-price files from data.public.lu.
 *
 * Two datasets feed the locality table:
 *   - "Prix annoncés des logements - Par commune"            (commune level)
 *   - "Prix annoncés des logements - A Luxembourg-Ville,      (LU-Ville
 *      par quartier"                                           quartier level)
 *
 * Both expose timestamped file URLs that change every quarter, so URLs must be
 * resolved fresh from the API — the resource IDs are stable, the URLs are not.
 * Each resource carries a `last_modified`; the most recent across all four lets
 * the fetcher skip the download entirely when nothing has been republished.
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DATASET_API = {
  commune:
    "https://data.public.lu/api/1/datasets/prix-annonces-des-logements-par-commune/",
  quartier:
    "https://data.public.lu/api/1/datasets/prix-annonces-des-logements-a-luxembourg-ville-par-quartier/",
} as const;

/** Stable resource IDs (do not change across quarters). */
const RESOURCE_IDS = {
  communeApartment: "50299491-6363-4f5e-bb3b-d8db82c400fe",
  communeHouse: "411d7b8d-893a-4541-8973-e09889937645",
  quartierApartment: "c11d6f9d-2efe-417a-8e52-a5a98dc635f0",
  quartierHouse: "4a3de498-0a47-4b22-8d4d-e8eeb17db855",
} as const;

interface UdataResource {
  id: string;
  url: string;
  last_modified: string;
}

export interface StatecResolved {
  /** Most recent `last_modified` (ISO 8601) across all four resources. */
  lastModified: string;
  communeApartmentUrl: string;
  communeHouseUrl: string;
  quartierApartmentUrl: string;
  quartierHouseUrl: string;
}

export interface StatecSources {
  communeApartmentXls: string;
  communeHouseXls: string;
  quartierApartmentXls: string;
  quartierHouseXls: string;
}

const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

/**
 * fetch with a per-attempt timeout and retry on timeout / network error / 5xx.
 * 4xx responses are returned as-is — the caller turns them into a clear error.
 */
async function fetchRetrying(url: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.ok || res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error(`fetch failed after ${MAX_ATTEMPTS} attempts: ${url} — ${lastErr}`);
}

async function fetchResources(api: string): Promise<UdataResource[]> {
  const res = await fetchRetrying(api);
  if (!res.ok) throw new Error(`data.public.lu API: HTTP ${res.status} (${api})`);
  return ((await res.json()) as { resources: UdataResource[] }).resources;
}

/** Two dataset API calls → all four resource URLs + last_modified. No download. */
export async function resolveStatec(): Promise<StatecResolved> {
  const [commune, quartier] = await Promise.all([
    fetchResources(DATASET_API.commune),
    fetchResources(DATASET_API.quartier),
  ]);
  const find = (pool: UdataResource[], id: string): UdataResource => {
    const r = pool.find((x) => x.id === id);
    if (!r) throw new Error(`STATEC resource ${id} missing from dataset`);
    return r;
  };
  const resources = {
    communeApartment: find(commune, RESOURCE_IDS.communeApartment),
    communeHouse: find(commune, RESOURCE_IDS.communeHouse),
    quartierApartment: find(quartier, RESOURCE_IDS.quartierApartment),
    quartierHouse: find(quartier, RESOURCE_IDS.quartierHouse),
  };
  return {
    // ISO 8601 strings sort chronologically; take the most recent of the four.
    lastModified: Object.values(resources)
      .map((r) => r.last_modified)
      .sort()
      .at(-1)!,
    communeApartmentUrl: resources.communeApartment.url,
    communeHouseUrl: resources.communeHouse.url,
    quartierApartmentUrl: resources.quartierApartment.url,
    quartierHouseUrl: resources.quartierHouse.url,
  };
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetchRetrying(url);
  if (!res.ok) {
    throw new Error(`STATEC download failed: HTTP ${res.status} for ${url}`);
  }
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/** Download all four files from a resolved descriptor into a temp dir. */
export async function downloadStatec(
  resolved: StatecResolved,
): Promise<StatecSources> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "statec-"));
  const sources: StatecSources = {
    communeApartmentXls: path.join(dir, "commune-apartment.xls"),
    communeHouseXls: path.join(dir, "commune-house.xls"),
    quartierApartmentXls: path.join(dir, "quartier-apartment.xlsx"),
    quartierHouseXls: path.join(dir, "quartier-house.xlsx"),
  };
  await Promise.all([
    download(resolved.communeApartmentUrl, sources.communeApartmentXls),
    download(resolved.communeHouseUrl, sources.communeHouseXls),
    download(resolved.quartierApartmentUrl, sources.quartierApartmentXls),
    download(resolved.quartierHouseUrl, sources.quartierHouseXls),
  ]);
  return sources;
}
