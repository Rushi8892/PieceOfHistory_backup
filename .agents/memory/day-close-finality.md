---
name: Day-close finality
description: Defines the boundary between delayed payment settlement and immutable historical days.
---

Captured payments may settle only while a day remains active and only when the verified provider event time is at or before the closing timestamp. Any finalization path, including request-triggered catch-up, must reconcile pending provider captures before closing; once closed, a day is immutable.

**Why:** Delayed webhooks must not rewrite a published historical winner. A production close scheduler should reconcile pending provider orders before changing the day to closed.

**How to apply:** Keep payment settlement and day close serialized on the DailyPiece row lock. Before any scheduled or request-triggered rollover closes a day, query the provider for pending orders and settle eligible pre-deadline captures.