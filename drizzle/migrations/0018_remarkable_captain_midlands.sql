ALTER TABLE `employees` DROP FOREIGN KEY `fk_employees_designation`;
--> statement-breakpoint
ALTER TABLE `employees` DROP FOREIGN KEY `fk_employees_department`;
--> statement-breakpoint
ALTER TABLE `employees` DROP FOREIGN KEY `employees_ibfk_1`;
--> statement-breakpoint
DROP INDEX `manager_id` ON `employees`;--> statement-breakpoint
DROP TABLE `designations`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `designation`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `designation_id`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `department`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `department_id`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `manager_id`;