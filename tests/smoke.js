'use strict';
/* 2048-bd - headless-Chrome smoke tests via RAW CDP (no dependencies).
 * Uses the global WebSocket client (Node 22+) and /opt/meta-chromium/chrome.
 * Usage: node tests/smoke.js [--viewport=desktop|mobile]
 * Exit code 0 = all checks pass. */
var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');

var VIEWPORT = 'desktop';
process.argv.slice(2).forEach(function (a) {
  if (a.indexOf('--viewport=') === 0) VIEWPORT = a.split('=')[1];
});
var MOBILE = VIEWPORT === 'mobile';
var PORT = MOBILE ? 19223 : 19222;
var CHROME = '/opt/meta-chromium/chrome';
var INDEX = 'file://' + path.resolve(__dirname, '..', 'index.html');

var passed = 0;
var failed = 0;
var failures = [];
var pageErrors = [];

function check(name, cond, extra) {
  if (cond) { passed++; }
  else {
    failed++;
    failures.push(name);
    console.log('FAIL: ' + name + (extra ? ' | ' + extra : ''));
  }
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function getVersion() {
  return new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:' + PORT + '/json/version', function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function launchChrome() {
  var args = [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--no-first-run',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=/tmp/2048bd-smoke-' + VIEWPORT,
    'about:blank'
  ];
  return child_process.spawn(CHROME, args, { stdio: 'ignore', detached: true });
}

function main() {
  var chrome = launchChrome();
  var ws = null;
  var nextId = 1;
  var pending = new Map();

  function send(method, params, sessionId) {
    return new Promise(function (resolve, reject) {
      var id = nextId++;
      pending.set(id, { resolve: resolve, reject: reject });
      var msg = { id: id, method: method, params: params || {} };
      if (sessionId) msg.sessionId = sessionId;
      ws.send(JSON.stringify(msg));
      setTimeout(function () {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error('CDP timeout: ' + method));
        }
      }, 15000);
    });
  }

  function onMessage(data) {
    var msg;
    try { msg = JSON.parse(data.toString()); } catch (e) { return; }
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result || {});
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      var d = msg.params.exceptionDetails || {};
      pageErrors.push('exception: ' + (d.text || '') + ' ' +
        ((d.exception && d.exception.description) || ''));
    }
    if (msg.method === 'Log.entryAdded') {
      var e = msg.params.entry || {};
      if (e.level === 'error') pageErrors.push('log: ' + (e.text || '') + ' ' + (e.url || ''));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      var args = msg.params.args || [];
      if (msg.params.type === 'error') {
        pageErrors.push('console.error: ' + args.map(function (a) { return a.value || a.description || ''; }).join(' '));
      }
    }
  }

  (async function () {
    try {
      var version = null;
      for (var i = 0; i < 50 && !version; i++) {
        try { version = await getVersion(); } catch (e) { await sleep(200); }
      }
      if (!version) throw new Error('Chrome DevTools endpoint did not come up');

      ws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });
      ws.onmessage = function (ev) { onMessage(ev.data); };

      var target = await send('Target.createTarget', { url: 'about:blank' });
      var targetId = target.targetId;
      var attach = await send('Target.attachToTarget', { targetId: targetId, flatten: true });
      var session = attach.sessionId;

      await send('Runtime.enable', {}, session);
      await send('Page.enable', {}, session);
      await send('Log.enable', {}, session);
      if (MOBILE) {
        await send('Emulation.setDeviceMetricsOverride',
          { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, session);
      } else {
        await send('Emulation.setDeviceMetricsOverride',
          { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, session);
      }
      await send('Page.navigate', { url: INDEX }, session);

      function ev(expr) {
        return send('Runtime.evaluate',
          { expression: expr, returnByValue: true }, session)
          .then(function (res) {
            if (res.exceptionDetails) {
              throw new Error('evaluate failed: ' + JSON.stringify(res.exceptionDetails));
            }
            return res.result.value;
          });
      }

      // Wait for the app + test hook.
      var ready = false;
      for (var w = 0; w < 50 && !ready; w++) {
        ready = await ev('typeof window.__test === "object" ? "yes" : "no"') === 'yes';
        if (!ready) await sleep(200);
      }
      check('app boots and exposes window.__test hook', ready);

      function countTiles(board) {
        var n = 0;
        board.forEach(function (row) { row.forEach(function (v) { if (v !== 0) n++; }); });
        return n;
      }

      async function dispatchKey(key, code, vk) {
        await send('Input.dispatchKeyEvent',
          { type: 'keyDown', key: key, code: code, windowsVirtualKeyCode: vk }, session);
        await send('Input.dispatchKeyEvent',
          { type: 'keyUp', key: key, code: code, windowsVirtualKeyCode: vk }, session);
        await sleep(150);
      }

      var SEEDED = '[[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]';
      var DEAD = '[[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]';
      var WINSETUP = '[[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]';

      // 1. Fresh board: exactly 2 tiles.
      var st = await ev('window.__test.getState()');
      check('initial board has exactly 2 tiles', countTiles(st.board) === 2,
        'got ' + countTiles(st.board));
      check('initial score is 0', st.score === 0);
      check('initial moves is 0', st.moves === 0);

      // 2. CDP arrow key merges: seed [2,2,0,0], ArrowLeft -> 4, score 4.
      await ev('window.__test.setBoard(' + SEEDED + ', 0)');
      await dispatchKey('ArrowLeft', 'ArrowLeft', 37);
      st = await ev('window.__test.getState()');
      check('ArrowLeft via CDP merges [2,2] into 4', st.board[0][0] === 4,
        JSON.stringify(st.board[0]));
      check('merge scores 4 points', st.score === 4, 'score=' + st.score);
      check('move counter increments', st.moves === 1, 'moves=' + st.moves);

      // 3. Undo restores the seeded board AND score.
      await ev('document.getElementById("btn-undo").click()');
      await sleep(150);
      st = await ev('window.__test.getState()');
      check('Undo restores board', JSON.stringify(st.board) === JSON.stringify(JSON.parse(SEEDED)),
        JSON.stringify(st.board));
      check('Undo restores score to 0', st.score === 0);

      // 4. On-screen arrow button works: seed column pair, click Down.
      await ev('window.__test.setBoard([[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]], 0)');
      await ev('document.getElementById("btn-down").click()');
      await sleep(150);
      st = await ev('window.__test.getState()');
      check('Down button merges column pair to bottom', st.board[3][0] === 4,
        JSON.stringify(st.board));

      // 5. New Game resets to 2 tiles, score 0, moves 0.
      await ev('document.getElementById("btn-new").click()');
      await sleep(150);
      st = await ev('window.__test.getState()');
      check('New Game resets to 2 tiles', countTiles(st.board) === 2);
      check('New Game resets score to 0', st.score === 0);
      check('New Game resets moves to 0', st.moves === 0);

      // 6. BN toggle renders Bengali digits (score 0 -> Bengali zero).
      await ev('document.getElementById("btn-lang").click()');
      await sleep(150);
      var scoreText = await ev('document.getElementById("score-value").textContent');
      check('BN toggle renders Bengali digits in score', scoreText.indexOf('\u09e6') !== -1,
        'scoreText=' + JSON.stringify(scoreText));
      var langBtn = await ev('document.getElementById("btn-lang").textContent');
      check('BN mode shows English toggle label', langBtn === 'English',
        'langBtn=' + JSON.stringify(langBtn));
      // Toggle back to English for the remaining checks.
      await ev('document.getElementById("btn-lang").click()');
      await sleep(150);

      // 7. Win overlay on a seeded 1024+1024 board merged with ArrowLeft.
      await ev('window.__test.setBoard(' + WINSETUP + ', 0)');
      await dispatchKey('ArrowLeft', 'ArrowLeft', 37);
      var winShown = await ev('!document.getElementById("win-overlay").classList.contains("hidden")');
      check('Win overlay appears after merging 1024+1024', winShown === true);
      st = await ev('window.__test.getState()');
      var has2048 = st.board.some(function (row) { return row.indexOf(2048) !== -1; });
      check('board contains a 2048 tile after win merge', has2048);
      // Keep Playing dismisses the overlay.
      await ev('document.getElementById("btn-keep").click()');
      await sleep(150);
      var winHidden = await ev('document.getElementById("win-overlay").classList.contains("hidden")');
      check('Keep Playing dismisses win overlay', winHidden === true);

      // 8. Game Over overlay on a seeded dead board.
      await ev('window.__test.setBoard(' + DEAD + ', 0)');
      var overShown = await ev('!document.getElementById("gameover-overlay").classList.contains("hidden")');
      check('Game Over overlay appears on a dead board', overShown === true);

      // 9. No horizontal overflow at this viewport.
      var overflow = await ev('document.documentElement.scrollWidth <= window.innerWidth');
      var sw = await ev('document.documentElement.scrollWidth');
      check('no horizontal overflow (scrollWidth ' + sw + ' <= innerWidth)',
        overflow === true);

      // 10. Touch swipe (mobile only): seed [2,2,0,0], swipe left across grid.
      if (MOBILE) {
        await ev('window.__test.setBoard(' + SEEDED + ', 0)');
        var rect = await ev('JSON.stringify((function(){var r=document.getElementById("grid").getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})())');
        var rct = JSON.parse(rect);
        var cy = rct.y + rct.h / 2;
        var x0 = rct.x + rct.w * 0.8;
        var x1 = rct.x + rct.w * 0.2;
        await send('Input.dispatchTouchEvent',
          { type: 'touchStart', touchPoints: [{ x: x0, y: cy }] }, session);
        await send('Input.dispatchTouchEvent',
          { type: 'touchMove', touchPoints: [{ x: (x0 + x1) / 2, y: cy }] }, session);
        await send('Input.dispatchTouchEvent',
          { type: 'touchEnd', touchPoints: [] }, session);
        await sleep(300);
        st = await ev('window.__test.getState()');
        check('touch swipe left merges [2,2] into 4', st.board[0][0] === 4,
          JSON.stringify(st.board[0]));
      }

      // 11. Zero console/page errors across the whole session.
      check('zero console/page errors', pageErrors.length === 0,
        pageErrors.slice(0, 3).join(' | '));

      try { await send('Target.closeTarget', { targetId: targetId }); } catch (e) {}
    } catch (err) {
      failed++;
      failures.push('smoke harness error: ' + err.message);
      console.log('HARNESS ERROR: ' + (err.stack || err.message));
    } finally {
      try { ws && ws.close(); } catch (e) {}
      try { chrome.kill('SIGKILL'); } catch (e) {}
      console.log('smoke (' + VIEWPORT + '): ' + passed + ' passed, ' +
        failed + ' failed, ' + (passed + failed) + ' total');
      if (failures.length > 0) console.log('Failures: ' + failures.join('; '));
      process.exit(failed > 0 ? 1 : 0);
    }
  })();
}

main();
