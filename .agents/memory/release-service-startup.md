---
name: Release service startup
description: How release browser validation handles stopped artifact workflows in a clean workspace
---

Release browser validation must not assume managed artifact workflows are already running. When local ports are unavailable, start the configured API and frontend development commands, poll both services, then run the existing browser test so its concise preflight errors remain the final failure surface.

**Why:** Newly opened workspaces can have registered workflows in a stopped state, while the browser test may resolve through the Replit development domain rather than localhost.

**How to apply:** Keep startup orchestration in the release entry point, use direct localhost readiness checks for auto-started services, and only stop process groups that the release command created.