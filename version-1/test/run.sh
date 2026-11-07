#!/bin/bash
# Compiles the pure-logic tests with tsc into a temp folder and runs them with
# node's built-in test runner. No Electron, no DOM, no network; safe to run while
# the app is open. Usage: npm test   (or: bash test/run.sh)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
npx tsc --outDir "$OUT" --rootDir . --module commonjs --target es2020 \
  --moduleResolution node --esModuleInterop --strict --skipLibCheck \
  --types node test/logic.test.ts
node --test "$OUT/test/logic.test.js"
