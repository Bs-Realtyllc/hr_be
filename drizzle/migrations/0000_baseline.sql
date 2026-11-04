CREATE TABLE `access_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`trace_id` varchar(36) NOT NULL,
	`employee_id` bigint,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`ip_address` varchar(45),
	`response_status` smallint NOT NULL,
	`response_duration_ms` int,
	`user_agent` varchar(500),
	`request_timestamp` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `culture_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`event_type` enum('birthday','anniversary','team_event','milestone') NOT NULL,
	`employee_id` int,
	`event_date` date NOT NULL,
	`description` text,
	`slack_notified` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `culture_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `designations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`department_id` int,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `designations_id` PRIMARY KEY(`id`),
	CONSTRAINT `title` UNIQUE(`title`)
);
--> statement-breakpoint
CREATE TABLE `email_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`smtp_host` varchar(255) NOT NULL DEFAULT 'smtp.gmail.com',
	`smtp_port` int NOT NULL DEFAULT 587,
	`smtp_user` varchar(255) NOT NULL,
	`smtp_pass` varchar(255) NOT NULL,
	`smtp_from` varchar(255),
	`default_to` text,
	`default_cc` text,
	`default_bcc` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `email_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `employee_id` UNIQUE(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `employee_clock_pauses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clock_id` int NOT NULL,
	`pause` timestamp DEFAULT (now()),
	`resume` timestamp,
	`reason` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_clock_pauses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_compensation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`salary` decimal(10,2) NOT NULL,
	`pay_frequency` enum('monthly','biweekly','weekly') NOT NULL DEFAULT 'monthly',
	`effective_from` date NOT NULL,
	`effective_to` date,
	`change_reason` varchar(255),
	`changed_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `employee_compensation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_daily_clock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`clock_in` timestamp DEFAULT (now()),
	`clock_out` timestamp,
	`clock_date` date DEFAULT (curdate()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_daily_clock_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_employee_day` UNIQUE(`employee_id`,`clock_date`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emp_id` int NOT NULL,
	`url` varchar(255),
	`name` varchar(100) NOT NULL,
	`filename` varchar(255) NOT NULL,
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_onboarding_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`gender` enum('male','female','other','prefer_not_to_say'),
	`dob` date,
	`email` varchar(150) NOT NULL,
	`phone` varchar(20),
	`current_address` varchar(60),
	`permanent_address` varchar(60),
	`emergency_contact` varchar(150),
	`education_level` varchar(50),
	`institution_name` varchar(50),
	`field_of_study` varchar(50),
	`graduation_date` date,
	`previous_experience` text,
	`is_active` tinyint DEFAULT 1,
	`areas_of_interest` text,
	`linkedin_url` varchar(255),
	`github_url` varchar(255),
	`portfolio_url` varchar(255),
	`role` enum('intern','employee') NOT NULL,
	`additional_info` text,
	`tech_stack` json,
	`nda_path` varchar(255),
	`citizenship_front_path` varchar(255),
	`citizenship_back_path` varchar(255),
	`pan_path` varchar(255),
	`passout_certificate_path` varchar(255),
	`photo_path` varchar(255),
	`designation` varchar(100),
	`source` varchar(20) NOT NULL DEFAULT 'manual',
	`source_application_id` varchar(100),
	CONSTRAINT `employee_onboarding_profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `uq_onboarding_source_application` UNIQUE(`source_application_id`)
);
--> statement-breakpoint
CREATE TABLE `employee_tax_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`panNo` varchar(50) NOT NULL,
	`month` tinyint NOT NULL,
	`year` smallint NOT NULL,
	`amount` decimal(10,2),
	`tax_amount` decimal(10,2),
	`tax_perc` decimal(5,2),
	CONSTRAINT `employee_tax_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_employee_tax_profiles_pan_month_year` UNIQUE(`panNo`,`month`,`year`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`gender` enum('male','female','other','prefer_not_to_say'),
	`email` varchar(150) NOT NULL,
	`secondary_email` varchar(150),
	`phone` varchar(20),
	`emergency_contact` varchar(150),
	`profile_picture` varchar(255),
	`designation` varchar(100),
	`designation_id` int,
	`department` varchar(100),
	`department_id` int,
	`manager_id` int,
	`start_date` date,
	`dob` date,
	`github_url` varchar(255),
	`address` text,
	`discord_username` varchar(100),
	`panNo` varchar(50),
	`timezone` varchar(50) DEFAULT 'UTC',
	`work_hours` varchar(50) DEFAULT '9 AM - 5 PM',
	`role` enum('admin','lead','employee','intern') NOT NULL DEFAULT 'employee',
	`password_hash` varchar(255),
	`salary` decimal(10,2),
	`pay_frequency` enum('monthly','biweekly','weekly') DEFAULT 'monthly',
	`status` enum('onboarding','active','on_leave','probation','terminated') NOT NULL DEFAULT 'active',
	`leave_policy_accepted` tinyint DEFAULT 0,
	`leave_policy_accepted_at` timestamp,
	`two_factor_enabled` tinyint NOT NULL DEFAULT 0,
	`two_factor_secret` varchar(255),
	`two_factor_backup_codes` json,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `discord_username` UNIQUE(`discord_username`),
	CONSTRAINT `panNo` UNIQUE(`panNo`)
);
--> statement-breakpoint
CREATE TABLE `feedback_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_employee_id` int NOT NULL,
	`to_employee_id` int NOT NULL,
	`feedback_type` enum('praise','constructive','peer','manager') DEFAULT 'praise',
	`visibility` enum('public','private') DEFAULT 'public',
	`message` text NOT NULL,
	`project_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `feedback_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms_layout` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`data` json NOT NULL,
	CONSTRAINT `forms_layout_id` PRIMARY KEY(`id`),
	CONSTRAINT `name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` enum('individual','team','company') DEFAULT 'individual',
	`metric_unit` varchar(30) DEFAULT '%',
	`target_value` decimal(12,2) DEFAULT '100.00',
	`current_value` decimal(12,2) DEFAULT '0.00',
	`weight` int DEFAULT 3,
	`status` enum('not_started','in_progress','at_risk','completed','missed') DEFAULT 'not_started',
	`start_date` date,
	`due_date` date,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`token_expiry` datetime,
	`channel_id` varchar(255),
	`resource_id` varchar(255),
	`channel_expiry` datetime,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`message` text,
	`holiday_date` date NOT NULL,
	`year` year NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`),
	CONSTRAINT `holiday_date` UNIQUE(`holiday_date`)
);
--> statement-breakpoint
CREATE TABLE `inbox_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inbox_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_channel_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`role` enum('admin','member','readonly') NOT NULL DEFAULT 'member',
	`joined_at` timestamp DEFAULT (now()),
	`last_read_at` timestamp,
	CONSTRAINT `inbox_channel_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_ch_member` UNIQUE(`channel_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('text','voice','announcement') NOT NULL DEFAULT 'text',
	`category` enum('text','voice') NOT NULL DEFAULT 'text',
	`description` varchar(500),
	`position` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` int,
	`updated_by` int,
	`required_role` enum('admin','lead','employee','intern') NOT NULL DEFAULT 'intern',
	`is_archived` tinyint NOT NULL DEFAULT 0,
	`category_id` int,
	`is_private` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `inbox_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_dm_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_employee_id` int NOT NULL,
	`to_employee_id` int NOT NULL,
	`content` text NOT NULL,
	`is_edited` tinyint NOT NULL DEFAULT 0,
	`is_read` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	CONSTRAINT `inbox_dm_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`emoji` varchar(12) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `inbox_message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_reaction` UNIQUE(`message_id`,`employee_id`,`emoji`)
);
--> statement-breakpoint
CREATE TABLE `inbox_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`content` text NOT NULL,
	`is_edited` tinyint NOT NULL DEFAULT 0,
	`is_pinned` tinyint NOT NULL DEFAULT 0,
	`reply_to_id` int,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	`reply_to_content` varchar(500),
	`reply_to_author` varchar(100),
	CONSTRAINT `inbox_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_notification_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`mode` enum('all','mentions','none') NOT NULL DEFAULT 'all',
	`muted_until` timestamp,
	CONSTRAINT `inbox_notification_prefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_notif_pref` UNIQUE(`channel_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_presence` (
	`employee_id` int NOT NULL,
	`status` enum('online','away','dnd','offline') NOT NULL DEFAULT 'offline',
	`last_seen` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `inbox_presence_employee_id` PRIMARY KEY(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_saved_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`message_id` int NOT NULL,
	`saved_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inbox_saved_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_employee_message` UNIQUE(`employee_id`,`message_id`)
);
--> statement-breakpoint
CREATE TABLE `inbox_voice_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`joined_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `inbox_voice_presence_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_voice_presence` UNIQUE(`channel_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `leave_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`leave_type` enum('sick','bereavement','maternity','paternity') NOT NULL,
	`total` int DEFAULT 0,
	`taken` int DEFAULT 0,
	`year` year NOT NULL,
	CONSTRAINT `leave_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_balance` UNIQUE(`employee_id`,`leave_type`,`year`)
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`leave_type` enum('sick','bereavement','maternity','paternity','casual','annual') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `leave_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int,
	`email` varchar(255) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`success` tinyint NOT NULL,
	`failure_reason` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_datetime` datetime NOT NULL,
	`end_datetime` datetime NOT NULL,
	`attendees` json,
	`google_event_id` varchar(255),
	`meet_link` varchar(500),
	`status` enum('scheduled','cancelled') NOT NULL DEFAULT 'scheduled',
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_google_event` UNIQUE(`google_event_id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`due_date` date NOT NULL,
	`status` enum('pending','in_progress','completed') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`month` tinyint NOT NULL,
	`year` smallint NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int,
	`notes` text,
	`submitted_at` timestamp DEFAULT (now()),
	CONSTRAINT `monthly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`notification_type` varchar(64) NOT NULL,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_notification_preferences_employee_type` UNIQUE(`employee_id`,`notification_type`)
);
--> statement-breakpoint
CREATE TABLE `operation_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`trace_id` varchar(36) NOT NULL,
	`employee_id` bigint,
	`operation` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 5,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `overtime_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`project_id` int,
	`work_date` date NOT NULL,
	`hours` decimal(4,2) NOT NULL,
	`reason` text NOT NULL,
	`approved_by_name` varchar(150) NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`hourly_rate` decimal(12,2),
	`overtime_rate` decimal(12,2),
	`amount` decimal(12,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `overtime_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `token` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `payroll_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`type` enum('overtime_pay','leave_deduction','leave_bonus') NOT NULL,
	`title` varchar(150) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`year` year NOT NULL,
	`month` tinyint,
	`reference_type` enum('overtime_request','leave_request'),
	`reference_id` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payroll_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`reviewer_id` int,
	`review_period` varchar(20) NOT NULL,
	`overall_rating` decimal(2,1),
	`category_ratings` json,
	`strengths` text,
	`improvements` text,
	`manager_comments` text,
	`employee_comments` text,
	`status` enum('draft','submitted','acknowledged') DEFAULT 'draft',
	`submitted_at` timestamp,
	`acknowledged_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` int,
	CONSTRAINT `performance_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_review_period` UNIQUE(`employee_id`,`review_period`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`uploaded_by` int,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`category` varchar(30) NOT NULL DEFAULT 'policy',
	`is_pinned` tinyint DEFAULT 0,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policy_acknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policy_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`signed_file_path` varchar(255) NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`rejection_reason` text,
	`submitted_at` timestamp DEFAULT (now()),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	CONSTRAINT `policy_acknowledgements_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_policy_employee` UNIQUE(`policy_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `project_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`employee_id` int NOT NULL,
	`role` varchar(100) NOT NULL DEFAULT 'developer',
	`assigned_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_assignment` UNIQUE(`project_id`,`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `project_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`service_key` varchar(50) NOT NULL,
	`assigned_at` timestamp DEFAULT (now()),
	CONSTRAINT `project_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_project_service` UNIQUE(`project_id`,`service_key`)
);
--> statement-breakpoint
CREATE TABLE `project_todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`deadline` date,
	`is_complete` tinyint NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` int,
	`updated_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_todos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`repo_url` varchar(255),
	`docs_url` varchar(255),
	`status` enum('active','archived','on_hold') DEFAULT 'active',
	`roadmap_key` varchar(50),
	`roadmap_label` varchar(100),
	`public_link` varchar(255),
	`start_date` date,
	`expected_end_date` date,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int,
	`name` varchar(100) NOT NULL,
	`environment` enum('development','staging','production') NOT NULL,
	`ip_address` varchar(45),
	`domain` varchar(255),
	`ssh_user` varchar(100),
	`notes` text,
	`is_sensitive` tinyint DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`service_name` varchar(100) NOT NULL,
	`username` varchar(255),
	`password` varchar(255),
	`notes` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp DEFAULT (now()),
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `service_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_employee_service` UNIQUE(`employee_id`,`service_name`)
);
--> statement-breakpoint
CREATE TABLE `standups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`workedOn` text,
	`completed` text,
	`inProgress` text,
	`nextUp` text,
	`blockers` text,
	`links` text,
	`standup_date` date NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	`updated_by` int,
	CONSTRAINT `standups_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_employee_standup_date` UNIQUE(`employee_id`,`standup_date`)
);
--> statement-breakpoint
CREATE TABLE `trusted_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trusted_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_trusted_devices_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `two_factor_email_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `two_factor_email_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`week_start_date` date NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int,
	`notes` text,
	`submitted_at` timestamp DEFAULT (now()),
	CONSTRAINT `weekly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `culture_events` ADD CONSTRAINT `culture_events_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `culture_events` ADD CONSTRAINT `culture_events_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `culture_events` ADD CONSTRAINT `culture_events_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `designations` ADD CONSTRAINT `designations_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_settings` ADD CONSTRAINT `email_settings_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_settings` ADD CONSTRAINT `email_settings_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_settings` ADD CONSTRAINT `email_settings_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_clock_pauses` ADD CONSTRAINT `employee_clock_pauses_clock_id_employee_daily_clock_id_fk` FOREIGN KEY (`clock_id`) REFERENCES `employee_daily_clock`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_compensation_history` ADD CONSTRAINT `employee_compensation_history_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_compensation_history` ADD CONSTRAINT `employee_compensation_history_changed_by_employees_id_fk` FOREIGN KEY (`changed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_daily_clock` ADD CONSTRAINT `employee_daily_clock_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_emp_id_employees_id_fk` FOREIGN KEY (`emp_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_designation_id_designations_id_fk` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_notes` ADD CONSTRAINT `feedback_notes_from_employee_id_employees_id_fk` FOREIGN KEY (`from_employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_notes` ADD CONSTRAINT `feedback_notes_to_employee_id_employees_id_fk` FOREIGN KEY (`to_employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_notes` ADD CONSTRAINT `feedback_notes_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_channel_members` ADD CONSTRAINT `inbox_channel_members_channel_id_inbox_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `inbox_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_channel_members` ADD CONSTRAINT `inbox_channel_members_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_dm_messages` ADD CONSTRAINT `inbox_dm_messages_from_employee_id_employees_id_fk` FOREIGN KEY (`from_employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_dm_messages` ADD CONSTRAINT `inbox_dm_messages_to_employee_id_employees_id_fk` FOREIGN KEY (`to_employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_message_reactions` ADD CONSTRAINT `inbox_message_reactions_message_id_inbox_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `inbox_messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_message_reactions` ADD CONSTRAINT `inbox_message_reactions_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_messages` ADD CONSTRAINT `inbox_messages_channel_id_inbox_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `inbox_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_messages` ADD CONSTRAINT `inbox_messages_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_messages` ADD CONSTRAINT `inbox_messages_ibfk_3` FOREIGN KEY (`reply_to_id`) REFERENCES `inbox_messages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_notification_prefs` ADD CONSTRAINT `inbox_notification_prefs_channel_id_inbox_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `inbox_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_notification_prefs` ADD CONSTRAINT `inbox_notification_prefs_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_presence` ADD CONSTRAINT `inbox_presence_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_voice_presence` ADD CONSTRAINT `inbox_voice_presence_channel_id_inbox_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `inbox_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inbox_voice_presence` ADD CONSTRAINT `inbox_voice_presence_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leave_balances` ADD CONSTRAINT `leave_balances_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_reviewed_by_employees_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `login_history` ADD CONSTRAINT `login_history_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_reports` ADD CONSTRAINT `monthly_reports_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_reviewed_by_employees_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `overtime_requests` ADD CONSTRAINT `overtime_requests_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll_adjustments` ADD CONSTRAINT `payroll_adjustments_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_reviewer_id_employees_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policies` ADD CONSTRAINT `policies_uploaded_by_employees_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policy_acknowledgements` ADD CONSTRAINT `policy_acknowledgements_policy_id_policies_id_fk` FOREIGN KEY (`policy_id`) REFERENCES `policies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policy_acknowledgements` ADD CONSTRAINT `policy_acknowledgements_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policy_acknowledgements` ADD CONSTRAINT `policy_acknowledgements_reviewed_by_employees_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_assignments` ADD CONSTRAINT `project_assignments_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_assignments` ADD CONSTRAINT `project_assignments_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_services` ADD CONSTRAINT `project_services_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_todos` ADD CONSTRAINT `project_todos_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_todos` ADD CONSTRAINT `project_todos_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_todos` ADD CONSTRAINT `project_todos_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_credentials` ADD CONSTRAINT `service_credentials_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_credentials` ADD CONSTRAINT `service_credentials_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_credentials` ADD CONSTRAINT `service_credentials_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `standups` ADD CONSTRAINT `standups_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `standups` ADD CONSTRAINT `standups_created_by_employees_id_fk` FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `standups` ADD CONSTRAINT `standups_updated_by_employees_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trusted_devices` ADD CONSTRAINT `trusted_devices_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `two_factor_email_tokens` ADD CONSTRAINT `two_factor_email_tokens_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_reports` ADD CONSTRAINT `weekly_reports_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employee_id` ON `culture_events` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_culture_events_date` ON `culture_events` (`event_date`);--> statement-breakpoint
CREATE INDEX `department_id` ON `designations` (`department_id`);--> statement-breakpoint
CREATE INDEX `clock_id` ON `employee_clock_pauses` (`clock_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_comp_history_employee` ON `employee_compensation_history` (`employee_id`,`effective_from`);--> statement-breakpoint
CREATE INDEX `changed_by` ON `employee_compensation_history` (`changed_by`);--> statement-breakpoint
CREATE INDEX `idx_employee_documents_emp_name` ON `employee_documents` (`emp_id`,`name`);--> statement-breakpoint
CREATE INDEX `manager_id` ON `employees` (`manager_id`);--> statement-breakpoint
CREATE INDEX `from_employee_id` ON `feedback_notes` (`from_employee_id`);--> statement-breakpoint
CREATE INDEX `to_employee_id` ON `feedback_notes` (`to_employee_id`);--> statement-breakpoint
CREATE INDEX `project_id` ON `feedback_notes` (`project_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `goals` (`employee_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `goals` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_ch_member_emp` ON `inbox_channel_members` (`employee_id`);--> statement-breakpoint
CREATE INDEX `from_employee_id` ON `inbox_dm_messages` (`from_employee_id`);--> statement-breakpoint
CREATE INDEX `to_employee_id` ON `inbox_dm_messages` (`to_employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `inbox_message_reactions` (`employee_id`);--> statement-breakpoint
CREATE INDEX `channel_id` ON `inbox_messages` (`channel_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `inbox_messages` (`employee_id`);--> statement-breakpoint
CREATE INDEX `reply_to_id` ON `inbox_messages` (`reply_to_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `inbox_notification_prefs` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_employee_saved` ON `inbox_saved_messages` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_message_saved` ON `inbox_saved_messages` (`message_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `inbox_voice_presence` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `leave_requests` (`employee_id`);--> statement-breakpoint
CREATE INDEX `reviewed_by` ON `leave_requests` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_leave_requests_status_employee` ON `leave_requests` (`status`,`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_leave_requests_status_dates` ON `leave_requests` (`status`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `idx_login_history_employee_created` ON `login_history` (`employee_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `created_by` ON `meetings` (`created_by`);--> statement-breakpoint
CREATE INDEX `project_id` ON `milestones` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_milestones_status` ON `milestones` (`status`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `monthly_reports` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_preferences_employee` ON `notification_preferences` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `otp_codes` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `overtime_requests` (`employee_id`);--> statement-breakpoint
CREATE INDEX `project_id` ON `overtime_requests` (`project_id`);--> statement-breakpoint
CREATE INDEX `reviewed_by` ON `overtime_requests` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_overtime_requests_status_employee` ON `overtime_requests` (`status`,`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_overtime_requests_work_date` ON `overtime_requests` (`work_date`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `password_reset_tokens` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `payroll_adjustments` (`employee_id`);--> statement-breakpoint
CREATE INDEX `reviewer_id` ON `performance_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_performance_reviews_status_employee` ON `performance_reviews` (`status`,`employee_id`);--> statement-breakpoint
CREATE INDEX `uploaded_by` ON `policies` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `policy_acknowledgements` (`employee_id`);--> statement-breakpoint
CREATE INDEX `reviewed_by` ON `policy_acknowledgements` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_policy_ack_status` ON `policy_acknowledgements` (`status`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `project_assignments` (`employee_id`);--> statement-breakpoint
CREATE INDEX `project_id` ON `project_todos` (`project_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `project_todos` (`created_by`);--> statement-breakpoint
CREATE INDEX `updated_by` ON `project_todos` (`updated_by`);--> statement-breakpoint
CREATE INDEX `idx_projects_status` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `project_id` ON `servers` (`project_id`);--> statement-breakpoint
CREATE INDEX `created_by` ON `service_credentials` (`created_by`);--> statement-breakpoint
CREATE INDEX `updated_by` ON `service_credentials` (`updated_by`);--> statement-breakpoint
CREATE INDEX `idx_standups_date` ON `standups` (`standup_date`);--> statement-breakpoint
CREATE INDEX `idx_trusted_devices_employee` ON `trusted_devices` (`employee_id`);--> statement-breakpoint
CREATE INDEX `idx_two_factor_email_tokens_employee` ON `two_factor_email_tokens` (`employee_id`);--> statement-breakpoint
CREATE INDEX `employee_id` ON `weekly_reports` (`employee_id`);