ALTER TABLE `employees` ADD `employee_id` varchar(8);--> statement-breakpoint
ALTER TABLE `employees` ADD `nationality` varchar(40);--> statement-breakpoint
ALTER TABLE `employees` ADD `current_address` varchar(60);--> statement-breakpoint
ALTER TABLE `employees` ADD `permanent_address` varchar(60);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergency_contact_name` varchar(150);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergency_contact_relation` varchar(30);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergency_contact_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergency_contact_email` varchar(150);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergency_contact_address` varchar(60);--> statement-breakpoint
ALTER TABLE `employees` ADD `work_location` enum('remote','onsite','hybrid') DEFAULT 'onsite';--> statement-breakpoint
ALTER TABLE `employees` ADD `account_holder_name` varchar(100);--> statement-breakpoint
ALTER TABLE `employees` ADD `account_number` varchar(50);--> statement-breakpoint
ALTER TABLE `employees` ADD `bank_name` varchar(50);--> statement-breakpoint
ALTER TABLE `employees` ADD `bank_branch_name` varchar(50);--> statement-breakpoint
ALTER TABLE `employees` ADD `account_type` varchar(50);--> statement-breakpoint
ALTER TABLE `employees` ADD `linkedin_url` varchar(255);--> statement-breakpoint
ALTER TABLE `employees` ADD `portfolio_url` varchar(255);--> statement-breakpoint
ALTER TABLE `employees` ADD `education_info` json;--> statement-breakpoint
ALTER TABLE `employees` ADD `previous_experience_info` json;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `emergency_contact`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `address`;