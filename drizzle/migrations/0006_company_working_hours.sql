ALTER TABLE `company_settings` ADD `work_start` time;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `work_end` time;--> statement-breakpoint
ALTER TABLE `company_settings` ADD `late_grace_minutes` int DEFAULT 15;