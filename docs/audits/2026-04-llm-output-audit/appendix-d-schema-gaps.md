# Appendix D — Schema Gap Analysis

Mapping the gap between (a) what ListingLux AI's current schemas capture and (b) what athome.lu / immotop.lu collect, plus what Luxembourg law requires from real estate ads.

## Method

- **Current schema** verified by reading `lib/schemas/property.ts`, `lib/schemas/photo-analysis.ts`, `lib/schemas/listing.ts`, `lib/schemas/property-aggregates.ts`, `lib/constants.ts` (`PROPERTY_TYPES`, `FEATURE_OPTIONS`), `lib/types.ts`, and migrations `001` through `009` in `supabase/migrations/`.
- **athome.lu fields** verified against an actual listing detail page ([id-8870920](https://www.athome.lu/en/buy/apartment/luxembourg/id-8870920.html)) which exposed every attribute below (energy class, thermal class, separate toilets count, lift, floor, gas heating, etc.) and against athome.lu's listing-form overview ([athome.lu/en/list](https://www.athome.lu/en/list)).
- **immotop.lu fields** verified against [immotop.lu/advertise-property](https://www.immotop.lu/advertise-property/), [immotop.lu/news/optimiser-l-insertion](https://www.immotop.lu/news/optimiser-l-insertion-d-une-annonce-immobiliere-n71.html), and search confirmation that listings include year of construction, floor, energy class, and monthly charges.
- **CPE legal status** confirmed via [Guichet.lu — Requesting an energy performance certificate](https://guichet.public.lu/en/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html), which states verbatim: *"Commercial real estate sales and rental advertisements should therefore indicate: the energy performance class; and the thermal insulation class; as they appear on the building's valid energy performance certificate."* The underlying instrument is the *Règlement grand-ducal modifié du 30 novembre 2007 concernant la performance énergétique des bâtiments d'habitation* (now superseded for technical aspects by the [RGD du 9 juin 2021](https://legilux.public.lu/eli/etat/leg/rgd/2021/06/09/a439/jo)). The advertisement-disclosure obligation took effect 1 July 2012.

## Gap table

| Field | Current schema? | athome.lu? | immotop.lu? | LU legal req? | Priority | Notes |
|---|---|---|---|---|---|---|
| **Energy efficiency class (CPE)** | No | Yes (`Energy Class A`) | Yes (`Energy Class BBB`) | Yes — Guichet.lu states ads "should indicate" the energy performance class; instrument: RGD 30 Nov 2007 | **P0** | Most public-facing risk: every ad is non-compliant without it. Free-text `class A`–`I` plus optional CPE expiry date. |
| **Thermal insulation class** | No | Yes (`Thermal Insulation Class A`) | Yes (paired with energy class) | Yes — same Guichet.lu provision | **P0** | Always disclosed alongside energy class on athome.lu detail pages; treat as a required pair. |
| **Transaction type (sale / rental)** | No (price field is unitless) | Yes (sale vs rent flow) | Yes (chosen first) | No — but commercial-practices law requires accurate pricing context | **P0** | The single biggest missing field. Copy/CTAs/legal disclaimers (commission, deposit) all branch on this. Without it the LLM cannot tell "€2,500/mo rent" from "€2,500 sale." |
| **Heating type** | No (closest: free-text features) | Yes (`Gas Heating: Yes`, plus oil/heat-pump/etc.) | Yes | No (technical info, not a legal ad-disclosure field) | **P1** | Often appears alongside CPE in copy; agents expect to convey it. Add as a single enum: `gas \| oil \| electric \| heat-pump \| district \| pellet \| other`. |
| **Year of construction** | No | Yes | Yes (e.g. `Built in 1972`) | No | **P1** | Standard parity field; integer year. |
| **Year of last renovation** | No | Yes (when applicable) | Yes (e.g. `Complete renovation in 2015`) | No | **P1** | Optional integer; only set when renovation occurred. |
| **Floor of unit** | No | Yes (`1st floor`) | Yes (`Second floor`) | No | **P1** | Integer; `0` for ground floor, negatives for basement units. |
| **Total floors in building** | No | Yes (visible on detail pages) | Yes | No | **P2** | Useful context but not always shown; pair with floor of unit. |
| **Monthly charges** (rentals + condos) | No | Yes (rent flow) | Yes (e.g. `200.00 €`) | No (legal requirement is for transparent pricing in commercial ads, not specifically charges; but de-facto market parity) | **P1** | Hard requirement for any rental copy — without it the AI cannot generate the charge line agents expect. Numeric, EUR/month. |
| **Availability date** | No | Yes (`To be confirmed (Dec 2027)`) | Yes | No | **P1** | Date or sentinel `immediate`; affects copy ("disponible immédiatement"). |
| **Toilets count (separate)** | No (only `bathrooms`) | Yes (`Separate Toilets: 1`) | Yes | No | **P2** | Listed as a distinct attribute on athome.lu; nice-to-have for surface-area-rich descriptions. |
| **Lift / elevator** | Partial — `elevator` exists in `FEATURE_OPTIONS` (boolean) | Yes (`Lift: Yes`) | Yes | No | Already covered | Keep as-is; the boolean flag is sufficient and matches portal granularity. |
| **Exposition (compass orientation)** | No | Sometimes (visible on detail pages, often free-text) | Sometimes | No | **P2** | Niche; only shows on premium listings. Enum `N/NE/E/SE/S/SW/W/NW`. |
| **Property type — apartment, house, penthouse, studio, duplex, villa** | Yes (current `PROPERTY_TYPES`) | Yes | Yes | n/a | Already covered | Unchanged. |
| **Triplex** | No | Yes (`/buy/apartment/triplex`) | Yes | n/a | **P1** | 2-line addition to `PROPERTY_TYPES`. |
| **Loft** | No | Yes (`/buy/apartment/loft`) | Yes | n/a | **P1** | 2-line addition to `PROPERTY_TYPES`. |
| **Attic room (chambre mansardée)** | No | Yes (athome subcategory) | Yes | n/a | **P2** | 2-line addition; very narrow segment. |
| **Ground floor (rez-de-chaussée)** | No | Yes (athome subcategory) | Yes | n/a | **P2** | 2-line addition; arguably better modelled as `floor === 0` than as a property type. Recommend `floor` field instead and skip the type. |
| **Commercial** | No | Yes (separate flow) | Yes | n/a | **Out of scope (defer)** | Triggers different fields (lease type, B2B VAT, no bedrooms). Don't add to MVP. |
| **Office** | No | Yes (separate flow) | Yes | n/a | **Out of scope (defer)** | Same as commercial — different fields, different copy register. |
| **Parking (as a primary listing)** | Partial — `parking` in `FEATURE_OPTIONS` is the *amenity*, not a standalone listing | Yes (athome lets you list a parking spot) | Yes | n/a | **Out of scope (defer)** | Standalone parking-only listings are a different surface (no bedrooms/bathrooms/sqm semantics). Defer. |
| **Land (building / non-building)** | No | Yes (athome `Land` category) | Yes | n/a | **Out of scope (defer)** | Land has no bedrooms/bathrooms/photos-of-rooms — most of the current schema and the photo-analysis pipeline don't apply. |
| **Investment building** | No | Yes (multi-unit residential) | Yes | n/a | **Out of scope (defer)** | Multi-unit yields, rent rolls, cap-rate context — wholly different schema. |

## Synthesis

### What blocks production today (P0)

Three fields are non-negotiable before any agent can use ListingLux AI in production: **transaction type (sale vs rental)**, **energy efficiency class**, and **thermal insulation class**. Transaction type is a functional block — without it, the LLM cannot pick the right vocabulary, the right CTA, or the right legal disclosures (commission paid by seller vs deposit + monthly charges for rent), so the generated copy is structurally wrong roughly half the time. The two CPE classes are a regulatory block: Luxembourg's energy-performance regime (Règlement grand-ducal modifié du 30 novembre 2007, advertisement obligation effective 1 July 2012, [confirmed by Guichet.lu](https://guichet.public.lu/en/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html)) requires both classes to appear in commercial ads. An ad missing them is non-compliant; the tool should refuse to export final copy until they are populated, or at minimum render them as a visible "REQUIRED — fill before publishing" placeholder.

### What's needed for athome.lu parity (P1)

Once the legal blockers are resolved, the parity gap is moderate: **heating type**, **year of construction**, **year of last renovation**, **floor of unit**, **monthly charges**, **availability date**, and three additional property-type values (**triplex**, **loft**, plus the existing six). All of these appear on every athome.lu detail page we inspected and are part of the immotop.lu listing flow. They are simple typed scalars (one boolean would-need-to-be-an-enum for heating; the rest are integers, dates, or short strings) and don't change the photo-analysis pipeline, the AI prompt structure, or the export formats — they slot into `propertyBase` in `lib/schemas/property.ts` as optional fields and into the form as a "Building details" section. Triplex and loft can be added to `PROPERTY_TYPES` in `lib/constants.ts` in two lines each; the schema's `z.enum(propertyTypeValues)` derivation in `property-aggregates.ts` picks them up for free.

### What to defer (P2 and out-of-scope)

**Total floors, separate-toilets count, exposition, attic room, and ground floor** are P2: they appear inconsistently across listings, are usually conveyed in free-text descriptions anyway, and the LLM can synthesise them when present in the description without a typed field. "Ground floor" specifically is better modelled as `floor === 0` than as a distinct property type. **Commercial, office, parking-only, land, and investment-building** listings are explicit out-of-scope deferrals: each one breaks core assumptions of the current schema (no bedrooms/bathrooms semantics for land or parking; B2B VAT and lease structures for commercial; multi-unit financials for investment buildings) and would require parallel form flows, parallel photo-analysis prompts, and parallel copy registers. They are not parity blockers for the residential MVP — agents who need them will keep using athome.lu directly until a follow-up phase explicitly scopes them.

## Sources

- [Guichet.lu — Energy performance certificate (Energiepass) for residential buildings](https://guichet.public.lu/en/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html) — verbatim: ads "should indicate the energy performance class and the thermal insulation class"; cites *Règlement grand-ducal modifié du 30 novembre 2007*.
- [Règlement grand-ducal du 9 juin 2021 — Legilux](https://legilux.public.lu/eli/etat/leg/rgd/2021/06/09/a439/jo) — current consolidated technical instrument on building energy performance.
- [MOLITOR — Entrée en vigueur du Règlement Grand-Ducal du 9 juin 2021](https://molitorlegal.lu/entree-en-vigueur-du-reglement-grand-ducal-du-9-juin-2021-concernant-la-performance-energetique-des-batiments/) — legal commentary on the regime.
- [athome.lu — apartment listing id-8870920 (Luxembourg-Bonnevoie)](https://www.athome.lu/en/buy/apartment/luxembourg/id-8870920.html) — fielded reference example.
- [athome.lu — list your property (form overview)](https://www.athome.lu/en/list) — five-step listing flow.
- [athome.lu — triplex for sale](https://www.athome.lu/en/buy/apartment/triplex/luxembourg), [loft for sale](https://www.athome.lu/en/buy/apartment/loft) — confirms the additional apartment subtypes.
- [immotop.lu — publish your listing](https://www.immotop.lu/advertise-property/) — required fields: contract type, property type, characteristics, address, description, photos.
- [immotop.lu — optimise your listing](https://www.immotop.lu/news/optimiser-l-insertion-d-une-annonce-immobiliere-n71.html) — listing tips referencing the typical fields.
