// CSS 343 · doubling-worker.js: the three 3-sum algorithms, instrumented and timed,
// for doubling.html. Runs off the main thread so the page stays responsive.
//
// Message in:  { alg: "brute" | "bsearch" | "twoptr", sizes: [N, …], budget: seconds }
// Messages out: { type: "row", alg, N, ops, triples, ms, runs }  per size
//               { type: "skip", alg, N, predicted }               when the next size would exceed the budget
//               { type: "done", alg }
//
// ops is the EXACT count of the inner operation, deterministic for a given array:
//   brute   : triples tested (the inner-loop test)       = N(N−1)(N−2)/6
//   bsearch : binary-search probes (one per loop pass)   ≤ (N(N−1)/2)(⌊lg N⌋ + 1)
//   twoptr  : pointer-loop iterations (one compare each) ≤ (N−1)(N−2)/2
// The arrays are distinct random integers in [−1,000,000, 1,000,000] from a
// fixed seed, so every visitor gets the same arrays and the same counts.

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// one pool of distinct values; size N uses its first N entries (as twopointer.cpp does)
function distinctPool(n) {
  const rnd = mulberry32(343), seen = new Set(), out = new Int32Array(n);
  let k = 0;
  while (k < n) {
    const v = Math.floor(rnd() * 2000001) - 1000000;
    if (!seen.has(v)) { seen.add(v); out[k++] = v; }
  }
  return out;
}

function brute(a) {
  const N = a.length; let ops = 0, cnt = 0;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      for (let k = j + 1; k < N; k++) { ops++; if (a[i] + a[j] + a[k] === 0) cnt++; }
  return { ops, triples: cnt };
}

function bsearch(a0) {
  const a = Int32Array.from(a0).sort(), N = a.length; let ops = 0, cnt = 0;
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const x = -(a[i] + a[j]); let lo = 0, hi = N - 1, at = -1;
      while (lo <= hi) {
        ops++;
        const mid = (lo + hi) >> 1;
        if (x < a[mid]) hi = mid - 1; else if (x > a[mid]) lo = mid + 1; else { at = mid; break; }
      }
      if (at > j) cnt++;
    }
  return { ops, triples: cnt };
}

function twoptr(a0) {
  const a = Int32Array.from(a0).sort(), N = a.length; let ops = 0, cnt = 0;
  for (let i = 0; i < N; i++) {
    let lo = i + 1, hi = N - 1;
    while (lo < hi) {
      ops++;
      const s = a[i] + a[lo] + a[hi];
      if (s < 0) lo++; else if (s > 0) hi--; else { cnt++; lo++; hi--; }
    }
  }
  return { ops, triples: cnt };
}

const ALGS = { brute, bsearch, twoptr };
let pool = null;

onmessage = (e) => {
  const { alg, sizes, budget } = e.data;
  const f = ALGS[alg];
  const maxN = Math.max(...sizes);
  if (!pool || pool.length < maxN) pool = distinctPool(Math.max(maxN, 16000));
  let lastMs = 0, lastN = 0;
  for (let w = 0; w < 3; w++) f(pool.subarray(0, 200));   // warm up: let the JIT compile the loops before timing
  // the order of growth each algorithm is expected to show, used only to skip a size that would run too long
  const growth = { brute: 8, bsearch: 4.5, twoptr: 4 }[alg];
  for (const N of sizes) {
    const predicted = lastN ? lastMs * (N / lastN) ** Math.log2(growth) / 1000 : 0;   // seconds
    if (predicted > budget) { postMessage({ type: "skip", alg, N, predicted }); continue; }
    const a = pool.subarray(0, N);
    // one timing = repeat the run until at least 100 ms have passed, report the mean
    // (a single sub-millisecond run is below the timer's resolution); best of 3 timings
    let best = Infinity, res = null, runs = 0;
    for (let rep = 0; rep < 3; rep++) {
      let reps = 0; const t0 = performance.now(), deadline = t0 + 100;
      do { res = f(a); reps++; } while (performance.now() < deadline);
      const ms = (performance.now() - t0) / reps;
      best = Math.min(best, ms); runs += reps;
      if (ms > 400) break;                        // a long run: one timing is enough
    }
    postMessage({ type: "row", alg, N, ops: res.ops, triples: res.triples, ms: best, runs });
    lastMs = best; lastN = N;
  }
  postMessage({ type: "done", alg });
};

// exported for the Node test (the worker global has no module system)
if (typeof module !== "undefined") module.exports = { brute, bsearch, twoptr, distinctPool };
