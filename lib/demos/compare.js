// CSS 343 unified library — demos/compare.js
// The COMPARISON demos, ported from the lecture decks into the gallery: two
// (or three) structures run the same operation SIDE BY SIDE in lockstep, with
// a speed select and a ⏩ 1024× button to sweep the slow one to completion.
// Both are DualDemo specs — mountDemo dispatches on `panels`.

import { ArrayRenderer, AVL, BST, ChainRenderer, DP, Graph, GraphRenderer, MatrixRenderer, OpenAddressing, SeparateChaining, Sorting, TreeRenderer } from "../index.js";

// S04's plain-BST-vs-AVL race: the same keys into both; ascending input
// degenerates the BST into a path while the AVL rotates and stays log-height.
export const bstVsAvlDemo = {
  id: "bst-vs-avl",
  title: "BST vs AVL (side by side)",
  blurb: "The same keys into both, in lockstep: the plain BST's shape (and height) is at the mercy of insertion order, while the AVL rebalances. Insert the whole 1..16 sequence and watch the heights diverge — 15 vs 4. ⏩ 1024× sweeps a long insertion to the end.",
  proto: "avl",
  panels: [
    { title: "plain BST", make: () => new BST(), renderer: (c) => new TreeRenderer(c, { labels: "none" }) },
    { title: "AVL (rebalances)", make: () => new AVL(), renderer: (c) => new TreeRenderer(c, { labels: "bf" }) },
  ],
  op: (s, v) => s.insert(v),
  initial: "",
  sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  speedControl: true,
  finishButton: true,
  width: 440, height: 280,
};

// S14's fib race: naive vs memoized vs two variables at the same n — the
// linear versions finish and freeze while the naive lane crawls toward
// 2·fib(n+1)−1 calls; ⏩ 1024× puts it out of its misery.
const clampN = (v) => Math.max(2, Math.min(16, Math.trunc(v) || 10));

