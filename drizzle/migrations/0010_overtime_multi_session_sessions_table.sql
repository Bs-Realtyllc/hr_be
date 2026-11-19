CREATE TABLE `overtime_request_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`overtime_request_id` int NOT NULL,
	`clock_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `overtime_request_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `overtime_requests` DROP FOREIGN KEY `overtime_requests_clock_id_employee_daily_clock_id_fk`;
--> statement-breakpoint
ALTER TABLE `overtime_request_sessions` ADD CONSTRAINT `ot_req_sessions_request_fk` FOREIGN KEY (`overtime_request_id`) REFERENCES `overtime_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_request_sessions` ADD CONSTRAINT `ot_req_sessions_clock_fk` FOREIGN KEY (`clock_id`) REFERENCES `employee_daily_clock`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `overtime_request_id` ON `overtime_request_sessions` (`overtime_request_id`);--> statement-breakpoint
CREATE INDEX `clock_id` ON `overtime_request_sessions` (`clock_id`);--> statement-breakpoint
ALTER TABLE `overtime_requests` DROP COLUMN `clock_id`;