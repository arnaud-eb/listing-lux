import path from "node:path";
import fs from "node:fs/promises";
import type { Language } from "@/lib/types";
import type { ListingOutput } from "@/lib/schemas/listing";

export const AUDIT_DIR = path.resolve(
  process.cwd(),
  "docs/audits/2026-04-llm-output-audit",
);

export const RUNS_DIR = (promptVersion: string) =>
  path.join(AUDIT_DIR, "runs", promptVersion);

export const SCORES_PATH = (promptVersion: string) =>
  path.join(AUDIT_DIR, `scores-${promptVersion}.json`);

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJson(
  filepath: string,
  data: unknown,
): Promise<void> {
  await ensureDir(path.dirname(filepath));
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

export async function readJson<T>(filepath: string): Promise<T> {
  const raw = await fs.readFile(filepath, "utf8");
  return JSON.parse(raw) as T;
}

export interface GenerationOutput {
  fixture_id: string;
  language: Language;
  prompt_version: string;
  model: string;
  generated_at: string;
  output: ListingOutput;
}

export type DimensionName =
  | "factual_fidelity"
  | "completeness"
  | "cross_lang_consistency"
  | "native_quality"
  | "market_fit"
  | "compliance_cpe"
  | "seo_signal"
  | "tone_discipline"
  | "fair_housing"
  | "hallucination";

export interface DimensionScore {
  score: 1 | 2 | 3 | 4 | 5;
  evidence: string;
}

export interface RubricScore {
  fixture_id: string;
  language: Language;
  prompt_version: string;
  scores: Record<DimensionName, DimensionScore>;
  overall_pass: boolean;
  notes?: string;
}

export interface ScoresFile {
  prompt_version: string;
  judged_at: string;
  judge_model: string;
  scores: RubricScore[];
}
