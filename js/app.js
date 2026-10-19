'use strict';
/* 2048-bd - UI wiring. Pure ASCII source. Game rules live in logic.js. */
(function () {
  var G = window.Game2048;
  var I = window.I18N2048;

  var BEST_KEY = '2048bd-best';
  var LANG_KEY = '2048bd-lang';

  var state = {
    board: G.emptyBoard(),
    score: 0,
    moves: 0,
    undoStack: [],
    keepPlaying: false,
    lang: 'en',
    best: 0
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function loadBest() {
    try {
      var v = window.localStorage.getItem(BEST_KEY);
      state.best = v ? parseInt(v, 10) || 0 : 0;
    } catch (e) { state.best = 0; }
  }

  function saveBest() {
    try { window.localStorage.setItem(BEST_KEY, String(state.best)); } catch (e) {}
  }

  function loadLang() {
    try {
      var v = window.localStorage.getItem(LANG_KEY);
      state.lang = (v === 'bn') ? 'bn' : 'en';
    } catch (e) { state.lang = 'en'; }
  }

  function saveLang() {
    try { window.localStorage.setItem(LANG_KEY, state.lang); } catch (e) {}
  }

  function applyI18n() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = I.t(state.lang, nodes[i].getAttribute('data-i18n'));
    }
    document.documentElement.setAttribute('lang', state.lang === 'bn' ? 'bn' : 'en');
    // Arrow-button accessible names follow the language.
    var arrows = { 'btn-up': 'up', 'btn-down': 'down', 'btn-left': 'left', 'btn-right': 'right' };
    Object.keys(arrows).forEach(function (id) {
      var el = $(id);
      if (el) el.setAttribute('aria-label', I.t(state.lang, arrows[id]));
    });
  }

  function render() {
    applyI18n();
    var grid = $('grid');
    grid.innerHTML = '';
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var v = state.board[r][c];
        var cell = document.createElement('div');
        cell.className = 'tile' + (v === 0 ? ' tile-empty' : ' tile-' + v);
        cell.setAttribute('data-row', String(r));
        cell.setAttribute('data-col', String(c));
        if (v !== 0) cell.textContent = I.formatNum(v, state.lang);
        grid.appendChild(cell);
      }
    }
    $('score-value').textContent = I.formatNum(state.score, state.lang);
    $('best-value').textContent = I.formatNum(state.best, state.lang);
    $('moves-value').textContent = I.formatNum(state.moves, state.lang);
    $('btn-undo').disabled = state.undoStack.length === 0;
    $('btn-undo').setAttribute('aria-disabled', state.undoStack.length === 0 ? 'true' : 'false');
  }

  function hideOverlays() {
    $('win-overlay').classList.add('hidden');
    $('gameover-overlay').classList.add('hidden');
  }

  function evaluateOverlays() {
    if (G.hasWon(state.board) && !state.keepPlaying) {
      $('win-overlay').classList.remove('hidden');
      return;
    }
    if (G.isGameOver(state.board)) {
      $('gameover-overlay').classList.remove('hidden');
    }
  }

  function doMove(dir) {
    // A no-op move spawns nothing and pushes no undo state.
    var res = G.slide(state.board, dir);
    if (!res.moved) return false;
    G.pushUndo(state.undoStack, {
      board: state.board, score: state.score, moves: state.moves
    });
    state.board = res.board;
    state.score += res.gained;
    state.moves += 1;
    if (state.score > state.best) {
      state.best = state.score;
      saveBest();
    }
    G.spawnRandom(state.board);
    hideOverlays();
    render();
    evaluateOverlays();
    return true;
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    var prev = state.undoStack.pop();
    state.board = prev.board;
    state.score = prev.score;
    state.moves = prev.moves;
    hideOverlays();
    render();
  }

  function newGame() {
    var g = G.newGame();
    state.board = g.board;
    state.score = g.score;
    state.moves = g.moves;
    state.undoStack = [];
    state.keepPlaying = false;
    hideOverlays();
    render();
  }

  function toggleLang() {
    state.lang = (state.lang === 'en') ? 'bn' : 'en';
    saveLang();
    render();
  }

  function bindEvents() {
    $('btn-new').addEventListener('click', newGame);
    $('btn-undo').addEventListener('click', undo);
    $('btn-lang').addEventListener('click', toggleLang);
    $('btn-keep').addEventListener('click', function () {
      state.keepPlaying = true;
      hideOverlays();
    });
    $('btn-win-new').addEventListener('click', newGame);
    $('btn-over-new').addEventListener('click', newGame);

    var dirs = ['up', 'down', 'left', 'right'];
    dirs.forEach(function (d) {
      $('btn-' + d).addEventListener('click', function () { doMove(d); });
    });

    document.addEventListener('keydown', function (e) {
      var map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right'
      };
      var dir = map[e.key];
      if (!dir) return;
      if (e.key.indexOf('Arrow') === 0) e.preventDefault();
      doMove(dir);
    });

    // Touch swipe on the grid.
    var grid = $('grid');
    var startX = 0, startY = 0, tracking = false;
    grid.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    grid.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // tap, not swipe
      if (Math.abs(dx) > Math.abs(dy)) {
        doMove(dx > 0 ? 'right' : 'left');
      } else {
        doMove(dy > 0 ? 'down' : 'up');
      }
    });
  }

  function init() {
    els.grid = $('grid');
    loadBest();
    loadLang();
    bindEvents();
    newGame();
    // Test hook (documented in TEST_RESULTS.md): lets the smoke tests
    // seed exact boards, e.g. a 1024+1024 win setup or a dead board.
    window.__test = {
      setBoard: function (board, score) {
        state.board = G.cloneBoard(board);
        state.score = (typeof score === 'number') ? score : 0;
        state.moves = 0;
        state.undoStack = [];
        state.keepPlaying = false;
        hideOverlays();
        render();
        evaluateOverlays();
      },
      getBoard: function () { return G.cloneBoard(state.board); },
      getState: function () {
        return {
          board: G.cloneBoard(state.board),
          score: state.score,
          moves: state.moves,
          best: state.best,
          lang: state.lang,
          undoDepth: state.undoStack.length
        };
      },
      doMove: doMove,
      undo: undo,
      newGame: newGame
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
