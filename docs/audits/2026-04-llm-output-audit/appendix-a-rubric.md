# Appendix A — Scoring Rubric

This rubric is the contract between every part of the audit. The fixtures are written to exercise specific dimensions; the LLM-as-judge scores against these anchors; the prompt-edit recommendations are justified by which dimensions they raise. If a finding can't be tied to a row below, it doesn't go in the audit doc.

## How scoring works

- **10 dimensions**, each scored on a 1–5 integer scale.
- The judge model is **Claude Opus 4.7** (the model under audit is **gpt-4.1-mini**).
- Each scored output produces a `RubricScore` JSON record. Every dimension's score is paired with a one-sentence `evidence` string that quotes the listing.
- **Two dimensions are hard-fail**: any score < 5 on `fair_housing` or `hallucination` flips `overall_pass` to `false` regardless of the other dimensions.
- A dimension score of `1` or `2` on any non-hard-fail dimension also flips `overall_pass` to `false`.
- `cross_lang_consistency` is special: scored **once per fixture across all 4 languages**, not per language. The judge compares the 4 outputs side-by-side.

## Output schema (machine-readable)

The judge MUST emit one JSON object per (fixture × language), using exactly this shape:

```ts
type DimensionName =
  | 'factual_fidelity'
  | 'completeness'
  | 'cross_lang_consistency'
  | 'native_quality'
  | 'market_fit'
  | 'compliance_cpe'
  | 'seo_signal'
  | 'tone_discipline'
  | 'fair_housing'
  | 'hallucination';

type Score = 1 | 2 | 3 | 4 | 5;

interface RubricScore {
  fixture_id: string;            // e.g. 'penthouse-belair-dense-01'
  language: 'de' | 'fr' | 'en' | 'lu';
  prompt_version: string;        // e.g. '1.3'
  scores: Record<DimensionName, { score: Score; evidence: string }>;
  overall_pass: boolean;         // computed: false if fair_housing<5 OR hallucination<5 OR any score<=2
  notes?: string;                // free-form judge commentary, optional
}
```

`scores.cross_lang_consistency` carries the same value across all 4 language records of the same fixture (the judge writes it once per fixture and replicates the score with shared evidence pointing to the language pairs that disagreed).

## The 10 dimensions

Each dimension below gives anchors at scores 5, 3, and 1. Scores 4 and 2 are interpolations.

### 1. `factual_fidelity` — does the output contradict its inputs?

- **5** — Every numeric, feature, and location claim in the output traces directly to the fixture's `property` or `photo_analyses`. No invented rooms. No "5-minute walk to school" without a photo source.
- **3** — One or two minor drifts (e.g. "spacious" applied to a 60 m² studio; "newly renovated" when only one room was). No hard contradictions.
- **1** — Output asserts facts that contradict the fixture: wrong sqm, wrong bedroom count, claims pool when fixture says no pool.

### 2. `completeness` — does the output use the input data?

- **5** — Output mentions all 5 of {beds, baths, sqm, price-range, neighborhood} AND ≥80% of features marked `true` in the fixture AND surfaces the 2–3 strongest signals from `photo_analyses[*].selling_points`.
- **3** — Mentions the 5 core fields but drops 30–50% of active features, OR mentions all features but omits price/sqm.
- **1** — Drops one of {sqm, price, neighborhood} entirely, OR mentions ≤30% of active features.

### 3. `cross_lang_consistency` — do DE/FR/EN/LU agree?

- **5** — The 4 language outputs agree on every numeric (price, sqm, bed/bath count), feature list, and neighborhood claim. Tone is calibrated per language but facts are identical.
- **3** — Facts agree but one language drops a feature the other 3 mention, OR one language uses a different price tier descriptor (e.g. "affordable" in EN, "premium" in FR).
- **1** — Direct numeric contradiction between languages: "3 bedrooms" in one, "2" in another, or different square meters cited.

### 4. `native_quality` — does the output read native, not translated?

- **5** — Idiomatic, no calques, register matches luxury market in that language. A native speaker would not flag the prose as machine-generated.
- **3** — Mostly native but one or two phrases feel translated (e.g. EN-shaped sentences in FR).
- **1** — Machine-translated feel throughout, grammatical errors, or wrong register (casual EN in a DE high-end listing, slang in FR luxury copy).

### 5. `market_fit` — does the vocabulary match the Luxembourg luxury corpus?

- **5** — Uses tier-appropriate vocabulary attested in athome.lu / immotop.lu / Engel & Völkers Luxembourg corpus: e.g. FR "haut de gamme", "standing", "prestations soignées"; DE "Penthouse mit Panoramablick", "hochwertige Ausstattung". Neighborhood references draw on the local descriptors.
- **3** — Generic luxury vocabulary that could appear anywhere in Europe, not specific to LU.
- **1** — Generic copy ("beautiful home", "great location") with no market specificity, OR uses vocabulary from a different market (FR France conventions instead of LU).

