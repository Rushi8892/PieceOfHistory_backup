---
name: Browser link regressions
description: Guidance for browser checks that follow rendered archive links through client-side navigation.
---

Browser-level archive-link checks must wait for the detail content to render after the click, not only for the URL to change; client-side routing can update the path before the data query completes.

**Why:** A first version of the check observed the route transition while the detail page was still loading, which allowed a false failure or false success depending on timing.

**How to apply:** Poll for the detail page's rendered marker and assert its path together with the date-only href from the originating page.