# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a desktop arithmetic flashcard training app for macOS. The app helps users practice basic arithmetic (addition, subtraction, multiplication, division, percent × percent) with spaced repetition and performance tracking.

## Architecture Overview

### Card Selection Algorithm Pattern

The card selection algorithm is designed to be swappable. The algorithm interface:

**Receives:**
- Full set of cards in current practice set
- Each card's graduation state (streak count, last shown time, graduated status)
- Complete response history (timestamps, correctness)
- Current session's recent cards

**Returns:**
- Next card to display

**Constraints handled externally:**
- Graduation logic (3 correct answers under graduation interval)
- "Show again within 10" rule for incorrect answers

**Potential algorithms to support:**
- Random: uniform selection from non-graduated cards
- Sequential difficulty: prioritize smaller operands
- Weakness-focused: prioritize cards with slower response times

### Problem Space Definition

- All operations limited to 1-12 range (no zeros)
  - Addition: 1+1 to 12+12
  - Multiplication: 1×1 to 12×12
- Subtraction: only problems with non-negative answers
- Division: only problems with whole number answers (no remainders)
- Percent × Percent (`%`, id prefix `pct`): operands from 0%, 1%, 2%, 5%, 10%, … 100% (both orders); answer is entered in percent (e.g. `50% × 5% = 2.5`). Difficulty ranking uses the operand's index in `PERCENT_VALUES`.

Shared helpers for ids, answers, labels, and display live in `src/utils/problems.ts`.

### Data Storage Requirements

Each response must record:
- Timestamp when query was served
- Timestamp of response
- The arithmetic question
- The given answer
- The practice set configuration active during that query

From these, derive:
- Correctness (boolean)
- Response time (calculated from timestamps)

### Session Definition

A practice session ends when either:
1. Gap of more than one hour after a response
2. Practice set is manually changed

### Graduation System

Cards graduate when answered correctly in less than the graduation interval 3 times in a row (without any slower or incorrect answers in between). Graduated cards:
- Don't appear again in current session
- Reset on app restart
- Don't appear for next hour unless practice set changes

## Development Milestones

1. Core flashcard loop (show problem, accept input, evaluate, next card)
2. Graduation logic and session tracking
3. Settings sidebar and practice set selection
4. Stats page with time series graph
5. Stats table view and CSV export

## UI Structure

### Main Views

**Practice View:**
- Flashcard showing arithmetic problem (no answer)
- Input field for answer
- Visual feedback on enter: red (incorrect), yellow (correct but slow), green (correct and fast)
- Completion celebration when all cards graduate

**Settings View:**
- 2×2 grid for selecting operation types (at least one must be selected)
- Graduation interval slider (default: 2 seconds)

**Stats View:**
- Time series graph: x-axis is date, y-axis is response time
- Sessions shown as rectangles (min to max response time, with average highlighted)
- Color coding by practice set (solid for single operation, diagonal stripes for mixed)
- Date range slider for zooming
- "Exclude wrong answers" toggle
- Hoverable sessions show start/end time and practice set
- Clickable sessions show detailed time series with wrong answers in red

**Stats Table View:**
- Operation selector dropdown
- Columns: fact, correct % (operation-only), correct % (mixed), avg time (operation-only), avg time (mixed)
- "Mixed" = any practice set with multiple operations

### Navigation

Vertical sidebar with icons:
- Practice (return to flashcard)
- Settings (gear icon)
- Stats (trendline icon)

Stats toolbar (when in stats view):
- Time series graph icon
- Table view icon
- Download CSV icon

## Development

### Running in Dev Mode

To run the app in development mode with hot module replacement:

```bash
# Start the dev server (runs both Vite and TypeScript compiler)
npm run dev

# In a separate terminal, start Electron
NODE_ENV=development npx electron .
```

The Vite dev server runs on port 5173 by default. Electron will connect to this port automatically.

### Restarting the App

When restarting during development, always restart both the dev server and Electron together:

```bash
# Kill everything and restart
pkill -f "electron"; pkill -f "vite"; pkill -f "npm"
npm run dev &
sleep 2 && NODE_ENV=development npx electron .
```

**Important:** If only Electron is restarted without the dev server running, the app will show a blank screen due to connection refused error.

### Building for Production

```bash
npm run build && npm start
```