### 6. `compliance_cpe` — does the output handle the energy class correctly?

Luxembourg's energy passport (CPE / Energiepass) must be disclosed in real estate ads. The audit treats invented CPE classes as a hard error.

- **5** — Either uses a CPE class supplied in the fixture (rare — most fixtures omit it), OR explicitly surfaces a placeholder appropriate to the language ("Classe énergétique : à communiquer", "Energieausweis: Klasse wird nachgereicht", "Energy passport: class to be confirmed"). Never invents a class.
- **3** — Omits CPE entirely without flagging it. Acceptable for now since the field doesn't exist on the form yet, but flagged because the next version of the prompt should require the placeholder.
- **1** — **Invents** an energy class ("Classe A++", "Energieklasse A") not present in the inputs. This is illegal advertising in LU and a hard production blocker.

### 7. `seo_signal` — are hashtags and the title well-shaped for discovery?

- **5** — Title 8–15 words, includes neighborhood AND a property-defining adjective AND a key feature; hashtags include 1 architectural style + 1 amenity + 1 lifestyle, all CamelCase or single-word, no duplication of market-level tags from `lib/markets/lu.ts`.
- **3** — Title meets length but is generic ("Beautiful apartment in Luxembourg"); hashtags are the right count but skew generic ("#RealEstate", "#DreamHome").
- **1** — Title under 6 words or over 18; hashtags <3 or >5, OR exact duplicates of market-level tags.

### 8. `tone_discipline` — does the output avoid hyperbole?

The Luxembourg luxury market reads understated. Engel & Völkers prod copy is the reference.

- **5** — Zero hyperbolic adjectives ("breathtaking", "once-in-a-lifetime", "stunning", "unparalleled"). No exclamation marks. Reads like Engel & Völkers or Sotheby's prod copy.
- **3** — One or two hype words; otherwise composed.
- **1** — Five or more hype words across the description, OR exclamation marks, OR phrases like "must-see", "don't miss", "act fast".

### 9. `fair_housing` (HARD-FAIL) — does the output steer by demographics?

EU and LU housing regulations forbid advertisements that steer renters/buyers by age, family status, religion, gender, or national origin. "Perfect for young families" is a steering signal.

- **5** — Zero references to ideal occupant demographics, family status, religion, age, gender, or national origin. Describes the property and the neighborhood, not who should live there.
- **3** — Mild ambient signal that could be read as steering ("ideal for entertaining"); marginal.
- **1** — Explicit steering: "perfect for young couples", "great for families", "ideal for retirees", "Christian neighborhood", "expat-friendly area" used as a target-audience signal rather than a neighborhood description.

**Any score < 5 flips `overall_pass = false`.** A score of 1 here is a production blocker.

### 10. `hallucination` (HARD-FAIL) — does the output add unfounded specifics?

Different from `factual_fidelity`. Fidelity asks "does the output contradict inputs?". Hallucination asks "does the output add specifics that aren't in inputs and could mislead a buyer?". Real estate copy is high-stakes for hallucination — a wrong commute time is actionable misrepresentation under LU consumer law.

- **5** — Every concrete number, named place, distance, transit line, school, or amenity in the output is supported by the fixture's `property`, `photo_analyses`, or `neighborhood` data.
- **3** — One unsupported specific that's plausible (e.g. "close to public transport" without source — soft enough to defend).
- **1** — Invents a named amenity, school, distance, or transit line: "5-minute walk to Lycée Robert Schuman", "served by the Tram T1", "next to the new Apple Store" — none of which are in the fixture inputs.

**Any score < 5 flips `overall_pass = false`.**

## Inter-rater agreement protocol

Per Step 3c of the plan: 6 outputs are sampled (stratified across language and 3 dimensions of interest). The user blind-scores them using this rubric. Per-dimension agreement is computed as:

```
agreement(d) = count(judge.score[d] == user.score[d] ± 1) / 6
```

A delta of 1 counts as agreement (the rubric is anchored, not metric — adjacent scores are nearly indistinguishable in practice). Strict equality across 6 outputs would be unrealistic.

If `agreement(d) < 0.70` for any dimension `d`, the audit's findings on that dimension are flagged as **low-confidence** and may not drive P0 recommendations.

## Re-audit triggers

This rubric is also the regression contract. Re-run `audit:judge` whenever:

- `PROMPT_VERSION` in `lib/ai/prompts.ts` is bumped
- `lib/schemas/listing.ts` changes shape
- `lib/schemas/property.ts` adds or renames a field that flows into the prompt
- `lib/markets/lu.ts` (or its DB-sourced successor) changes neighborhood data the prompt consumes
- A new language is added to `LANGUAGES` in `lib/constants.ts`

A bump that drops any dimension's average by more than 0.5 points is a regression and blocks merge.
