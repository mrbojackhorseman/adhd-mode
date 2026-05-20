# ADHD Mode

7 executive function tools that shatter paralysis and get work done in hours, not days.

## What it does

A dark-mode web app with 7 AI-powered modes, each targeting a specific ADHD failure pattern:

| Mode | When to use |
|------|-------------|
| 🧱 Task Paralysis Shatterer | Frozen in front of a task |
| ⚡ Dopamine Menu Architect | Bored, restless, can't engage |
| 👥 Body Doubling Simulator | Need presence to stay focused (30-min timer + check-ins) |
| 🔄 Context Switching Guide | Brain stuck between two tasks |
| 🎮 Interest-Based Filter | Task too boring to start — gamify it |
| ⏰ Time Blindness Auditor | Keep underestimating task duration |
| 🧠 Executive Function Externalizer | Head full of open loops — triage to Now/Later/Trash |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel project settings
4. Deploy

## Configuration

All 7 mode prompts live in `src/lib/modes.ts`. Edit the `systemPrompt` field on any mode to tune the AI's behavior without touching the UI.
