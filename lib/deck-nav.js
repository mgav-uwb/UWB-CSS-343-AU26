/* CSS 343 / shared deck runtime: navigation.
 *
 * Decks are sections (horizontal) of slides (vertical). Navigation is LINEAR:
 * next / previous (→ ← ↓ ↑, PageDown / PageUp, space, a clicker) step through
 * every slide in order, and the controls show only left and right arrows
 * (Reveal's navigationMode "linear", set in each lecture's Reveal.initialize).
 *
 * Shift + next jumps to the first slide of the next section; Shift + previous
 * jumps to the first slide of the previous section (from inside a section,
 * Shift + previous first returns to that section's start). Course-agnostic:
 * depends only on the reveal.js public API.
 */
(function () {
  var NEXT = { ArrowRight: 1, ArrowDown: 1, PageDown: 1 };
  var PREV = { ArrowLeft: 1, ArrowUp: 1, PageUp: 1 };
  window.addEventListener("keydown", function (e) {
    if (!e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || !window.Reveal || !Reveal.isReady || !Reveal.isReady()) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; // typing in a demo box
    var dir = NEXT[e.key] ? 1 : PREV[e.key] ? -1 : 0;
    if (!dir) return;
    e.preventDefault(); e.stopImmediatePropagation(); // Reveal would jump to the first / last slide
    var ix = Reveal.getIndices();
    var last = Reveal.getHorizontalSlides().length - 1;
    var h = dir > 0 ? Math.min(last, ix.h + 1) : (ix.v > 0 ? ix.h : Math.max(0, ix.h - 1));
    Reveal.slide(h, 0);
  }, true); // capture: runs before Reveal's own key handler
})();
