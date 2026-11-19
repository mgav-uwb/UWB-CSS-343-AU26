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

import { initDeckDemos, AVL, BST, TwoThree, RedBlack, MaxHeap, TreeRenderer, MultiwayTreeRenderer, ArrayRenderer, HeapTreeRenderer,
  LinearProbing, SeparateChaining, ChainRenderer, chainingInfo, openAddressingInfo,
  Graph, graphInfo, GraphRenderer, renderTraceTable, WeightedGraph,
  Intervals, IntervalRenderer, Huffman, codecSpec, adaptiveCodecSpec } from "../lib/deck.js";
import { DEMOS } from "../lib/demos/registry.js";

// ── 2. slide specs (from the Summer lecture pages, unchanged in behavior) ──
const heapViews = () => [
  (c) => new ArrayRenderer(c, { mode: "cells", pointerRows: 1 }),  // one pointer, k
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
  // the same keys into a plain BST and an AVL tree, side by side: Build inserts
  // the box's keys into both from empty, key by key; it opens with 1..16 loaded
  "avl-vs-bst": {
    panels: [
      { title: "plain BST", make: () => new BST(), renderer: (c) => new TreeRenderer(c, { labels: "none" }) },
      { title: "AVL (rebalances)", make: () => new AVL(), renderer: (c) => new TreeRenderer(c, { labels: "bf" }) },
    ],
    op: (s, v) => s.insert(v),
    initial: "1..16",
    buildStep: (s, k) => s.insert(k),
    speedControl: true, finishButton: true,
    width: 400, height: 200,
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
    initial: "1..14:1:RAND",
    // the 2-3 tree it encodes beside it; purple marks: red is only a red link
    renderer: [(c) => new MultiwayTreeRenderer(c, { mark: "#7c5cff" }), (c) => new TreeRenderer(c, { labels: "none", mark: "#7c5cff" })],
    layout: "row", cols: [360, 540], labels: ["2-3 tree", "red-black BST"],
    buildStep: (s, k) => s.insert(k),
    ops: [
      { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
      { name: "Delete", arg: "number", run: (s, v) => s.delete(v) },
    ],
    costs: ["compare", "rotation", "link"], chrome: { showCosts: true },
    width: 900, height: 230,
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


// ── hashing (from the Summer hashing lecture) ──
const hashArr = (c) => new ArrayRenderer(c, { mode: "cells" });
const probeCosts = ["hash", "compare", "write"];
const HASH_SPECS = {
  // the odd numbers 1..21 into M = 7: four 2-chains, three 1-chains, α = 11/7
  "hash-chain": {
    title: "chaining table (M = 7)",
    make: () => new SeparateChaining(7),
    initial: "1..21:2",
    buildStep: (s, k) => s.insert(k),
    renderer: (c) => new ChainRenderer(c),
    stateMsg: (s) => {
      const longest = Math.max(0, ...s.buckets.map((b) => b.length));
      return `M = ${s.M}, n = ${s.n}: α = ${s.alpha()}, longest chain ${longest}`;
    },
    scripts: [{ name: "prove the α cost: search deep keys", text: "search 63\nsearch 70" }],
    info: chainingInfo("M is FIXED: no resize"),
    ops: [
      { name: "Insert", arg: "number", desc: "hash to the bucket, scan for a duplicate, link at the chain's end", run: (s, v) => s.insert(v) },
      { name: "Search", arg: "number", desc: "walk ONLY the home bucket's chain", run: (s, v) => s.search(v) },
      { name: "Delete", arg: "number", desc: "walk the chain, unlink the node; nothing else moves", run: (s, v) => s.remove(v) },
    ],
    costs: ["hash", "compare"], chrome: { showCosts: true },
    width: 1000, height: 240,
  },
  "hash-chain-resize": { use: "hash-chain-resize", width: 1000, chrome: { showCosts: true } },
  "hash-delete-race": { use: "hash-delete-race", width: 1000 },
  "probe-delete-pitfalls": { use: "probe-delete-pitfalls", width: 1000 },
  // the registry race, with shorter panels so three fit on a 620-px slide
  "probe-race": { ...DEMOS["probe-race"], width: 1000,
                  panels: DEMOS["probe-race"].panels.map((p) => ({ ...p, height: 74 })) },
  // 2→2, 8→8, 14→3, 20→9; inserting 25: home 3 is taken, probes to 4
  "hash-probe": {
    title: "probing table (M = 11, fixed)",
    make: () => new LinearProbing(11, { resizeAt: Infinity }),
    initial: "2..20:6",
    buildStep: (s, k) => s.insert(k),
    renderer: hashArr,
    stateMsg: (s) => `M = ${s.M}, h(k) = k mod ${s.M}: ${s.n} keys, no lists; colliders probe forward`,
    info: openAddressingInfo("fixed M: a full table rejects inserts"),
    ops: [
      { name: "Insert", arg: "number", desc: "hash to the home slot, probe forward past collisions, place in the first empty slot", run: (s, v) => s.insert(v) },
      { name: "Search", arg: "number", desc: "probe forward from the home slot until the key or an empty slot", run: (s, v) => s.search(v) },
    ],
    costs: probeCosts, chrome: { showCosts: true },
    width: 1000, height: 150,
  },
  // 14, 25, 36 all home to slot 3 and occupy 3, 4, 5
  "hash-delete": {
    title: "probing table (M = 11, fixed)",
    make: () => new LinearProbing(11, { resizeAt: Infinity }),
    initial: "14..36:11",
    buildStep: (s, k) => s.insert(k),
    renderer: hashArr,
    stateMsg: () => "the cluster from the slides: 14, 25, 36 all home to slot 3; now Delete 14",
    info: openAddressingInfo("fixed M · delete = Sedgewick cluster re-insert"),
    defaultOp: "Delete",
    scripts: [{ name: "delete 14, then prove 25 survives", text: "delete 14\nsearch 25" }],
    ops: [
      { name: "Insert", arg: "number", desc: "probe forward from the home slot, place in the first empty slot", run: (s, v) => s.insert(v) },
      { name: "Search", arg: "number", desc: "probe forward until the key or an empty slot", run: (s, v) => s.search(v) },
      { name: "Delete", arg: "number", desc: "empty the slot, then re-insert the rest of the cluster so no probe path breaks (Sedgewick)", run: (s, v) => s.remove(v) },
    ],
    costs: probeCosts, chrome: { showCosts: true },
    width: 1000, height: 150,
  },
  // 6→6, 10→2, 14→6 (probes to 7) at M = 8; one more insert crosses α = ½
  "hash-resize": {
    title: "probing table (resizes at α = ½)",
    make: () => new LinearProbing(8),
    initial: "6..14:4",
    buildStep: (s, k) => s.insert(k),
    renderer: hashArr,
    stateMsg: (s) => `M = ${s.M}, ${s.n} keys: α = ${(s.n / s.M).toFixed(2)}; one more insert crosses ½`,
    info: openAddressingInfo("doubles at α ≥ 0.5"),
    ops: [
      { name: "Insert", arg: "number", desc: "insert; crossing α = ½ DOUBLES the table and rehashes every key", run: (s, v) => s.insert(v) },
      { name: "Search", arg: "number", desc: "probe forward until the key or an empty slot", run: (s, v) => s.search(v) },
    ],
    costs: probeCosts, chrome: { showCosts: true },
    width: 1000, height: 150,
  },
};

// ── graphs (from the Summer graph and Dijkstra lectures) ──
const DAG = "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7";       // the course graph
const WDAG = "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7";
const graphBase = () => ({
  make: () => new Graph({ layout: "circle" }),
  initial: DAG, initialPlaceholder: "u v, u v, …", initialTitle: "directed edge pairs \"u v\", comma-separated",
  valPlaceholder: "start vertex",
  buildAll: (s, keys) => s.buildTrace(keys),
  renderer: (c) => new GraphRenderer(c, { directed: true }),
  stateMsg: (g) => `directed graph: ${g.inorder()}; pairs "u v" in the box are the edges`,
  info: graphInfo,
  costs: ["visit", "compare"], chrome: { showCosts: true },
  width: 960, height: 240,
});
const frontierView = (inner) => ({ draw: (snap) => inner.draw(snap?.frontier?.items ?? [], {}) });
const outputView = (inner) => ({ draw: (snap, hl) => inner.draw(hl?.nodes?.done ?? [], {}) });
const graphDual = (h) => ({
  renderer: [
    (c) => new GraphRenderer(c, { directed: true }),
    (c) => frontierView(new ArrayRenderer(c, { mode: "cells", pointers: false, indices: false })),
    (c) => outputView(new ArrayRenderer(c, { mode: "cells", pointers: false, indices: false })),
  ],
  labels: ["", "the frontier: BFS the queue · DFS the recursion stack · topo the ready set",
               "the OUTPUT so far: BFS visit order · DFS finish order (reverse → topo) · Kahn the topological order"],
  height: [h, 40, 40],
});
const dfsOp = { name: "DFS from", arg: "number", desc: "dive along unvisited edges, backtrack at dead ends; a back edge to a stack ancestor = a CYCLE", run: (s, v) => s.dfs(v) };
const bfsOp = { name: "BFS from", arg: "number", desc: "explore in layers via the queue; each label = fewest edges from the start", run: (s, v) => s.bfs(v) };
const topoOp = { name: "Topo sort", desc: "Kahn: repeatedly output an in-degree-0 vertex; the finale lines the vertices up, every edge pointing right", run: (s) => s.topo() };
const wgraphBase = () => ({
  make: () => new WeightedGraph({ layout: "circle", aspect: (960 - 60) / (300 - 60) }),
  initial: WDAG, initialPlaceholder: "u v w, …", initialTitle: "weighted directed edge triples \"u v w\", comma-separated",
  valPlaceholder: "start vertex",
  buildAll: (s, keys) => s.buildTrace(keys),
  renderer: (c) => new GraphRenderer(c, { directed: true }),
  stateMsg: (g) => `weighted digraph: ${g.inorder()}; triples "u v w" in the box are the edges`,
  ops: [{ name: "Dijkstra from", arg: "number", run: (s, v) => s.dijkstra(v) }],
  costs: ["visit", "compare"], chrome: { showCosts: true },
  width: 960, height: 300,
});
const GRAPH_SPECS = {
  "graph-tour": {
    make: () => { const g = new Graph({ layout: "circle", aspect: (900 - 60) / (230 - 60) }); g.build(DAG.split(/[\s,]+/).filter(Boolean).map(Number)); return g; },
    renderer: (c) => new GraphRenderer(c, { directed: true }),
    label: "the course graph: a DAG on 8 vertices, 11 directed edges",
    width: 900, height: 230,
  },
  "graph-dfs": { ...graphBase(), ...graphDual(130), ops: [dfsOp] },
  "graph-bfs": { ...graphBase(), ...graphDual(130), ops: [dfsOp, bfsOp], defaultOp: "BFS from",
                 scripts: [{ name: "compare the orders: DFS then BFS from 0", text: "dfs 0\nbfs 0" }] },
  "search-race": { ...DEMOS["search-race"], width: 1000,
                   panels: DEMOS["search-race"].panels.map((p) => ({ ...p, height: 118 })) },
  "graph-topo": { ...graphBase(), ...graphDual(125), ops: [dfsOp, bfsOp, topoOp], defaultOp: "Topo sort",
                  presets: [{ name: "the course DAG", initial: DAG }, { name: "with a cycle (6→2 added)", initial: DAG + ", 6 2" }],
                  scripts: [{ name: "Kahn, then DFS double-checks", text: "topo\ndfs 0" }] },
  "wgraph-tour": {
    make: () => { const g = new WeightedGraph({ layout: "circle", aspect: (900 - 60) / (300 - 60) }); g.build(WDAG.split(/[\s,]+/).filter(Boolean).map(Number)); return g; },
    renderer: (c) => new GraphRenderer(c, { directed: true }),
    label: "the course graph: 8 vertices, 11 weighted directed edges",
    width: 900, height: 300,
  },
  // 0→1(2), 0→2(5), 0→3(9) discover; 1→3(4) improves dist[3] from 9 to 6; 2→3(8) fails
  "relax": {
    make: () => {
      const g = new WeightedGraph();
      g.nodes = [{ id: 0, x: 0.10, y: 0.50 }, { id: 1, x: 0.45, y: 0.15 }, { id: 2, x: 0.45, y: 0.85 }, { id: 3, x: 0.85, y: 0.50 }];
      g.edges = [{ u: 0, v: 1, w: 2, directed: true }, { u: 0, v: 2, w: 5, directed: true }, { u: 0, v: 3, w: 9, directed: true },
                 { u: 1, v: 3, w: 4, directed: true }, { u: 2, v: 3, w: 8, directed: true }];
      g.adj = { 0: [{ v: 1, w: 2 }, { v: 2, w: 5 }, { v: 3, w: 9 }], 1: [{ v: 3, w: 4 }], 2: [{ v: 3, w: 8 }], 3: [] };
      return g;
    },
    renderer: (c) => new GraphRenderer(c, { directed: true }),
    run: (s) => s.dijkstra(0),
    costs: ["visit", "compare"], chrome: { showCosts: true }, width: 800, height: 230,
  },
  "dijkstra": wgraphBase(),
  "dijkstra-neg": wgraphBase(),
  // Lecture 10 and 11 graph algorithms (lib/demos/graph-algos.js), sized for 1280x620
  "dfs-edges": { use: "dfs-edges", width: 960, height: [215, 40] },
  "scc": { use: "scc", width: 960, height: [285, 40] },
  "bellman-ford": { use: "bellman-ford", width: 960, height: [200, 40] },
  // Lecture 13 MST demos (lib/demos/mst.js), on the ring the slides' figures use. Each topic
  // lays the graph beside its second canvas (Kruskal's union-find forest, Prim's heap), so
  // the graph keeps the full height; Prim's heap wraps onto several rows in its narrow column
  "kruskal": { use: "kruskal", make: () => new WeightedGraph({ directed: false, layout: "circle" }) },
  "prim": {
    use: "prim", make: () => new WeightedGraph({ directed: false, layout: "circle" }),
    renderer: [
      (c) => new GraphRenderer(c, { directed: false }),
      (c) => {
        const heap = new ArrayRenderer(c, { mode: "cells", pointers: false, wrapCell: 40 });
        return { draw: (snap, hl) => heap.draw(snap?.pq ?? [], hl?.pq ?? {}) };
      },
    ],
  },
};

// static figures drawn from the engines (they cannot drift from the demos)
function mountStatic() {
  const bw = document.getElementById("bfs-worked");
  if (bw && !bw.__mounted) {
    bw.__mounted = true;
    const g = new Graph(); g.build([0, 1, 0, 2, 1, 3, 2, 3]);
    renderTraceTable(bw, {
      trace: g.bfs(0),
      action: (f) => f.msg.replace(/ \u2014 scan its neighbors$/, "").replace(/, enqueue it$/, "").replace(/ \u2014 /g, ": "),
      cols: [
        { label: "queue", get: (f) => `[${f.snapshot.frontier.items.join(" ")}]` },
        ...[0, 1, 2, 3].map((v) => ({ label: `d(${v})`, get: (f) => f.highlight?.dist?.[v] ?? "–" })),
        { label: "visit order", get: (f) => (f.highlight?.nodes?.done ?? []).join(" ") },
      ],
    });
  }
  const line = document.getElementById("topo-line");
  if (line && !line.__mounted) {
    line.__mounted = true;
    const g = new Graph(); g.build(DAG.split(/[\s,]+/).map(Number));
    const last = g.topo().last;
    const cv = document.createElement("canvas");
    cv.width = 900; cv.height = 150; cv.style.width = "100%"; cv.style.height = "auto";
    line.appendChild(cv);
    new GraphRenderer(cv, { directed: true }).draw(last.snapshot, last.highlight);
  }
}

// ── greedy algorithms and Huffman coding (Lecture 14) ──
// One interval instance, both greedies: a[1,5) b[2,6) c[3,7) d[7,9) e[8,11).
// Rooms gives 3 (the depth), Select gives 2 (a, d): same picture, different
// question, different answer.
const FIVE_REQUESTS = "1 5, 2 6, 3 7, 7 9, 8 11";
const CLRS_FREQS = "5, 9, 12, 13, 16, 45";     // a:5 b:9 c:12 d:13 e:16 f:45, 224 bits
const GREEDY_SPECS = {
  "intervals": {
    make: () => new Intervals(),
    initial: FIVE_REQUESTS,
    initialPlaceholder: "start finish, …",
    initialTitle: "half-open intervals \"start finish\", comma-separated",
    loadRaw: true,            // Build just shows the requests; the OPS are the algorithms
    renderer: (c) => new IntervalRenderer(c, { rowH: 26 }),
    stateMsg: (s) => `${s.iv.length} requests: ${s.inorder()}; depth ${s.peakOverlap()}`,
    ops: [
      { name: "Rooms", desc: "interval partitioning: the fewest rooms that host them all", run: (s) => s.rooms() },
      { name: "Select", desc: "activity selection: the most requests in one room", run: (s) => s.select() },
    ],
    costs: ["compare", "write"], chrome: { showCosts: true },
    width: 860, height: 210,
  },
  // the build: the pool (smallest first) above the forest it is folded into
  "huffman-build": {
    make: () => new Huffman(),
    initial: CLRS_FREQS,
    initialPlaceholder: "TEXT(…) · SYM-FRQ(a:20, b:17) · SYM-RAND(a..h) · 5, 9, 12",
    initialTitle: "TEXT(real text) · SYM-FRQ(a:20, b:17) · SYM-RAND(a..h) · or plain frequencies for a, b, c, …",
    initialWidth: 250,
    presets: [
      { name: "CLRS (5,9,12,13,16,45)", initial: CLRS_FREQS },
      { name: "real text, spaces and all", initial: "TEXT(the white fox jumped over the white fence by the white house)" },
      { name: "average English (26 letters + space)", initial: "ENGLISH" },
      { name: "equal frequencies: no saving", initial: "8, 8, 8, 8" },
    ],
    buildAll: (s, keys, vals, method, raw) => s.buildInput(raw, keys),
    renderer: [
      (c) => new ArrayRenderer(c, { mode: "cells", pointers: false }),
      (c) => new TreeRenderer(c, { labels: "sym" }),
    ],
    stateMsg: (s) => s.statsLine() || `Huffman tree: ${s.inorder()}`,
    costs: ["compare", "link", "alloc"], chrome: { showCosts: true },
    width: 900, height: [66, 250],
  },
  // the code USED: the tree on top, then text · bits · decoded text; Decode
  // consumes exactly the bits Encode produced
  "huffman-codes": {
    ...codecSpec(),
    width: 900, height: [180, 104],
    chrome: { showValue: false, showOps: false, showCosts: false },
  },
  // the tree is built BY THE TEXT; Decode starts from an empty tree
  "adaptive-huffman": {
    ...adaptiveCodecSpec(),
    width: 900, height: [186, 100],
    chrome: { showValue: false, showOps: false, showClear: false, showCosts: false },
  },
};

// Lecture 15: the registry's sorting demos, opened on the lecture's arrays
const LECTURE_ARRAY = "3, 7, 1, 9, 4, 8, 6, 2, 5";
const SORT_SPECS = {
  "mergesort-lecture": { use: "mergesort", initial: "38, 27, 43, 3, 9, 82, 10" },
  "quicksort-lecture": { use: "quicksort", initial: LECTURE_ARRAY },
  "quickselect-lecture": { use: "quickselect", initial: "7, 2, 9, 4, 1, 6, 3" },
  "lomuto-vs-hoare-lecture": { use: "lomuto-vs-hoare", initial: LECTURE_ARRAY },
};

const slots = Object.fromEntries(Object.keys(DEMOS).map((slug) => [slug, { use: slug }]));
initDeckDemos({ ...slots, ...SLIDE_SPECS, ...HASH_SPECS, ...GRAPH_SPECS, ...GREEDY_SPECS, ...SORT_SPECS });

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

const start = () => { mountStatic(); startLegacy(); };
const R = window.Reveal;
if (R && R.isReady && R.isReady()) start();
else if (R && typeof R.on === "function") R.on("ready", start);
else document.addEventListener("DOMContentLoaded", start);
