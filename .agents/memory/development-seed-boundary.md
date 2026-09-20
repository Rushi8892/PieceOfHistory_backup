---
name: Development seed boundary
description: Rules for adding temporary homepage fixture data without affecting real users or live records.
---

Homepage fixtures should use deterministic `seed-*` identities and idempotent upserts. They may create or refresh seed stories, standings, and closed archive days, but must not overwrite non-seed users or their stories.

**Why:** The homepage needs populated data for visual QA before launch, while the database may already contain real Clerk-linked development records and future live data.

**How to apply:** Keep fixture creation in the database seed script, tag fixture users with a non-production auth provider, make repeated runs produce the same counts, and verify the public competition/archive endpoints after seeding.

Release seed validation should use an isolated temporary database rather than clearing the shared workspace database.

**Why:** Empty-database coverage must not risk deleting Clerk-linked users or other development records.

**How to apply:** Create the temporary database from the configured connection, apply the current schema, run the seed twice, compare expected counts, and always drop the temporary database during cleanup.