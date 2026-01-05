# Arithmetic Training App

A desktop flashcard application for practicing basic arithmetic operations (addition, subtraction, multiplication, division) with spaced repetition and performance tracking.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

To run the app in development mode, you need two terminal windows:

**Terminal 1** - Start the Vite dev server:
```bash
npm run dev:renderer
```

**Terminal 2** - Start Electron (after the dev server is running):
```bash
npm run dev:start
```

Or use concurrently to run both at once:
```bash
npm run dev
```

### Production Build

Build and run the production version:

```bash
npm run build
npm start
```

## Features

### Core Practice Mode
- Flash card interface for arithmetic practice
- Visual feedback (red/yellow/green) based on correctness and speed
- Graduation system: answer correctly 3 times under the graduation interval
- Smart card selection with "show within 10" rule for incorrect answers

### Settings
- Select practice set (any combination of +, -, ×, ÷)
- Adjust graduation interval (default: 2 seconds)
- Practice set changes trigger new session

### Data Persistence
- All responses saved to JSON file
- Settings persisted across sessions
- Data stored in app's userData directory

### Statistics (Coming Soon)
- Time series graphs showing response times over sessions
- Performance breakdown by operation type
- CSV export for external analysis

## Architecture

### Key Services
- **ProblemGenerator**: Generates all valid arithmetic problems (0-12 range)
- **SessionManager**: Tracks graduation state and session progress
- **CardSelector**: Swappable algorithm interface for card selection
- **DataService**: Handles JSON file persistence via Electron IPC

### Tech Stack
- Electron
- React + TypeScript
- Vite
- Recharts (for stats visualization)

## Development Status

✅ Core flashcard loop
✅ Graduation logic
✅ Settings UI
✅ Data persistence
⏳ Stats visualization
⏳ CSV export
