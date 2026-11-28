CREATE TABLE `issue_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issue_id` int NOT NULL,
	`linked_issue_id` int NOT NULL,
	`link_type` enum('blocks','relates_to','duplicates') NOT NULL,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`company_id` int NOT NULL DEFAULT 1,
	CONSTRAINT `issue_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_issue_link` UNIQUE(`issue_id`,`linked_issue_id`,`link_type`)
);
--> statement-breakpoint
ALTER TABLE `issues` ADD `type` enum('epic','story','task','bug','subtask') DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `parent_issue_id` int;--> statement-breakpoint
ALTER TABLE `issue_links` ADD CONSTRAINT `issue_links_issue_id_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_links` ADD CONSTRAINT `issue_links_linked_issue_id_issues_id_fk` FOREIGN KEY (`linked_issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_links` ADD CONSTRAINT `issue_links_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_issue_links_issue_id` ON `issue_links` (`issue_id`);--> statement-breakpoint
CREATE INDEX `idx_issue_links_linked_issue_id` ON `issue_links` (`linked_issue_id`);--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_parent_issue_id_issues_id_fk` FOREIGN KEY (`parent_issue_id`) REFERENCES `issues`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_issues_parent_issue_id` ON `issues` (`parent_issue_id`);