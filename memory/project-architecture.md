---
name: project-architecture
description: Core architecture decisions for the ADHD Mode Next.js app — streaming API, mode registry pattern, no-library markdown renderer
metadata:
  type: project
---

# Architecture — ADHD Mode

**All mode config is centralised in `src/lib/modes.ts`.** The `MODES` array is the single source of truth. Adding a new mode requires only editing this file.

**Why:** Keeps the API route and UI components completely mode-agnostic — they loop over whatever is in `MODES` without any hardcoded mode logic.

**How to apply:** When adding features, check if they belong in the mode definition (new input field type, new prompt variable) vs. the session component (new UI behaviour).

---

**Claude streaming via `ReadableStream` in the API route.** `client.messages.stream()` is piped directly to `new ReadableStream` in `/api/adhd/route.ts`, consumed on the frontend with `res.body.getReader()`.

**Why:** Gives instant progressive output with no full-response buffer in memory. Keeps latency perceptible immediately.

**How to apply:** Any new AI-powered route should follow the same streaming pattern. Do not switch to `await client.messages.create()` unless a feature genuinely needs the full response before rendering.

---

**Custom markdown parser, no third-party library.** `MarkdownRenderer.tsx` uses regex. Supports: tables, h1-h3, bold/italic, inline code, hr, blockquote, ul/ol, paragraphs.

**Why:** Keeps bundle lean for a personal app. The Claude responses use a known, constrained markdown subset, so a full parser is overkill.

**How to apply:** If Claude responses start using markdown features not yet supported (e.g. nested lists, code blocks), extend `parseMarkdown()` in `MarkdownRenderer.tsx`. Note: `dangerouslySetInnerHTML` is used — content must come from Claude, not raw user input.
