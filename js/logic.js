'use strict';
/*
 * 2048-bd -- pure game logic. No DOM, no I/O, no randomness beyond
 * Math.random in spawnRandom. Usable in the browser (window.Game2048)
 * and in Node (module.exports) via the UMD-style guard below.
 *
 * Board representation: 4x4 array of arrays of numbers. 0 = empty.
 * slide() NEVER mutates its input board; it returns a fresh board.
 * spawnRandom() mutates the board it is given and returns it.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Game2048 = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  var SIZE = 4;
  var WIN_TILE = 2048;
  var UNDO_CAP = 10;

  function emptyBoard() {
    var board = [];
    for (var r = 0; r < SIZE; r++) {
      board.push([0, 0, 0, 0]);
    }
    return board;
  }

  function cloneBoard(board) {
    return board.map(function (row) { return row.slice(); });
  }

  function boardsEqual(a, b) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function emptyCells(board) {
    var cells = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) cells.push([r, c]);
      }
    }
    return cells;
  }

  /*
   * Slide one row to the LEFT, applying the merge rule:
   * equal neighbours merge once per move, left to right.
   * [2,2,4,0] -> [4,4,0,0]; [2,2,2,2] -> [4,4,0,0] (no double-merge).
   */
  function slideRowLeft(row) {
    var tiles = row.filter(function (v) { return v !== 0; });
    var out = [];
    var gained = 0;
    var i = 0;
    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
        var merged = tiles[i] * 2;
        out.push(merged);
        gained += merged;
        i += 2; // both consumed; the merged tile cannot merge again
      } else {
        out.push(tiles[i]);
        i += 1;
      }
    }
    while (out.length < SIZE) out.push(0);
    var moved = false;
    for (var c = 0; c < SIZE; c++) {
      if (out[c] !== row[c]) { moved = true; break; }
    }
    return { row: out, gained: gained, moved: moved };
  }

  function slide(board, dir) {
    if (dir !== 'left' && dir !== 'right' && dir !== 'up' && dir !== 'down') {
      throw new Error('Invalid direction: ' + dir);
    }
    var next = cloneBoard(board);
    var gained = 0;
    var moved = false;

    function applyLine(line) {
      var res = slideRowLeft(line);
      gained += res.gained;
      if (res.moved) moved = true;
      return res.row;
    }

    if (dir === 'left') {
      for (var r = 0; r < SIZE; r++) next[r] = applyLine(next[r]);
    } else if (dir === 'right') {
      for (var r2 = 0; r2 < SIZE; r2++) {
        var rev = next[r2].slice().reverse();
        next[r2] = applyLine(rev).reverse();
      }
    } else if (dir === 'up') {
      for (var c = 0; c < SIZE; c++) {
        var col = [next[0][c], next[1][c], next[2][c], next[3][c]];
        var colOut = applyLine(col);
        for (var r3 = 0; r3 < SIZE; r3++) next[r3][c] = colOut[r3];
      }
    } else { // down
      for (var c2 = 0; c2 < SIZE; c2++) {
        var colD = [next[3][c2], next[2][c2], next[1][c2], next[0][c2]];
        var colDOut = applyLine(colD);
        for (var r4 = 0; r4 < SIZE; r4++) next[3 - r4][c2] = colDOut[r4];
      }
    }

    return {
      board: next,
      gained: gained,
      moved: moved,
      won: hasWon(next)
    };
  }

  // Place a 2 (90%) or 4 (10%) tile in a random empty cell.
  // On a full board, returns the board unchanged.
  function spawnRandom(board) {
    var cells = emptyCells(board);
    if (cells.length === 0) return board;
    var pick = cells[Math.floor(Math.random() * cells.length)];
    board[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
    return board;
  }

  function canMove(board) {
    if (emptyCells(board).length > 0) return true;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
        if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
      }
    }
    return false;
  }

  function isGameOver(board) {
    return !canMove(board);
  }

  function hasWon(board) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (board[r][c] >= WIN_TILE) return true;
      }
    }
    return false;
  }

  function newGame() {
    var board = emptyBoard();
    spawnRandom(board);
    spawnRandom(board);
    return { board: board, score: 0, moves: 0 };
  }

  // Push a snapshot onto the undo stack, capped at UNDO_CAP entries
  // (oldest dropped). Returns the stack for chaining.
  function pushUndo(stack, snapshot) {
    stack.push({
      board: cloneBoard(snapshot.board),
      score: snapshot.score,
      moves: snapshot.moves
    });
    while (stack.length > UNDO_CAP) stack.shift();
    return stack;
  }

  return {
    SIZE: SIZE,
    WIN_TILE: WIN_TILE,
    UNDO_CAP: UNDO_CAP,
    emptyBoard: emptyBoard,
    cloneBoard: cloneBoard,
    boardsEqual: boardsEqual,
    emptyCells: emptyCells,
    slide: slide,
    spawnRandom: spawnRandom,
    canMove: canMove,
    isGameOver: isGameOver,
    hasWon: hasWon,
    newGame: newGame,
    pushUndo: pushUndo
  };
});
