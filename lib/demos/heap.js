// CSS 343 unified library — demos/heap.js
// Full-demo specs for the binary heap: a priority queue AND heapsort, both
// driven by the same array-backed BinaryHeap. Array indices ARE tree positions,
// so the shared ArrayRenderer draws it directly. Two specs, one engine — the
// max-heap and the min-heap differ ONLY in which way the comparison points, so
// the min version is the max version with `>` flipped to `<` (see
// structures/heap.js `_beats`).
//
// BUILD is itself a choice here — the build string names the method,
// INSERT(1..31) or HEAPIFY(1..31) (bare keys mean INSERT) — because the two
// ways to build a heap cost differently: n swims versus bottom-up heapify. The gap
// shows on insert's WORST case — ascending keys into a max-heap, where every
// insert swims to the root: 1..31 costs 98 swaps by insert against 26 by
// heapify (1..63: 258 vs 57). On RANDOM keys insert is Θ(n) expected too and
// the two land close (n=200: 234 vs 145 swaps), which is the honest version of
// the comparison and the reason the presets pair the ascending case explicitly.

import { ArrayRenderer, HeapTreeRenderer, MaxHeap, MinHeap } from "../index.js";

// stateless factories — both specs mount their own renderer instances from these
const renderer = [
  (c) => new ArrayRenderer(c, { mode: "cells" }),
  (c) => new HeapTreeRenderer(c),
];

/** Build = the method the build string names — INSERT(keys) or HEAPIFY(keys),
 *  bare keys meaning INSERT. Both start from the fresh instance FullDemo just
 *  made, so their counters are directly comparable. RAW is deliberately NOT
 *  offered here: the gallery has no standalone Heapify op to follow it with
 *  (the deck's Part 6 / Part 8 slides do — see the session's index.html). */
const buildAll = (s, keys, vals, method) => s.buildBy(keys, method, ["insert", "heapify"]);

export const heapDemo = {
  id: "heap",
  title: "Binary Heap (max-heap / PQ)",
  blurb: "An array-backed complete binary tree, shown BOTH ways at once — the flat array and the tree it encodes (parent k/2, children 2k and 2k+1), so the heap property is visible: every parent ≥ its children. Insert swims up, delete-max sinks down, both Θ(log n). The build box names the method — INSERT(1..31) or HEAPIFY(1..31) over the same keys, bare keys meaning INSERT — and Sort down then runs heapsort's second phase on its own, so the two halves of heapsort can be watched separately. Compare the build counters on ASCENDING keys — insert's worst case, every key swimming to the root — where 1..31 costs 98 swaps by insert against 26 by heapify; on random keys insert is Θ(n) expected too and the two run close. Flipping one comparison gives the min-heap demo.",
  make: () => new MaxHeap(),
  initial: "INSERT(1..10:ZIG)",  // a deterministic scramble: 1,10,2,9,…
  buildAll,
  initialBuilt: true,    // open on a finished heap, so Delete max is safe before the first Build
  proto: "heap",
  presets: [
    { name: "scramble 1..10 zigzag — by insert", initial: "INSERT(1..10:ZIG)" },
    { name: "1..31 ascending by INSERT — 98 swaps", initial: "INSERT(1..31)" },
    { name: "1..31 ascending by HEAPIFY — 26 swaps", initial: "HEAPIFY(1..31)" },
    { name: "15..1 descending — no swims", initial: "INSERT(1..15:DESC)" },
    { name: "random 16 by heapify — then Sort down", initial: "HEAPIFY(1..16:RAND)" },
  ],
  renderer,
  height: [75, 210],
  costs: ["compare", "swap", "read", "write"],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete max", run: (s) => s.delMax() },
    // heapify is a BUILD method (the build string), not an op — on a heap it has
    // nothing to do. Sort down is heapsort's second phase on its own, so the
    // Θ(n) build and the Θ(n log n) sort can be watched separately; it dims
    // whenever the array is not a heap (e.g. right after a finished Heapsort).
    { name: "Sort down (heapsort phase 2)", run: (s) => s.sinkDown(),
      enabledWhen: (s) => s.size() > 1 && s.isHeap(), requires: "a valid heap — Build first" },
    { name: "Heapsort", run: (s) => s.heapsort() },
  ],
};

// The SAME engine with the comparison reversed: the root is now the SMALLEST
// key. This is the priority queue Dijkstra, Prim and Huffman actually want
// (repeatedly take the cheapest thing), and sorting it down runs DESCENDING.
export const minHeapDemo = {
  ...heapDemo,
  id: "min-heap",
  title: "Binary Heap (min-heap / PQ)",
  blurb: "The same array-backed heap with ONE comparison flipped: every parent ≤ its children, so the smallest key sits at a[1]. This is the priority queue Dijkstra, Prim and Huffman use — repeatedly remove the cheapest item. Insert swims up, delete-min sinks down, both Θ(log n). The build box names the method — INSERT(…) or HEAPIFY(…) over the same keys; insert's worst case here is DESCENDING input (every key swims to the root) — 31..1 costs 98 swaps by insert against 26 by heapify. Sorting a min-heap down lays the keys out in DESCENDING order.",
  make: () => new MinHeap(),
  presets: [
    { name: "scramble 1..10 zigzag — by insert", initial: "INSERT(1..10:ZIG)" },
    { name: "31..1 descending by INSERT — 98 swaps", initial: "INSERT(1..31:DESC)" },
    { name: "31..1 descending by HEAPIFY — 26 swaps", initial: "HEAPIFY(1..31:DESC)" },
    { name: "1..15 ascending — no swims", initial: "INSERT(1..15)" },
    { name: "random 16 by heapify — then Sort down", initial: "HEAPIFY(1..16:RAND)" },
  ],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete min", run: (s) => s.delMin() },
    { name: "Sort down (heapsort phase 2)", run: (s) => s.sinkDown(),
      enabledWhen: (s) => s.size() > 1 && s.isHeap(), requires: "a valid heap — Build first" },
    { name: "Heapsort (descending)", run: (s) => s.heapsort() },
  ],
};