export const fibRaceDemo = {
  id: "fib-race",
  title: "Fibonacci race (naive vs memo vs 2 vars)",
  blurb: "One basic step per tick, in lockstep: the two-variable version finishes first (its table never grows past TWO cells — Θ(1) space), memoization right behind at 2n−1 calls, and the naive recursion keeps recomputing values it already knew (the times row counts the waste). For n = 10: 10 · 19 · 177 steps.",
  proto: "dp",
  stacked: true, columns: "3.2fr 1fr",
  panels: [
    { title: "naive (no memo)", make: () => new DP(), renderer: (c) => new MatrixRenderer(c, {}),
      op: (s, v) => s.fibNaive(clampN(v)), width: 900, height: 130, fullRow: true,
      stat: (s, f) => `${f.counters["call"] || 0} calls · ${f.counters["recompute"] || 0} recomputes` },
    { title: "memoized", make: () => new DP(), renderer: (c) => new MatrixRenderer(c, {}),
      op: (s, v) => s.fib(clampN(v)), width: 660, height: 90,
      stat: (s, f) => `${f.counters["call"] || 0} calls · ${f.counters["cache-hit"] || 0} cache hits` },
    { title: "2 vars", make: () => new DP(), renderer: (c) => new MatrixRenderer(c, {}),
      op: (s, v) => s.fibTwoVar(clampN(v)), width: 200, height: 90,
      stat: (s, f) => `${f.counters["add"] || 0} adds · 2 cells` },
  ],
  opLabel: "Race fib", valLabel: "n (2–16)", placeholder: "10", initialValue: 10,
  speed: 300, speedControl: true, finishButton: true,
  about: `
      <p class="lede">The same fib(n) computed three ways at once, one basic step per tick, in
      lockstep — so the difference between an exponential algorithm and a linear one is a
      thing you watch rather than a thing you are told.</p>
      <h3>How to run it</h3>
      <ul>
        <li>Press <b>Race fib</b> at n = 10 and wait. The <b>2 vars</b> lane finishes after 10
        additions and freezes; <b>memoized</b> lands right behind it at 19 calls; the
        <b>naive</b> lane has barely started.</li>
        <li>Then press <b>⏩ 1024×</b> to put the naive lane out of its misery: it needs
        <b>177</b> calls, 166 of them recomputing a value it already knew.</li>
        <li>Try n = 16 for 16 · 31 · <b>3,193</b>. The gap is not a constant factor; it grows
        like φⁿ.</li>
      </ul>
      <h3>What the panels show</h3>
      <ul>
        <li><b>naive</b> — two rows: each fib(k)'s value, and the <em>times</em> row counting how
        often it has been recomputed. That row ends as the Fibonacci sequence read backwards
        (34, 55, 34, 21, …), because fib(k) is computed fib(n−k+1) times.</li>
        <li><b>memoized</b> — one row, the memo. Each cache hit is an entire subtree of calls that
        never happens. Exactly 2n − 1 calls.</li>
        <li><b>2 vars</b> — a table that never grows past TWO cells. Θ(1) space, visibly.</li>
      </ul>
      <p>The counters are the argument: the three lanes compute the identical number.</p>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#fib", label: "Chapter 14 §1: the whole arc →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 2 →" },
  ],
};

// Rod cutting WITH and WITHOUT the table, on the same rod, in lockstep. The
// deck asserts the uncached recursion is ~2^n; this counts it — exactly 2^n
// calls against the table's n(n+1)/2 candidates, both reaching the same
// optimum. The price list is fixed (CLRS's) so the only variable is n, which
// is the variable the claim is about.
const CLRS_PRICES = [1, 5, 8, 9, 10, 17, 17, 20, 24, 30, 30, 32];
const clampRod = (v) => Math.max(1, Math.min(12, Math.trunc(v) || 10));

export const rodcutRaceDemo = {
  id: "rodcut-race",
  title: "Rod cutting race: no table vs table",
  blurb: "The same rod into both, one frame per elementary step: the uncached recursion re-solves every length along every first-cut path (exactly 2^n calls), while the table solves each length once (n(n+1)/2 candidates). Both reach the same optimum. At n = 10 that is 1024 against 55; at n = 12, 4096 against 78.",
  proto: "dp",
  stacked: true,
  panels: [
    { title: "no table — re-solve every remainder", make: () => new DP(), renderer: (c) => new MatrixRenderer(c, {}),
      op: (s, v) => s.rodCutNaive(CLRS_PRICES, clampRod(v)), width: 900, height: 120, fullRow: true,
      stat: (s, f) => `${f.counters["call"] || 0} calls · ${f.counters["recompute"] || 0} re-solved` },
    { title: "tabulated — each length once", make: () => new DP(), renderer: (c) => new MatrixRenderer(c, {}),
      op: (s, v) => s.rodCut(CLRS_PRICES, clampRod(v)), width: 900, height: 150, fullRow: true,
      stat: (s, f) => `${f.counters["compare"] || 0} candidates · ${f.counters["write"] || 0} writes` },
  ],
  opLabel: "Race rod", valLabel: "n (1–12)", placeholder: "10", initialValue: 10,
  speed: 260, speedControl: true, finishButton: true,
  about: `
      <p class="lede">The lecture says a rod-cutting recursion without a table is about 2ⁿ. This
      counts it: the two panels solve the same rod, one frame per elementary step, and the top one
      never finishes while you are still watching the bottom one.</p>
      <h3>The two counters</h3>
      <ul>
        <li><b>calls</b> (no table) — exactly <b>2ⁿ</b>. cut(len) calls cut(len−1) … cut(0), so
        T(n) = 1 + the sum of every smaller T, which doubles.</li>
        <li><b>candidates</b> (table) — exactly <b>n(n+1)/2</b>. Length len tries len first cuts,
        once, because every remainder is already in the table.</li>
      </ul>
      <p>n = 4: 16 against 10, and the table looks like no bargain at all. n = 8: 256 against 36.
      n = 12: <b>4096 against 78</b>. The point is not that one is faster; it is that one grows
      like 2ⁿ and the other like n².</p>
      <h3>The times row</h3>
      <p>The top panel's second row counts how often each length has been re-solved, and it ends as
      the powers of two read backwards — 8, 4, 2, 1, 1 at n = 4. Naive Fibonacci's equivalent row
      ends as Fibonacci numbers. In both cases the recursion is measuring itself, and the number it
      reports is the number the cache removes.</p>
      <p>Prices are fixed at CLRS's list (1, 5, 8, 9, 10, 17, 17, 20, 24, 30, 30, 32) so that n is
      the only thing changing — it is the variable the 2ⁿ claim is about. To edit prices, use the
      single-panel <a href="demo.html?ds=rodcut">rod-cutting demo</a>.</p>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#rod", label: "Chapter 14 §2: rod cutting →" },
    { href: "../handouts/dynamic-programming.html", label: "Dynamic Programming: why caching pays →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 2 →" },
  ],
};

