// CSS 343 unified library — demos/recurrence.js
// The master theorem as a level sum. Type a recurrence, watch the tree's level
// costs stack up as bars, and read the case off the shape of the series
// instead of off a memorised list.

import { Recurrence, RecurrenceRenderer, parseRecurrence } from "../index.js";

const MERGESORT = "T(n) = 2T(n/2) + n";

/** A function, not a constant: the deck mounts its own instance. */
export function recurrenceSpec() {
  return {
    make: () => new Recurrence(),
    initial: MERGESORT,
    initialPlaceholder: "T(n) = 2T(n/2) + n",
    initialTitle: "a recurrence: aT(n/b) + f(n), with f one of 1, n, n^2, n log n, …",
    initialWidth: 210,
    presets: [
      { name: "mergesort — 2T(n/2) + n", initial: MERGESORT },
      { name: "binary search — T(n/2) + 1", initial: "T(n) = T(n/2) + 1" },
      { name: "case 1, leaves win — 8T(n/2) + n^2", initial: "T(n) = 8T(n/2) + n^2" },
      { name: "case 3, root wins — 2T(n/2) + n^2", initial: "T(n) = 2T(n/2) + n^2" },
      { name: "Karatsuba — 3T(n/2) + n", initial: "T(n) = 3T(n/2) + n" },
      { name: "Strassen — 7T(n/2) + n^2", initial: "T(n) = 7T(n/2) + n^2" },
      { name: "the GAP — 2T(n/2) + n log n", initial: "T(n) = 2T(n/2) + n log n" },
    ],
    // Build parses the recurrence and runs the level sum — the sum IS the demo
    buildAll: (s, keys, vals, method, raw) => s.set(parseRecurrence(raw || MERGESORT)).sum(),
    renderer: (c) => new RecurrenceRenderer(c),
    stateMsg: (s) => s.inorder(),
    costs: ["visit"],
    height: 260,
    chrome: { showValue: false },
  };
}

export const recurrenceDemo = {
  id: "recurrence",
  title: "Master theorem (level sum)",
  blurb: "Type a recurrence T(n) = aT(n/b) + f(n) and watch the recursion tree's cost accumulate one level at a time. Each bar is a level's total cost — aⁱ subproblems of size n/bⁱ — and the bars form a geometric series whose behaviour IS the master theorem's three cases: shrinking means the root dominates (case 3), flat means every level ties so the depth multiplies in a log (case 2), growing means the leaves dominate (case 1). Try mergesort, then 8T(n/2)+n² and 2T(n/2)+n² to see the two extremes, then 2T(n/2)+n log n — the gap case the basic theorem cannot decide, where the level sum still answers Θ(n log²n).",
  about: `
      <p class="lede">The master theorem is usually taught as three cases to memorise. It is
      really one observation: the cost of a recursion tree is a <b>geometric series</b>, and a
      geometric series is dominated by its first term, its last term, or nothing at all.</p>

      <p>Level <i>i</i> of the tree holds <code>aⁱ</code> subproblems of size <code>n/bⁱ</code>, so
      it costs <code>aⁱ·f(n/bⁱ)</code>. Each bar here is one such level. Watch what the bars do:</p>
      <ul>
        <li><b>shrinking</b> → the root's work dominates the sum → <b>case 3</b>, Θ(f(n))</li>
        <li><b>flat</b> → every level costs the same, so the answer is one level × the depth →
        <b>case 2</b>, Θ(n^log_b(a) · log n) — that is where the log factor comes from</li>
        <li><b>growing</b> → the leaves dominate → <b>case 1</b>, Θ(n^log_b(a))</li>
      </ul>

      <h3>Things to try</h3>
      <ul>
        <li><code>T(n) = 2T(n/2) + n</code> — mergesort: perfectly flat bars, the visual of case 2</li>
        <li><code>T(n) = 8T(n/2) + n^2</code> vs <code>T(n) = 2T(n/2) + n^2</code> — the same f(n),
        opposite verdicts, because a and b moved the leaf work past it or below it</li>
        <li><code>T(n) = 3T(n/2) + n</code> — Karatsuba, n^1.585: the leaves win by a whisker</li>
        <li><code>T(n) = 2T(n/2) + n log n</code> — the bars look flat but drift; the basic theorem
        has no case for this (f beats the leaf work by only a log, not a polynomial factor), and the
        level sum still gives Θ(n log²n). That is the point: the sum is the method, the cases are a
        fast path.</li>
      </ul>
      <p>The tree is drawn at n = b⁶ so the levels fit on screen; the verdict is computed exactly
      from the exponents, not from the drawn numbers.</p>`,
  links: [
    { href: "../sessions/S13-sorting-dc/index.html", label: "Lecture 13 — Part 1 →" },
    { href: "../handouts/ch13-sorting-dc.html", label: "Chapter 13 §1: the master theorem →" },
  ],
  ...recurrenceSpec(),
};
