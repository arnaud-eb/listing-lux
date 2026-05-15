#!/usr/bin/env bun
/**
 * audit:generate — runs every fixture × language through buildListingPrompt
 * and the production model (gpt-4.1-mini), writes outputs to runs/<promptVersion>/.
 *
 * Reuses the same prompt builder, schema, and OpenAI client the production
 * stream route uses (lib/ai/prompts.ts, lib/schemas/listing.ts, lib/ai/client.ts)
 * so the audit reflects what real generations produce.
 *
 * Usage:
 *   bun run scripts/audit/generate.ts                              # all fixtures, all langs
 *   bun run scripts/audit/generate.ts --fixture <id>                # one fixture, all its langs
 *   bun run scripts/audit/generate.ts --fixture <id> --lang en      # one fixture, one lang
 */

import { generateObject } from "ai";
import path from "node:path";

import { openai, LISTING_MODEL } from "@/lib/ai/client";
import { buildListingPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { getNeighborhoodBySlug } from "@/lib/markets";
import { listingOutputSchema } from "@/lib/schemas/listing";
import {
  fixtures,
  type ListingFixture,
} from "@/lib/ai/__fixtures__/properties";
import type { Language } from "@/lib/types";

import {
  ensureDir,
  writeJson,
  RUNS_DIR,
  type GenerationOutput,
} from "./lib";

interface Args {
  fixtureId?: string;
  language?: Language;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fixture") out.fixtureId = argv[++i];
    if (argv[i] === "--lang") out.language = argv[++i] as Language;
  }
  return out;
}

async function generateOne(
  fixture: ListingFixture,
  language: Language,
): Promise<GenerationOutput> {
  const neighborhood = getNeighborhoodBySlug(fixture.property.neighborhood);

  const prompt = buildListingPrompt(
    language,
    {
      bedrooms: fixture.property.bedrooms,
      bathrooms: fixture.property.bathrooms,
      sqm: fixture.property.sqm ?? null,
      price: fixture.property.price ?? null,
      neighborhood: fixture.property.neighborhood,
      property_type: fixture.property.property_type,
      features: fixture.property.features,
    },
    fixture.photo_analyses,
    neighborhood,
    fixture.user_comment,
    fixture.current_listing,
  );

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];
  if (prompt.feedback) {
    messages.push({ role: "user", content: prompt.feedback });
  }

  const result = await generateObject({
    model: openai(LISTING_MODEL),
    schema: listingOutputSchema,
    messages,
  });

  return {
    fixture_id: fixture.id,
    language,
    prompt_version: PROMPT_VERSION,
    model: LISTING_MODEL,
    generated_at: new Date().toISOString(),
    output: result.object,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const runDir = RUNS_DIR(PROMPT_VERSION);
  await ensureDir(runDir);

  const targetFixtures = args.fixtureId
    ? fixtures.filter((f) => f.id === args.fixtureId)
    : fixtures;

  if (targetFixtures.length === 0) {
    console.error(`No fixture found matching id: ${args.fixtureId}`);
    process.exit(1);
  }

  console.log(
    `Audit run: PROMPT_VERSION=${PROMPT_VERSION}, model=${LISTING_MODEL}`,
  );
  console.log(`Output dir: ${runDir}\n`);

  let count = 0;
  let failed = 0;
  for (const fixture of targetFixtures) {
    const langs: Language[] = args.language
      ? [args.language]
      : fixture.languages_to_test;

    for (const lang of langs) {
      const tag = `${fixture.id} / ${lang}`;
      try {
        process.stdout.write(`[gen] ${tag} ...`);
        const output = await generateOne(fixture, lang);
        const filepath = path.join(runDir, `${fixture.id}-${lang}.json`);
        await writeJson(filepath, output);
        process.stdout.write(` ok (${output.output.title.slice(0, 40)}...)\n`);
        count++;
      } catch (err) {
        process.stdout.write(
          `\n[gen] ${tag} FAILED: ${(err as Error).message}\n`,
        );
        failed++;
      }
    }
  }

  console.log(`\nGenerated ${count} outputs in ${runDir}`);
  if (failed > 0) {
    console.log(`${failed} generations failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