// Mergesort vs quicksort on the SAME array, in lockstep — compare counters
// diverge; a sorted array (try 1..9) drives Lomuto quicksort to Θ(n²) while
// mergesort doesn't care about input order.
const sortPanel = (title, algo, costs) => ({
  title,
  make: () => new Sorting(),
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  op: (s, v) => { s.build(v); return s[algo](); },
  stat: (s, f) => costs.map((k) => `${f.counters[k] || 0} ${k}s`).join(" · "),
  width: 440, height: 110,
});

// LOMUTO vs HOARE, the same array in both, stepped in lockstep. The telemetry
// is chosen to make the difference legible rather than to be exhaustive:
// PARTITIONS (how many times the array was split), SWAPS (how much data
// actually moved — the column where the two schemes really differ), and how
// many elements are already IN FINAL POSITION, which is the progress bar of a
// sort. The highlighted cells are the placed pivots, provably final; the
// in-place count also includes elements that happen to sit correctly already,
// so it can run ahead of the highlights and then dip — which is itself worth
// pointing at, since quicksort never moves a placed pivot but freely moves
// everything else.
const qsPanel = (title, algo) => ({
  title,
  make: () => new Sorting(),
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  op: (s, v) => { s.build(v); return s[algo](); },
  stat: (snap, f, s) => {
    const a = Array.isArray(snap) ? snap : s.a;
    const sorted = [...a].sort((x, y) => x - y);
    const fixed = a.reduce((n, v, i) => n + (v === sorted[i] ? 1 : 0), 0);
    return `${f.counters.partition || 0} partitions · ${f.counters.swap || 0} swaps · `
      + `${fixed}/${a.length} in final position`;
  },
  width: 880, height: 92,
});

export const lomutoHoareRaceDemo = {
  id: "lomuto-vs-hoare",
  title: "Quicksort race: Lomuto vs Hoare",
  blurb: "The same array into both partition schemes, one frame per tick, stacked so the arrays line up column for column. The telemetry under each panel counts partitions, swaps, and how many elements are already in their final position. On a shuffle the two finish within a step or two of each other but Hoare moves far less data; on already-sorted input both go quadratic and Lomuto thrashes (77 swaps against 11); on all-equal keys they part company completely — Lomuto peels one element per partition while Hoare splits down the middle.",
  proto: "sorting",
  stacked: true,
  panels: [qsPanel("Lomuto — pivot a[hi], one scanning index", "quicksort"),
           qsPanel("Hoare — pivot a[lo], two pointers inward", "quicksortHoare")],
  opArg: "numbers",
  opLabel: "Race both", valLabel: "array", valWidth: 190,
  initialValue: "3,7,1,9,4,8,6,2,5", placeholder: "3,7,1,9,4,8,6,2,5 · 1..12 · 7×12",
  speed: 320, speedControl: true, finishButton: true,
  about: `
      <p class="lede">One array, both partition schemes, stepped in lockstep — the panels are
      stacked so the two arrays line up column for column and you can watch them diverge.</p>
      <h3>The telemetry</h3>
      <ul>
        <li><b>partitions</b> — how many times the array has been split. Each one places exactly
        one pivot forever.</li>
        <li><b>swaps</b> — how much data actually moved. This is the column where the schemes
        differ structurally: Lomuto swaps once per element smaller than the pivot, Hoare once per
        inverted PAIR.</li>
        <li><b>in final position</b> — the sort's real progress bar. Note it can run ahead of the
        highlighted cells (which are placed pivots, provably final) and can dip again, because
        quicksort never moves a placed pivot but freely moves everything else.</li>
      </ul>
      <h3>Three races worth running</h3>
      <ul>
        <li><code>3,7,1,9,4,8,6,2,5</code> — the lecture's array. Similar finish times, 11 swaps
        against 7.</li>
        <li><code>1..12</code> — already sorted. Both are quadratic with a fixed-position pivot,
        but watch the swap counters: 77 against 11. Lomuto is doing enormous work to achieve
        nothing.</li>
        <li><code>7,7,7,7,7,7,7,7,7,7,7,7</code> — all equal. The schemes part company: Lomuto's
        test never fires, so it peels one element per partition (Θ(n²)); Hoare's scans stop on
        equal keys, so the pointers meet in the middle (Θ(n log n)).</li>
      </ul>`,
  links: [
    { href: "../sessions/S13-sorting-dc/index.html", label: "Lecture 13 — Part 3 →" },
    { href: "../handouts/ch13-sorting-dc.html", label: "Chapter 13 §3: quicksort →" },
  ],
};

