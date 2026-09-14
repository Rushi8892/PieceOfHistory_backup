# Piece of History

Piece of History is a daily, USD-only cumulative-payment competition where the winning story becomes a permanent public record.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run generate` — generate a Drizzle migration from the schema
- `pnpm --filter @workspace/db run seed` — create one idempotent sample active day
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — source of truth for the Piece of History PostgreSQL schema
- `lib/db/scripts/seed.mjs` — idempotent development seed for an active day
- `artifacts/api-server/` — API service, to be expanded in later build phases

## Architecture decisions

- Use the existing workspace PostgreSQL + Drizzle stack rather than introducing Prisma.
- Store all USD monetary values as integer cents to avoid floating-point errors.
- Keep every payment as a ledger row and materialize per-day totals in `participant_standings`.
- Enforce one active day with a PostgreSQL partial unique index; previous days are represented as closed rows.
- Preserve display names on stories so a user changing their profile later cannot rewrite historical records.

## Product

- One active day accepts stories and cumulative USD payments.
- Closed days are immutable public history, showing the winner and winning story.
- Signed-in users will later have a separate private history of their own stories and payments.

## User preferences

- Keep the product focused; do not add social-network or gamification features.
- Use USD-only payments.

## Gotchas

- Payment and day-closing logic must be transactional and idempotent before real payments are enabled.
- The minimum payment is currently seeded at 100 cents and should remain configurable per day until the final payment rule is confirmed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
