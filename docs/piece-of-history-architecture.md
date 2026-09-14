# Piece of History — Foundation Architecture

## Product boundary

Piece of History has exactly one active participation day. Users submit one
story for that day and make cumulative USD payments. Each captured payment is
real, immediate, and non-refundable. At the configured closing timestamp, the
highest cumulative standing wins. The winner and story become a permanent
public record for that date.

Closed dates are read-only. Public archive history shows the winner for each
date. A signed-in user's private My History view will show their own stories,
individual payments, running totals, final ranks, and win/loss results.

## Runtime architecture

```text
Browser
  │
  ├── Public pages and private user pages
  │
  └── API Server
        │
        ├── Authentication (later phase)
        ├── Story and archive routes (later phase)
        ├── Payment provider abstraction (later phase)
        ├── Verified payment webhook
        ├── Transactional standing/leaderboard service
        └── Idempotent day-close job
                │
                └── PostgreSQL + Drizzle ORM
```

The existing workspace uses Express for the API server and Drizzle ORM for
PostgreSQL, so the foundation follows those conventions rather than adding a
second ORM. The frontend and API contract will be added in later phases.

## Data model

| Model | Purpose |
| --- | --- |
| `users` | Identity, public display name, auth provider, and owner role |
| `daily_pieces` | One row per calendar date, with active/closed state and locked winner |
| `stories` | One participant story per user per day, with a display-name snapshot |
| `bids` | Immutable payment ledger rows, stored in USD cents with provider reference |
| `participant_standings` | Per-user/per-day materialized cumulative total used for ranking |
| `audit_events` | Optional record of leader changes, day closes, and owner actions |

Money is stored as integer cents. This avoids floating-point errors and keeps
all payment, standing, and winning values in USD without ambiguous decimal
rounding.

## Database invariants

- Only one `daily_pieces` row can have `status = active`.
- A calendar date can have only one `daily_pieces` row.
- A captured payment amount must be positive.
- A daily minimum payment must be positive.
- A participant has at most one story per daily piece.
- A participant's standing is keyed by `(user_id, daily_piece_id)`.
- Closed-day winner fields are stored on the daily piece and are never replaced
  by a later day-close retry.
- Payment references are unique so a replayed provider webhook cannot create a
  second ledger row.

The application transaction that accepts a verified capture will lock the
active daily piece, insert or reconcile the payment ledger row, update the
participant standing, and derive the leader in one atomic operation.

## Day state transition

```text
                    ┌──────────────────────────────┐
                    │                              │
                    │  create next active day      │
                    │  after close transaction     │
                    │                              │
                    ▼                              │
┌──────────┐   open   ┌──────────┐  deadline passed  ┌─────────┐
│ planned  │ ───────▶ │  active  │ ───────────────▶ │ closing │
└──────────┘          └──────────┘                  └─────────┘
                           │                            │
                           │ stories + verified         │ lock row,
                           │ captured payments           │ select winner
                           │                            │
                           └────────────────────────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │ archived │
                                                  └──────────┘
                                                   read-only
```

The database currently represents the operational states as `active` and
`closed`. The `planned` and `closing` labels describe service-level workflow
states; they do not create extra mutable day statuses in the MVP.

## Phase boundary

This foundation intentionally does not yet include authentication, public
pages, payment-provider credentials, payment webhooks, or the scheduled
close job. Those are separate phases because they introduce identity,
external-service, and real-money behavior that must be verified independently.