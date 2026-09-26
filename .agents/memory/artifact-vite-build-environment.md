---
name: Artifact Vite build environment
description: Required environment values for manual builds of artifact-managed Vite apps.
---

Manual Vite builds for an artifact need the same `PORT` and `BASE_PATH` values that the managed workflow supplies automatically. Running the package build without them stops while loading Vite config, before compilation starts.

**Why:** Direct shell commands do not inherit artifact workflow configuration, so a missing value can look like a build failure even when the application is valid.

**How to apply:** For one-off verification, pass a valid `PORT` and the artifact's registered preview path as `BASE_PATH`; keep the application config explicit rather than adding silent defaults solely for ad hoc builds.