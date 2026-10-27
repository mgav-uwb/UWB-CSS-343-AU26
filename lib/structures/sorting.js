// CSS 343 unified library: structures/sorting.js
// Comparison sorting over a plain array, drawn with the shared ArrayRenderer.
// mergesort is bottom-up (width doubles each pass) so the interesting step
// (merging two adjacent sorted runs) is the thing on screen; quicksort and
// quickselect share one Lomuto partition (pivot = last element, i tracks the
// "confirmed < pivot" boundary as j scans left-to-right). Every op runs once
// through a Tracer and returns a Trace the Player scrubs.
//
// The textbook's sorting chapters draw their figures from the same file: the
// elementary sorts (selectionSort, insertionSort, shellsort, bubbleSort), the
// TOP-DOWN mergesort with its four-branch merge (mergesortTopDown, mergeOnce),
// and Dijkstra's three-way partition (quicksort3way), each written exactly as
// the chapter's code and traced one frame per decision; plus the untraced
// key-indexed counting, LSD and MSD radix passes and the inversion count.
// None of them is used by a demo yet; the demos' ops above are unchanged.

import { Tracer } from "../core/tracer.js";

const SAMPLE = [5, 2, 8, 1, 9, 3, 7, 4, 6];
const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo) }, (_, x) => lo + x);

/** The number of inversions of a: pairs i < j with a[i] > a[j]. */
export function inversions(a) {
  let n = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++;
  return n;
}

/** Key-indexed counting, as the counting-sort chapter writes it: histogram,
 *  prefix sums into start[], a stable left-to-right placement, copy back.
 *  records: any values; key(r) in 0..R-1. Returns every intermediate state:
 *  count (after the histogram), start (the prefix sums), steps (one per placed
 *  record: the record, its slot, aux after, start after) and the output. */
export function keyIndexedCounting(records, R, key = (r) => r) {
  const count = new Array(R).fill(0);
  for (const r of records) count[key(r)]++;
  const start = new Array(R);
  for (let r = 0, s = 0; r < R; r++) { start[r] = s; s += count[r]; }
  const next = start.slice(), aux = new Array(records.length).fill(null), steps = [];
  for (const rec of records) {
    const slot = next[key(rec)]++;
    aux[slot] = rec;
    steps.push({ rec, slot, aux: aux.slice(), start: next.slice() });
  }
  return { count, start, steps, out: aux.slice() };
}

/** Digit p (0 = least significant) of x in base R. */
export const digit = (x, p, R = 10) => Math.floor(x / R ** p) % R;

/** LSD radix sort: one key-indexed counting pass per digit, least significant
 *  first. Returns the array after each pass. unstable: fill each digit's block
 *  from its right end while scanning left to right, which reverses ties (the
 *  chapter's broken run). */
export function lsdPasses(keys, d, R = 10, { unstable = false } = {}) {
  let a = keys.slice();
  const passes = [];
  for (let p = 0; p < d; p++) {
    if (!unstable) a = keyIndexedCounting(a, R, (x) => digit(x, p, R)).out;
    else {
      const count = new Array(R).fill(0);
      for (const x of a) count[digit(x, p, R)]++;
      const end = new Array(R);
      for (let r = 0, s = 0; r < R; r++) { s += count[r]; end[r] = s; }
      const aux = new Array(a.length);
      for (const x of a) aux[--end[digit(x, p, R)]] = x;
      a = aux;
    }
    passes.push(a.slice());
  }
  return passes;
}

/** MSD radix sort's first pass: one stable counting pass on the leading digit
 *  (digit d-1), returned as the blocks it splits the array into, in digit order. */
export function msdFirstPass(keys, d, R = 10) {
  const out = keyIndexedCounting(keys, R, (x) => digit(x, d - 1, R)).out;
  const blocks = [];
  for (const x of out) {
    const g = digit(x, d - 1, R), last = blocks[blocks.length - 1];
    if (last && last.digit === g) last.keys.push(x); else blocks.push({ digit: g, keys: [x] });
  }
  return blocks;
}

export class Sorting {
  constructor() { this.a = []; }

