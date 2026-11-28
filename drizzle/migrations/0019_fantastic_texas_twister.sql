CREATE TABLE `issue_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issue_id` int NOT NULL,
	`actor_id` int,
	`verb` varchar(20) NOT NULL,
	`field` varchar(50),
	`old_value` text,
	`new_value` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `issue_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issue_id` int NOT NULL,
	`body` text NOT NULL,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `issue_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_label_links` (
	`issue_id` int NOT NULL,
	`label_id` int NOT NULL,
	CONSTRAINT `issue_label_links_pk` PRIMARY KEY(`issue_id`,`label_id`)
);
--> statement-breakpoint
CREATE TABLE `issue_labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(50) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#6b7280',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `issue_labels_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_project_label_name` UNIQUE(`project_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`status` enum('backlog','todo','in_progress','done','cancelled') NOT NULL DEFAULT 'backlog',
	`priority` enum('urgent','high','medium','low','none') NOT NULL DEFAULT 'none',
	`assignee_id` int,
	`milestone_id` int,
	`due_date` date,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `issue_activity` ADD CONSTRAINT `issue_activity_issue_id_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_activity` ADD CONSTRAINT `issue_activity_actor_id_employees_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_comments` ADD CONSTRAINT `issue_comments_issue_id_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_comments` ADD CONSTRAINT `issue_comments_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_label_links` ADD CONSTRAINT `issue_label_links_issue_id_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_label_links` ADD CONSTRAINT `issue_label_links_label_id_issue_labels_id_fk` FOREIGN KEY (`label_id`) REFERENCES `issue_labels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_labels` ADD CONSTRAINT `issue_labels_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_assignee_id_employees_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_milestone_id_milestones_id_fk` FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_issue_activity_issue_id` ON `issue_activity` (`issue_id`);--> statement-breakpoint
CREATE INDEX `idx_issue_comments_issue_id` ON `issue_comments` (`issue_id`);--> statement-breakpoint
CREATE INDEX `idx_issue_label_links_label_id` ON `issue_label_links` (`label_id`);--> statement-breakpoint
CREATE INDEX `idx_issue_labels_project_id` ON `issue_labels` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_issues_project_id` ON `issues` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_issues_status` ON `issues` (`status`);--> statement-breakpoint
CREATE INDEX `idx_issues_assignee_id` ON `issues` (`assignee_id`);