// CSS 343 unified library: structures/threesum-fast.js
// The two faster 3-sums on a small array of distinct integers, traced one
// COMPARISON per frame:
//   bsearch()    sort, then for each pair i < j binary-search −(a[i] + a[j]);
//                pointers i, j, lo, mid, hi; one frame per probe
//   twoPointer() sort, then for each i close lo and hi in from the ends of the
//                rest; pointers i, lo, hi; one frame per sum tested
// Snapshots carry {array, target, found} so the info band can show the target
// and the triples found so far. Untraced references (countBsearch,
// countTwoPointer, countBrute) give the counts the tests compare against.

import { Tracer } from "../core/tracer.js";

const SAMPLE = [-5, -1, 0, 3, 1, 4, 2, -3];

export class ThreeSumFast {
  constructor() { this.a = SAMPLE.slice(); }
  build(keys) {
    const seen = new Set(); this.a = [];
    for (const k of (keys && keys.length ? keys : SAMPLE)) if (!seen.has(k)) { seen.add(k); this.a.push(k); }
    this.rejectedCount = (keys ? keys.length : 0) - this.a.length;   // repeats dropped: the demo needs distinct values
    return this;
  }
  loadRaw(keys) { return this.build(keys); }
  get rejectedWhy() { return "3-sum here counts triples of DISTINCT values: repeated values are dropped"; }
  snapshot() { return { array: this.a.slice(), target: null, found: [] }; }
  inorder() { return this.a.join(", "); }

  _sorted(t) {
    const s = this.a.slice().sort((x, y) => x - y);
    t.step(`sort once (N log₂ N): ${s.join(", ")}`, { snapshot: { array: s.slice(), target: null, found: [] }, highlight: {} });
    return s;
  }

  /** bsearch(): for each pair, binary-search the sorted array for −(a[i] + a[j]); count it if found to the right of j. */
  bsearch() {
    const t = new Tracer(), a = this._sorted(t), N = a.length, found = [];
    const snap = (target) => ({ array: a.slice(), target, found: found.slice() });
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const x = -(a[i] + a[j]); let lo = 0, hi = N - 1, at = -1;
        t.step(`pair (${a[i]}, ${a[j]}): search for −(${a[i]} + ${a[j]}) = ${x}`,
          { snapshot: snap(x), highlight: { active: [i, j], pointers: { i, j } } });
        while (lo <= hi) {
          const mid = (lo + hi) >> 1; t.count("compare");
          const rel = x < a[mid] ? "<" : x > a[mid] ? ">" : "=";
          const next = rel === "<" ? `go left: hi = ${mid - 1}` : rel === ">" ? `go right: lo = ${mid + 1}` : "found";
          t.step(`probe a[${mid}] = ${a[mid]}: ${x} ${rel} ${a[mid]}, ${next}`,
            { snapshot: snap(x), highlight: { active: [i, j], compare: [mid], pointers: { i, j, lo, mid, hi } } });
          if (rel === "<") hi = mid - 1; else if (rel === ">") lo = mid + 1; else { at = mid; break; }
        }
        if (at > j) {
          found.push([a[i], a[j], a[at]]);
          t.step(`${x} is at index ${at} > j = ${j}: triple (${a[i]}, ${a[j]}, ${x}) counted`,
            { snapshot: snap(x), highlight: { done: [i, j, at], pointers: { i, j } } });
        } else {
          t.step(at < 0 ? `${x} is not in the array: no triple for this pair`
                        : `${x} is at index ${at}, not right of j = ${j}: that triple was counted already (or uses a[i] or a[j] twice)`,
            { snapshot: snap(x), highlight: { active: [i, j], pointers: { i, j } } });
        }
      }
    t.step(`done: ${found.length} triple${found.length === 1 ? "" : "s"} from N(N−1)/2 = ${N * (N - 1) / 2} binary searches`,
      { snapshot: snap(null), highlight: {} });
    return t.trace();
  }

  /** twoPointer(): for each i, lo = i + 1 and hi = N − 1 close in; each test retires lo or hi (or both on a hit). */
  twoPointer() {
    const t = new Tracer(), a = this._sorted(t), N = a.length, found = [];
    const snap = (target) => ({ array: a.slice(), target, found: found.slice() });
    for (let i = 0; i < N - 2; i++) {
      let lo = i + 1, hi = N - 1;
      t.step(`fix a[${i}] = ${a[i]}: look for a pair in a[${lo}..${hi}] summing to ${-a[i]}`,
        { snapshot: snap(-a[i]), highlight: { active: [i], pointers: { i, lo, hi } } });
      while (lo < hi) {
        const s = a[i] + a[lo] + a[hi]; t.count("compare");
        const head = `${a[i]} + ${a[lo]} + ${a[hi]} = ${s}`;
        if (s < 0) {
          t.step(`${head} < 0: a[lo] = ${a[lo]} is too small even with the largest partner left, so lo++`,
            { snapshot: snap(-a[i]), highlight: { active: [i], compare: [lo, hi], pointers: { i, lo, hi } } });
          lo++;
        } else if (s > 0) {
          t.step(`${head} > 0: a[hi] = ${a[hi]} is too large even with the smallest partner left, so hi--`,
            { snapshot: snap(-a[i]), highlight: { active: [i], compare: [lo, hi], pointers: { i, lo, hi } } });
          hi--;
        } else {
          found.push([a[i], a[lo], a[hi]]);
          t.step(`${head}: triple (${a[i]}, ${a[lo]}, ${a[hi]}) counted; values are distinct, so retire both: lo++, hi--`,
            { snapshot: snap(-a[i]), highlight: { done: [i, lo, hi], pointers: { i, lo, hi } } });
          lo++; hi--;
        }
      }
      t.step(`lo and hi have met: every pair with a[${i}] = ${a[i]} is decided`,
        { snapshot: snap(-a[i]), highlight: { active: [i] } });
    }
    t.step(`done: ${found.length} triple${found.length === 1 ? "" : "s"}; each i takes at most N − i − 2 tests`,
      { snapshot: snap(null), highlight: {} });
    return t.trace();
  }

  // ---- untraced references (the tests compare the traced counters against these) ----
  countBrute() {
    const a = this.a, N = a.length; let c = 0;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) for (let k = j + 1; k < N; k++) if (a[i] + a[j] + a[k] === 0) c++;
    return c;
  }
  countBsearch() {
    const a = this.a.slice().sort((x, y) => x - y), N = a.length; let c = 0, probes = 0;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const x = -(a[i] + a[j]); let lo = 0, hi = N - 1, at = -1;
      while (lo <= hi) { probes++; const m = (lo + hi) >> 1; if (x < a[m]) hi = m - 1; else if (x > a[m]) lo = m + 1; else { at = m; break; } }
      if (at > j) c++;
    }
    return { triples: c, compares: probes };
  }
  countTwoPointer() {
    const a = this.a.slice().sort((x, y) => x - y), N = a.length; let c = 0, tests = 0;
    for (let i = 0; i < N - 2; i++) {
      let lo = i + 1, hi = N - 1;
      while (lo < hi) { tests++; const s = a[i] + a[lo] + a[hi]; if (s < 0) lo++; else if (s > 0) hi--; else { c++; lo++; hi--; } }
    }
    return { triples: c, compares: tests };
  }
}
