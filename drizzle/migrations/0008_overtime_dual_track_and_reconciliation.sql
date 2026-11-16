ALTER TABLE `overtime_requests` MODIFY COLUMN `approved_by_name` varchar(150);--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `request_type` enum('planned','worked') DEFAULT 'worked' NOT NULL;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `approved_despite_mismatch` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `actual_hours` decimal(4,2);--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `reconciled_at` timestamp;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD `reconciled_by` int;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_reconciled_by_employees_id_fk` FOREIGN KEY (`reconciled_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;