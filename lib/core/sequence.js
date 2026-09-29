// CSS 343 unified library — core/sequence.js
// A "build sequence" mini-language for FullDemo's editable initial box. Either
// a plain number list ("10,20,30", as before), a compact range spec:
//
//   START..STOP[:STEP][:ORDER]     ORDER in {ASC, DESC, RAND, ZIG, ZAG} (default ASC)
//
//   "1..50"           1,2,3,…,50
//   "1..50:5"         1,6,11,…,46
//   "1..50:ZIG"       step defaults to 1; ZIG order
//   "1..50:5:RAND"    step 5, shuffled
//
// …or an EXPLICIT list, which may carry an order of its own:
//
//   "(2,5,7,13,15)"        those five values, as typed
//   "(2,5,7,13,15):RAND"   the same five, shuffled
//
// (A bare "2,5,7,13,15" also works and is the older spelling; the parenthesized
// form exists so an order flag has something unambiguous to attach to.)
//
// ZIG interleaves from both ENDS inward:    1..10 → 1,10,2,9,3,8,4,7,5,6
// ZAG interleaves from the MIDDLE outward:  1..10 → 5,6,4,7,3,8,2,9,1,10
//
// …or a GRAPH GENERATOR for the edge-list demos (emits a flat number list the
// graph structures read as "u v" pairs — or "u v w" triples with the W flag,
// weights deterministic so a build is reproducible):
//
//   PATH:n · RING:n · STAR:n · COMPLETE:n · RAND:n:m     (n vertices ≤ 8; RAND: m edges)
//   append :W for weighted triples — "RING:8:W", "RAND:8:12:W"
//
//   "PATH:5"     0 1, 1 2, 2 3, 3 4          "STAR:5"  0 1, 0 2, 0 3, 0 4
//   "RING:5"     PATH:5 + 4 0 (a cycle — topo sort reports it)
//   "COMPLETE:4" every pair i<j              "RAND:8:12" 12 distinct edges, seeded
//
// …and any of those may be WRAPPED IN A BUILD METHOD, for the structures that
// can be built more than one way:
//
//   "INSERT(1..100:4:RAND)"   "HEAPIFY(50, 30, 70)"   "HEAPIFY(1..31)"
//
// The wrapper names the method; the inside is an ordinary build string.
// parseSequence ignores the wrapper and returns the keys either way, so a
// stray method on a demo that has only one build path costs nothing;
// parseMethod reads the name, and the demo's buildAll decides what it means.

const ORDERS = new Set(["ASC", "DESC", "RAND", "ZIG", "ZAG"]);
const RANGE_RE = /^(-?\d+)\s*\.\.\s*(-?\d+)\s*(?::\s*([^:\s]+))?\s*(?::\s*([^:\s]+))?$/;
// an explicit list, optionally ordered: "(2,5,7,13)" · "(2,5,7,13):RAND"
const LIST_RE = /^\(([^()]*)\)\s*(?::\s*([A-Za-z]+))?$/;

function zig(a) {
  const out = []; let lo = 0, hi = a.length - 1;
  while (lo <= hi) { out.push(a[lo++]); if (lo <= hi) out.push(a[hi--]); }
  return out;
}

function zag(a) {
  const n = a.length, out = [];
  let lo = Math.floor((n - 1) / 2), hi = lo + 1;
  if (n % 2 === 1) { out.push(a[lo]); lo--; } // odd count: the one true middle goes first
  while (lo >= 0 || hi < n) {
    if (lo >= 0) out.push(a[lo--]);
    if (hi < n) out.push(a[hi++]);
  }
  return out;
}

