# Database layer

```
src/db/
├── migrate.ts              Runner: applies pending drizzle-kit migrations on boot
├── mongo/                   Mongoose models (inbox messages live in MongoDB)
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

`drizzle/schema.ts` is the single definition of every MySQL table: drizzle-kit
diffs it to generate migrations, and the app imports its tables and row types
from it directly (`import { employees, NewEmployee } from '../../drizzle/schema'`).
When adding or changing a table, edit only that file.

Drizzle keys are camelCase (`employeeId`); DB columns stay snake_case (`employee_id`).

- **Existing endpoints** still speak snake_case to the frontend. Their repositories keep
  that shape explicitly: reads list their output keys (`select({ employee_id: t.employeeId })`,
  or a per-file `<table>Columns` object for whole rows), and writes map incoming fields
  (`.values({ employeeId: data.employee_id })`). When adding a column to one of these
  tables, add it to those lists too if the endpoint should expose or accept it.
- **New code** uses camelCase end to end (schema, repository, API, frontend) — no mapping.

`drizzle/migrations/0000_baseline.sql` creates the whole schema from scratch; every
later migration should only add, alter or drop on top of it.

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
