CREATE TABLE `issue_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issue_id` int NOT NULL,
	`object_key` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`uploaded_by` int,
	`created_at` timestamp DEFAULT (now()),
	`company_id` int NOT NULL DEFAULT 1,
	CONSTRAINT `issue_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `issue_attachments` ADD CONSTRAINT `issue_attachments_issue_id_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_attachments` ADD CONSTRAINT `issue_attachments_uploaded_by_employees_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_issue_attachments_issue_id` ON `issue_attachments` (`issue_id`);