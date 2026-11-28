ALTER TABLE `issues` ADD `sequence_number` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `code` varchar(10);--> statement-breakpoint
ALTER TABLE `projects` ADD `issue_counter` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `unique_project_code` UNIQUE(`code`);