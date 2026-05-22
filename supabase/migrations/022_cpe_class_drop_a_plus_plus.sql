-- 022: drop the non-existent 'A++' class from the CPE CHECK constraints.
--
-- Luxembourg's energy-passport scale runs A+ (best) to I (worst) — there is no
-- 'A++'. Migration 011 mistakenly allowed it. The TypeScript CPE_CLASSES enum,
-- the Zod schemas, and the AI prompts no longer accept 'A++'; this realigns the
-- database so the constraint is not broader than the application.
--
-- Any stored 'A++' is first folded to the nearest valid class 'A+' so the
-- tightened constraint applies cleanly even if such a row exists.

UPDATE properties SET cpe_class = 'A+' WHERE cpe_class = 'A++';
UPDATE properties SET thermal_insulation_class = 'A+' WHERE thermal_insulation_class = 'A++';

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_cpe_class_check,
  ADD CONSTRAINT properties_cpe_class_check
    CHECK (cpe_class IS NULL OR cpe_class IN ('A+','A','B','C','D','E','F','G','H','I')),
  DROP CONSTRAINT IF EXISTS properties_thermal_insulation_class_check,
  ADD CONSTRAINT properties_thermal_insulation_class_check
    CHECK (thermal_insulation_class IS NULL OR thermal_insulation_class IN ('A+','A','B','C','D','E','F','G','H','I'));
