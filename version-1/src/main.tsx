// Renderer entry point for Arithmetic Trainer. Mounts <App/> (src/App.tsx).
// Data files and logs are described in electron/main.ts.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
