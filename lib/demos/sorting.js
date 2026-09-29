// CSS 343 unified library — demos/sorting.js
// Full-demo specs for comparison sorting over a plain array (shared Sorting
// structure): bottom-up mergesort (merge is the spotlight), Lomuto quicksort
// (partition is the spotlight), and quickselect (partition, but discard the
// side that can't contain the answer).

import { Sorting, ArrayRenderer } from "../index.js";

const RAW = { loadRaw: true };  // Build = show the raw array; the ops run the algorithms

// second-canvas adapter: draw the frame's aux buffer (blank when no merge is
// mid-flight) with the aux-specific highlights carried in hl.aux
const auxView = (inner) => ({
  draw: (snap, hl) => inner.draw(snap?.aux ?? [], (hl && hl.aux) || {}),
});

export const mergesortDemo = {
  ...RAW,
  id: "mergesort",
  title: "Mergesort (bottom-up)",
  blurb: "Merge adjacent sorted runs of width 1, then 2, 4, … — and NOT in place: each merge first copies both runs into the Θ(n) AUX buffer (second row), then compares the two copies' front elements and writes the smaller back into the array. That extra row IS mergesort's memory cost — the price of a stable, always-Θ(n log n) sort.",
  make: () => new Sorting(),
  initial: "1..9:ZIG",
  presets: [
    { name: "zigzag (1..9)", initial: "1..9:ZIG" },
    { name: "already sorted (1..9) — same cost", initial: "1..9" },
    { name: "random (1..30)", initial: "1..30:RAND" },
  ],
  renderer: [
    (c) => new ArrayRenderer(c, { mode: "cells" }),
    (c) => auxView(new ArrayRenderer(c, { mode: "cells" })),
  ],
  labels: ["a[] — the array being sorted", "aux — the Θ(n) scratch buffer each merge copies into"],
  height: [95, 95],
  proto: "sorting",
  costs: ["compare", "read", "write"],
  ops: [{ name: "Mergesort", run: (s) => s.mergesort() }],
};

export const quicksortDemo = {
  ...RAW,
  id: "quicksort",
  height: 130,
  title: "Quicksort (Lomuto vs Hoare)",
  blurb: "Two ways to partition, same recursion. LOMUTO takes the last element as pivot and sweeps one index left to right, swapping everything smaller into a growing boundary, then drops the pivot at that boundary. HOARE takes the first element and walks two pointers inward, swapping only genuinely out-of-place pairs — far fewer swaps, and both scans stop ON keys equal to the pivot, which is what saves it from duplicates. Run each on the same array and read the counters: on a shuffle Hoare does about a third of Lomuto's swaps; on an already-sorted array (preset) both go quadratic, but Lomuto pays 77 swaps to Hoare's 11; on all-equal keys (preset) Lomuto is Θ(n²) while Hoare splits down the middle at Θ(n log n).",
  about: `
      <p class="lede">Same algorithm, two partition schemes — and the difference is not
      cosmetic. Run both ops on each preset and watch the counters.</p>
      <h3>Lomuto</h3>
      <p>Pivot = <code>a[hi]</code>, the LAST element. One index <code>j</code> scans the whole
      range; <code>i</code> marks the boundary of the &ldquo;&lt; pivot&rdquo; region and advances
      only when something belongs in it. Every line of the trace is the same statement,
      <code>if (a[j] &lt; pivot) swap(a[++i], a[j])</code> — which is why it is the one to learn
      first.</p>
      <h3>Hoare</h3>
      <p>Pivot = <code>a[lo]</code>, the FIRST element. <code>i</code> walks right while keys are
      smaller, <code>j</code> walks left while keys are bigger; when both stop, the two keys are on
      the wrong sides of each other, so swap them and continue. When the pointers cross, the pivot
      swaps into <code>j</code>. Only genuinely misplaced pairs ever move.</p>
      <h3>What the counters show</h3>
      <ul>
        <li><b>shuffled</b> — Hoare does roughly a third of Lomuto's swaps (7 against 11 on a
        9-element array). The COMPARISON counters are not a fair race on one small input: the two
        schemes take different pivots (<code>a[lo]</code> vs <code>a[hi]</code>), so they split
        differently and one may recurse deeper by luck — swaps are the column that shows the
        structural difference</li>
        <li><b>already sorted</b> — both degrade to Θ(n²) with a fixed-position pivot, but Lomuto
        also thrashes: 77 swaps against Hoare's 11 on 1..12</li>
        <li><b>all equal</b> — the real separation. Lomuto skips every key, so the pivot lands at
        the boundary every time and it peels ONE element per level: Θ(n²). Hoare's scans stop on
        equal keys, so the pointers meet in the middle: Θ(n log n). Measured at n = 8/16/24, Lomuto
        takes 28/120/276 comparisons and Hoare 18/50/90.</li>
      </ul>
      <p>Neither is stable, both are in place, and library sorts use a Hoare-style partition. The
      remaining case — <em>many</em> duplicates but not all — is what 3-way partitioning fixes.</p>`,
  links: [
    { href: "../sessions/S13-sorting-dc/index.html", label: "Lecture 13 — Part 3 →" },
    { href: "../handouts/ch13-sorting-dc.html", label: "Chapter 13 §3: quicksort →" },
  ],
  make: () => new Sorting(),
  initial: "1..9:ZIG",
  presets: [
    { name: "zigzag (1..9)", initial: "1..9:ZIG" },
    { name: "the lecture's array", initial: "3, 7, 1, 9, 4, 8, 6, 2, 5" },
    { name: "sorted (1..12) — both go quadratic", initial: "1..12" },
    { name: "all equal — Lomuto Θ(n²), Hoare Θ(n log n)", initial: "7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7" },
    { name: "random (1..30)", initial: "1..30:RAND" },
  ],
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  proto: "sorting",
  costs: ["compare", "swap", "read", "write"],
  ops: [
    { name: "Lomuto", desc: "pivot = a[hi]; one scanning index, swap every smaller key into the boundary",
      run: (s) => s.quicksort() },
    { name: "Hoare", desc: "pivot = a[lo]; two pointers inward, swap only out-of-place pairs — and stop on equal keys",
      run: (s) => s.quicksortHoare() },
  ],
};

export const quickselectDemo = {
  ...RAW,
  id: "quickselect",
  valPlaceholder: "rank k (0-based)", valWidth: 110,
  height: 130,
  title: "Quickselect (k-th smallest)",
  blurb: "Same Lomuto partition as quicksort, but recurse into only the side that contains rank k (0-indexed) — expected Θ(n), since the other side is thrown away instead of sorted.",
  make: () => new Sorting(),
  initial: "1..9:ZIG",
  presets: [
    { name: "zigzag (1..9)", initial: "1..9:ZIG" },
    { name: "sorted (1..9) — worst-case partitions", initial: "1..9" },
    { name: "random (1..30)", initial: "1..30:RAND" },
  ],
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  proto: "sorting",
  costs: ["compare", "swap", "read", "write"],
  ops: [{ name: "Quickselect", arg: "number", run: (s, v) => s.quickselect(v) }],
};
