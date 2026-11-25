import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVAGES, pickUnique, claimUnique } from '../../shared/flavor.js';

test('SAVAGES contains distinct entries with zero duplicates', () => {
  const unique = new Set(SAVAGES);
  assert.ok(SAVAGES.length >= 50, `Expected >= 50 roasts, got ${SAVAGES.length}`);
  assert.equal(unique.size, SAVAGES.length, 'SAVAGES pool should contain no duplicate strings');
});

test('pickUnique exhausts every item before repeating and never repeats back-to-back', () => {
  const tracker = { seen: new Set(), last: null };
  const firstPass = [];

  for (let i = 0; i < SAVAGES.length; i += 1) {
    firstPass.push(pickUnique(SAVAGES, tracker));
  }

  assert.equal(new Set(firstPass).size, SAVAGES.length, 'First full cycle should show every roast once');

  let prev = firstPass[firstPass.length - 1];
  for (let i = 0; i < SAVAGES.length * 2; i += 1) {
    const next = pickUnique(SAVAGES, tracker);
    assert.notEqual(next, prev, 'Same roast must never appear consecutively even across cycle rollovers');
    prev = next;
  }
});

test('claimUnique accepts unseen server candidate and replaces repeated candidates', () => {
  const tracker = { seen: new Set(), last: null };
  const serverPick = SAVAGES[0];

  const first = claimUnique(serverPick, SAVAGES, tracker);
  assert.equal(first, serverPick);

  const second = claimUnique(serverPick, SAVAGES, tracker);
  assert.notEqual(second, serverPick, 'Duplicate candidate must be swapped for an unseen message');

  const missing = claimUnique(undefined, SAVAGES, tracker);
  assert.ok(missing.length > 0);
  assert.notEqual(missing, second);
});
