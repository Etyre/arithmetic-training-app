// Draft persistence for text fields (agent-coding "drafts are never lost" rule).
// Every text input saves what the user has typed on each change and restores it
// the next time that exact field is shown. Keys are "<view>:<field>:<record>" so a
// draft only comes back in the place it was typed. Storage is the renderer's
// localStorage (Electron keeps it on disk under the app's userData folder);
// every access is wrapped in try/catch because localStorage can be unavailable.

const PREFIX = 'arithmetic-trainer:draft:';

function storage(): Storage | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

export function loadDraft(key: string): string {
  try {
    return storage()?.getItem(PREFIX + key) ?? '';
  } catch {
    return '';
  }
}

export function saveDraft(key: string, value: string): void {
  try {
    const s = storage();
    if (!s) return;
    if (value === '') {
      s.removeItem(PREFIX + key);
    } else {
      s.setItem(PREFIX + key, value);
    }
  } catch {
    // Losing a draft is better than crashing the field.
  }
}

export function clearDraft(key: string): void {
  try {
    storage()?.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
