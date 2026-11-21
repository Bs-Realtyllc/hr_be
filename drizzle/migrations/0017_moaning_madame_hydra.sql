CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`short_name` varchar(20),
	`rank` int,
	`department_id` int NOT NULL,
	`reports_to_position_id` int,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `departments` ADD `head_position_id` int;--> statement-breakpoint
ALTER TABLE `employees` ADD `position_id` int;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`reports_to_position_id`) REFERENCES `positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `department_id` ON `positions` (`department_id`);--> statement-breakpoint
CREATE INDEX `reports_to_position_id` ON `positions` (`reports_to_position_id`);--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `departments_head_position_id_positions_id_fk` FOREIGN KEY (`head_position_id`) REFERENCES `positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `position_id` ON `employees` (`position_id`);