  build(keys) { this.a = (keys && keys.length) ? keys.slice() : SAMPLE.slice(); return this; }
  loadRaw(keys) { return this.build(keys); } // FullDemo: Build = load the raw array (ops run the sorts)
  snapshot() { return this.a.slice(); }
  inorder() { return this.a.join(", "); }

  /** mergesort(): bottom-up: merge adjacent runs of width 1, then 2, 4, ... until
   *  width >= n. No recursion, so the merge step (the interesting part) is front
   *  and center: two sorted runs, a compare of their front elements, a write of
   *  the smaller into place. */
  mergesort() {
    const t = new Tracer();
    const n = this.a.length;
    t.step(`start: bottom-up mergesort over ${n} keys: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: {} });
    if (n < 2) {
      t.step(`done: trivially sorted`, { snapshot: this.a.slice(), highlight: { done: n ? [0] : [] } });
      return t.trace();
    }
    for (let width = 1; width < n; width *= 2) {
      t.step(`pass: merge runs of width ${width}`, { snapshot: this.a.slice(), highlight: {} });
      for (let lo = 0; lo < n; lo += 2 * width) {
        const mid = Math.min(lo + width, n);
        const hi = Math.min(lo + 2 * width, n);
        if (mid < hi) this._merge(lo, mid, hi, t);
      }
    }
    t.step(`done: mergesorted ascending: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  /** merge a[lo..mid) with a[mid..hi) via a scratch copy: mergesort is NOT
   *  in place: both runs are first copied into an AUX buffer (the Θ(n) extra
   *  memory), then i walks the left copy, j the right copy, and k writes the
   *  smaller front element back into a[]. Snapshots carry {array, aux} so the
   *  demo can draw the aux row aligned under the main array (aux slots the
   *  merge doesn't own stay blank); hl.aux carries the aux row's highlights. */
  _merge(lo, mid, hi, t) {
    const left = this.a.slice(lo, mid);
    const right = this.a.slice(mid, hi);
    const n = this.a.length;
    const auxRow = () => {
      const row = new Array(n).fill("");
      left.forEach((v, x) => { row[lo + x] = v; });
      right.forEach((v, x) => { row[mid + x] = v; });
      return row;
    };
    const snap = () => ({ array: this.a.slice(), aux: auxRow() });
    t.count("read", hi - lo); t.count("write", hi - lo); // the copy into aux
    t.step(`merge a[${lo}..${mid - 1}] with a[${mid}..${hi - 1}]: copy both runs into the AUX buffer; the Θ(n) extra memory`,
      { snapshot: snap(), highlight: { active: range(lo, mid), compare: range(mid, hi),
        aux: { active: range(lo, mid), compare: range(mid, hi) } } });

    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      t.count("compare"); t.count("read", 2);
      t.step(`compare aux left[${i}]=${left[i]} vs aux right[${j}]=${right[j]}`,
        { snapshot: snap(), highlight: { pointers: { k },
          aux: { compare: [lo + i, mid + j], pointers: { i: lo + i, j: mid + j } } } });
      if (left[i] <= right[j]) { this.a[k] = left[i]; i++; } else { this.a[k] = right[j]; j++; }
      t.count("write");
      t.step(`write the smaller back: a[${k}] = ${this.a[k]}`,
        { snapshot: snap(), highlight: { active: k, pointers: { k },
          aux: { pointers: { i: lo + i, j: mid + j } } } });
      k++;
    }
    while (i < left.length) {
      this.a[k] = left[i]; t.count("write");
      t.step(`copy remaining aux left[${i}]=${this.a[k]} back into a[${k}]`,
        { snapshot: snap(), highlight: { active: k, pointers: { k }, aux: { pointers: { i: lo + i } } } });
      i++; k++;
    }
    while (j < right.length) {
      this.a[k] = right[j]; t.count("write");
      t.step(`copy remaining aux right[${j}]=${this.a[k]} back into a[${k}]`,
        { snapshot: snap(), highlight: { active: k, pointers: { k }, aux: { pointers: { j: mid + j } } } });
      j++; k++;
    }
    t.step(`merged a[${lo}..${hi - 1}] → ${this.a.slice(lo, hi).join(", ")}`,
      { snapshot: { array: this.a.slice(), aux: new Array(n).fill("") }, highlight: { done: range(lo, hi) } });
  }

  /** quicksort(): recursive, Lomuto partition (see _partition). */
  quicksort() {
    const t = new Tracer();
    const n = this.a.length;
    t.step(`start: quicksort (Lomuto partition) over ${n} keys: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: {} });
    if (n < 2) {
      t.step(`done: trivially sorted`, { snapshot: this.a.slice(), highlight: { done: n ? [0] : [] } });
      return t.trace();
    }
    const finalized = new Set();
    this._quicksort(0, n - 1, t, finalized);
    t.step(`done: quicksorted ascending: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  _quicksort(lo, hi, t, finalized) {
    if (lo > hi) return;
    if (lo === hi) {
      finalized.add(lo);
      t.step(`single element a[${lo}]=${this.a[lo]}: trivially in place`,
        { snapshot: this.a.slice(), highlight: { done: [...finalized] } });
      return;
    }
    const p = this._partition(lo, hi, t, finalized);
    this._quicksort(lo, p - 1, t, finalized);
    this._quicksort(p + 1, hi, t, finalized);
  }

  /** Lomuto partition of a[lo..hi]: pivot = a[hi]; i marks the boundary of the
   *  "confirmed < pivot" region while j scans lo..hi-1. Every element < pivot
   *  gets swapped into the boundary and i advances; at the end the pivot is
   *  swapped into index i, which is its final sorted position (returned).
   *  `finalized` just accumulates already-placed indices so earlier `done`
   *  cells stay highlighted while later partitions run. Every frame also
   *  carries kind ("start", "compare", "swap", "place") and range ({lo, hi}),
   *  which the textbook's figures read; the renderer ignores both. */
  _partition(lo, hi, t, finalized) {
    const pivot = this.a[hi];
    t.count("partition");
    t.step(`partition a[${lo}..${hi}]: pivot = a[${hi}]=${pivot}`,
      { snapshot: this.a.slice(), highlight: { done: [...finalized], active: hi, pointers: { pivot: hi }, kind: "start", range: { lo, hi } } });
    let i = lo;
    for (let j = lo; j < hi; j++) {
      t.count("compare"); t.count("read");
      t.step(`compare a[${j}]=${this.a[j]} vs pivot ${pivot}`,
        { snapshot: this.a.slice(), highlight: { done: [...finalized], compare: [j, hi], pointers: { i, j, pivot: hi }, kind: "compare", range: { lo, hi } } });
      if (this.a[j] < pivot) {
        [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
        t.count("swap"); t.count("read", 2); t.count("write", 2);
        t.step(`a[${j}] < pivot: swap into boundary at i=${i}`,
          { snapshot: this.a.slice(), highlight: { done: [...finalized], active: [i, j], pointers: { i, j, pivot: hi }, kind: "swap", range: { lo, hi } } });
        i++;
      }
    }
    [this.a[i], this.a[hi]] = [this.a[hi], this.a[i]];
    t.count("swap"); t.count("read", 2); t.count("write", 2);
    finalized.add(i);
    t.step(`pivot ${this.a[i]} lands in final sorted position at index ${i}`,
      { snapshot: this.a.slice(), highlight: { done: [...finalized], pointers: { pivot: i }, kind: "place", range: { lo, hi } } });
    return i;
  }

  /** quicksortHoare(): the same recursion, Sedgewick's HOARE partition
   *  (§2.3): the pivot is the FIRST element, two pointers walk toward each
   *  other, and out-of-place pairs are swapped. Fewer swaps than Lomuto (only
   *  genuinely misplaced pairs move), and (the part worth watching) both
   *  scans STOP on keys equal to the pivot, so an array of duplicates splits
   *  down the middle instead of peeling one element per level the way Lomuto
   *  does. Same Θ(n) per partition, same recursion, different constants and a
   *  different behaviour on ties. */
  quicksortHoare() {
    const t = new Tracer();
    const n = this.a.length;
    t.step(`start: quicksort (Hoare partition) over ${n} keys: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: {} });
    if (n < 2) {
      t.step(`done: trivially sorted`, { snapshot: this.a.slice(), highlight: { done: n ? [0] : [] } });
      return t.trace();
    }
    const finalized = new Set();
    this._quicksortHoare(0, n - 1, t, finalized);
    t.step(`done: quicksorted ascending: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }
  _quicksortHoare(lo, hi, t, finalized) {
    if (lo >= hi) {
      if (lo === hi) {
        finalized.add(lo);
        t.step(`single element a[${lo}]=${this.a[lo]}: trivially in place`,
          { snapshot: this.a.slice(), highlight: { done: [...finalized] } });
      }
      return;
    }
    const p = this._partitionHoare(lo, hi, t, finalized);
    this._quicksortHoare(lo, p - 1, t, finalized);
    this._quicksortHoare(p + 1, hi, t, finalized);
  }

  /** Hoare/Sedgewick partition of a[lo..hi] around pivot = a[lo]. `i` scans
   *  right while keys are smaller, `j` scans left while keys are bigger; when
   *  both stop, the two keys are on the wrong sides, so swap them. When the
   *  pointers cross, j is where the pivot belongs: swap it in and return j. */
  _partitionHoare(lo, hi, t, finalized) {
    const pivot = this.a[lo];
    t.count("partition");
    t.step(`partition a[${lo}..${hi}]: pivot = a[${lo}]=${pivot} (the FIRST element)`,
      { snapshot: this.a.slice(), highlight: { done: [...finalized], active: lo, pointers: { pivot: lo }, kind: "start", range: { lo, hi } } });
    let i = lo, j = hi + 1;
    for (;;) {
      do { i++; t.count("compare"); t.count("read"); } while (i < hi && this.a[i] < pivot);
      do { j--; t.count("compare"); t.count("read"); } while (this.a[j] > pivot);
      t.step(i >= j
        ? `i=${i} and j=${j} crossed: the scan is done`
        : `i stops at a[${i}]=${this.a[i]} (≥ pivot), j stops at a[${j}]=${this.a[j]} (≤ pivot): wrong sides`,
        { snapshot: this.a.slice(),
          highlight: { done: [...finalized], compare: i >= j ? [] : [i, j], pointers: { i, j, pivot: lo }, kind: "scan", range: { lo, hi } } });
      if (i >= j) break;
      [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
      t.count("swap"); t.count("read", 2); t.count("write", 2);
      t.step(`swap a[${i}] and a[${j}]: each moves to the side it belongs on`,
        { snapshot: this.a.slice(), highlight: { done: [...finalized], active: [i, j], pointers: { i, j, pivot: lo }, kind: "swap", range: { lo, hi } } });
    }
    [this.a[lo], this.a[j]] = [this.a[j], this.a[lo]];
    t.count("swap"); t.count("read", 2); t.count("write", 2);
    finalized.add(j);
    t.step(`pivot ${this.a[j]} lands in final sorted position at index ${j}`,
      { snapshot: this.a.slice(), highlight: { done: [...finalized], pointers: { pivot: j }, kind: "place", range: { lo, hi } } });
    return j;
  }

  /** quickselect(k): 0-INDEXED rank (k=0 is the smallest element). Repeatedly
   *  Lomuto-partitions a[lo..hi], recursing only into the side that contains
   *  rank k, until the pivot lands exactly at index k. Θ(n) expected time:
   *  each partition throws away the other side instead of recursing into it.
   *  Returns the Trace (for the Player); the k-th-smallest value is also
   *  attached as `trace.result` for callers that just want the number. */
  quickselect(k) {
    const t = new Tracer();
    const n = this.a.length;
    t.step(`start: quickselect for rank k=${k} (0-indexed) among ${n} keys: ${this.a.join(", ")}`,
      { snapshot: this.a.slice(), highlight: { pointers: { k } } });
    if (n === 0 || k < 0 || k >= n) {
      t.step(`invalid: k=${k} out of range for n=${n}`, { snapshot: this.a.slice(), highlight: {} });
      const trace = t.trace(); trace.result = undefined; return trace;
    }
    let lo = 0, hi = n - 1;
    const finalized = new Set();
    while (true) {
      if (lo === hi) {
        finalized.add(lo);
        t.step(`done: a[${k}]=${this.a[k]} is rank ${k} (0-indexed smallest)`,
          { snapshot: this.a.slice(), highlight: { done: k, pointers: { k } } });
        break;
      }
      const p = this._partition(lo, hi, t, finalized);
      if (p === k) {
        t.step(`pivot landed exactly at rank k=${k}: a[${k}]=${this.a[k]}`,
          { snapshot: this.a.slice(), highlight: { done: k, pointers: { k } } });
        break;
      } else if (p < k) {
        t.step(`rank k=${k} is right of pivot index ${p}: recurse into a[${p + 1}..${hi}]`,
          { snapshot: this.a.slice(), highlight: { active: range(p + 1, hi + 1), pointers: { k } } });
        lo = p + 1;
      } else {
        t.step(`rank k=${k} is left of pivot index ${p}: recurse into a[${lo}..${p - 1}]`,
          { snapshot: this.a.slice(), highlight: { active: range(lo, p), pointers: { k } } });
        hi = p - 1;
      }
    }
    const trace = t.trace();
    trace.result = this.a[k];
    return trace;
  }

  // ── the textbook's elementary sorts ────────────────────────────────────
  // Counters: "compare" (one per key comparison) and "swap" (one per exchange,
  // a self-exchange included, as the chapter counts them).

  /** selectionSort(): round i scans a[i+1..n-1] for the minimum and exchanges
   *  it into position i (unconditionally, so a round can exchange a[i] with itself). */
  selectionSort() {
    const t = new Tracer(), a = this.a, n = a.length;
    t.step(`start: selection sort over ${n} keys: ${a.join(", ")}`, { snapshot: a.slice(), highlight: {} });
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) { t.count("compare"); if (a[j] < a[min]) min = j; }
      [a[i], a[min]] = [a[min], a[i]]; t.count("swap");
      t.step(`round ${i}: the minimum of a[${i}..${n - 1}] is ${a[i]} (at ${min}); exchange it into position ${i}`,
        { snapshot: a.slice(), highlight: { round: i, min, done: range(0, i + 1) } });
    }
    t.step(`done: ${a.join(", ")}`, { snapshot: a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  /** insertionSort(): the exchange form: step i slides a[i] left while it is
   *  STRICTLY smaller than its left neighbour. One frame per compare, carrying
   *  the pair compared (highlight.compare = [j-1, j]) and the test's outcome
   *  (highlight.less); one frame per exchange. */
  insertionSort() {
    const t = new Tracer(), a = this.a, n = a.length;
    t.step(`start: insertion sort over ${n} keys: ${a.join(", ")}`, { snapshot: a.slice(), highlight: {} });
    for (let i = 1; i < n; i++) {
      t.step(`step ${i}: slide a[${i}] = ${a[i]} left`, { snapshot: a.slice(), highlight: { step: i, active: i } });
      for (let j = i; j > 0; j--) {
        t.count("compare");
        const less = a[j] < a[j - 1];
        t.step(`a[${j}] = ${a[j]} < a[${j - 1}] = ${a[j - 1]}? ${less ? "yes" : "no: stop"}`,
          { snapshot: a.slice(), highlight: { step: i, compare: [j - 1, j], less } });
        if (!less) break;
        [a[j], a[j - 1]] = [a[j - 1], a[j]]; t.count("swap");
        t.step(`exchange a[${j - 1}] and a[${j}]`, { snapshot: a.slice(), highlight: { step: i, active: [j - 1, j] } });
      }
    }
    t.step(`done: ${a.join(", ")}`, { snapshot: a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  /** shellsort(gaps): h-sort for each gap (default Shell's halving n/2, n/4, ..., 1),
   *  each pass an insertion sort with step h. Frames: one per pass start
   *  (highlight.pass = h), one per compare (h, i, compare = [j-h, j], less) and
   *  one per exchange (h, i, active = [j-h, j]). */
  shellsort(gaps = null) {
    const t = new Tracer(), a = this.a, n = a.length;
    const hs = gaps ?? (() => { const g = []; for (let h = Math.floor(n / 2); h > 0; h = Math.floor(h / 2)) g.push(h); return g; })();
    t.step(`start: shellsort over ${n} keys, gaps ${hs.join(", ")}`, { snapshot: a.slice(), highlight: {} });
    for (const h of hs) {
      t.step(`pass h = ${h}`, { snapshot: a.slice(), highlight: { pass: h } });
      for (let i = h; i < n; i++) {
        for (let j = i; j >= h; j -= h) {
          t.count("compare");
          const less = a[j] < a[j - h];
          t.step(`h = ${h}, i = ${i}: a[${j}] = ${a[j]} < a[${j - h}] = ${a[j - h]}? ${less ? "yes" : "no: stop"}`,
            { snapshot: a.slice(), highlight: { h, i, compare: [j - h, j], less } });
          if (!less) break;
          [a[j], a[j - h]] = [a[j - h], a[j]]; t.count("swap");
          t.step(`h = ${h}, i = ${i}: exchange a[${j - h}] and a[${j}]`,
            { snapshot: a.slice(), highlight: { h, i, active: [j - h, j] } });
        }
      }
    }
    t.step(`done: ${a.join(", ")}`, { snapshot: a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  /** bubbleSort(): left-to-right passes exchanging adjacent out-of-order pairs;
   *  pass i stops n-1-i short; a pass with no exchange ends the sort. One frame
   *  per pass end (highlight.pass, highlight.swapped). */
  bubbleSort() {
    const t = new Tracer(), a = this.a, n = a.length;
    t.step(`start: bubble sort over ${n} keys: ${a.join(", ")}`, { snapshot: a.slice(), highlight: {} });
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        t.count("compare");
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; t.count("swap"); swapped = true; }
      }
      t.step(swapped ? `pass ${i + 1}: the largest of a[0..${n - 1 - i}] reached position ${n - 1 - i}`
        : `pass ${i + 1}: no exchange, so the array is sorted: stop`,
        { snapshot: a.slice(), highlight: { pass: i + 1, swapped, done: range(n - 1 - i, n) } });
      if (!swapped) break;
    }
    t.step(`done: ${a.join(", ")}`, { snapshot: a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }

  // ── the textbook's top-down mergesort ──────────────────────────────────

  /** mergesortTopDown(): sort each half recursively, then merge; mid =
   *  lo + (hi - lo) / 2 rounded down. Frames: a call (highlight.call = {lo, hi,
   *  mid, depth}), a base case (highlight.base = {lo, hi, depth}), and the merge's
   *  frames (see _mergeTD). */
  mergesortTopDown() {
    const t = new Tracer(), n = this.a.length;
    t.step(`start: top-down mergesort over ${n} keys: ${this.a.join(", ")}`, { snapshot: this.a.slice(), highlight: {} });
    const aux = new Array(n);
    this._mergesortTD(0, n - 1, 0, aux, t);
    t.step(`done: ${this.a.join(", ")}`, { snapshot: this.a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }
  _mergesortTD(lo, hi, depth, aux, t) {
    if (hi <= lo) {
      t.step(`mergesort(${lo}, ${hi}): base case`, { snapshot: this.a.slice(), highlight: { base: { lo, hi, depth } } });
      return;
    }
    const mid = lo + Math.floor((hi - lo) / 2);
    t.count("call");
    t.step(`mergesort(${lo}, ${hi}): split at mid = ${mid}`, { snapshot: this.a.slice(), highlight: { call: { lo, hi, mid, depth } } });
    this._mergesortTD(lo, mid, depth + 1, aux, t);
    this._mergesortTD(mid + 1, hi, depth + 1, aux, t);
    this._mergeTD(lo, mid, hi, depth, aux, t);
  }

  /** mergeOnce(mid): one traced merge of the sorted runs a[0..mid] and a[mid+1..n-1]. */
  mergeOnce(mid) {
    const t = new Tracer(), n = this.a.length;
    this._mergeTD(0, mid, n - 1, 0, new Array(n), t);
    return t.trace();
  }

  /** The chapter's four-branch merge through aux[]: per output position k one
   *  frame with highlight.branch ("left exhausted", "right exhausted",
   *  "right smaller", "left wins"), the aux index taken (take), the run fronts
   *  before the step (i, j) and the output position k. A tie goes left. */
  _mergeTD(lo, mid, hi, depth, aux, t) {
    for (let k = lo; k <= hi; k++) aux[k] = this.a[k];
    const runs = { lo, mid, hi, depth };
    t.step(`merge a[${lo}..${mid}] with a[${mid + 1}..${hi}]`, { snapshot: this.a.slice(), highlight: { merge: runs, aux: aux.slice() } });
    let i = lo, j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      let branch, take;
      const front = { i, j };
      if (i > mid) { branch = "left exhausted"; take = j++; }
      else if (j > hi) { branch = "right exhausted"; take = i++; }
      else {
        t.count("compare");
        if (aux[j] < aux[i]) { branch = "right smaller"; take = j++; } else { branch = "left wins"; take = i++; }
      }
      this.a[k] = aux[take];
      t.step(`k = ${k}: ${branch}: emit ${aux[take]}`,
        { snapshot: this.a.slice(), highlight: { merge: runs, k, branch, take, i: front.i, j: front.j } });
    }
    t.step(`merged a[${lo}..${hi}]: ${this.a.slice(lo, hi + 1).join(", ")}`,
      { snapshot: this.a.slice(), highlight: { merged: runs, done: range(lo, hi + 1) } });
  }

  // ── Dijkstra's three-way partition ─────────────────────────────────────

  /** quicksort3way(): pivot v = a[lo]; lt, i, gt keep a[lo..lt-1] < v,
   *  a[lt..i-1] == v, a[i..gt] unexamined, a[gt+1..hi] > v. One frame per
   *  partition start (highlight.part = {lo, hi, v}) and one per branch, after its
   *  action (highlight.branch = "less" | "greater" | "equal", lt, i, gt, at = the
   *  index examined); a frame when a partition ends (highlight.split = {lo, hi, lt, gt}).
   *  Counts one compare for the < test and one more when the > test runs. */
  quicksort3way() {
    const t = new Tracer(), n = this.a.length;
    t.step(`start: three-way quicksort over ${n} keys: ${this.a.join(", ")}`, { snapshot: this.a.slice(), highlight: {} });
    this._sort3way(0, n - 1, t);
    t.step(`done: ${this.a.join(", ")}`, { snapshot: this.a.slice(), highlight: { done: range(0, n) } });
    return t.trace();
  }
  _sort3way(lo, hi, t) {
    const a = this.a;
    if (hi <= lo) return;
    const v = a[lo];
    let lt = lo, i = lo + 1, gt = hi;
    t.count("partition");
    t.step(`partition a[${lo}..${hi}] three ways around v = ${v}`, { snapshot: a.slice(), highlight: { part: { lo, hi, v }, lt, i, gt } });
    while (i <= gt) {
      const at = i;
      t.count("compare");
      if (a[i] < v) {
        [a[lt], a[i]] = [a[i], a[lt]]; t.count("swap");
        lt++; i++;
        t.step(`a[${at}] < ${v}: swap a[${lt - 1}] and a[${at}]; lt++, i++`, { snapshot: a.slice(), highlight: { part: { lo, hi, v }, branch: "less", at, lt, i, gt } });
      } else {
        t.count("compare");
        if (a[i] > v) {
          [a[i], a[gt]] = [a[gt], a[i]]; t.count("swap");
          gt--;
          t.step(`a[${at}] > ${v}: swap a[${at}] and a[${gt + 1}]; gt--, i stays`, { snapshot: a.slice(), highlight: { part: { lo, hi, v }, branch: "greater", at, lt, i, gt } });
        } else {
          i++;
          t.step(`a[${at}] == ${v}: i++`, { snapshot: a.slice(), highlight: { part: { lo, hi, v }, branch: "equal", at, lt, i, gt } });
        }
      }
    }
    t.step(`a[${lt}..${gt}] holds every ${v}; recurse on a[${lo}..${lt - 1}] and a[${gt + 1}..${hi}]`,
      { snapshot: a.slice(), highlight: { split: { lo, hi, lt, gt, v } } });
    this._sort3way(lo, lt - 1, t);
    this._sort3way(gt + 1, hi, t);
  }
}
