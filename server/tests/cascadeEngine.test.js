import test from 'node:test';
import assert from 'node:assert/strict';
import {
  targetDifficultyFor,
  selectQuestion,
  evaluateCascadeAnswer,
} from '../src/cascadeEngine.js';
import { parseAndValidateQuestions } from '../src/models/questionValidator.js';
import { DEFAULT_CONFIG } from '../../shared/constants.js';
import { JUNIOR } from '../src/questions/junior.js';
import { SENIOR } from '../src/questions/senior.js';

function makePlayer(overrides = {}) {
  return {
    id: 'p1',
    name: 'TestAgent',
    year: 1,
    group: 'junior',
    level: 0,
    phase: 'MAIN',
    room: 0,
    resets: 0,
    bestLevel: 0,
    solved: 0,
    fails: 0,
    hintsUsed: 0,
    cheats: 0,
    score: 0,
    streak: 0,
    mainFailsOnCurrentLevel: 0,
    finished: false,
    finishedAt: null,
    status: 'active',
    ...overrides,
  };
}

test('targetDifficultyFor is non-increasing across rooms and floors at 1', () => {
  for (let level = 0; level < 60; level++) {
    const mainDiff = targetDifficultyFor(level, 'MAIN', 0);
    assert.equal(mainDiff, level + 1);
    let prev = mainDiff;
    for (let r = 1; r <= 4; r++) {
      const roomDiff = targetDifficultyFor(level, 'ROOM', r);
      assert.ok(roomDiff >= 1, `Room ${r} difficulty at level ${level} must be >= 1`);
      assert.ok(roomDiff <= prev, `Room ${r} (${roomDiff}) must be <= previous (${prev})`);
      prev = roomDiff;
    }
  }
});

test('MAIN correct advances level and finishes at level 60', () => {
  const p0 = makePlayer({ level: 0, phase: 'MAIN', room: 0 });
  const r1 = evaluateCascadeAnswer({ player: p0, isCorrect: true, remainingSec: 20 });
  assert.equal(r1.transition, 'ADVANCE');
  assert.equal(r1.nextPlayer.level, 1);
  assert.equal(r1.nextPlayer.bestLevel, 1);
  assert.equal(r1.nextPlayer.phase, 'MAIN');
  assert.ok(r1.pointsGained > 0);

  const p59 = makePlayer({ level: 59, bestLevel: 59, phase: 'MAIN', room: 0 });
  const r60 = evaluateCascadeAnswer({ player: p59, isCorrect: true, remainingSec: 15 });
  assert.equal(r60.transition, 'FINISH');
  assert.equal(r60.nextPlayer.level, 60);
  assert.equal(r60.nextPlayer.finished, true);
  assert.equal(r60.nextPlayer.status, 'won');
});

test('Cascade fall-down: MAIN wrong -> R1 -> R2 -> R3 -> R4 -> RESET', () => {
  let p = makePlayer({ level: 17, bestLevel: 17, score: 500, streak: 3 });

  // MAIN wrong -> ROOM 1
  let res = evaluateCascadeAnswer({ player: p, isCorrect: false });
  assert.equal(res.transition, 'ENTER_ROOM');
  assert.equal(res.nextPlayer.phase, 'ROOM');
  assert.equal(res.nextPlayer.room, 1);
  assert.equal(res.nextPlayer.level, 17);
  assert.equal(res.nextPlayer.streak, 0);
  p = res.nextPlayer;

  // ROOM 1..3 wrong -> ROOM 2..4
  for (let r = 1; r <= 3; r++) {
    res = evaluateCascadeAnswer({ player: p, isCorrect: false });
    assert.equal(res.transition, 'NEXT_ROOM');
    assert.equal(res.nextPlayer.phase, 'ROOM');
    assert.equal(res.nextPlayer.room, r + 1);
    p = res.nextPlayer;
  }

  // ROOM 4 wrong -> FULL RESET
  res = evaluateCascadeAnswer({ player: p, isCorrect: false });
  assert.equal(res.transition, 'RESET');
  assert.equal(res.nextPlayer.level, 0);
  assert.equal(res.nextPlayer.phase, 'MAIN');
  assert.equal(res.nextPlayer.room, 0);
  assert.equal(res.nextPlayer.resets, 1);
  assert.equal(res.nextPlayer.score, 0);
  assert.equal(res.nextPlayer.bestLevel, 17);
});

