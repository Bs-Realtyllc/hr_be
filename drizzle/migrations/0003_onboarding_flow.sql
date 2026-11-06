ALTER TABLE `employee_onboarding_profile` ADD `nationality` varchar(40);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `education_info` json;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `previous_experience_info` json;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_name` varchar(150);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_relation` varchar(30);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_email` varchar(150);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_address` varchar(60);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `id_front_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `id_back_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `pan_front_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `pan_back_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `additional_document_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `contract_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `other_document_paths` json;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `confirmed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `forms_layout` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `forms_layout` ADD `updated_by` int;--> statement-breakpoint
ALTER TABLE `forms_layout` ADD CONSTRAINT `forms_layout_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `emergency_contact`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `education_level`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `institution_name`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `field_of_study`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `graduation_date`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `previous_experience`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `areas_of_interest`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `additional_info`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `tech_stack`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `nda_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `citizenship_front_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `citizenship_back_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `pan_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `passout_certificate_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` DROP COLUMN `designation`;