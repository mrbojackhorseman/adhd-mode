# PROJECT_STATE.md — ADHD Mode

## What the project does

A personal Next.js web app (deployed on Vercel) that provides seven AI-powered ADHD executive function modes. The user picks a mode that matches their current cognitive state — task paralysis, dopamine crash, need for a body double, context-switch difficulty, avoidance due to boredom, time blindness, or mental overload — fills in a short form, and receives a streaming Claude-generated response tailored to that mode's system prompt. The app is intentionally minimal: one page, one session at a time, no persistence.

---

## Architecture decisions

1. **Next.js App Router + API route for streaming** — The `/api/adhd/route.ts` uses the Anthropic SDK's `client.messages.stream()` and pipes it as a `ReadableStream` in the response. This avoids loading the full response into memory and gives the user instant progressive output.

2. **All mode config lives in `src/lib/modes.ts`** — The `MODES` array is the single source of truth for mode IDs, input fields, system prompts, and color themes. Adding a new mode only requires editing this file; no other code needs updating.

3. **Custom markdown parser, no library** — `MarkdownRenderer.tsx` uses a hand-rolled regex parser rather than `react-markdown` or `marked`. This keeps the bundle lean and avoids dependency overhead for a personal app. Supports: tables, headings h1–h3, bold/italic/bold-italic, inline code, horizontal rules, blockquotes, unordered and ordered lists, and paragraphs.

4. **Body double mode has a timer baked in** — `ModeSession.tsx` detects `mode.id === "bodydouble"` and starts a 30-minute interval timer after the first API response. Check-ins trigger at every 10-minute mark (`t % 600 === 0`) and inject elapsed context into a follow-up API call.

5. **No auth, no database** — This is a personal single-user tool. The Anthropic API key is stored in a Vercel environment variable (`ANTHROPIC_API_KEY`), never exposed to the client.

6. **Tailwind dark theme** — The UI uses a near-black background (`#0a0a0f`) with per-mode gradient cards and accent colors. Prose styling for the AI response area is handled via a `prose-adhd` CSS class defined in `globals.css`.

7. **CVE patch applied** — Next.js was upgraded from 15.1.x to ^16.2.6 to patch CVE-2025-66478.

---

## Complete file map

| File | Description |
|------|-------------|
| `src/app/page.tsx` | Root page — toggles between Dashboard and ModeSession based on `activeMode` state |
| `src/app/layout.tsx` | Root layout — sets font, metadata, dark background |
| `src/app/globals.css` | Global styles including `prose-adhd` response typography |
| `src/app/components/Dashboard.tsx` | Mode picker grid — lists all 7 modes as tappable cards |
| `src/app/components/ModeSession.tsx` | Per-mode session — input form, streaming response, body-double timer, check-in flow |
| `src/app/components/MarkdownRenderer.tsx` | Custom regex markdown → HTML renderer |
| `src/app/api/adhd/route.ts` | POST API handler — streams Claude response for a given modeId + inputs |
| `src/lib/modes.ts` | Mode registry: IDs, titles, colors, input fields, system prompts |
| `next.config.ts` | Next.js config (minimal) |
| `tailwind.config.ts` | Tailwind config |
| `tsconfig.json` | TypeScript config with `@/` path alias |
| `package.json` | Dependencies: next, react, @anthropic-ai/sdk, lucide-react, tailwind |
| `.vercel/project.json` | Vercel project ID and org ID |
| `README.md` | Project readme |

---

## API contracts

### POST `/api/adhd`

**Request body:**
```json
{
  "modeId": "paralysis" | "dopamine" | "bodydouble" | "context-switch" | "gamify" | "timeblind" | "externalizer",
  "inputs": {
    "[field.key]": "user input string"
  }
}
```

**Response:** `text/plain` streaming — raw markdown text chunks from Claude.

---

## Mode registry

| ID | Title | Input fields |
|----|-------|-------------|
| `paralysis` | Task Paralysis Shatterer | `task` |
| `dopamine` | Dopamine Menu Architect | `context`, `interests` |
| `bodydouble` | Body Doubling Simulator | `task` |
| `context-switch` | Context Switching Guide | `taskA`, `taskB` |
| `gamify` | Interest-Based Filter | `task`, `interest` |
| `timeblind` | Time Blindness Auditor | `project`, `estimate` |
| `externalizer` | Executive Function Externalizer | `dump` |

---

## Environment variables

| Key | Location | Purpose |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | Vercel env vars | Claude API authentication |

---

## Known behaviours and watch points

- **MarkdownRenderer XSS surface** — `dangerouslySetInnerHTML` is used. All content comes from Claude (trusted), not user input directly, but worth noting if user-supplied text ever feeds directly into rendered HTML.
- **Body double timer only counts up** — The displayed time is elapsed, not a countdown. The `minutesLeft` calculation assumes a fixed 30-minute session. If the user resets and restarts, the timer resets cleanly.
- **Check-in context injection** — On a body double check-in, the original task is re-sent with the check-in update appended. This means the full conversation is reconstructed each call (no persistent conversation ID with Claude).
- **Optional inputs** — `dopamine` mode's `context` field is optional (the system prompt notes this). All other fields are required before submission is enabled.
- **`⌘↵` shortcut** — Multiline textareas submit on Cmd/Ctrl+Enter; single-line inputs submit on Enter.
- **Next.js 16** — `next-env.d.ts` has been modified (shown in git status) — this is expected after a version upgrade.

---

## Pending work / next steps

- [ ] Add history — store past sessions in localStorage so users can review previous outputs
- [ ] Mode for "hyperfocus spiral" — a grounding mode to break out of hyperfocus and re-orient
- [ ] PWA / home screen icon so it feels native on mobile
- [ ] Dark/light theme toggle (currently dark-only)
- [ ] Deploy verification — confirm latest CVE-patched build is live on Vercel

---

## How to resume in a new session

1. `cd /Users/godfreyjoseph/.claude/projects/-Users-godfreyjoseph-Downloads/memory/personal/adhd-mode`
2. Read this file and `MEMORY.md`
3. The app is deployed on Vercel (project `adhd-mode`, org `team_NR7hriQpNu86t6CSCRDAORab`)
4. To run locally for dev: `npm run dev` (requires `ANTHROPIC_API_KEY` in `.env.local`)
5. To deploy: push to the connected git branch — Vercel auto-deploys

---

Last updated: 2026-05-20
Tool calls at handoff: N/A
