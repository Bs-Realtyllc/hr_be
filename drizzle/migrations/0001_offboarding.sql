CREATE TABLE `employee_offboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emp_id` int NOT NULL,
	`exit_type` enum('resignation','termination','end_of_contract','non_renewal') NOT NULL,
	`reason` text,
	`notice_date` date NOT NULL,
	`last_working_day` date NOT NULL,
	`status` enum('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
	`previous_status` varchar(20) NOT NULL,
	`relieving_letter_path` varchar(255),
	`completed_at` timestamp,
	`cancelled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `employee_offboarding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_offboarding_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offboarding_id` int NOT NULL,
	`category` enum('hr','it','finance','manager') NOT NULL,
	`title` varchar(150) NOT NULL,
	`status` enum('pending','completed','not_applicable') NOT NULL DEFAULT 'pending',
	`notes` text,
	`completed_by` int,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `employee_offboarding_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employee_offboarding` ADD CONSTRAINT `employee_offboarding_emp_id_employees_id_fk` FOREIGN KEY (`emp_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_offboarding` ADD CONSTRAINT `employee_offboarding_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_offboarding` ADD CONSTRAINT `employee_offboarding_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_offboarding_tasks` ADD CONSTRAINT `employee_offboarding_tasks_completed_by_employees_id_fk` FOREIGN KEY (`completed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_offboarding_tasks` ADD CONSTRAINT `employee_offboarding_tasks_offboarding_id_fk` FOREIGN KEY (`offboarding_id`) REFERENCES `employee_offboarding`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_employee_offboarding_emp_id` ON `employee_offboarding` (`emp_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_offboarding_tasks_offboarding_id` ON `employee_offboarding_tasks` (`offboarding_id`);