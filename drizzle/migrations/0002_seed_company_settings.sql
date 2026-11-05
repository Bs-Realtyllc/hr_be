-- Ensures company_settings always has exactly one row, so application code
-- never needs an insert branch and can rely on real row-level locking.
INSERT INTO `company_settings` (`id`, `name`, `email`, `website`)
SELECT 1, NULL, NULL, NULL FROM (SELECT 1) AS `t`
WHERE NOT EXISTS (SELECT 1 FROM `company_settings`);
