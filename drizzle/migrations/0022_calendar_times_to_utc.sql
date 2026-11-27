-- Calendar times become exact instants stored in UTC (see src/pkg/instant.ts).
-- Until now meetings and calendar_events held Kathmandu wall-clock time
-- (APP_TIMEZONE=Asia/Kathmandu, UTC+5:45 all year — Nepal has no DST), so
-- every row moves back 5h45m. updated_at is set to itself so this doesn't
-- look like an edit.
--
-- Meetings linked to Google that an older sync had already written in UTC
-- end up 5h45m early here; running "Sync now" (Profile → Integrations) after
-- deploying rewrites every Google meeting from 7 days ago onward with the
-- exact time from Google.
UPDATE `meetings`
SET `start_datetime` = DATE_SUB(`start_datetime`, INTERVAL 345 MINUTE),
    `end_datetime` = DATE_SUB(`end_datetime`, INTERVAL 345 MINUTE),
    `updated_at` = `updated_at`;
--> statement-breakpoint
UPDATE `calendar_events`
SET `start_datetime` = DATE_SUB(`start_datetime`, INTERVAL 345 MINUTE),
    `end_datetime` = DATE_SUB(`end_datetime`, INTERVAL 345 MINUTE),
    `updated_at` = `updated_at`;
