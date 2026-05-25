---
name: body-double-timer
description: Body double mode has a 30-minute timer with 10-minute check-ins baked into ModeSession — context is re-injected per call, not a persistent conversation
metadata:
  type: project
---

# Body Double Timer Behaviour

The body double timer lives entirely in `ModeSession.tsx`. It only activates for `mode.id === "bodydouble"`.

- Timer starts after the first API response (`setTimerActive(true)` in the `submit()` finally block)
- Check-ins trigger at `t % 600 === 0` (every 600 seconds = 10 minutes)
- When a check-in is submitted, the original `task` input is re-sent with the check-in update appended as a multi-line string: `task + "\n\n---\n[CHECK-IN at Xmin]\nUser update: ...\nTime remaining: ~Ym"`

**Why:** Claude has no persistent conversation ID — each call is stateless. Context must be manually re-injected to give Claude the session history it needs for a coherent check-in response.

**How to apply:** If adding other time-aware modes (e.g. Pomodoro), follow this same pattern. The `isBodyDouble` boolean guard in `ModeSession.tsx` is the feature flag — replicate it for new timer-based modes with a similar boolean.
