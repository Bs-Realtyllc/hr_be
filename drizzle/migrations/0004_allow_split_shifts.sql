CREATE INDEX `employee_daily_clock_employee_id_idx` ON `employee_daily_clock` (`employee_id`);--> statement-breakpoint
ALTER TABLE `employee_daily_clock` DROP INDEX `unique_employee_day`;