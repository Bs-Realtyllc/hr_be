ALTER TABLE `issue_labels` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `milestones` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_assignments` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_services` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `company_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_issues_company_id` ON `issues` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_company_id` ON `projects` (`company_id`);