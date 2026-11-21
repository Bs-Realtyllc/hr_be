CREATE TABLE `employee_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`position_id` int NOT NULL,
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `position_id` UNIQUE(`position_id`)
);
--> statement-breakpoint
ALTER TABLE `employees` DROP FOREIGN KEY `employees_position_id_positions_id_fk`;
--> statement-breakpoint
DROP INDEX `position_id` ON `employees`;--> statement-breakpoint
ALTER TABLE `employee_positions` ADD CONSTRAINT `employee_positions_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_positions` ADD CONSTRAINT `employee_positions_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employee_id` ON `employee_positions` (`employee_id`);--> statement-breakpoint
INSERT INTO `employee_positions` (`employee_id`, `position_id`, `is_primary`, `created_at`)
SELECT `id`, `position_id`, true, now() FROM `employees` WHERE `position_id` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `position_id`;