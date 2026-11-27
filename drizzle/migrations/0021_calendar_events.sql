CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_datetime` datetime NOT NULL,
	`end_datetime` datetime NOT NULL,
	`event_type` enum('in-person','online') NOT NULL,
	`location` varchar(255),
	`meet_link` varchar(500),
	`attendees` json,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_calendar_events_start` ON `calendar_events` (`start_datetime`);--> statement-breakpoint
CREATE INDEX `idx_calendar_events_created_by` ON `calendar_events` (`created_by`);