# 2048 BD -- Test Results

Hand-verified run on 2026-10-19 (factory slot 14:00 Asia/Dhaka). No test result below is invented: every number is the literal output of the command listed.

## Unit tests (Node, no dependencies)

Command: `node tests/test-logic.js`

Result: **43 passed, 0 failed, 43 total** (exit code 0).

Coverage in `tests/test-logic.js` over `js/logic.js`:

- Left merge `[2,2,4,0] -> [4,4,0,0]`, gained 4, moved true, not won
- Left `[2,2,2,2] -> [4,4,0,0]`, gained 8
- No double-merge `[4,4,8,0] -> [8,8,0,0]`, gained 8 (not 16)
- Right `[2,2,4,0] -> [0,0,4,4]`, gained 4; right `[2,2,2,2] -> [0,0,4,4]`
- Up column `[2,2,4,0] -> [4,4,0,0]`; down column `-> [0,0,4,4]`
- Down `[2,2,2,2] -> [0,0,4,4]`; up `[2,2,2,2] -> [4,4,0,0]` (no vertical double-merge)
- Merge into 2048: `[1024,1024,0,0] -> [2048,0,0,0]`, `won === true`, gained 2048
- Score-gain math: merging two 8s gains 16, producing `[16,0,0,0]`
- No-move detection: slide on a dead board reports `moved === false`, board unchanged, gained 0
- `canMove === false` on a full board with no adjacent equals; `true` with an empty cell; `true` with adjacent equals
- `isGameOver` true on the dead board, false otherwise; `hasWon` true/false
- `slide()` does not mutate its input board
- `spawnRandom`: 200 trials, only the single empty cell filled, value always 2 or 4, other cells untouched
- `spawnRandom` on a full board leaves it unchanged
- Spawn distribution sanity: 300 spawns, each places exactly one tile valued 2 or 4
- `newGame()`: exactly 2 tiles (each 2 or 4), score 0, moves 0
- Undo stack cap: 12 pushes keep exactly 10 entries, oldest dropped (first kept snapshot is #2)
- `slide()` with an invalid direction throws

## Smoke tests (headless Chromium, raw CDP, no test framework)

Command: `node tests/smoke.js --viewport=desktop` and `node tests/smoke.js --viewport=mobile`

- Desktop (1280x800): **21 passed, 0 failed, 21 total** (exit code 0)
- Mobile (390x844): **22 passed, 0 failed, 22 total** (exit code 0)
- Console / page errors across both runs: **0**

Checks performed in each run (mobile adds the swipe check):

1. App boots and exposes the `window.__test` hook
2. Initial board has exactly 2 tiles; score 0; moves 0
3. ArrowLeft sent via CDP `Input.dispatchKeyEvent` merges seeded `[2,2]` into 4
4. Merge scores 4 points; move counter increments to 1
5. Clicking Undo restores the seeded board and score 0
6. Clicking the on-screen Down button merges a seeded column pair to the bottom row
7. Clicking New Game resets to 2 tiles, score 0, moves 0
8. BN toggle renders Bengali digits in the score (Bengali zero U+09E6) and shows the "English" toggle label
9. Win overlay appears after merging a seeded 1024+1024 board; board contains a 2048 tile
10. Keep Playing dismisses the win overlay
11. Game Over overlay appears on a seeded dead board
12. No horizontal overflow (`scrollWidth <= innerWidth`)
13. Mobile only: a real CDP touch swipe left merges seeded `[2,2]` into 4
14. Zero console/page errors (CDP `Runtime.exceptionThrown`, `Log.entryAdded` level error, `Runtime.consoleAPICalled` type error)

### Test hook

The page exposes `window.__test` with `setBoard(board, score)`, `getBoard()`, `getState()`, `doMove(dir)`, `undo()`, and `newGame()`. The smoke tests use `setBoard` to seed exact boards: the 1024+1024 win setup and the dead board (`[[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]`). The hook calls the same render/overlay code a player's move uses; it adds no gameplay path.

## Pure-ASCII source check

Command (run in the build dir):

```
grep -rP '[^\x00-\x7F]' --include='*.js' --include='*.html' --include='*.css' --include='*.md' .
```

Result: **no matches** (grep exit code 1). All Bangla strings are `\uXXXX` escapes in JS and numeric entities (`&#...;`) in HTML. One repair was needed during the build: an em-dash in a `js/logic.js` comment was replaced with ASCII `--`, after which the grep came back clean and all tests were re-run green.

## Repairs

- Repair 1 (ASCII constraint): em-dash in `js/logic.js` comment was replaced with ASCII `--`.
- Repair 2 (ASCII constraint): em-dashes in `README.md` and `TEST_RESULTS.md` prose were replaced with ASCII `--` after a final grep caught them.
- After each fix the ASCII grep was re-run clean and the full test suite re-run green. No logic repair cycles were needed: unit tests, desktop smoke, and mobile smoke all passed on their first runs.
