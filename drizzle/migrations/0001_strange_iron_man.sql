CREATE TABLE `company_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150),
	`email` varchar(150),
	`website` varchar(255),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` int,
	CONSTRAINT `company_settings_id` PRIMARY KEY(`id`)
);