export const sortRaceDemo = {
  id: "sort-race",
  title: "Sort race (mergesort vs quicksort)",
  blurb: "The SAME array into both, one frame per tick: mergesort's compare count barely moves with input order; quicksort's depends on the pivots. Race 1..9:ZIG, then race plain 1..9 — already-sorted input drives Lomuto's last-element pivot to its Θ(n²) worst case (36 compares) while mergesort is unbothered.",
  proto: "sorting",
  panels: [sortPanel("mergesort", "mergesort", ["compare", "write"]),
           sortPanel("quicksort", "quicksort", ["compare", "swap"])],
  opArg: "numbers",
  opLabel: "Race both", valLabel: "array", valWidth: 140,
  initialValue: "1..9:ZIG", placeholder: "5,2,8,… or 1..9:ZIG",
  speed: 350, speedControl: true, finishButton: true,
};

// The DELETE story, side by side. Chaining: hash classes stay independent —
// delete is one unlink, nothing else moves, no tombstones. Probing: one
// shared array braids the probe runs, so delete must leave a TOMBSTONE that
// every later search still walks. Same keys, same deletes, different worlds.
// (Replaces the old hash-race insert-throughput demo; the "hash-race" slug
// stays as an alias in the registry.)
export const hashDeleteRaceDemo = {
  id: "hash-delete-race",
  title: "Delete: chaining vs probing (tombstones)",
  blurb: "Both tables take the same keys, then the same deletes, then the same searches. TOP (chaining): each bucket is its own world — delete unlinks one node, α drops, done. BOTTOM (probing, fixed M): the deleted slot can't just be emptied (it would cut probe paths), so it becomes a tombstone † that searches keep stepping over and only a future insert can reclaim. Run the scripted story — the survivor search walks two tombstones and still wins; the ghost search walks them all the way to an empty slot — then improvise your own deletes.",
  proto: "hashing",
  stacked: true,
  panels: [
    { title: "separate chaining (M = 7) — delete = unlink", make: () => new SeparateChaining(7),
      renderer: (c) => new ChainRenderer(c),
      stat: (snap, f, s) => `α = ${s.alpha()} · ${f.counters["compare"] || 0} compares`,
      width: 900, height: 200 },
    { title: "linear probing (M = 11, fixed) — delete = tombstone", make: () => new OpenAddressing(11, { probe: "linear", resizeAt: Infinity, deleteMode: "tombstone" }),
      renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
      stat: (snap, f, s) => `${s.tombs} tombstone${s.tombs === 1 ? "" : "s"} · ${f.counters["compare"] || 0} compares`,
      width: 900, height: 110 },
  ],
  ops: [
    { name: "Insert", arg: "number", desc: "into BOTH tables — chaining links, probing places (reusing a tombstone if it passes one)", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "from BOTH — chaining unlinks one node; probing leaves a tombstone †", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", desc: "in BOTH — chaining walks one chain; probing walks the run, stepping over tombstones", run: (s, v) => s.search(v) },
  ],
  defaultOp: "Delete",
  // 14 homes to 3 and is displaced all the way to slot 10 — it is the key
  // whose survival the tombstones protect (dry-run verified 2026-07-16)
  initial: "1,3,5,7,9,13,15,17,19,14",
  script: [["delete", 15], ["delete", 5], ["search", 14], ["search", 15], ["insert", 25]],
  scriptLabel: "delete 2 · search a survivor and a ghost · insert into the graveyard",
  valLabel: "key",
  speedControl: true, finishButton: true,
};

// BFS vs DFS on the SAME graph from the SAME start, in lockstep — the frontier
// container is the only difference (queue vs stack), and it changes everything:
// BFS paints layer by layer, DFS dives and backtracks. Each panel's title line
// carries its live frontier.
const searchPanel = (title, opName, method) => ({
  title,
  make: () => new Graph({ layout: "circle" }),
  renderer: (c) => new GraphRenderer(c, { directed: true }),
  ops: { "Search from": (s, v) => s[method](v) },
  stat: (snap, f) => {
    const done = f.highlight?.nodes?.done ?? [];
    const fr = snap?.frontier;
    return `${fr ? `${fr.label}: [${fr.items.join(" ")}]` : "idle"} · done: ${done.join(" ") || "—"}`;
  },
  width: 900, height: 205,
});

export const searchRaceDemo = {
  id: "search-race",
  title: "BFS vs DFS (side by side)",
  blurb: "The same graph, the same start vertex — BFS on top, DFS below, one step per tick in LOCKSTEP. The only difference between the two algorithms is the frontier container, and the title lines show it live: BFS's QUEUE drains front-first and paints the graph layer by layer (labels = fewest edges from the start); DFS's STACK dives deep and backtracks. Same vertices visited, completely different order.",
  proto: "graph",
  stacked: true,
  panels: [
    searchPanel("BFS (queue — layer by layer)", "Search from", "bfs"),
    searchPanel("DFS (stack — dive and backtrack)", "Search from", "dfs"),
  ],
  ops: [
    { name: "Search from", arg: "number", desc: "run BFS on the top panel and DFS on the bottom, from the same start, in lockstep", run: (s, v) => s.bfs(v) },
  ],
  initial: "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7",
  script: [["search", 0]],
  scriptLabel: "race from vertex 0",
  valLabel: "start vertex",
  speedControl: true, finishButton: true,
};

// Linear vs quadratic vs double on the SAME collide-heavy stream: linear
// piles a run at the shared home slot (primary clustering), quadratic
// scatters but every same-home key retraces the SAME path (secondary
// clustering), double's key-dependent stride scatters even those.
export const probeRaceDemo = {
  id: "probe-race",
  title: "Probe race (linear vs quadratic vs double)",
  blurb: "The same keys — all homing to slot 3 at M = 11 — into three fixed tables. Watch WHERE the colliders land: linear builds a wall 3-4-5-6… (primary clustering), quadratic hops 3, 4, 7, 1, 8 (scattered, but every slot-3 key retraces that same path — secondary clustering), double strides by h2(k) so even same-home keys part ways. The compares row is the price of each shape.",
  proto: "hashing",
  stacked: true,
  panels: [
    { title: "linear (+1)", make: () => new OpenAddressing(11, { probe: "linear", resizeAt: Infinity }),
      renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
      stat: (snap, f) => `${f.counters["compare"] || 0} compares`, width: 900, height: 100 },
    { title: "quadratic (+t²)", make: () => new OpenAddressing(11, { probe: "quadratic", resizeAt: Infinity }),
      renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
      stat: (snap, f) => `${f.counters["compare"] || 0} compares`, width: 900, height: 100 },
    { title: "double (+t·h2(k))", make: () => new OpenAddressing(11, { probe: "double", q: 7, resizeAt: Infinity }),
      renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
      stat: (snap, f) => `${f.counters["compare"] || 0} compares`, width: 900, height: 100 },
  ],
  ops: [
    { name: "Insert", arg: "number", desc: "into all THREE tables — watch where each probe family parks the collider", run: (s, v) => s.insert(v) },
    { name: "Search", arg: "number", desc: "in all three — the compare counters show each family's bill", run: (s, v) => s.search(v) },
  ],
  initial: "",
  script: [["insert", 3], ["insert", 14], ["insert", 25], ["insert", 36], ["insert", 47], ["search", 47]],
  scriptLabel: "collide 5 keys at slot 3, then search the last",
  valLabel: "key",
  speedControl: true, finishButton: true,
};