test('ROOM recovery returns to MAIN on SAME level by default, or NEXT level if configured', () => {
  const p = makePlayer({ level: 12, bestLevel: 12, phase: 'ROOM', room: 4 });

  // same_question mode (default)
  const sameRes = evaluateCascadeAnswer({
    player: p,
    isCorrect: true,
    remainingSec: 10,
    config: { ...DEFAULT_CONFIG, returnMode: 'same_question' },
  });
  assert.equal(sameRes.transition, 'RETURN_TO_MAIN');
  assert.equal(sameRes.nextPlayer.level, 12);
  assert.equal(sameRes.nextPlayer.phase, 'MAIN');
  assert.equal(sameRes.nextPlayer.room, 0);

  // next_level mode
  const nextRes = evaluateCascadeAnswer({
    player: p,
    isCorrect: true,
    remainingSec: 10,
    config: { ...DEFAULT_CONFIG, returnMode: 'next_level' },
  });
  assert.equal(nextRes.transition, 'RETURN_TO_MAIN');
  assert.equal(nextRes.nextPlayer.level, 13);
  assert.equal(nextRes.nextPlayer.phase, 'MAIN');
  assert.equal(nextRes.nextPlayer.room, 0);
});

test('maxMainFailsPerLevel forces RESET when enabled', () => {
  let p = makePlayer({ level: 5, bestLevel: 5, mainFailsOnCurrentLevel: 1 });
  const res = evaluateCascadeAnswer({
    player: p,
    isCorrect: false,
    config: { ...DEFAULT_CONFIG, maxMainFailsPerLevel: 2 },
  });
  assert.equal(res.transition, 'RESET');
  assert.equal(res.nextPlayer.level, 0);
  assert.equal(res.nextPlayer.resets, 1);
});

test('selectQuestion avoids repeats and shuffles without exposing answer in client payload', () => {
  const seen = new Set();
  for (const bank of [JUNIOR, SENIOR]) {
    let lastId = null;
    for (let i = 0; i < 30; i++) {
      const sel = selectQuestion({
        bank,
        level: i,
        phase: 'MAIN',
        room: 0,
        seenIds: seen,
        excludeId: lastId,
      });
      assert.ok(sel.clientQuestion.questionToken);
      assert.equal(sel.clientQuestion.options.length, 4);
      assert.equal('a' in sel.clientQuestion, false);
      assert.notEqual(sel.questionId, lastId);
      assert.ok(['A', 'B', 'C', 'D'].includes(sel.correctOptionId));
      seen.add(sel.questionId);
      lastId = sel.questionId;
    }
  }
});

test('parseAndValidateQuestions parses CSV and JSON and computes coverage report', () => {
  const json = JSON.stringify([
    { id: 'Q1', difficulty: 1, text: '1+1?', options: ['1', '2', '3', '4'], correct_option: 'B', topic: 'Math' },
    { id: 'Q2', difficulty: 2, text: '2+2?', options: ['2', '3', '4', '5'], correct_option: 2, topic: 'Math' },
  ]);
  const res = parseAndValidateQuestions(json);
  assert.equal(res.ok, true);
  assert.equal(res.report.loaded, 2);
  assert.equal(res.questions[0].a, 1);
  assert.equal(res.questions[1].lv, 2);

  const csv = 'id,difficulty,text,optionA,optionB,optionC,optionD,correct,topic\nC1,5,"What is TCP?",A,B,C,D,C,Networking';
  const csvRes = parseAndValidateQuestions(csv);
  assert.equal(csvRes.ok, true);
  assert.equal(csvRes.questions[0].a, 2);
  assert.equal(csvRes.questions[0].lv, 5);
});
