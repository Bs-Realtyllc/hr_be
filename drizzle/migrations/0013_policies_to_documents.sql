DROP TABLE `policy_acknowledgements`;--> statement-breakpoint
RENAME TABLE `policies` TO `documents`;--> statement-breakpoint
ALTER TABLE `documents` DROP FOREIGN KEY `policies_uploaded_by_employees_id_fk`;
--> statement-breakpoint
ALTER TABLE `documents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `type` enum('file','folder') NOT NULL DEFAULT 'file';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `file_path` varchar(255);--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `category` varchar(30);--> statement-breakpoint
-- ALTER TABLE `documents` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `documents` ADD `size_bytes` bigint;--> statement-breakpoint
ALTER TABLE `documents` ADD `parent_id` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploaded_by_employees_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_parent_id_documents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `documents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` DROP COLUMN `version`;