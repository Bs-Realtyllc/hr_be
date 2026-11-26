CREATE TABLE `document_acknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`signed_file_path` varchar(255),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejection_reason` text,
	`submitted_at` timestamp DEFAULT (now()),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	CONSTRAINT `document_acknowledgements_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_document_employee` UNIQUE(`document_id`,`employee_id`)
);
--> statement-breakpoint
ALTER TABLE `access_log` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `operation_log` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documents` ADD `document_type` varchar(50);--> statement-breakpoint
ALTER TABLE `documents` ADD `requires_acknowledgement` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `document_acknowledgements` ADD CONSTRAINT `document_acknowledgements_document_id_documents_id_fk` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_acknowledgements` ADD CONSTRAINT `document_acknowledgements_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_acknowledgements` ADD CONSTRAINT `document_acknowledgements_reviewed_by_employees_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_doc_ack_employee` ON `document_acknowledgements` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_doc_ack_document` ON `document_acknowledgements` (`document_id`);--> statement-breakpoint
CREATE INDEX `idx_doc_ack_status` ON `document_acknowledgements` (`status`);--> statement-breakpoint
CREATE INDEX `idx_access_trace` ON `access_log` (`trace_id`);--> statement-breakpoint
CREATE INDEX `idx_access_employee_created` ON `access_log` (`employee_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_documents_document_type` ON `documents` (`document_type`);--> statement-breakpoint
CREATE INDEX `idx_operation_trace` ON `operation_log` (`trace_id`);--> statement-breakpoint
CREATE INDEX `idx_operation_employee_created` ON `operation_log` (`employee_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `access_log` DROP PRIMARY KEY, ADD PRIMARY KEY(`id`,`created_at`);--> statement-breakpoint
ALTER TABLE `operation_log` DROP PRIMARY KEY, ADD PRIMARY KEY(`id`,`created_at`);