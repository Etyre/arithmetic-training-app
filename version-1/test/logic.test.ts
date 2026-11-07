// Unit tests for the pure logic (no Electron, no DOM): problem generation,
// answer checking, graduation/streaks, card selection, and draft persistence.
// Run with `npm test` (test/run.sh compiles this with tsc and runs node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProblemGenerator } from '../src/services/ProblemGenerator';
import { SessionManager } from '../src/services/SessionManager';
import { RandomSelector } from '../src/algorithms/RandomSelector';
import { computeAnswer, getCorrectAnswer, PERCENT_VALUES } from '../src/utils/problems';
import { loadDraft, saveDraft, clearDraft } from '../src/utils/drafts';

const gen = new ProblemGenerator();

test('problem space matches the spec', () => {
  const add = gen.getProblems(['+']);
  assert.equal(add.length, 144); // 1..12 x 1..12
  const sub = gen.getProblems(['-']);
  assert.ok(sub.every(p => p.answer >= 0), 'subtraction answers are non-negative');
  const div = gen.getProblems(['/']);
  assert.ok(div.every(p => Number.isInteger(p.answer)), 'division answers are whole');
  const pct = gen.getProblems(['%']);
  assert.equal(pct.length, PERCENT_VALUES.length ** 2);
  for (const p of [...add, ...sub, ...div, ...pct]) {
    assert.equal(getCorrectAnswer(p.id), p.answer, `id round-trips for ${p.id}`);
  }
});

test('percent answers are expressed in percent', () => {
  assert.equal(computeAnswer('%', 50, 5), 2.5);
  assert.equal(computeAnswer('%', 100, 100), 100);
});

test('graduation needs 3 fast correct answers after a miss', () => {
  const sm = new SessionManager(2000, ['*']);
  const p = gen.getProblems(['*']).find(x => x.id === 'mul-7-8')!;
  // Wrong first: not graduated, scheduled for re-show within 10 cards
  sm.recordResponse(p, 55, 0, 1000);
  assert.equal(sm.getState().cardStates.get(p.id)!.graduated, false);
  assert.ok(sm.getPriorityCards().includes(p.id));
  // Three fast correct answers in a row graduate it
  for (let i = 0; i < 3; i++) sm.recordResponse(p, 56, 0, 1000);
  assert.equal(sm.getState().cardStates.get(p.id)!.graduated, true);
  // A slow correct answer un-graduates it
  sm.recordResponse(p, 56, 0, 5000);
  assert.equal(sm.getState().cardStates.get(p.id)!.graduated, false);
});

test('first-try fast correct answer graduates immediately', () => {
  const sm = new SessionManager(2000, ['+']);
  const p = gen.getProblems(['+'])[0];
  const r = sm.recordResponse(p, p.answer, 0, 500);
  assert.deepEqual(r, { correct: true, fast: true });
  assert.equal(sm.getState().cardStates.get(p.id)!.graduated, true);
});

test('selector returns a card from the practice set and avoids the current card', () => {
  const sm = new SessionManager(2000, ['+', '/']);
  const sel = new RandomSelector();
  const problems = gen.getProblems(['+', '/']);
  const ids = new Set(problems.map(p => p.id));
  let current: string | null = null;
  for (let i = 0; i < 200; i++) {
    const next = sel.selectNext(problems, sm.getState(), [], current);
    assert.ok(next && ids.has(next.id));
    assert.notEqual(next!.id, current);
    sm.trackShownCard(next!.id);
    current = next!.id;
  }
});

test('drafts save, restore and clear through localStorage', () => {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  saveDraft('practice:answer:mul-7-8', '5');
  assert.equal(loadDraft('practice:answer:mul-7-8'), '5');
  assert.equal(loadDraft('practice:answer:mul-7-9'), '', 'keyed per card');
  clearDraft('practice:answer:mul-7-8');
  assert.equal(loadDraft('practice:answer:mul-7-8'), '');
  // Unavailable storage must not throw
  (globalThis as any).localStorage = undefined;
  saveDraft('x', 'y');
  assert.equal(loadDraft('x'), '');
});