function shuffle(a) {
  // SEEDED (like the graph generator's weights): the same range spec yields
  // the same "random" order on every load, so a narrated build reproduces
  const b = a.slice();
  let s = (0x343 + b.length * 2654435761) >>> 0;   // seed varies with the range length
  const rnd = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ---- graph generators ---------------------------------------------------
const GEN_NAMES = new Set(["PATH", "RING", "STAR", "COMPLETE", "RAND"]);
const weightOf = (u, v) => ((u * 7 + v * 3) % 9) + 1; // deterministic edge weight 1..9

function generateGraph(name, args, weighted) {
  const n = Math.max(2, Math.min(args[0] ?? 8, 8)); // the shared layouts have 8 fixed vertices
  const edges = [];
  if (name === "PATH" || name === "RING") {
    for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
    if (name === "RING") edges.push([n - 1, 0]);
  } else if (name === "STAR") {
    for (let i = 1; i < n; i++) edges.push([0, i]);
  } else if (name === "COMPLETE") {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
  } else if (name === "RAND") {
    const m = Math.max(1, Math.min(args[1] ?? n + 2, (n * (n - 1)) / 2));
    let seed = n * 31 + m * 7 + 13; // fixed seed → same graph every Build
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const seen = new Set();
    while (edges.length < m) {
      const u = Math.floor(rnd() * n), v = Math.floor(rnd() * n);
      const [a, b] = u < v ? [u, v] : [v, u];
      const k = `${a}-${b}`;
      if (a !== b && !seen.has(k)) { seen.add(k); edges.push([a, b]); }
    }
  }
  return edges.flatMap(([u, v]) => (weighted ? [u, v, weightOf(u, v)] : [u, v]));
}

// METHOD(keys) — the build-method wrapper. The name is deliberately loose
// (any identifier): validating it belongs to the demo that knows its own
// methods, which can then say so in a trace frame instead of silently
// building the wrong way.
const CALL_RE = /^([A-Za-z][A-Za-z0-9_-]*)\s*\(([\s\S]*)\)$/;

/** The build METHOD a build string names, lower-cased — or null for a bare
 *  string. Only demos with more than one way to build (the heap: insert vs
 *  heapify) look at it. */
export function parseMethod(input) {
  const m = String(input ?? "").trim().match(CALL_RE);
  return m ? m[1].toLowerCase() : null;
}

/** parseCall — the method name AND its raw inner text, for build methods whose
 *  argument is NOT a number list: TEXT(the quick brown fox), SYM-FRQ(a:20, b:17),
 *  SYM-RAND(a..h). `parseSequence` would throw those away, so a structure that
 *  wants the characters reads them here instead. Returns null for a bare string.
 *  @returns {{name:string, arg:string}|null} */
export function parseCall(input) {
  const m = String(input ?? "").trim().match(CALL_RE);
  return m ? { name: m[1].toLowerCase(), arg: m[2] } : null;
}

/** Parse a build-sequence string into an array of numbers
 *  (graph generator, range spec, or plain list), ignoring any METHOD(…) wrapper. */
export function parseSequence(input) {
  const outer = String(input ?? "").trim();
  const call = outer.match(CALL_RE);
  const s = call ? call[2].trim() : outer;

  const toks = s.split(":").map((t) => t.trim());
  const gname = toks[0].toUpperCase();
  if (GEN_NAMES.has(gname)) {
    const weighted = toks[toks.length - 1].toUpperCase() === "W";
    const args = toks.slice(1, weighted ? -1 : undefined).map(Number).filter(Number.isFinite);
    return generateGraph(gname, args, weighted);
  }

  // An EXPLICIT list may carry an order too: "(2,5,7,13):RAND". Without this
  // the bare-number fallback below would silently drop the ":RAND" and return
  // the values as typed, which reads as "the order flag did nothing".
  const lm = s.match(LIST_RE);
  if (lm) return applyOrder((lm[1].match(/-?\d+/g) || []).map(Number), lm[2]);

  const m = s.match(RANGE_RE);
  if (!m) return (s.match(/-?\d+/g) || []).map(Number);

  const start = Number(m[1]), stop = Number(m[2]);
  let step = 1, order = "ASC";
  [m[3], m[4]].forEach((tok) => {
    if (!tok) return;
    const up = tok.toUpperCase();
    if (ORDERS.has(up)) order = up;
    else { const n = Number(tok); if (Number.isFinite(n) && n > 0) step = n; }
  });

  const out = [];
  if (step > 0 && start <= stop) for (let v = start; v <= stop; v += step) out.push(v);

  return applyOrder(out, order);
}

/** Reorder a value list by an ORDER token. Unknown/absent tokens leave it alone,
 *  so a typo degrades to ASC rather than throwing mid-build. */
function applyOrder(arr, order) {
  switch (String(order ?? "").toUpperCase()) {
    case "DESC": return arr.slice().reverse();
    case "RAND": return shuffle(arr);
    case "ZIG": return zig(arr);
    case "ZAG": return zag(arr);
    default: return arr;
  }
}

/** Expand the string-repeat shorthand: "A^11B" → "AAAAAAAAAAAB",
 *  "(AB)^6C" → "ABABABABABABC". A trick in the spirit of the numeric range
 *  syntax, for the text demos (KMP's adversarial inputs, long LCS words, NFA
 *  match strings) where typing 12 A's by hand is the barrier. Each repeat
 *  count is capped; the caller applies its own overall length cap after. */
export function expandRepeats(input, cap = 64) {
  let s = String(input ?? "");
  for (let round = 0; round < 4; round++) { // a few rounds so (A^2B)^3-style nesting resolves
    const next = s
      .replace(/\(([^()]*)\)\^(\d+)/g, (_, g, k) => g.repeat(Math.min(+k, cap)))
      .replace(/([^^()])\^(\d+)/g, (_, c, k) => c.repeat(Math.min(+k, cap)));
    if (next === s) break;
    s = next;
  }
  return s;
}
