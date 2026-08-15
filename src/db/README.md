# Database layer

```
src/db/
├── schema.sql             Base schema — full CREATE TABLE statements, applied first
├── migrate.ts              Runner: applies schema.sql, then migrations/*.sql in order
├── migrations/              Incremental schema changes, one file per change
├── seed/                    Demo/dev seed data (run manually, never by migrate.ts)
├── create-admin.ts         One-off script: create an admin employee account
└── migrate_employee_data.ts One-off backfill script (department/designation normalization)
```

## Migrations (`migrations/`)

- Every file is named `migrate_<description>.sql` and applied in alphabetical order by
  `npm run migrate` (`migrate.ts`). Each statement is idempotent-safe: errors with codes like
  `ER_DUP_FIELDNAME`, `ER_DUP_KEYNAME`, `ER_DUP_ENTRY`, `ER_TABLE_EXISTS_ERROR` are treated as
  "already applied" and skipped rather than failing the run.
- Applied filenames are recorded in the `schema_migrations` table so re-running `npm run migrate`
  is a no-op for files already applied.
- `migrate_zz_*.sql` files are late/patch-style migrations (e.g. added audit columns) — the `zz`
  prefix just keeps them sorted after the earlier, more foundational migrations. New migrations
  should generally NOT use the `zz` prefix unless they're a small follow-up patch to something
  already merged.
- To add a new migration: create `migrations/migrate_<short_description>.sql`, write
  idempotent DDL (`ADD COLUMN IF NOT EXISTS` isn't supported by MySQL, so rely on the
  skippable-error-code behavior above, or guard with `INSERT IGNORE` / conditional checks as
  needed), then run `npm run migrate`.

## Seed data (`seed/`)

- `seed/seed.sql` is demo/dev data only — it is **not** run automatically by `migrate.ts`.
  Apply it manually after migrating:
  ```
  mysql -u root -p hr_platform < src/db/seed/seed.sql
  ```
- Add new seed files here as `seed/<description>.sql` if a separate dataset is needed (e.g.
  per-environment fixtures); keep them idempotent (`INSERT IGNORE`) since they may be re-run.

## Scripts

- `npm run migrate` — applies `schema.sql` then everything in `migrations/`.
- `npm run create-admin -- "Full Name" "email@company.com" "Password123"` — creates an admin
  employee account directly (bypasses seed data).
- `npm run migrate-employee-data` — one-off backfill for department/designation normalization;
  pass `--verify` to check without writing.
