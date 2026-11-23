-- Rebuilds access_log and operation_log as tables partitioned by RANGE COLUMNS(created_at),
-- five buckets per calendar month (p_YYYY_MM_01/08/15/22/29), all dates UTC.
--
-- Hand-written (drizzle-kit can't express partitions); 0018_snapshot.json matches drizzle/schema.ts.
-- Rows inside the retention window (2026-08-01 .. 2026-12-08) are copied over, older rows are
-- dropped. Partitions are created for Aug 2026 .. p_2026_12_01; src/pkg/maintainLogPartitions.ts
-- (run at the end of `npm run migrate`, at app startup and daily at 03:30 UTC) adds later ones and
-- drops months that have left the retention window, so a DB migrated long after Nov 2026 catches up
-- immediately.
--
-- Session time zone is pinned to UTC so the old TIMESTAMP values are copied into DATETIME as UTC.
SET time_zone = '+00:00';--> statement-breakpoint
DROP TABLE IF EXISTS `access_log_new`;--> statement-breakpoint
CREATE TABLE `access_log_new` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trace_id` varchar(36) NOT NULL,
  `employee_id` bigint NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `ip_address` varchar(45) NULL,
  `response_status` smallint NOT NULL,
  `response_duration_ms` int NULL,
  `user_agent` varchar(500) NULL,
  `request_timestamp` timestamp NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `created_at`),
  KEY `idx_access_trace` (`trace_id`),
  KEY `idx_access_employee_created` (`employee_id`, `created_at`)
) ENGINE=InnoDB
PARTITION BY RANGE COLUMNS (`created_at`) (
  PARTITION p_2026_08_01 VALUES LESS THAN ('2026-08-08'),
  PARTITION p_2026_08_08 VALUES LESS THAN ('2026-08-15'),
  PARTITION p_2026_08_15 VALUES LESS THAN ('2026-08-22'),
  PARTITION p_2026_08_22 VALUES LESS THAN ('2026-08-29'),
  PARTITION p_2026_08_29 VALUES LESS THAN ('2026-09-01'),
  PARTITION p_2026_09_01 VALUES LESS THAN ('2026-09-08'),
  PARTITION p_2026_09_08 VALUES LESS THAN ('2026-09-15'),
  PARTITION p_2026_09_15 VALUES LESS THAN ('2026-09-22'),
  PARTITION p_2026_09_22 VALUES LESS THAN ('2026-09-29'),
  PARTITION p_2026_09_29 VALUES LESS THAN ('2026-10-01'),
  PARTITION p_2026_10_01 VALUES LESS THAN ('2026-10-08'),
  PARTITION p_2026_10_08 VALUES LESS THAN ('2026-10-15'),
  PARTITION p_2026_10_15 VALUES LESS THAN ('2026-10-22'),
  PARTITION p_2026_10_22 VALUES LESS THAN ('2026-10-29'),
  PARTITION p_2026_10_29 VALUES LESS THAN ('2026-11-01'),
  PARTITION p_2026_11_01 VALUES LESS THAN ('2026-11-08'),
  PARTITION p_2026_11_08 VALUES LESS THAN ('2026-11-15'),
  PARTITION p_2026_11_15 VALUES LESS THAN ('2026-11-22'),
  PARTITION p_2026_11_22 VALUES LESS THAN ('2026-11-29'),
  PARTITION p_2026_11_29 VALUES LESS THAN ('2026-12-01'),
  PARTITION p_2026_12_01 VALUES LESS THAN ('2026-12-08')
);--> statement-breakpoint
INSERT INTO `access_log_new` (`id`, `trace_id`, `employee_id`, `endpoint`, `method`, `ip_address`, `response_status`, `response_duration_ms`, `user_agent`, `request_timestamp`, `created_at`)
SELECT `id`, `trace_id`, `employee_id`, `endpoint`, `method`, `ip_address`, `response_status`, `response_duration_ms`, `user_agent`, `request_timestamp`, `created_at` FROM `access_log`
WHERE `created_at` >= '2026-08-01' AND `created_at` < '2026-12-08';--> statement-breakpoint
RENAME TABLE `access_log` TO `access_log_old`, `access_log_new` TO `access_log`;--> statement-breakpoint
DROP TABLE `access_log_old`;--> statement-breakpoint
DROP TABLE IF EXISTS `operation_log_new`;--> statement-breakpoint
CREATE TABLE `operation_log_new` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trace_id` varchar(36) NOT NULL,
  `employee_id` bigint NULL,
  `operation` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL,
  `metadata` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `created_at`),
  KEY `idx_operation_trace` (`trace_id`),
  KEY `idx_operation_employee_created` (`employee_id`, `created_at`)
) ENGINE=InnoDB
PARTITION BY RANGE COLUMNS (`created_at`) (
  PARTITION p_2026_08_01 VALUES LESS THAN ('2026-08-08'),
  PARTITION p_2026_08_08 VALUES LESS THAN ('2026-08-15'),
  PARTITION p_2026_08_15 VALUES LESS THAN ('2026-08-22'),
  PARTITION p_2026_08_22 VALUES LESS THAN ('2026-08-29'),
  PARTITION p_2026_08_29 VALUES LESS THAN ('2026-09-01'),
  PARTITION p_2026_09_01 VALUES LESS THAN ('2026-09-08'),
  PARTITION p_2026_09_08 VALUES LESS THAN ('2026-09-15'),
  PARTITION p_2026_09_15 VALUES LESS THAN ('2026-09-22'),
  PARTITION p_2026_09_22 VALUES LESS THAN ('2026-09-29'),
  PARTITION p_2026_09_29 VALUES LESS THAN ('2026-10-01'),
  PARTITION p_2026_10_01 VALUES LESS THAN ('2026-10-08'),
  PARTITION p_2026_10_08 VALUES LESS THAN ('2026-10-15'),
  PARTITION p_2026_10_15 VALUES LESS THAN ('2026-10-22'),
  PARTITION p_2026_10_22 VALUES LESS THAN ('2026-10-29'),
  PARTITION p_2026_10_29 VALUES LESS THAN ('2026-11-01'),
  PARTITION p_2026_11_01 VALUES LESS THAN ('2026-11-08'),
  PARTITION p_2026_11_08 VALUES LESS THAN ('2026-11-15'),
  PARTITION p_2026_11_15 VALUES LESS THAN ('2026-11-22'),
  PARTITION p_2026_11_22 VALUES LESS THAN ('2026-11-29'),
  PARTITION p_2026_11_29 VALUES LESS THAN ('2026-12-01'),
  PARTITION p_2026_12_01 VALUES LESS THAN ('2026-12-08')
);--> statement-breakpoint
INSERT INTO `operation_log_new` (`id`, `trace_id`, `employee_id`, `operation`, `status`, `metadata`, `created_at`)
SELECT `id`, `trace_id`, `employee_id`, `operation`, `status`, `metadata`, `created_at` FROM `operation_log`
WHERE `created_at` >= '2026-08-01' AND `created_at` < '2026-12-08';--> statement-breakpoint
RENAME TABLE `operation_log` TO `operation_log_old`, `operation_log_new` TO `operation_log`;--> statement-breakpoint
DROP TABLE `operation_log_old`;
