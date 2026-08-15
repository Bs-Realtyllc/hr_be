# Backend restructuring — TypeScript + Drizzle, layered architecture

This is the living reference for the backend rewrite: why, what the target shape looks like, and the
domain-by-domain checklist tracking what's converted so far. Read this before converting the next domain —
it's meant to be followed exactly, not reinterpreted per domain.

## Why

The backend was a flat Express app: `models/*.js` were hand-written raw-SQL query functions (not real ORM
models — no schema, no table definition), controllers reached into them directly with little service layer,
and DTOs (where they existed) validated but didn't declare typed request/response shapes. This rewrite moves
every domain to a standard **route → controller → service → repository → model** layering, in TypeScript,
on Drizzle ORM, with typed DTOs as the request/response contract.

Decisions locked in during the Employee/Auth pilot (don't re-litigate these per domain):
- **Language**: TypeScript, adopted incrementally — `tsconfig.json` has `allowJs: true`, so untouched `.js`
  domains keep compiling and running unmodified alongside converted `.ts` ones. No flag-day rewrite.
- **ORM**: Drizzle, used purely as a typed query builder. **Migrations stay hand-rolled** — `src/db/schema.sql`
  + `src/db/migrate_*.sql` + `src/db/migrate.js` are still the only source of truth for DDL. Drizzle schema
  files describe existing tables; nothing runs `drizzle-kit push`/`generate` against this database.
- **Response shape**: stays flat (`res.json(dto)`, not `res.json({ data: dto })`). No response envelope —
  changing that would break whatever already consumes this API.
- **Audit columns**: `id, created_at, updated_at, created_by, updated_by` (see BaseModel below) are added to
  a table's migration *as that table's domain gets converted*, not all up front.

## Target folder structure

```
backend/
  index.ts                        # app entry — Express setup, mounts routes, boots both DB connections
  tsconfig.json
  src/
    config/
      database.ts                  # Drizzle instance (mysql2 pool + drizzle())
    db/                             # UNCHANGED — schema.sql, migrate_*.sql, migrate.js stay exactly as-is
    models/                         # Drizzle schema definitions — columns + associations ONLY, no queries
      BaseModel.ts                  # baseColumns / auditColumns, shared by every table
      <Table>.ts                    # one file per table/view
      index.ts                      # re-exports every table/view
    repositories/
      <domain>.repository.ts        # the ONLY place queries live; same fn names as the old models/*.js file
    dtos/
      <domain>.dto.ts                # request + response TS interfaces, Zod schemas, bind/map functions
    services/
      <domain>.service.ts            # business logic; takes typed DTO input, never touches req/res or SQL
    controllers/
      <domain>.controller.ts         # thin: bind body -> DTO, call service, map result -> response DTO
    routes/
      modules/
        <domain>.routes.ts            # this domain's Express router
        index.ts                      # aggregates every converted domain's router — see "Route grouping"
      index.js                        # mounts modules/index's aggregate + any still-unconverted domain routers
    middleware/, pkg/                # unchanged, shared across converted and unconverted domains alike
```

Until a domain is converted, its `controllers/<name>.js`, `routes/<name>.js`, `dtos/<name>Dto.js`,
`models/<Name>.js`, `services/<name>.js` (where present) stay exactly where they are, untouched.

## The standard pattern (worked example: Employee)

```
route (routes/modules/employee.routes.ts)
  -> controller (controllers/employee.controller.ts)   binds req.body -> DTO, maps result -> response DTO
    -> service (services/employee.service.ts)          business logic, orchestrates repositories
      -> repository (repositories/employee.repository.ts)  the only place Drizzle queries live
        -> model (models/Employee.ts, EmployeeFlat.ts, ...)  schema only
```

**Controller** — binds and validates at the boundary, calls the service with typed input, maps the service's
result through the DTO's response mapper, sends it. Never imports a repository or model. Example shape:

```ts
export const create = asyncHandler(async (req: any, res: Response) => {
  const input = employeeDto.toCreateInput(req.body);              // bind + validate here
  const id = await employeeService.create(input, req.user?.id ?? null);
  res.status(201).json({ id });
});
```

**Service** — pure business logic. Takes the DTO's typed input type, never `Record<string, any>` or raw
`req.body`. Never imports Express types. Owns multi-repository orchestration and transactions-spanning logic
that isn't itself persistence (e.g. "create an employee, then seed their leave balances" is two repository
calls orchestrated by the service; "insert these five related rows atomically" is one repository call using
`db.transaction`).

