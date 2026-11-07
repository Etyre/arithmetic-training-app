// Smoke test: launch the built app (dist/) against a throwaway data folder,
// let it run for a few seconds, then quit it. Passes if Electron starts and exits
// cleanly on SIGTERM; the real data in ~/Library/Application Support is untouched.
// Usage: npm run smoke   (needs `npm run build` first; opens a window briefly)
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const electron = require('electron'); // path to the Electron binary
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arithmetic-trainer-smoke-'));
const child = spawn(electron, [path.join(__dirname, '..')], {
  env: { ...process.env, ARITHMETIC_TRAINER_DATA_DIR: dataDir },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', d => (output += d));
child.stderr.on('data', d => (output += d));
const timer = setTimeout(() => child.kill('SIGTERM'), 6000);
child.on('exit', (code, signal) => {
  clearTimeout(timer);
  const crashed = signal !== 'SIGTERM' && code !== 0;
  console.log(`electron exited code=${code} signal=${signal}; data dir ${dataDir}`);
  if (output.trim()) console.log(output.trim());
  fs.rmSync(dataDir, { recursive: true, force: true });
  if (crashed || /Error/.test(output)) {
    console.error('SMOKE FAIL');
    process.exit(1);
  }
  console.log('SMOKE OK');
});
