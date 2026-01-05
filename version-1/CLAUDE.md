# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a desktop arithmetic flashcard training app for macOS. The app helps users practice basic arithmetic (addition, subtraction, multiplication, division) with spaced repetition and performance tracking.

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

- All operations limited to 0-12 range
  - Addition: up to 12 + 12
  - Multiplication: up to 12 × 12
- Subtraction: only problems with non-negative answers
- Division: only problems with whole number answers (no remainders)

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
