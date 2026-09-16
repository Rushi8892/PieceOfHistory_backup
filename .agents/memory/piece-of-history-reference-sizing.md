---
name: Piece of History reference sizing
description: Responsive breakpoint and date-shape lessons from the supplied homepage reference.
---

The supplied Piece of History homepage reference is 683px wide and still uses the desktop composition: full navigation, side-by-side hero content, and competition/history columns. The mobile composition should begin below that width, around the existing 402px preview.

**Why:** Treating the reference width as mobile caused the hero and lower panels to stack, making the page look substantially different even though the individual styles were close.

**How to apply:** When adjusting the homepage, verify at both 683px and 402px. Keep compact-desktop layout rules at `sm` where possible, and keep mobile-specific stacking below that breakpoint. Parse API dates as either date-only strings or full ISO timestamps before formatting.