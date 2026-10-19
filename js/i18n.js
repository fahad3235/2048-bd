'use strict';
/*
 * 2048-bd - bilingual strings (English + Bangla).
 * HARD CONSTRAINT: this file is pure ASCII. Every Bangla string is
 * written with \uXXXX escapes, so the source contains no non-ASCII
 * bytes. The browser decodes the escapes at parse time.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.I18N2048 = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  var BN_DIGITS = ['\u09e6', '\u09e7', '\u09e8', '\u09e9', '\u09ea',
                   '\u09eb', '\u09ec', '\u09ed', '\u09ee', '\u09ef'];

  var STRINGS = {
    en: {
      title: '2048 BD',
      tagline: 'Merge tiles. Reach 2048.',
      score: 'Score',
      best: 'Best',
      moves: 'Moves',
      newGame: 'New Game',
      undo: 'Undo',
      langBtn: '\u09ac\u09be\u0982\u09b2\u09be',
      hint: 'Use arrow keys, WASD, buttons, or swipe to move. Merge equal tiles to reach 2048.',
      howTo: 'How to play',
      howToText: 'Slide tiles with arrow keys, WASD, the on-screen arrows, or swipe. Equal tiles merge into one. Reach the 2048 tile to win. Undo goes back up to 10 moves.',
      winTitle: 'You Win!',
      winText: 'You made the 2048 tile!',
      keepPlaying: 'Keep Playing',
      gameOverTitle: 'Game Over',
      gameOverText: 'No more moves. Try again!',
      playAgain: 'Play Again',
      up: 'Up',
      down: 'Down',
      left: 'Left',
      right: 'Right'
    },
    bn: {
      title: '\u09e8\u09e6\u09ea\u09ee \u09ac\u09bf\u09a1\u09bf',
      tagline: '\u099f\u09be\u0987\u09b2 \u09ae\u09c7\u09b2\u09be\u09a8\u0964 \u09e8\u09e6\u09ea\u09ee-\u098f \u09aa\u09cc\u0981\u099b\u09be\u09a8\u0964',
      score: '\u09b8\u09cd\u0995\u09cb\u09b0',
      best: '\u09b8\u09c7\u09b0\u09be',
      moves: '\u099a\u09be\u09b2',
      newGame: '\u09a8\u09a4\u09c1\u09a8 \u0996\u09c7\u09b2\u09be',
      undo: '\u0986\u0997\u09c7\u09b0 \u099a\u09be\u09b2',
      langBtn: 'English',
      hint: '\u09b8\u09b0\u09be\u09a4\u09c7 \u09a4\u09c0\u09b0 \u099a\u09bf\u09b9\u09cd\u09a8, WASD, \u09ac\u09cb\u09a4\u09be\u09ae \u09ac\u09be \u09b8\u09cb\u09af\u09bc\u09be\u0987\u09aa \u09ac\u09cd\u09af\u09ac\u09b9\u09be\u09b0 \u0995\u09b0\u09c1\u09a8\u0964 \u09b8\u09ae\u09be\u09a8 \u099f\u09be\u0987\u09b2 \u09ae\u09c7\u09b2\u09be\u09a8 \u09eb\u09a8\u09e6\u09ea\u09ee-\u098f \u09aa\u09cc\u0981\u099b\u09be\u09a8\u0964',
      howTo: '\u0995\u09c0\u09ad\u09be\u09ac\u09c7 \u0996\u09c7\u09b2\u09ac\u09c7\u09a8',
      howToText: '\u09a4\u09c0\u09b0 \u099a\u09bf\u09b9\u09cd\u09a8, WASD, \u09ac\u09cb\u09a4\u09be\u09ae \u09ac\u09be \u09b8\u09cb\u09af\u09bc\u09be\u0987\u09aa \u09a6\u09bf\u09af\u09bc\u09c7 \u099f\u09be\u0987\u09b2 \u09b8\u09b0\u09be\u09a8\u0964 \u09b8\u09ae\u09be\u09a8 \u099f\u09be\u0987\u09b2 \u098f\u0995 \u09b9\u09af\u09bc\u09c7 \u09af\u09be\u09af\u09bc\u0964 \u09e8\u09e6\u09ea\u09ee \u099f\u09be\u0987\u09b2 \u09ac\u09be\u09a8\u09be\u09b2\u09c7 \u099c\u09bf\u09a4\u09ac\u09c7\u09a8\u0964 \u0986\u0997\u09c7\u09b0 \u09e7\u09e6 \u099a\u09be\u09b2 \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 \u09ab\u09bf\u09b0\u09c7 \u09af\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u0964',
      winTitle: '\u0986\u09aa\u09a8\u09bf \u099c\u09bf\u09a4\u09c7\u099b\u09c7\u09a8!',
      winText: '\u0986\u09aa\u09a8\u09bf \u09e8\u09e6\u09ea\u09ee \u099f\u09be\u0987\u09b2 \u09ac\u09be\u09a8\u09bf\u09af\u09bc\u09c7\u099b\u09c7\u09a8!',
      keepPlaying: '\u0996\u09c7\u09b2\u09be \u099a\u09be\u09b2\u09bf\u09af\u09bc\u09c7 \u09af\u09be\u09a8',
      gameOverTitle: '\u0996\u09c7\u09b2\u09be \u09b6\u09c7\u09b7',
      gameOverText: '\u0986\u09b0 \u0995\u09cb\u09a8\u09cb \u099a\u09be\u09b2 \u09a8\u09c7\u0987\u0964 \u0986\u09ac\u09be\u09b0 \u099a\u09c7\u09b7\u09cd\u099f\u09be \u0995\u09b0\u09c1\u09a8!',
      playAgain: '\u0986\u09ac\u09be\u09b0 \u0996\u09c7\u09b2\u09c1\u09a8',
      up: '\u0989\u09aa\u09b0\u09c7',
      down: '\u09a8\u09bf\u099a\u09c7',
      left: '\u09ac\u09be\u09ae\u09c7',
      right: '\u09a1\u09be\u09a8\u09c7'
    }
  };

  function toBnDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) {
      return BN_DIGITS[Number(d)];
    });
  }

  function formatNum(value, lang) {
    return lang === 'bn' ? toBnDigits(value) : String(value);
  }

  function t(lang, key) {
    var dict = STRINGS[lang] || STRINGS.en;
    return dict[key] !== undefined ? dict[key] : STRINGS.en[key];
  }

  return {
    STRINGS: STRINGS,
    toBnDigits: toBnDigits,
    formatNum: formatNum,
    t: t
  };
});
