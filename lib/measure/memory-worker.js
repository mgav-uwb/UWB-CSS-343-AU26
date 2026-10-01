// CSS 343 · memory-hierarchy measurements, run in a Web Worker so the page
// stays responsive. The same experiments as code/measure/
// latency.cpp and locality.cpp, written with typed arrays.
//
// Messages in:  { cmd: "latency", sizes: [bytes...], steps }
//               { cmd: "matrix", n }
//               { cmd: "list", nodes }
// Messages out: { type: "point", bytes, ns }       one per latency size
//               { type: "result", ...fields }      at the end of each experiment
//               { type: "status", text }           progress
//               { type: "error", text }

let seed = 2463534242;                          // xorshift32: the same sequence everywhere
const rand = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed; };

// Sattolo's shuffle of 0..n-1: the result, read as next[i], is ONE cycle
// through all n slots, so following it visits every slot before repeating.
function singleCycle(n) {
  const next = new Uint32Array(n);
  for (let i = 0; i < n; i++) next[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = rand() % i;
    const t = next[i]; next[i] = next[j]; next[j] = t;
  }
  return next;
}

function chase(next, steps) {                    // dependent reads: p = next[p]
  let p = 0;
  for (let k = 0; k < steps; k++) p = next[p];
  return p;
}

function latency({ sizes, steps }) {
  chase(singleCycle(1024), 2e6);                 // let the JIT compile chase() first
  let sink = 0;
  for (const bytes of sizes) {
    postMessage({ type: "status", text: `building a random cycle through ${label(bytes)}` });
    const next = singleCycle(bytes / 4);
    sink += chase(next, next.length);            // warm up: touch every slot once
    postMessage({ type: "status", text: `chasing pointers through ${label(bytes)}` });
    const t0 = performance.now();
    sink += chase(next, steps);
    const ns = (performance.now() - t0) * 1e6 / steps;
    postMessage({ type: "point", bytes, ns });
  }
  postMessage({ type: "result", exp: "latency", sink });
}

function sumRows(m, n) { let s = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += m[r * n + c]; return s; }
function sumCols(m, n) { let s = 0; for (let c = 0; c < n; c++) for (let r = 0; r < n; r++) s += m[r * n + c]; return s; }

function matrix({ n }) {
  postMessage({ type: "status", text: `filling a ${n} x ${n} matrix` });
  const m = new Int32Array(n * n);
  for (let i = 0; i < m.length; i++) m[i] = i % 7;
  const w = new Int32Array(64 * 64);              // compile both loops on a small matrix first
  sumRows(w, 64); sumCols(w, 64);
  // three runs of each, alternating, keeping the fastest: the row loop is
  // short enough that a single run is at the mercy of other activity
  let tr = Infinity, tc = Infinity, sr = 0, sc = 0;
  for (let rep = 1; rep <= 3; rep++) {
    postMessage({ type: "status", text: `summing by rows (run ${rep} of 3)` });
    let t0 = performance.now(); sr = sumRows(m, n); tr = Math.min(tr, performance.now() - t0);
    postMessage({ type: "status", text: `summing by columns (run ${rep} of 3)` });
    t0 = performance.now(); sc = sumCols(m, n); tc = Math.min(tc, performance.now() - t0);
  }
  postMessage({ type: "result", exp: "matrix", n, adds: n * n, rowsMs: tr, colsMs: tc, sumRows: sr, sumCols: sc });
}

// A linked list stored as an array of 2-int nodes: node k is (value, next) at
// slots 2k and 2k + 1, 8 bytes per node, and next is a node index (-1 ends).
// "In order" links node k to node k + 1, so the walk moves forward through
// memory; "scattered" links the same nodes in a shuffled order.
function walk(nodes, head) { let s = 0; for (let p = head; p !== -1; p = nodes[2 * p + 1]) s += nodes[2 * p]; return s; }
function link(nodes, order) {
  for (let k = 0; k + 1 < order.length; k++) nodes[2 * order[k] + 1] = order[k + 1];
  nodes[2 * order[order.length - 1] + 1] = -1;
  return order[0];
}

function list({ nodes: N }) {
  postMessage({ type: "status", text: `allocating ${N.toLocaleString()} nodes` });
  const nodes = new Int32Array(2 * N);
  const order = new Int32Array(N);
  for (let k = 0; k < N; k++) { nodes[2 * k] = k % 7; order[k] = k; }
  const w = new Int32Array(2 * 64), wo = new Int32Array(64).map((_, i) => i);
  walk(w, link(w, wo));                            // compile walk() first
  let head = link(nodes, order);
  let ts = Infinity, tx = Infinity, s1 = 0, s2 = 0;
  for (let rep = 1; rep <= 3; rep++) {             // fastest of three walks
    postMessage({ type: "status", text: `walking the list in memory order (run ${rep} of 3)` });
    const t0 = performance.now(); s1 = walk(nodes, head); ts = Math.min(ts, performance.now() - t0);
  }
  postMessage({ type: "status", text: "shuffling the links" });
  for (let i = N - 1; i > 0; i--) { const j = rand() % (i + 1); const t = order[i]; order[i] = order[j]; order[j] = t; }
  head = link(nodes, order);
  for (let rep = 1; rep <= 3; rep++) {
    postMessage({ type: "status", text: `walking the scattered list (run ${rep} of 3)` });
    const t0 = performance.now(); s2 = walk(nodes, head); tx = Math.min(tx, performance.now() - t0);
  }
  postMessage({ type: "result", exp: "list", nodes: N, adds: N, orderMs: ts, scatterMs: tx, sum1: s1, sum2: s2 });
}

function label(bytes) { return bytes < (1 << 20) ? `${bytes >> 10} KiB` : `${bytes >> 20} MiB`; }

onmessage = (e) => {
  try {
    const m = e.data;
    if (m.cmd === "latency") latency(m);
    else if (m.cmd === "matrix") matrix(m);
    else if (m.cmd === "list") list(m);
  } catch (err) {
    postMessage({ type: "error", text: String(err && err.message || err) });
  }
};
