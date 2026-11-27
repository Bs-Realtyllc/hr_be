ALTER TABLE `employees` ADD `welcome_seen_at` timestamp;--> statement-breakpoint
-- Backfill: anyone who has already logged in successfully has seen /welcome before.
UPDATE `employees` e
JOIN (SELECT `employee_id`, MIN(`created_at`) AS first_login FROM `login_history` WHERE `success` = 1 AND `employee_id` IS NOT NULL GROUP BY `employee_id`) lh
  ON lh.`employee_id` = e.`id`
SET e.`welcome_seen_at` = lh.first_login
WHERE e.`welcome_seen_at` IS NULL;
