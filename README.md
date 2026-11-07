# Arithmetic Training App

A simple adaptive flashcard app: a macOS desktop (Electron + React) trainer for basic arithmetic facts (addition, subtraction, multiplication, division, and percent × percent) with a streak-based graduation system, a difficulty ladder, and response-time statistics. Built 3–4 January 2026 from `version-1/spec.md` so Eli could drill arithmetic facts to speed; the progress bar, refined card selection and the percent × percent set were added 25 August 2026. The code lives in `version-1/` (this folder is the git repo root).

## How it works

- **Problem space** (`version-1/src/services/ProblemGenerator.ts`): all operations use operands 1–12 (no zeros). Addition 1+1…12+12; multiplication 1×1…12×12; subtraction only where the answer is ≥ 0; division only where the answer is a whole number. Percent × Percent (`%`, id prefix `pct`) uses operands 0%, 1%, 2%, 5%, 10%, … 100% in both orders; the answer is entered in percent (`50% × 5% = 2.5`). Problem ids look like `mul-7-8`; `src/utils/problems.ts` holds the shared helpers for ids, answers, labels and display.
- **Practice loop** (`src/App.tsx`, `src/components/Flashcard.tsx`): a card shows the problem, the user types the answer and presses Enter. The border flashes red (wrong), yellow (correct but slower than the graduation interval) or green (correct and fast); after 500 ms the next card is chosen. For percent problems a `%` suffix is shown next to the typed answer. If no answer is typed for one minute a "Press continue" pause screen appears; continuing draws a fresh card. Leaving the practice view discards the current card; returning draws a new one.
- **Graduation** (`src/services/SessionManager.ts`): a card graduates after 3 consecutive correct answers faster than the graduation interval (default 2 s). A first-ever attempt that is correct and fast graduates immediately. A slow or wrong answer resets the streak and un-graduates the card. Wrong answers are re-shown within 10 cards, slow ones within 15 ("priority cards"). Session state is in memory only and resets on app restart or practice-set change.
- **Card selection** (`src/algorithms/RandomSelector.ts`, behind the swappable `CardSelector` interface): a difficulty ladder starts with max operand 5 (percent: index in `PERCENT_VALUES`) and unlocks one more level per 10 graduations. Priority cards come first; otherwise weighted random where graduated cards have 0.1× weight and the last 10 shown cards are strongly down-weighted. The selector always returns a card, so the "all cards graduated" celebration view (with session stats and a scatter chart) is effectively unreachable with this selector.
- **Progress bar** (`src/components/ProgressBar.tsx`): graduated / in-progress / total for the current practice set.
- **Sessions** (for stats): responses are grouped into a session until a gap of more than one hour after a response or a practice-set change.
- **Persistence** (`electron/main.ts`, `electron/preload.ts`, `src/services/DataService.ts`): the renderer calls `window.electronAPI.*` over IPC; the main process appends every response (`queryTimestamp`, `responseTimestamp`, `problemId`, `givenAnswer`, `practiceSet`) to `responses.json` and saves `settings.json`. Correctness and response time are derived from those fields. Response times longer than one minute are truncated to one minute on load and on save.
- **Drafts** (`src/utils/drafts.ts`): the half-typed answer is saved to `localStorage` on every keystroke, keyed `practice:answer:<problemId>`, restored before the card paints, and cleared only on submit. (The Settings slider, stats range sliders, checkbox and dropdown are not text fields.)
- **Stats** (`src/components/Stats.tsx`): time-series view of sessions (rectangle from min to max response time, average marked, colour per practice set; solid for single-operation sets, striped for mixed), a date-range slider, an "exclude wrong answers" toggle, hover for session start/end/practice set, click for the per-response series of that session with wrong answers in red; a table view per operation (fact, correct % operation-only, correct % mixed, avg time operation-only, avg time mixed; "mixed" = any practice set with more than one operation); and a CSV download of all data.

Dependencies and why: Electron (native macOS window + file access), React + TypeScript (UI), Vite (bundler/dev server), Recharts (stats charts), concurrently and cross-env (dev scripts only).

## Files

