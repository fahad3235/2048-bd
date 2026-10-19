# 2048 BD

An offline, bilingual (English / Bangla) 2048 puzzle game. Slide numbered tiles on a 4x4 grid, merge equal tiles, and reach the 2048 tile. Zero network requests, zero dependencies, zero tracking.

## Problem

Most 2048 clones are English-only, ad-laden, and need a network connection. 2048 BD is a small, complete game that works fully offline, speaks Bangla as well as English (including Bengali digits), and runs on a 390px phone screen with no horizontal scrolling.

## Features

- Classic 4x4 2048: arrow keys, WASD, on-screen arrow buttons, and touch swipe
- Standard merge rules: a tile merges at most once per move (e.g. `[2,2,2,2]` slides to `[4,4]`, never `[8]`)
- Undo up to 10 steps, restoring both board and score
- Score + Best score (Best persists in `localStorage` on this device only)
- Win overlay at 2048 with Keep Playing / New Game
- Game Over overlay with Play Again
- Move counter
- EN / Bangla toggle persisted in `localStorage`; Bengali digits in Bangla mode (headings, buttons, score labels, overlays)
- Mobile layout for 390px viewports with no horizontal overflow
- No-op moves spawn no tile and push no undo state
- Fresh boards start with exactly 2 tiles plus a play hint

## Stack

- HTML + CSS + vanilla JavaScript (no frameworks, no build step, no dependencies)
- Game rules isolated in `js/logic.js` (UMD: works in the browser and in Node)
- Bilingual strings in `js/i18n.js` (Bangla stored as `\uXXXX` escapes; the source files are pure ASCII)

## Prerequisites

- Any modern browser (for playing)
- Node.js 18+ (for running the tests)

## Install

No install step. Clone the repo and open `index.html`, or serve the folder:

```bash
git clone https://github.com/fahad3235/2048-bd.git
cd 2048-bd
# option A: open index.html directly in a browser
# option B: serve locally
npx --yes serve .
# or
python3 -m http.server 8000
```

## Dev commands

There is no build step. Edit the files and reload the page.

```bash
# run the Node unit tests
node tests/test-logic.js
# run the headless-Chrome smoke tests (desktop + mobile)
node tests/smoke.js --viewport=desktop
node tests/smoke.js --viewport=mobile
```

## Testing

- `tests/test-logic.js` -- 43 Node assertions over `js/logic.js`: all four slide directions, merge rules incl. `[2,2,4] -> [4,4]` and `[2,2,2,2] -> [4,4]`, no double-merge, merge-into-2048 sets `won`, no-move and game-over detection, 200 spawn trials that never overwrite, spawn distribution sanity, score-gain math, undo-stack cap of 10, input immutability, and invalid-direction errors.
- `tests/smoke.js` -- headless Chromium driven over raw CDP (no test framework): boots the page from `file://`, verifies the initial 2 tiles, merges via real CDP arrow-key events, clicks Undo / New Game / on-screen arrows, toggles to Bangla and checks Bengali digits, triggers the Win overlay from a seeded 1024+1024 board, triggers Game Over from a seeded dead board, checks for zero console/page errors, checks no horizontal overflow, and (mobile) verifies a real touch swipe merges tiles.
- Full results with exact counts: see `TEST_RESULTS.md`.

## Deployment (GitHub Pages)

1. Push this repo to GitHub.
2. Repo Settings > Pages > Source: Deploy from a branch, Branch: `main`, Folder: `/ (root)`.
3. The site is served from `index.html` at `https://<user>.github.io/2048-bd/`.

## Test hook (smoke tests only)

The page exposes `window.__test` with `setBoard(board, score)`, `getBoard()`, `getState()`, `doMove(dir)`, `undo()`, and `newGame()`. It exists so the smoke tests can seed exact boards (e.g. a 1024+1024 win setup or a dead board). It changes no gameplay: it is the same code path a player triggers by moving.

## Limitations

- Best score and language preference live in `localStorage` on one device/browser; they do not sync.
- There is no online leaderboard, no multiplayer, and no save/resume of a mid-game board across reloads.
- Swipe is touch-only; mouse drag does not move tiles (use keys or the on-screen arrows).
- `2048-bd` is a fan-style re-implementation of the 2048 mechanic for learning and fun; it is not affiliated with the original 2048 authors.

## Status

Complete MVP. Unit tests 43/43, desktop smoke 21/21, mobile smoke 22/22, zero console/page errors. Built 2026-10-19 (factory run, slot 14:00 Asia/Dhaka). Not yet pushed to GitHub (publish step pending).
