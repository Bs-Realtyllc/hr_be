-- Custom SQL migration file, put your code below! --
-- Reverses migrations 0017-0020: drops the position-management tables and
-- restores the designations catalog plus the designation/department/manager
-- columns on employees that position management had replaced.

CREATE TABLE `designations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`department_id` int,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `designations_id` PRIMARY KEY(`id`),
	CONSTRAINT `title` UNIQUE(`title`)
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `designation` varchar(100);
--> statement-breakpoint
ALTER TABLE `employees` ADD `designation_id` int;
--> statement-breakpoint
ALTER TABLE `employees` ADD `department` varchar(100);
--> statement-breakpoint
ALTER TABLE `employees` ADD `department_id` int;
--> statement-breakpoint
ALTER TABLE `employees` ADD `manager_id` int;
--> statement-breakpoint

-- Carry forward existing position-management data before the source tables
-- are dropped: one designations row per distinct position title, each
-- employee's designation/department pulled from their primary position,
-- and manager_id resolved by walking the position's reports-to chain to
-- whoever currently holds that seat.

INSERT INTO `designations` (`title`, `department_id`, `is_active`, `created_at`)
SELECT `title`, MIN(`department_id`), 1, NOW() FROM `positions` GROUP BY `title`;
--> statement-breakpoint
UPDATE `employees` e
JOIN `employee_positions` ep ON ep.`employee_id` = e.`id` AND ep.`is_primary` = 1
JOIN `positions` p ON p.`id` = ep.`position_id`
JOIN `designations` ds ON ds.`title` = p.`title`
LEFT JOIN `departments` d ON d.`id` = p.`department_id`
SET e.`designation` = p.`title`,
    e.`designation_id` = ds.`id`,
    e.`department` = d.`name`,
    e.`department_id` = p.`department_id`;
--> statement-breakpoint
UPDATE `employees` e
JOIN `employee_positions` ep ON ep.`employee_id` = e.`id` AND ep.`is_primary` = 1
JOIN `positions` p ON p.`id` = ep.`position_id`
JOIN `employee_positions` mgr_ep ON mgr_ep.`position_id` = p.`reports_to_position_id`
SET e.`manager_id` = mgr_ep.`employee_id`
WHERE p.`reports_to_position_id` IS NOT NULL;
--> statement-breakpoint

ALTER TABLE `employees` ADD CONSTRAINT `employees_designation_id_designations_id_fk` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `manager_id` ON `employees` (`manager_id`);
--> statement-breakpoint
DROP TABLE `employee_positions`;
--> statement-breakpoint
ALTER TABLE `departments` DROP FOREIGN KEY `departments_head_position_id_positions_id_fk`;
--> statement-breakpoint
ALTER TABLE `departments` DROP COLUMN `head_position_id`;
--> statement-breakpoint
DROP TABLE `positions`;