| Path (under `version-1/`) | Purpose |
|---|---|
| `README.md` | Pointer to this file |
| `CLAUDE.md` | Architecture notes for Claude Code (card-selector interface, problem space, UI structure, dev workflow) |
| `spec.md` | Eli's original spec the app was built from |
| `package.json`, `package-lock.json` | npm scripts and dependencies |
| `tsconfig.json`, `tsconfig.main.json`, `tsconfig.node.json` | TypeScript configs for the renderer, the Electron main process, and `vite.config.ts` |
| `vite.config.ts`, `index.html` | Vite build (output `dist/renderer`) and the HTML shell |
| `electron/main.ts` | Main process: window, data files, IPC handlers (header comment describes data locations) |
| `electron/preload.ts` | Exposes `window.electronAPI` to the renderer |
| `src/main.tsx` | Renderer entry; mounts `App` |
| `src/App.tsx` | Top-level state: view, current card, settings, responses, session wiring |
| `src/components/Flashcard.tsx` / `.css` | The card, answer input (with draft persistence), feedback colours, pause screen, completion celebration |
| `src/components/Settings.tsx` / `.css` | Practice-set grid (at least one operation must stay selected) and graduation-interval slider (0.5–5 s) |
| `src/components/Stats.tsx` / `.css` | Session time series, session detail, facts table, CSV export |
| `src/components/ProgressBar.tsx` / `.css` | Graduated / in-progress progress bar |
| `src/components/Sidebar.tsx` / `.css` | Practice, Settings and Stats navigation |
| `src/services/ProblemGenerator.ts` | Generates every valid problem |
| `src/services/SessionManager.ts` | Streaks, graduation, priority cards, recent cards |
| `src/services/DataService.ts` | Thin wrapper over `window.electronAPI` |
| `src/algorithms/CardSelector.ts` | Interface for swappable selection algorithms |
| `src/algorithms/RandomSelector.ts` | The current algorithm (difficulty ladder + weighted random) |
| `src/utils/problems.ts` | Problem ids, answers, labels, percent values |
| `src/utils/drafts.ts` | localStorage draft save/restore/clear |
| `src/types/index.ts` | Shared TypeScript types |
| `test/logic.test.ts`, `test/run.sh` | Unit tests for problem generation, graduation, selection and drafts (`npm test`) |
| `test/smoke.js` | Launches the built app against a temp data folder and quits it (`npm run smoke`) |
| `dist/` (gitignored) | Build output: `main.js`, `preload.js`, `renderer/` |
| `../test.txt` | Empty file from the first test commit; harmless |

## Runtime locations

- **Data**: `~/Library/Application Support/arithmetic-trainer/data/responses.json` (every response) and `settings.json` (practice set, graduation interval). Override the folder with `ARITHMETIC_TRAINER_DATA_DIR=<path>`.
- **Drafts**: Electron's localStorage for the renderer, under `~/Library/Application Support/arithmetic-trainer/Local Storage/`.
- **Logs**: none on disk. Main-process errors print to the terminal that launched `npm start`; in dev mode DevTools opens automatically for renderer errors.
- **Installed copy**: none. The app runs from this folder via `npm start`; it is not packaged or installed as a background agent.

## Common tasks

All commands run from `version-1/`.

```bash
cd ~/Documents/agent-coding/arithmetic-training-app/version-1

# Install dependencies (first time only)
npm install

# Development with hot reload, two terminals:
npm run dev:renderer          # terminal 1: Vite dev server on http://localhost:5173
npm run dev:start             # terminal 2: build main process, start Electron in dev mode
# ...or both at once (Vite + tsc --watch), then Electron in another terminal:
npm run dev
NODE_ENV=development npx electron .

# Production build and run
npm run build                 # vite build -> dist/renderer, tsc -> dist/main.js
npm start

# Tests (no Electron, no DOM; safe while the app is open)
npm test

# Smoke test: starts the built app with a throwaway data folder for ~6 s, then quits it
npm run build && npm run smoke

# Try the app without touching real data
ARITHMETIC_TRAINER_DATA_DIR=/tmp/at-data npm start

# Stop: quit the app (Cmd+Q) or kill the Electron PID
pgrep -fl "arithmetic-training-app/version-1" ; kill <pid>

# Inspect data
cat ~/Library/Application\ Support/arithmetic-trainer/data/settings.json
python3 -c 'import json;print(len(json.load(open("'"$HOME"'/Library/Application Support/arithmetic-trainer/data/responses.json"))))'
```

## Settings that matter

- In-app Settings: practice set (any combination of +, −, ×, ÷, %×%; at least one) and graduation interval (0.5–5 s, default 2 s). Changing the practice set starts a new session; changing only the interval does not.
- No System Settings permissions are needed; the app only reads and writes its own userData folder.

## Gotchas learned

- Restarting only Electron while the Vite dev server is not running gives a blank window ("connection refused"). In dev mode always start the dev server first, or use `npm run dev:start` after `npm run dev:renderer`.
- `tsc --noEmit -p tsconfig.json` reports about ten pre-existing unused-import/variable errors (`noUnusedLocals`), e.g. in `Stats.tsx` and `App.tsx`. The Vite build does not typecheck, so `npm run build` still succeeds. `tsconfig.main.json` is clean.
- `RandomSelector` never returns `null` (graduated cards stay in the pool at 0.1× weight), so the completion celebration in `Flashcard.tsx` is effectively unreachable; `CLAUDE.md`'s "graduated cards don't appear again" describes the spec, not the current selector.
- Response times over one minute are clamped to 60 s on both save and load, so the stats never show a wall-clock pause as a 20-minute response.
- The dev-mode `--watch` tsc and the Vite server are separate processes; `pkill -f electron` style restarts (as written in `CLAUDE.md`) can silently fail and leave old code running. Prefer quitting the app and checking `pgrep` before restarting.
- The renderer bundle is ~550 kB (Recharts); Vite warns about chunk size on every build. Harmless.
- The original "Statistics (Coming Soon)" items from the first README (time series graphs, per-operation breakdown, CSV export) are now implemented in `Stats.tsx`.
