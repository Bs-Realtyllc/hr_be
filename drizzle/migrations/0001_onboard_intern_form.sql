ALTER TABLE `employee_onboarding_profile` RENAME COLUMN `emergency_contact` TO `emergency_contact_name`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` RENAME COLUMN `pan_path` TO `pan_front_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` RENAME COLUMN `passout_certificate_path` TO `educational_document_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` RENAME COLUMN `nda_path` TO `signed_contract_path`;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` MODIFY COLUMN `current_address` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` MODIFY COLUMN `permanent_address` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `nationality` varchar(50);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `department` varchar(50);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `start_date` date;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `reporting_manager` varchar(100);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `employment_type` enum('full_time','part_time','contract','internship');--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `work_location` varchar(100);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_relationship` varchar(30);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_email` varchar(150);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `emergency_contact_address` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `pan_back_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `additional_document_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `offer_letter_path` varchar(255);--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` ADD `other_employment_document_path` varchar(255);--> statement-breakpoint
-- Backfill: rows saved before this migration hold bare filenames whose folder was implied by
-- the column. Upload columns now store the path relative to the app root ("uploads/...").
UPDATE `employee_onboarding_profile` SET `signed_contract_path` = CONCAT('uploads/nda/', `signed_contract_path`) WHERE `signed_contract_path` <> '' AND `signed_contract_path` NOT LIKE 'uploads/%';--> statement-breakpoint
UPDATE `employee_onboarding_profile` SET `citizenship_front_path` = CONCAT('uploads/profile/citizenship/', `citizenship_front_path`) WHERE `citizenship_front_path` <> '' AND `citizenship_front_path` NOT LIKE 'uploads/%';--> statement-breakpoint
UPDATE `employee_onboarding_profile` SET `citizenship_back_path` = CONCAT('uploads/profile/citizenship/', `citizenship_back_path`) WHERE `citizenship_back_path` <> '' AND `citizenship_back_path` NOT LIKE 'uploads/%';--> statement-breakpoint
UPDATE `employee_onboarding_profile` SET `pan_front_path` = CONCAT('uploads/profile/PAN/', `pan_front_path`) WHERE `pan_front_path` <> '' AND `pan_front_path` NOT LIKE 'uploads/%';--> statement-breakpoint
UPDATE `employee_onboarding_profile` SET `educational_document_path` = CONCAT('uploads/profile/certificate/', `educational_document_path`) WHERE `educational_document_path` <> '' AND `educational_document_path` NOT LIKE 'uploads/%';--> statement-breakpoint
UPDATE `employee_onboarding_profile` SET `photo_path` = CONCAT('uploads/profile/photo/', `photo_path`) WHERE `photo_path` <> '' AND `photo_path` NOT LIKE 'uploads/%';
