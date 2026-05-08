#!/usr/bin/env bun
/**
 * audit:judge — scores every generation in runs/<promptVersion>/ against the
 * 10-dimension rubric using Claude Opus 4.7. Writes per-output `.score.json`
 * files alongside the generations and an aggregate scores-<version>.json
 * at the audit root.
 *
 * Cross-language consistency is judged once per fixture (the judge sees all
 * available languages at once), and the resulting score is replicated across
 * each per-language record.
 *
 * Usage:
 *   bun run scripts/audit/judge.ts                                # judge current PROMPT_VERSION
 *   bun run scripts/audit/judge.ts --prompt-version 1.4           # judge a specific run
 *   bun run scripts/audit/judge.ts --fixture <id>                  # one fixture only
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

import { PROMPT_VERSION } from "@/lib/ai/prompts";
import {
  fixtures,
  type ListingFixture,
} from "@/lib/ai/__fixtures__/properties";
import type { Language } from "@/lib/types";

import {
  readJson,
  writeJson,
  RUNS_DIR,
  SCORES_PATH,
  type GenerationOutput,
  type RubricScore,
  type DimensionName,
  type ScoresFile,
} from "./lib";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is required. Set it in .env.local or your shell.",
  );
  process.exit(1);
}

const JUDGE_MODEL = "claude-opus-4-7";

const anthropic = createAnthropic({ apiKey: ANTHROPIC_API_KEY });

const dimensionScoreSchema = z.object({
  score: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  evidence: z.string().min(1),
});

const perLanguageScoresSchema = z.object({
  factual_fidelity: dimensionScoreSchema,
  completeness: dimensionScoreSchema,
  native_quality: dimensionScoreSchema,
  market_fit: dimensionScoreSchema,
  compliance_cpe: dimensionScoreSchema,
  seo_signal: dimensionScoreSchema,
  tone_discipline: dimensionScoreSchema,
  fair_housing: dimensionScoreSchema,
  hallucination: dimensionScoreSchema,
});

const fixtureRubricSchema = z.object({
  fixture_id: z.string(),
  per_language: z.array(
    z.object({
      language: z.enum(["de", "fr", "en", "lu"]),
      scores: perLanguageScoresSchema,
      notes: z.string().optional(),
    }),
  ),
  cross_lang_consistency: dimensionScoreSchema,
});

const RUBRIC_SYSTEM_PROMPT = `You are a strict, evidence-based reviewer of AI-generated luxury real-estate listings for the Luxembourg market.

For each language provided, score 9 dimensions on a 1-5 integer scale:
- factual_fidelity: does the output contradict its inputs?
- completeness: does the output use the input data? (mentions beds/baths/sqm/neighborhood + 80% of active features + 2-3 strongest photo-derived selling points). Price is NOT required in the description prose: portals show it as a structured field, so PROMPT_VERSION 1.5 intentionally drops "Price: €X" from the user prompt. Do NOT penalize for omitting price.
- native_quality: does the output read native, not translated?
- market_fit: does the vocabulary match the Luxembourg luxury corpus (athome.lu, immotop.lu, Engel & Völkers Luxembourg)?
- compliance_cpe: how does the output handle the LU energy class (CPE)? Score 5 if a class supplied in the inputs is used accurately, OR if no class is supplied and the description omits CPE entirely (this is the new default — the structured field handles legal disclosure on the portal, not the prose). Score 3 if the description vaguely gestures at CPE ("energy passport on request") without inventing. Score 1 if the description INVENTS a class ("Class A++") not in inputs — that is illegal advertising in LU. The v1.4 placeholder requirement ("class to be confirmed") was dropped in 1.5; do NOT score down for omitting it.
- seo_signal: are the title and hashtags well-shaped? (title 8-15 words including neighborhood + property-defining adjective; 3-5 hashtags, CamelCase, no duplicates of generic market tags)
- tone_discipline: does the output avoid hyperbole? (no "breathtaking", "must-see", exclamation marks)
- fair_housing: zero references to ideal occupant demographics, family status, religion, age, gender, or national origin (HARD-FAIL: must score 5 to pass)
- hallucination: every concrete number, named place, distance, transit line, school, amenity must be supported by inputs (HARD-FAIL: must score 5 to pass)

Then score cross_lang_consistency ONCE for the fixture (judging facts and feature mentions across all languages provided): score 5 if all languages agree on numerics and feature lists; score 1 if there's a numeric mismatch. Note: from PROMPT_VERSION 1.5, Lëtzebuergesch was dropped — fixtures now ship 1-3 languages (DE/FR/EN), not 4.

Each score MUST include a one-sentence \`evidence\` field that quotes a specific span from the listing it scores. Do not paraphrase. For cross_lang_consistency, evidence should name the languages that agreed/disagreed.

Be strict. Score 5 is "genuinely excellent on this dimension," not a default.`;

interface PerLanguageResult {
  language: Language;
  scores: Record<Exclude<DimensionName, "cross_lang_consistency">, {
    score: 1 | 2 | 3 | 4 | 5;
    evidence: string;
  }>;
  notes?: string;
}

interface FixtureRubricResult {
  fixture_id: string;
  per_language: PerLanguageResult[];
  cross_lang_consistency: { score: 1 | 2 | 3 | 4 | 5; evidence: string };
}

async function judgeFixture(
  fixture: ListingFixture,
  generations: GenerationOutput[],
): Promise<FixtureRubricResult> {
  const userMessage = `# Fixture inputs

\`\`\`json
${JSON.stringify(
  {
    id: fixture.id,
    diversity_tags: fixture.diversity_tags,
    property: fixture.property,
    photo_analyses: fixture.photo_analyses,
    user_comment: fixture.user_comment ?? null,
    notes: fixture.notes ?? null,
  },
  null,
  2,
)}
\`\`\`

# Generated listings (${generations.length} language${generations.length > 1 ? "s" : ""})

${generations
  .map(
    (g) =>
      `## ${g.language.toUpperCase()} — prompt v${g.prompt_version}, model ${g.model}\n\n` +
      `**Title:** ${g.output.title}\n\n` +
      `**Description:**\n${g.output.description}\n\n` +
      `**Highlights:**\n${g.output.highlights.map((h) => `- ${h.text} [icon: ${h.icon}]`).join("\n")}\n\n` +
      `**Hashtags:** ${g.output.hashtags.join(" ")}`,
  )
  .join("\n\n---\n\n")}

# Task

Score every language present above. Replicate the rubric anchors faithfully. Quote specific text in every \`evidence\` field.`;

  const result = await generateObject({
    model: anthropic(JUDGE_MODEL),
    schema: fixtureRubricSchema,
    system: RUBRIC_SYSTEM_PROMPT,
    prompt: userMessage,
  });

  return result.object as FixtureRubricResult;
}

function computeOverallPass(scores: Record<DimensionName, { score: number }>): boolean {
  if (scores.fair_housing.score < 5) return false;
  if (scores.hallucination.score < 5) return false;
  for (const v of Object.values(scores)) {
    if (v.score <= 2) return false;
  }
  return true;
}

interface Args {
  promptVersion?: string;
  fixtureId?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--prompt-version") out.promptVersion = argv[++i];
    if (argv[i] === "--fixture") out.fixtureId = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const promptVersion = args.promptVersion ?? PROMPT_VERSION;
  const runDir = RUNS_DIR(promptVersion);

  let dirEntries: string[];
  try {
    dirEntries = await fs.readdir(runDir);
  } catch {
    console.error(
      `No generation outputs at ${runDir}. Run audit:generate first.`,
    );
    process.exit(1);
  }

  const generationFiles = dirEntries.filter(
    (f) => f.endsWith(".json") && !f.endsWith(".score.json"),
  );

  if (generationFiles.length === 0) {
    console.error(`No generation outputs in ${runDir}`);
    process.exit(1);
  }

  // Group by fixture_id
  const byFixture = new Map<string, GenerationOutput[]>();
  for (const file of generationFiles) {
    const gen = await readJson<GenerationOutput>(path.join(runDir, file));
    if (args.fixtureId && gen.fixture_id !== args.fixtureId) continue;
    if (!byFixture.has(gen.fixture_id)) byFixture.set(gen.fixture_id, []);
    byFixture.get(gen.fixture_id)!.push(gen);
  }

  if (byFixture.size === 0) {
    console.error(
      `No generations match fixture filter: ${args.fixtureId ?? "(none)"}`,
    );
    process.exit(1);
  }

  console.log(
    `Judge: ${JUDGE_MODEL} scoring PROMPT_VERSION=${promptVersion}, ${byFixture.size} fixture(s)\n`,
  );

  const allScores: RubricScore[] = [];
  let failed = 0;

  for (const [fixtureId, gens] of byFixture) {
    const fixture = fixtures.find((f) => f.id === fixtureId);
    if (!fixture) {
      console.error(`[judge] no fixture matching ${fixtureId}, skipping`);
      continue;
    }
    process.stdout.write(`[judge] ${fixtureId} (${gens.length} langs) ...`);
    try {
      const result = await judgeFixture(fixture, gens);
      for (const langResult of result.per_language) {
        const fullScores: Record<DimensionName, { score: 1 | 2 | 3 | 4 | 5; evidence: string }> = {
          ...langResult.scores,
          cross_lang_consistency: result.cross_lang_consistency,
        };
        const rubricScore: RubricScore = {
          fixture_id: fixtureId,
          language: langResult.language,
          prompt_version: promptVersion,
          scores: fullScores,
          overall_pass: computeOverallPass(fullScores),
          notes: langResult.notes,
        };
        allScores.push(rubricScore);
        const filepath = path.join(
          runDir,
          `${fixtureId}-${langResult.language}.score.json`,
        );
        await writeJson(filepath, rubricScore);
      }
      process.stdout.write(" ok\n");
    } catch (err) {
      process.stdout.write(
        `\n[judge] ${fixtureId} FAILED: ${(err as Error).message}\n`,
      );
      failed++;
    }
  }

  const aggregate: ScoresFile = {
    prompt_version: promptVersion,
    judged_at: new Date().toISOString(),
    judge_model: JUDGE_MODEL,
    scores: allScores,
  };
  const aggregatePath = SCORES_PATH(promptVersion);
  await writeJson(aggregatePath, aggregate);

  const passing = allScores.filter((s) => s.overall_pass).length;
  console.log(
    `\nJudged ${allScores.length} outputs (${passing} pass, ${allScores.length - passing} fail). Aggregate: ${aggregatePath}`,
  );
  if (failed > 0) {
    console.log(`${failed} fixture judgings failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
