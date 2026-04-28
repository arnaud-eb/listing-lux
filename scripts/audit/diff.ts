#!/usr/bin/env bun
/**
 * audit:diff — compares two scores-<version>.json runs and prints a per-dimension
 * delta. Used to confirm a prompt-version bump (e.g. 1.3 → 1.4) didn't regress
 * any dimension by more than 0.5 points.
 *
 * Usage:
 *   bun run scripts/audit/diff.ts --before 1.3 --after 1.4
 */

import { readJson, SCORES_PATH, type ScoresFile, type RubricScore } from "./lib";

interface Args {
  before?: string;
  after?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--before") out.before = argv[++i];
    if (argv[i] === "--after") out.after = argv[++i];
  }
  return out;
}

function avgPerDimension(scores: RubricScore[]): Record<string, number> {
  const sums: Record<string, { sum: number; n: number }> = {};
  for (const s of scores) {
    for (const [dim, v] of Object.entries(s.scores)) {
      if (!sums[dim]) sums[dim] = { sum: 0, n: 0 };
      sums[dim].sum += v.score;
      sums[dim].n += 1;
    }
  }
  const out: Record<string, number> = {};
  for (const [dim, { sum, n }] of Object.entries(sums)) {
    out[dim] = n > 0 ? sum / n : 0;
  }
  return out;
}

function passRate(scores: RubricScore[]): number {
  if (scores.length === 0) return 0;
  return scores.filter((s) => s.overall_pass).length / scores.length;
}

function regressions(
  before: Record<string, number>,
  after: Record<string, number>,
): string[] {
  const out: string[] = [];
  const dims = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const dim of dims) {
    const delta = (after[dim] ?? 0) - (before[dim] ?? 0);
    if (delta < -0.5) out.push(dim);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.before || !args.after) {
    console.error(
      "Usage: bun run scripts/audit/diff.ts --before <version> --after <version>",
    );
    process.exit(1);
  }

  const beforeFile = await readJson<ScoresFile>(SCORES_PATH(args.before));
  const afterFile = await readJson<ScoresFile>(SCORES_PATH(args.after));

  const beforeAvg = avgPerDimension(beforeFile.scores);
  const afterAvg = avgPerDimension(afterFile.scores);

  console.log(`\n# Audit diff: ${args.before} → ${args.after}\n`);
  console.log(`Judge model: ${beforeFile.judge_model} (before) vs ${afterFile.judge_model} (after)`);
  console.log(`Outputs scored: ${beforeFile.scores.length} (before) vs ${afterFile.scores.length} (after)`);
  const beforePass = (passRate(beforeFile.scores) * 100).toFixed(1);
  const afterPass = (passRate(afterFile.scores) * 100).toFixed(1);
  console.log(`Pass rate: ${beforePass}% → ${afterPass}%\n`);

  console.log("| Dimension | Before | After | Δ |");
  console.log("|---|---|---|---|");
  const dims = new Set([...Object.keys(beforeAvg), ...Object.keys(afterAvg)]);
  for (const dim of [...dims].sort()) {
    const b = beforeAvg[dim] ?? 0;
    const a = afterAvg[dim] ?? 0;
    const delta = a - b;
    const flag = delta < -0.5 ? " 🚨 REGRESSION" : delta >= 0.5 ? " ✓" : "";
    const sign = delta >= 0 ? "+" : "";
    console.log(
      `| \`${dim}\` | ${b.toFixed(2)} | ${a.toFixed(2)} | ${sign}${delta.toFixed(2)}${flag} |`,
    );
  }

  const regs = regressions(beforeAvg, afterAvg);
  if (regs.length > 0) {
    console.log(
      `\n⚠️  ${regs.length} dimension(s) regressed by more than 0.5 points: ${regs.join(", ")}`,
    );
    console.log(
      "Per the rubric, this blocks merging the prompt change. Investigate and revise.",
    );
    process.exit(1);
  } else {
    console.log("\n✓ No regressions beyond -0.5 threshold.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
