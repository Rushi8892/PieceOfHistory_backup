---
name: Day-close finality
description: Defines the boundary between delayed payment settlement and immutable historical days.
---

Captured payments may settle only while a day remains active and only when the verified provider event time is at or before the closing timestamp. Once closed, a day is immutable.

**Why:** Delayed webhooks must not rewrite a published historical winner. A production close scheduler should reconcile pending provider orders before changing the day to closed.

**How to apply:** Keep payment settlement and day close serialized on the DailyPiece row lock. Any future close-job enhancement must resolve pending captures before committing the closed state.