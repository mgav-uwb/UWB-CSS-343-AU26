// CSS 343 · topics/demos.js: every demo a topic deck can embed, wired once.
//
// A lecture page loads this module and nothing else for demos:
//   <script type="module" src="../../topics/demos.js"></script>
// so a topic mounts in any lecture with no per-lecture wiring.
//
// Three kinds of slot, all written in a topic as
//   <div class="algo-viz" data-algo="SLUG" data-config='{…}'> … fallback … </div>
//
//   1. a demo-library registry slug (lib/demos/registry.js): factorial, bst, …
//   2. a SLIDE SPEC below: a library demo configured for one slide
//      (a starting tree, a paused insert, a two-panel contrast)
//   3. a Summer canvas demo (topics/viz/legacy-*): loaded only when the page
//      has one of its slots, then started after reveal.js has built the slides
//
// The mergesort and BFS memory demos (topics/viz/mergesort.js, bfs.js) use
// their own .legacy-viz class and are still started by the lecture page.

import { initDeckDemos, AVL, BST, TwoThree, RedBlack, MaxHeap, TreeRenderer, MultiwayTreeRenderer, ArrayRenderer, HeapTreeRenderer } from "../lib/deck.js";
import { DEMOS } from "../lib/demos/registry.js";

// ── 2. slide specs (from the Summer lecture pages, unchanged in behavior) ──
const heapViews = () => [
  (c) => new ArrayRenderer(c, { mode: "cells" }),
  (c) => new HeapTreeRenderer(c),
];
// a buildAll that honours the box's METHOD(keys) wrapper, limited to some methods
const heapBuild = (...allow) => (s, keys, vals, method) => s.buildBy(keys, method, allow);

