# Database layer

```
src/db/
├── migrate.ts              Runner: applies pending drizzle-kit migrations on boot
├── seed/                    Demo/dev seed data (run manually, never by migrate.ts)
└── create-admin.ts         One-off script: create an admin employee account
```

## Schema changes

Schema is managed by [drizzle-kit](https://orm.drizzle.team/kit-docs/overview), not
hand-written SQL:

1. Edit the table definition in `drizzle/schema.ts`.
2. Run `npm run db:generate` — this diffs against the last snapshot and writes a new
   numbered SQL file into `drizzle/migrations/`.
3. Review the generated SQL, commit it.
4. On deploy, `npm run migrate` (`src/db/migrate.ts`) applies any migrations in
   `drizzle/migrations/` not yet recorded in the `__drizzle_migrations` tracking table.

`drizzle/schema.ts` is tracked separately from `src/models/*.ts` (the app's query
layer) — the app models don't declare real foreign keys, so pointing drizzle-kit
at them directly risked it proposing to drop constraints it didn't know existed.
When adding a new table, add it to **both** `src/models/` (so the app can query it)
and `drizzle/schema.ts` (so `db:generate` picks it up).

## Seed data (`seed/`)

- `seed/seed.sql` is demo/dev data only — it is **not** run automatically.
  Apply it manually after migrating:
  ```
  mysql -u root -p hr_platform < src/db/seed/seed.sql
  ```
- Add new seed files here as `seed/<description>.sql` if a separate dataset is needed
  (e.g. per-environment fixtures); keep them idempotent (`INSERT IGNORE`) since they
  may be re-run.

## Scripts

- `npm run migrate` — applies pending migrations from `drizzle/migrations/`.
- `npm run db:generate` — generates a new migration file from a `drizzle/schema.ts` change.
- `npm run create-admin -- "Full Name" "email@company.com" "Password123"` — creates an
  admin employee account directly (bypasses seed data).

## History

Prior to drizzle-kit, this repo used a hand-written SQL migration system
(`schema.sql` + `migrations/*.sql`, applied by a custom runner). It was retired after
drizzle-kit's `0000_baseline.sql` was seeded from a live introspection of production,
making it a complete, accurate replacement — including for fresh installs. The old
files are still visible in git history if you need the reasoning behind a past schema
change (e.g. `git log --all -- src/db/migrations`).
