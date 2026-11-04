ALTER TABLE `culture_events` MODIFY COLUMN `slack_notified` boolean;--> statement-breakpoint
ALTER TABLE `culture_events` MODIFY COLUMN `slack_notified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `designations` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `employee_onboarding_profile` MODIFY COLUMN `role` enum('intern','employee','admin') NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `status` enum('onboarding','active','on_leave','probation','offboarding','terminated') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `leave_policy_accepted` boolean;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `leave_policy_accepted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `two_factor_enabled` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `two_factor_enabled` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `login_history` MODIFY COLUMN `success` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_preferences` MODIFY COLUMN `enabled` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `policies` MODIFY COLUMN `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `policies` MODIFY COLUMN `is_pinned` boolean;--> statement-breakpoint
ALTER TABLE `policies` MODIFY COLUMN `is_pinned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `servers` MODIFY COLUMN `is_sensitive` boolean;--> statement-breakpoint
ALTER TABLE `servers` MODIFY COLUMN `is_sensitive` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `profile_picture`;