**Repository** — the only place Drizzle queries live, and the only place a raw `sql` escape hatch is allowed
(for things Drizzle's builder can't express cleanly — see `employee.repository.ts`'s `upsertAuth` for the
`ON DUPLICATE KEY UPDATE ... COALESCE` example). Exports the same function names the domain's old
`models/<Name>.js` file exported, so other still-unconverted domains that `require('../models/<Name>')`
keep working — repoint them at `require('../repositories/<domain>.repository')` (see "Cross-cutting
call sites" below) instead of rewriting their internals.

**Model** — Drizzle table/view definitions only: columns, types, defaults. No query functions. One file per
table (see `src/models/Employee.ts`, `EmployeeAuth.ts`, etc.) — even when several tables belong to one
"domain" conceptually, each gets its own model file. Read-only views defined with `mysqlView(name,
columns).existing()` (see `EmployeeFlat.ts`).

## DTOs

One `<domain>.dto.ts` per domain, containing:
- **Request interfaces** — `<Domain>CreateInput`, `<Domain>UpdateInput`, etc. Every field spelled out
  explicitly. Never a derived `Partial<Pick<...>>` type and never an index signature (`[key: string]:
  unknown`) — if a field doesn't appear by name in the interface, it isn't part of the contract.
- **Response interfaces** — `<Domain>Response`, matching exactly what the repository returns minus anything
  that must never reach the client (e.g. `password_hash`). Also spelled out field-by-field.
- **Zod schemas** built from one shared per-field object (see `employeeFields` in `employee.dto.ts`) so a
  validation rule is declared once and reused across create/update schemas via composition, not copy-pasted.
- **`toXInput(body: unknown)` functions** — call `bindAndValidate(schema, body)` from `src/pkg/validation.ts`
  instead of hand-rolling a parse-or-throw. Use `optionalNullable()` (same file) for fields that accept
  either omission or explicit `null`.
- **`toResponse`/`toResponseList` functions** — map a repository row to the response interface, stripping
  anything sensitive.

## Models: BaseModel / audit columns

`src/models/BaseModel.ts` exports two column sets:
- `baseColumns` — `id, created_at, updated_at, created_by, updated_by`, for any table with a surrogate `id`
  primary key.
- `auditColumns` — just `created_at, updated_at, created_by, updated_by`, for 1:1 tables whose primary key
  IS a foreign key (no separate `id` column) — e.g. `employee_auth`, keyed on `employee_id`.

Append-only history/audit-trail tables (e.g. `employee_job_history`) do **not** get either — they already
have their own shape (`changed_by` + `created_at`, no `updated_at`, since a row is never updated after
insert) and forcing mutable-row audit columns onto an intentionally-immutable table fights its design. Plain
lookup tables (e.g. `departments`) also skip BaseModel unless/until they need audit tracking.

When a domain's tables don't yet have `updated_at`/`created_by`/`updated_by`, add a migration file for
exactly that domain's tables as part of converting it — same pattern as
`src/db/migrate_zz_add_audit_columns_pilot.sql`. **Naming/ordering matters**: `migrate.js` applies
`migrate_*.sql` files in plain alphabetical order, so a new migration must sort *after* every migration it
depends on (e.g. after whatever created the tables it's altering). Check `ls src/db/migrate_*.sql | sort`
and name accordingly — prefix with `zz_` if nothing else guarantees late ordering, same as the pilot's file.
`created_by`/`updated_by` are set explicitly by the repository from an `actorId` param threaded from
`req.user.id` (controller → service → repository) — no AsyncLocalStorage/CLS magic.

## Route grouping

`src/routes/modules/index.ts` is the single place a converted domain registers itself:

```ts
const modules: Array<{ path: string; router: Router }> = [
  { path: '/auth', router: authRoutes },
  { path: '/employees', router: employeeRoutes },
  // add one entry per newly-converted domain here
];
```

`src/routes/index.js` mounts this whole aggregate with one line (`router.use(require('./modules').default)`)
plus one `router.use(path, require('./<name>'))` per still-unconverted domain. Converting a domain means:
add its router to the `modules` array, delete its old `router.use('/path', require('./old-route-file'))`
line from `routes/index.js`.

## Cross-cutting call sites

Before deleting an old `models/<Name>.js` (or `services/<name>.js`), `grep -rn "models/<Name>'" src` (and
same for any service other domains import) to find every file outside this domain that imports it. Update
each to import the new repository/service instead — same function names, so it's a one-line path swap, not
a rewrite of the calling file. This is what lets old raw-SQL files retire without a big-bang rewrite of
every domain that happens to read their data (see `employee.repository.ts`'s header comment for the exact
list from the pilot).

## Conversion checklist, per domain

1. Read the current `controllers/<name>.js`, `routes/<name>.js`, `dtos/<name>Dto.js`, `models/<Name>.js`
   (and any dedicated `services/<name>.js`) fully before changing anything.
2. `grep -rn "models/<Name>'"` (and any service the domain exports) across `src/` to bound the
   cross-cutting call-site list.
3. Model(s): one Drizzle file per table, extending `baseColumns`/`auditColumns` where applicable. Add an
   audit-columns migration if the table doesn't have them yet (see naming/ordering note above).
4. Repository: reimplement every exported function from the old model file, same names/signatures, using
   Drizzle (raw `sql` escape hatch only for what the builder can't express).
5. DTO: explicit request/response interfaces, Zod schemas built from one shared per-field object,
   `bindAndValidate`/`optionalNullable` from `src/pkg/validation.ts`.
6. Service: business logic only, typed DTO input in, repository calls out.
7. Controller: bind body → DTO in the controller, call service, map result → response DTO, send.
8. Route: same paths/methods/middleware as the old route file — the URL surface doesn't change.
9. Register the new router in `routes/modules/index.ts`; remove the old line from `routes/index.js`.
10. Update the cross-cutting call sites found in step 2.
11. Delete the old `.js` files for this domain once nothing references them
    (`grep -rn "models/<Name>'\|controllers/<name>'\|routes/<name>'\|dtos/<name>Dto'"`).
12. Verify: `npx tsc --noEmit`, `npm run build`, boot (`npm run dev` or `npm start`) against the real local
    DB, exercise every endpoint (happy path + at least one validation-error path), and hit one
    **unconverted** domain that reads this domain's data to confirm cross-cutting call sites still resolve.
13. Update the status table below.

## Domain status

| Domain | Status | Files (old → new) | Notes |
|---|---|---|---|
| Auth | ✅ Done | `controllers/auth.js`, `routes/auth.js`, `dtos/authDto.js` → `auth.controller.ts`, `routes/modules/auth.routes.ts`, `dtos/auth.dto.ts`, `services/auth.service.ts` | |
| Employees | ✅ Done | `models/Employee.js`, `models/PasswordResetToken.js`, `controllers/employees.js`, `routes/employees.js`, `dtos/employeeDto.js` → full stack under the new layout | Pilot domain — see this for the full worked pattern. `employees_flat` view modeled as a Drizzle `.existing()` view. |
| Leaves | ✅ Done | `controllers/leaves.js`, `routes/leaves.js`, `models/LeaveRequest.js`, `dtos/leaveDto.js`, `services/leaveService.js` → `leave.controller.ts`, `routes/modules/leave.routes.ts`, `models/LeaveRequest.ts` + `LeaveBalance.ts`, `dtos/leave.dto.ts`, `services/leave.service.ts` | Fixed a pre-existing bug found during conversion: leaveDto's LEAVE_TYPES allowed retired `casual`/`annual` and was missing `bereavement`/`maternity`/`paternity`. `leaveEvents.js` (used by the still-unconverted `webhook.js`) kept as-is, just repointed at `leave.repository.ts`. |
| Standups | ✅ Done | `controllers/standups.js`, `routes/standups.js`, `models/Standup.js`, `dtos/standupDto.js` → `standup.controller.ts`, `routes/modules/standup.routes.ts`, `models/Standup.ts`, `dtos/standup.dto.ts`, `services/standup.service.ts` | Fixed a pre-existing bug: no UNIQUE constraint ever existed on `(employee_id, standup_date)`, so the documented "resubmitting overwrites" upsert had nothing to collide on and silently inserted duplicate rows. Added the constraint + `id = LAST_INSERT_ID(id)` on conflict so the returned id is correct either way. Also added input validation to the DTO — the old one had none at all. `discordStandupService.js` kept as-is, just repointed at `standup.repository.ts`. |
| Projects | ⬜ Pending | `controllers/projects.js`, `routes/projects.js`, `models/Project.js`, `dtos/projectDto.js` | Includes milestones/assignments/services sub-resources. |
| Culture events | ⬜ Pending | `controllers/events.js`, `routes/events.js`, `models/CultureEvent.js`, `dtos/cultureEventDto.js`, `services/cultureEventService.js` | |
| Holidays | ⬜ Pending | `controllers/holidays.js`, `routes/holidays.js`, `models/Holiday.js`, `dtos/holidayDto.js` | |
| Servers | ⬜ Pending | `controllers/servers.js`, `routes/servers.js`, `models/Server.js`, `dtos/serverDto.js` | |
| Payroll | ⬜ Pending | `controllers/payroll.js`, `routes/payroll.js`, `models/PayrollAdjustment.js`, `models/EmployeeTax.js`, `dtos/payrollDto.js`, `services/payrollService.js` | |
| Overtime | ⬜ Pending | `controllers/overtime.js`, `routes/overtime.js`, `models/OvertimeRequest.js`, `dtos/overtimeDto.js`, `services/overtimeService.js` | |
| Discord | ⬜ Pending | `controllers/discordWebhook.js`, `routes/discord.js` | |
| Webhooks | ⬜ Pending | `controllers/webhook.js`, `routes/webhook.js` | Generic inbound webhook, may stay thin/untyped by nature. |
| Email settings | ⬜ Pending | `controllers/emailSettings.js`, `routes/emailSettings.js`, `models/EmailSettings.js`, `dtos/emailSettingsDto.js` | |
| Monthly reports | ⬜ Pending | `controllers/reports.js`, `routes/reports.js`, `models/MonthlyReport.js`, `dtos/monthlyReportDto.js` | File upload (multer) — check middleware compat. |
| Weekly reports | ⬜ Pending | `controllers/weeklyReports.js`, `routes/weeklyReports.js`, `models/WeeklyReport.js`, `dtos/weeklyReportDto.js`, `services/weeklyReminder.js` | File upload + node-cron reminder. |
| Service credentials | ⬜ Pending | `controllers/serviceCredentials.js`, `routes/serviceCredentials.js`, `models/ServiceCredential.js`, `dtos/serviceCredentialDto.js` | |
| Google / Meetings | ⬜ Pending | `controllers/googleController.js`, `controllers/meetings.js`, `routes/google.js`, `models/Meeting.js`, `models/GoogleSettings.js`, `dtos/meetingDto.js`, `services/googleCalendar.js`, `services/googleEventShaper.js` | External OAuth integration — check carefully. |
| Profile | ⬜ Pending | `controllers/profile.js`, `routes/profile.js`, `dtos/profileDto.js` | Largely wraps the already-converted `employee.repository.ts`. |
| Goals | ⬜ Pending | `controllers/goals.js`, `routes/goals.js`, `models/Goal.js`, `dtos/goalDto.js` | |
| Performance | ⬜ Pending | `controllers/performance.js`, `routes/performance.js`, `models/PerformanceReview.js`, `dtos/performanceDto.js` | |
| Feedback | ⬜ Pending | `controllers/feedback.js`, `routes/feedback.js`, `models/Feedback.js`, `dtos/feedbackDto.js` | |
| Policies | ⬜ Pending | `controllers/policies.js`, `controllers/policyAcknowledgements.js`, `routes/policies.js`, `models/Policy.js`, `models/PolicyAcknowledgement.js`, `services/policyAcknowledgementService.js` | |
| Dashboard | ⬜ Pending | `controllers/dashboard.js`, `routes/dashboard.js`, `models/Dashboard.js` | Aggregates across nearly every other domain — convert last. |

## Explicitly out of scope for this rewrite

- No response envelope (`{data: ...}`) — flat responses stay.
- No TypeScript `strict`/`noImplicitAny` — `tsconfig.json` keeps these off for low-friction incremental
  adoption; revisit only as a deliberate separate decision, not a side effect of converting a domain.
- `src/db/migrate.js`, `create-admin.js`, `migrate_employee_data.js` stay plain JS — standalone scripts, not
  part of the app's require graph, no reason to touch them.
- `swagger.js` (hand-maintained OpenAPI spec) is updated only if a converted domain's request/response
  shape actually changes — URL paths and shapes stay identical by design, so most conversions need no
  swagger.js edit at all.