const SLIDE_SPECS = {
  // AVL: pause at the imbalance, predict the rotation, continue
  "avl-insert": {
    make: () => new AVL(),
    renderer: (c) => new TreeRenderer(c, { labels: "bf" }),
    run: (s) => s.insert(160, { pause: true }),
    costs: ["compare", "rotation"], chrome: { showCosts: true },
    width: 820, height: 300,
  },
  // the same keys into a plain BST and an AVL tree, side by side
  "avl-vs-bst": {
    panels: [
      { title: "plain BST", make: () => new BST(), renderer: (c) => new TreeRenderer(c, { labels: "none" }) },
      { title: "AVL (rebalances)", make: () => new AVL(), renderer: (c) => new TreeRenderer(c, { labels: "bf" }) },
    ],
    op: (s, v) => s.insert(v),
    initial: "",
    sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    speedControl: true, finishButton: true,
    width: 400, height: 250,
  },
  "tt-insert": {
    make: () => new TwoThree(),
    initial: "1..40:1:ZIG",
    renderer: (c) => new MultiwayTreeRenderer(c),
    buildStep: (s, k) => s.insert(k),
    ops: [
      { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
      { name: "Delete", arg: "number", run: (s, v) => s.delete(v) },
    ],
    costs: ["compare", "write", "alloc"], chrome: { showCosts: true },
    width: 900, height: 230,
  },
  "btree-insert": {
    use: "btree",
    initial: "1..40:1:ZAG",
    inputs: [{ key: "m", width: 50 }],
    ops: [{ name: "Search", enabled: false }],
    chrome: { showCosts: true },
    width: 900, height: 230,
  },
  "rb-insert": {
    make: () => new RedBlack(),
    initial: "1..24:1:RAND",
    renderer: (c) => new TreeRenderer(c, { labels: "none" }),
    buildStep: (s, k) => s.insert(k),
    ops: [
      { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
      { name: "Delete", arg: "number", run: (s, v) => s.delete(v) },
    ],
    costs: ["compare", "rotation", "link"], chrome: { showCosts: true },
    width: 900, height: 250,
  },
  "heap-insert": {
    title: "heap", make: () => new MaxHeap(),
    initial: "INSERT(90,80,70,30,60,50)",
    renderer: heapViews(), buildAll: heapBuild("insert", "heapify"), initialBuilt: true,
    ops: [{ name: "Insert", arg: "number", run: (s, v) => s.insert(v) }],
    costs: ["compare", "swap"], chrome: { showCosts: true },
    width: 1000, height: [75, 130],
  },
  "heap-ops": {
    title: "heap", make: () => new MaxHeap(),
    initial: "INSERT(1..24:1:ZIG)",
    renderer: heapViews(), buildAll: heapBuild("insert", "heapify"), initialBuilt: true,
    ops: [
      { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
      { name: "Delete Max", run: (s) => s.delMax() },
    ],
    costs: ["compare", "swap"], chrome: { showCosts: true },
    width: 1000, height: [75, 130],
  },
  "heap-heapify": {
    title: "heap", make: () => new MaxHeap(),
    initial: "RAW(1..36:1:RAND)",
    renderer: heapViews(), buildAll: heapBuild("raw", "heapify", "insert"),
    stateMsg: () => "raw array: press Heapify (or Build with HEAPIFY(…) to animate the whole build)",
    ops: [{ name: "Heapify", run: (s) => s.heapify() }],
    costs: ["compare", "swap"], chrome: { showCosts: true },
    width: 1000, height: [75, 130],
  },
  "heap-sort": {
    title: "heap", make: () => new MaxHeap(),
    initial: "RAW(1..16:1:RAND)",
    renderer: heapViews(), buildAll: heapBuild("raw", "heapify", "insert"),
    stateMsg: () => "raw array: press Heapify, then Sort Down (or Heapsort for both at once)",
    ops: [
      { name: "Heapify", run: (s) => s.heapify() },
      { name: "Sort Down", run: (s) => s.sinkDown(),
        enabledWhen: (s) => s.size() > 1 && s.isHeap(), requires: "a valid heap: Heapify first" },
      { name: "Heapsort", run: (s) => s.heapsort() },
    ],
    costs: ["compare", "swap"], chrome: { showCosts: true },
    width: 1000, height: [75, 130],
  },
};

const slots = Object.fromEntries(Object.keys(DEMOS).map((slug) => [slug, { use: slug }]));
initDeckDemos({ ...slots, ...SLIDE_SPECS });

// ── 3. Summer canvas demos, loaded on demand ──
const here = new URL(".", import.meta.url);
const LEGACY = {
  trees: {
    ids: ["tree-terms", "general-tree", "tree-shapes", "tree-height", "array-tree", "traversals",
          "expr-tree", "bst-ops", "bst-shape", "bst-ordered", "bst-experiments"],
    css: ["viz/legacy-trees/viz.css"],
    js: ["viz/legacy-trees/viz-core.js", "viz/legacy-trees/bst-engine.js", "viz/legacy-trees/player.js",
         "viz/legacy-trees/bst.js", "viz/legacy-trees/d1-d3.js", "viz/legacy-trees/d4-d5.js",
         "viz/legacy-trees/d2-d6.js", "viz/legacy-trees/d7-expr.js", "viz/legacy-trees/d9-d10.js",
         "viz/legacy-trees/d11-experiments.js"],
  },
  avl: {
    ids: ["avl-rotate", "avl-path", "avl-cases", "avl-del", "avl-contrast"],
    css: ["viz/legacy-trees/viz.css", "viz/legacy-avl/viz-avl.css"],
    js: ["viz/legacy-trees/viz-core.js", "viz/legacy-trees/player.js", "viz/legacy-avl/avl-engine.js",
         "viz/legacy-avl/avl.js", "viz/legacy-avl/avl-rotate.js", "viz/legacy-avl/avl-path.js",
         "viz/legacy-avl/avl-cases.js", "viz/legacy-avl/avl-del.js"],
  },
};

const loaded = new Set();
const loadCss = (p) => { if (loaded.has(p)) return; loaded.add(p);
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL(p, here).href; document.head.appendChild(l); };
const loadJs = (p) => loaded.has(p) ? Promise.resolve() : new Promise((ok, fail) => {
  loaded.add(p);
  const s = document.createElement("script"); s.src = new URL(p, here).href; s.async = false;
  s.onload = ok; s.onerror = () => fail(new Error("could not load " + p)); document.head.appendChild(s);
});

async function startLegacy() {
  const present = new Set([...document.querySelectorAll(".algo-viz[data-algo]")].map((el) => el.dataset.algo));
  const sets = Object.values(LEGACY).filter((g) => g.ids.some((id) => present.has(id)));
  if (!sets.length) return;
  for (const g of sets) {
    g.css.forEach(loadCss);
    for (const p of g.js) await loadJs(p);                 // in order: each depends on the ones before
  }
  if (window.initVizBst) window.initVizBst();
  (window.__vizInits || []).forEach((f) => { try { f(); } catch (e) { console.error(e); } });
}

const R = window.Reveal;
if (R && R.isReady && R.isReady()) startLegacy();
else if (R && typeof R.on === "function") R.on("ready", startLegacy);
else document.addEventListener("DOMContentLoaded", startLegacy);
