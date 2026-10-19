'use strict';
/* 2048-bd - Node unit tests for js/logic.js. No dependencies.
 * Run: node tests/test-logic.js  (exit code 0 = all pass) */
var G = require('../js/logic.js');

var passed = 0;
var failed = 0;
var failures = [];

function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; failures.push(name); console.log('FAIL: ' + name); }
}

function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function checkEq(name, actual, expected) {
  check(name, eq(actual, expected));
  if (!eq(actual, expected)) {
    console.log('  expected: ' + JSON.stringify(expected));
    console.log('  actual:   ' + JSON.stringify(actual));
  }
}

function rowBoard(r0, r1, r2, r3) {
  return [r0, r1, r2, r3];
}
function colBoard(c0) {
  // Board whose first column is c0, rest zeros.
  return [[c0[0], 0, 0, 0], [c0[1], 0, 0, 0], [c0[2], 0, 0, 0], [c0[3], 0, 0, 0]];
}
function firstCol(board) {
  return [board[0][0], board[1][0], board[2][0], board[3][0]];
}
function countTiles(board) {
  var n = 0;
  board.forEach(function (row) { row.forEach(function (v) { if (v !== 0) n++; }); });
  return n;
}

// --- slide: left ---
var r = G.slide(rowBoard([2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
checkEq('left [2,2,4,0] -> [4,4,0,0]', r.board[0], [4, 4, 0, 0]);
check('left [2,2,4,0] gained 4', r.gained === 4);
check('left [2,2,4,0] moved', r.moved === true);
check('left [2,2,4,0] not won', r.won === false);

r = G.slide(rowBoard([2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
checkEq('left [2,2,2,2] -> [4,4,0,0]', r.board[0], [4, 4, 0, 0]);
check('left [2,2,2,2] gained 8', r.gained === 8);

r = G.slide(rowBoard([4, 4, 8, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
checkEq('no double-merge [4,4,8,0] -> [8,8,0,0]', r.board[0], [8, 8, 0, 0]);
check('no double-merge gained 8 (not 16)', r.gained === 8);

// --- slide: right ---
r = G.slide(rowBoard([2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'right');
checkEq('right [2,2,4,0] -> [0,0,4,4]', r.board[0], [0, 0, 4, 4]);
check('right gained 4', r.gained === 4);

r = G.slide(rowBoard([2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'right');
checkEq('right [2,2,2,2] -> [0,0,4,4]', r.board[0], [0, 0, 4, 4]);

// --- slide: up / down ---
r = G.slide(colBoard([2, 2, 4, 0]), 'up');
checkEq('up column [2,2,4,0] -> [4,4,0,0]', firstCol(r.board), [4, 4, 0, 0]);
check('up gained 4', r.gained === 4);

r = G.slide(colBoard([2, 2, 4, 0]), 'down');
checkEq('down column [2,2,4,0] -> [0,0,4,4]', firstCol(r.board), [0, 0, 4, 4]);

r = G.slide(colBoard([2, 2, 2, 2]), 'down');
checkEq('down column [2,2,2,2] -> [0,0,4,4]', firstCol(r.board), [0, 0, 4, 4]);

r = G.slide(colBoard([2, 2, 2, 2]), 'up');
checkEq('up column [2,2,2,2] -> [4,4,0,0] (no vertical double-merge)', firstCol(r.board), [4, 4, 0, 0]);

// --- merge into 2048 sets won ---
r = G.slide(rowBoard([1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
checkEq('merge 1024+1024 -> [2048,0,0,0]', r.board[0], [2048, 0, 0, 0]);
check('merge into 2048 sets won', r.won === true);
check('merge into 2048 gained 2048', r.gained === 2048);

// --- score-gain math: two 8s gain 16 ---
r = G.slide(rowBoard([8, 8, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]), 'left');
checkEq('merging two 8s -> [16,0,0,0]', r.board[0], [16, 0, 0, 0]);
check('merging two 8s gains 16', r.gained === 16);

// --- no-move detection / game over ---
var dead = [
  [2, 4, 2, 4],
  [4, 2, 4, 2],
  [2, 4, 2, 4],
  [4, 2, 4, 2]
];
check('canMove false on full board with no adjacent equals', G.canMove(dead) === false);
check('isGameOver true on dead board', G.isGameOver(dead) === true);
r = G.slide(dead, 'left');
check('slide on dead board reports moved=false', r.moved === false);
check('slide on dead board leaves board unchanged', eq(r.board, dead));
check('slide on dead board gains 0', r.gained === 0);

var withEmpty = G.cloneBoard(dead);
withEmpty[3][3] = 0;
check('canMove true when an empty cell exists', G.canMove(withEmpty) === true);
check('isGameOver false when an empty cell exists', G.isGameOver(withEmpty) === false);

var withPair = G.cloneBoard(dead);
withPair[0][1] = 2; // adjacent equal pair in row 0
check('canMove true when adjacent equals exist', G.canMove(withPair) === true);
check('isGameOver false when adjacent equals exist', G.isGameOver(withPair) === false);

// --- hasWon ---
check('hasWon false without 2048', G.hasWon(dead) === false);
var wonBoard = G.cloneBoard(dead);
wonBoard[1][1] = 2048;
check('hasWon true with a 2048 tile', G.hasWon(wonBoard) === true);

// --- slide does not mutate its input ---
var input = rowBoard([2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
var inputCopy = G.cloneBoard(input);
G.slide(input, 'left');
check('slide does not mutate input board', eq(input, inputCopy));

// --- spawnRandom: 200 trials, never overwrites ---
var spawnOk = true;
for (var t = 0; t < 200; t++) {
  var b = [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2, 4],
    [8, 16, 32, 0] // exactly one empty cell at [3][3]
  ];
  G.spawnRandom(b);
  if (b[3][3] !== 2 && b[3][3] !== 4) spawnOk = false;
  if (b[0][0] !== 2 || b[2][1] !== 1024 || b[3][2] !== 32) spawnOk = false;
}
check('spawnRandom: 200 trials, only the empty cell filled, value 2 or 4', spawnOk);

// --- spawnRandom on a full board leaves it unchanged ---
var fullCopy = G.cloneBoard(dead);
G.spawnRandom(dead);
check('spawnRandom on full board leaves board unchanged', eq(dead, fullCopy));

// --- spawn distribution sanity: exactly one tile, value 2 or 4 ---
var distOk = true;
for (var s = 0; s < 300; s++) {
  var e = G.emptyBoard();
  G.spawnRandom(e);
  if (countTiles(e) !== 1) distOk = false;
  e.forEach(function (row) { row.forEach(function (v) {
    if (v !== 0 && v !== 2 && v !== 4) distOk = false;
  }); });
}
check('spawn distribution: 300 spawns each place exactly one 2-or-4 tile', distOk);

// --- newGame ---
var ng = G.newGame();
check('newGame starts with exactly 2 tiles', countTiles(ng.board) === 2);
var newTilesOk = true;
ng.board.forEach(function (row) { row.forEach(function (v) {
  if (v !== 0 && v !== 2 && v !== 4) newTilesOk = false;
}); });
check('newGame tiles are 2 or 4', newTilesOk);
check('newGame score starts at 0', ng.score === 0);
check('newGame moves start at 0', ng.moves === 0);

// --- undo stack cap 10 ---
var stack = [];
for (var u = 0; u < 12; u++) {
  G.pushUndo(stack, { board: G.emptyBoard(), score: u, moves: u });
}
check('undo stack capped at 10 after 12 pushes', stack.length === 10);
check('undo stack drops oldest (first kept snapshot is #2)', stack[0].score === 2 && stack[9].score === 11);

// --- invalid direction throws ---
var threw = false;
try { G.slide(G.emptyBoard(), 'diagonal'); } catch (err) { threw = true; }
check('slide with invalid direction throws', threw === true);

console.log('test-logic: ' + passed + ' passed, ' + failed + ' failed, ' +
  (passed + failed) + ' total');
if (failures.length > 0) {
  console.log('Failures: ' + failures.join('; '));
  process.exit(1);
}
