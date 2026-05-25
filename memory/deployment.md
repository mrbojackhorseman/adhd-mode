---
name: deployment
description: ADHD Mode is deployed on Vercel — project ID, org ID, and ANTHROPIC_API_KEY env var location
metadata:
  type: reference
---

# Deployment — Vercel

- **Platform:** Vercel
- **Project name:** `adhd-mode`
- **Project ID:** `prj_xk0ZJQFsKzwBhCsQfWrc62Uz7KmQ`
- **Org ID:** `team_NR7hriQpNu86t6CSCRDAORab`
- **Auto-deploy:** pushes to the connected git branch trigger a new Vercel build

## Environment variables

`ANTHROPIC_API_KEY` must be set in the Vercel project environment variables. It is **not** in `.env.local` in this repo — set it manually in Vercel dashboard if re-creating the project.

## CVE note

Next.js was patched from `15.1.x` → `^16.2.6` in commit `2a40e71` to address CVE-2025-66478. The `next-env.d.ts` file has local modifications — this is expected after the version upgrade.
