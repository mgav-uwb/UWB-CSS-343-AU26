// CSS 343 unified library: demos/threesum-fast.js
// The two faster 3-sums, one comparison per frame, on a small sorted array:
// sort + binary search (pointers i, j for the pair; lo, mid, hi for the
// search) and sort + two pointers (i fixed; lo and hi closing in). The info
// band holds the current target and the triples found so far.

import { ThreeSumFast, ArrayRenderer } from "../index.js";

const info = {
  render: (snap) => {
    if (!snap) return "";
    const t = snap.target == null ? "" : `target ${snap.target} · `;
    const f = snap.found && snap.found.length ? snap.found.map((x) => `(${x.join(", ")})`).join(" ") : "none yet";
    return `${t}triples found: ${f}`;
  },
};

export const threeSumFastDemo = {
  id: "threesum-fast",
  title: "Faster 3-sum: binary search and two pointers",
  blurb: "Both faster 3-sums start by sorting. Binary search then takes each PAIR and searches for the third value −(a[i] + a[j]): about N²/2 searches of log₂ N probes each, N² log₂ N in all. Two pointers fix a[i] and close lo and hi in from the ends of the rest: a sum below 0 means a[lo] is too small for every partner left, so lo moves; above 0, hi moves. Each test retires an index for good, so at most N tests per i: N² in all. Run both on the same array and compare the counters.",
  about: `
      <p class="lede">Two ways to beat the triple loop, both built on sorting.</p>
      <h3>Sort + binary search (N² log₂ N)</h3>
      <p>For every pair <code>i &lt; j</code> the third value must be <code>−(a[i] + a[j])</code>.
      Binary search finds it, or proves it absent, in at most &lfloor;log₂ N&rfloor; + 1 probes.
      Each probe is one frame: <code>lo</code>, <code>mid</code> and <code>hi</code> mark the range
      still in play. A value found at an index &le; j is not counted: that triple was counted from
      its smallest pair, or it would reuse a[i] or a[j].</p>
      <h3>Sort + two pointers (N²)</h3>
      <p>Fix <code>a[i]</code>; put <code>lo</code> just right of it and <code>hi</code> at the end.
      If the sum is negative, <code>a[lo]</code> plus even the largest remaining partner is too small,
      so <code>a[lo]</code> pairs with nothing left: <code>lo++</code>. If positive, <code>a[hi]</code>
      is too large for every remaining partner: <code>hi--</code>. On a hit, count it and move both
      (the values are distinct). Every test retires at least one index, so the scan for one
      <code>i</code> takes at most N &minus; i &minus; 2 tests.</p>
      <h3>What to try</h3>
      <ul>
        <li>Run both on the same preset: same triples, far fewer comparisons for two pointers.</li>
        <li>On 8 keys binary search makes about 3 probes per pair; double the keys and it makes one more.</li>
        <li>The no-triple preset still costs both methods their full scan: the work does not depend on the answer.</li>
      </ul>`,
  links: [
    { href: "measure/doubling.html", label: "Time all three, doubling N →" },
    { href: "../textbook/foundations/foundation-time-analysis.html", label: "Textbook: analysis of algorithms →" },
  ],
  make: () => new ThreeSumFast(),
  initial: "-5, -1, 0, 3, 1, 4, 2, -3",
  presets: [
    { name: "toy: 5 keys, one triple", initial: "-4, 1, 3, 2, -2" },
    { name: "8 keys (the slide)", initial: "-5, -1, 0, 3, 1, 4, 2, -3" },
    { name: "no triple sums to 0", initial: "1, 2, 3, 4, 5, 6" },
    { name: "12 keys", initial: "-9, -7, -4, -2, -1, 1, 3, 5, 6, 8, 10, 11" },
  ],
  loadRaw: true,
  initialPlaceholder: "distinct integers: -5, -1, 0, 3, …",
  initialTitle: "distinct integers; the ops sort a copy first",
  stateMsg: (s) => `${s.a.length} distinct keys: run Binary search or Two pointers (each sorts first)`,
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  height: 120,
  info,
  costs: ["compare"],
  chrome: { showCosts: true },
  ops: [
    { name: "Binary search", desc: "sort, then for each pair binary-search −(a[i] + a[j]); one frame per probe", run: (s) => s.bsearch() },
    { name: "Two pointers", desc: "sort, then for each i close lo and hi in from the ends; one frame per sum tested", run: (s) => s.twoPointer() },
  ],
};
