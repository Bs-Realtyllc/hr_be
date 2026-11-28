CREATE TABLE `module_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`assigned_at` timestamp DEFAULT (now()),
	`company_id` int NOT NULL DEFAULT 1,
	CONSTRAINT `module_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_module_member` UNIQUE(`module_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`start_date` date,
	`target_date` date NOT NULL,
	`status` enum('backlog','planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'backlog',
	`lead_id` int,
	`created_at` timestamp DEFAULT (now()),
	`company_id` int NOT NULL DEFAULT 1,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_assignments` MODIFY COLUMN `role` varchar(100) NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `issues` ADD `module_id` int;--> statement-breakpoint
ALTER TABLE `module_members` ADD CONSTRAINT `module_members_module_id_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `module_members` ADD CONSTRAINT `module_members_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `modules` ADD CONSTRAINT `modules_lead_id_employees_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_module_members_employee_id` ON `module_members` (`employee_id`);--> statement-breakpoint
CREATE INDEX `project_id` ON `modules` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_modules_status` ON `modules` (`status`);--> statement-breakpoint
ALTER TABLE `issues` ADD CONSTRAINT `issues_module_id_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE set null ON UPDATE no action;