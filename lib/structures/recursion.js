// CSS 343 unified library: structures/recursion.js
// RECURSION, shown rather than computed. Each traced run records two views of
// the same execution in every frame:
//
//   tree    every call made so far (a node per call, an edge per call site),
//           with each call's result written into its node as it returns
//   stack   the calls that are open right now, bottom first: the running
//           frame on top, the frames waiting on it underneath
//
// The tree is the whole history; the stack is one root-to-node path of it.
// That sentence is what these demos exist to make visible, so the answer the
// algorithm computes is incidental: inputs are small and the traces are long.
//
// The call tree is built in full before the run, with every node a GHOST
// (laid out but not drawn), and a node is revealed when its call is made. The
// layout therefore never shifts as the tree grows.
//
// Snapshot contract: { tree, stack, legend, maxDepth }. TreeRenderer reads
// `tree`, StackRenderer reads the rest. Node keys are unique ids; highlights
// key by them, never by the numbers shown.

import { Tracer } from "../core/tracer.js";

export const REC_LIMITS = {
  factDraw: 8,     // deepest factorial chain that is drawn
  factExact: 18,   // 18! is the largest factorial a double holds exactly
  leafDraw: 48,    // widest k-sum tree that is drawn (leaf slots)
  nMax: 12,        // longest k-sum array accepted at all
};

const cloneTree = (x) => (x ? { ...x, kids: (x.kids || []).map(cloneTree) } : null);
const tuple = (xs) => `(${xs.join(", ")})`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** n choose k, exact for the sizes used here */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return Math.round(c);
}

/** Read a list of integers typed by a person. Tokens are separated by commas,
 *  semicolons or white space; a token is kept only if it is a whole integer.
 *  "3.5" and "abc" are DROPPED and reported, never cut into digits, and the
 *  minus signs a word processor substitutes (\u2212, \u2013, \u2014) count as "-".
 *  Returns { values, dropped }. */
export function readInts(text) {
  const values = [], dropped = [];
  String(text ?? "").split(/[\s,;]+/).filter(Boolean).forEach((tok) => {
    const t = tok.replace(/^[\u2212\u2013\u2014]/, "-");
    if (/^[+-]?\d+$/.test(t) && Number.isSafeInteger(Number(t))) values.push(Number(t));
    else dropped.push(tok);
  });
  return { values, dropped };
}
/** the integers alone: "3, -1, 0 4" -> [3, -1, 0, 4] */
export function parseInts(text) { return readInts(text).values; }

/** an array stays as it is; text is read with readInts, keeping what was dropped */
function intake(a) {
  if (Array.isArray(a)) return { values: a.map((v) => Math.trunc(v)), note: "" };
  const { values, dropped } = readInts(a);
  return { values, note: dropped.length ? `ignored ${dropped.map((d) => `"${d}"`).join(", ")}: not ${dropped.length === 1 ? "an integer" : "integers"}. ` : "" };
}

export class Recursion {
  /** @param {{kind?:"factorial"|"ksum"|"loops", n?:number, a?:number[], k?:number, target?:number}} [preview]
   *  what the opening frame shows before anything has run: the root call alone */
  constructor(preview = {}) {
    this.root = null; this.legend = ""; this.summary = ""; this.maxDepth = 0;
    if (preview.kind === "factorial") {
      const n = Recursion.clampFact(preview.n ?? 5);
      this.root = { key: "f0", label: String(n), value: "", kids: [] };
      this.legend = "factorial(n)";
    } else if (preview.kind === "ksum") {
      this.root = { key: "c0", label: "\u2205", value: "", kids: [] };
      this.legend = "countK(start, k, target)";
    } else if (preview.kind === "loops") {
      this.root = { key: "c0", label: "\u2205", kids: [] };
      this.legend = "count3(a)";
    }
  }

  snapshot() { return { tree: cloneTree(this.root), stack: [], legend: this.legend, maxDepth: this.maxDepth }; }
  inorder() { return this.summary; }

  // ── untraced references: what the tests and the slides' numbers come from ──

  static clampFact(n) { n = Math.trunc(Number(n)); return Number.isFinite(n) ? n : 5; }
  /** is this something a person could have meant as n? ("", "abc", "2.5" are not) */
  static isInt(n) { return typeof n === "number" ? Number.isInteger(n) : /^\s*[+-]?\d+\s*$/.test(String(n ?? "")); }

  /** factorial by the same code the demo traces: { value, calls, multiplies, depth } */
  static factorial(n) {
    let calls = 0, multiplies = 0;
    const f = (m) => { calls++; if (m <= 1) return 1; const r = f(m - 1); multiplies++; return m * r; };
    const value = f(n);
    return { value, calls, multiplies, depth: calls };
  }

  /** countK by the code on the slide: { count, checks, calls, depth, hits } */
  static countK(a, k, target) {
    let checks = 0, calls = 0, depth = 0;
    const hits = [];
    const go = (start, kk, tgt, picked) => {
      calls++; depth = Math.max(depth, picked.length + 1);
      if (kk === 0) { checks++; if (tgt === 0) hits.push(picked); return tgt === 0 ? 1 : 0; }
      let cnt = 0;
      for (let i = start; i < a.length; i++) cnt += go(i + 1, kk - 1, tgt - a[i], picked.concat(a[i]));
      return cnt;
    };
    const count = go(0, k, target, []);
    return { count, checks, calls, depth, hits };
  }

  /** count3 by the triple loop on the slide: { count, checks, hits } */
  static count3(a, target = 0) {
    let checks = 0, count = 0; const hits = [];
    const n = a.length;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        for (let k = j + 1; k < n; k++) {
          checks++;
          if (a[i] + a[j] + a[k] === target) { count++; hits.push([a[i], a[j], a[k]]); }
        }
    return { count, checks, hits };
  }

  /** leaf slots the k-sum call tree needs when drawn (nodes with no children) */
  static leafSlots(n, k) {
    const go = (rem, kk) => {
      if (kk === 0) return 1;
      if (rem === 0) return 2;               // a dead-end call is drawn two slots wide
      let s = 0;
      for (let i = 0; i < rem; i++) s += go(rem - i - 1, kk - 1);
      return s;
    };
    return go(n, k);
  }

  // ── shared trace machinery ──

  _begin(legend) {
    const t = new Tracer();
    const stack = [];
    const self = this;
    this.legend = legend; this.maxDepth = 0;
    const api = {
      t, stack, hits: [],
      snap: () => ({
        tree: cloneTree(self.root),
        stack: stack.map((f) => ({ title: f.title, lines: f.lines.slice(), state: f.state })),
        legend, maxDepth: self.maxDepth,
      }),
      hl: (extra = {}) => {
        const keys = stack.map((f) => f.node.key);
        return { path: keys.slice(0, -1), cur: keys.slice(-1), best: api.hits.slice(), ...extra };
      },
      step: (msg, extra) => t.step(msg, { snapshot: api.snap(), highlight: api.hl(extra) }),
      push: (node, title, lines) => {
        stack.forEach((f) => { f.state = "wait"; });
        stack.push({ node, title, lines: lines.slice(), state: "run" });
        self.maxDepth = Math.max(self.maxDepth, stack.length);
        node.ghost = false;
        t.count("call");
      },
      pop: () => { stack.pop(); if (stack.length) stack[stack.length - 1].state = "run"; },
      top: () => stack[stack.length - 1],
    };
    return api;
  }

  /** one frame that states the exact result of a run too large to draw */
  _tooLarge(msg) {
    const t = new Tracer();
    this.summary = msg;
    t.step(msg, { snapshot: this.snapshot(), highlight: {} });
    return t.trace();
  }

  // ── factorial ──

  factorial(n = 5) {
    if (!Recursion.isInt(n)) {
      this.root = { key: "f0", label: "?", value: "", kids: [] };
      return this._tooLarge(`n must be a whole number; "${String(n ?? "").trim()}" is not one. Try n from 0 to ${REC_LIMITS.factDraw}`);
    }
    n = Recursion.clampFact(n);
    if (n > REC_LIMITS.factDraw) {
      this.root = { key: "f0", label: String(n), value: "", kids: [] };
      if (n > REC_LIMITS.factExact)
        return this._tooLarge(`factorial(${n}) makes ${n} calls and its stack is ${n} frames deep, but the value no longer fits the number type exactly. Try n from 0 to ${REC_LIMITS.factDraw} to watch it run`);
      const r = Recursion.factorial(n);
      this.root.value = r.value;
      return this._tooLarge(`factorial(${n}) = ${r.value}: ${r.calls} calls, a stack ${r.depth} frames deep, ${r.multiplies} multiplications. The demo draws n up to ${REC_LIMITS.factDraw}`);
    }

    // the whole chain, ghosted: factorial(n) calls factorial(n-1) … down to the base case
    const chain = [];
    for (let m = n; m >= Math.min(n, 1); m--) chain.push({ key: `f${chain.length}`, label: String(m), n: m, value: "", ghost: true, kids: [] });
    for (let i = 0; i + 1 < chain.length; i++) chain[i].kids.push(chain[i + 1]);
    this.root = chain[0];
    this.root.ghost = false;

    const x = this._begin("factorial(n)");
    const { t } = x;
    x.step(`factorial(${n}): the tree will hold every call that is made, the stack the calls that are open`);

    const run = (node) => {
      const m = node.n;
      x.push(node, `factorial(${m})`, [`n = ${m}`]);
      x.step(`call factorial(${m}): a new frame is pushed, with its own n = ${m}`);
      t.count("compare");
      if (m <= 1) {
        x.top().lines = [`n = ${m}`, `${m} <= 1: base case`];
        x.step(`is n <= 1? ${m} <= 1 is true: the base case, answered without another call`);
        node.value = 1;
        x.top().state = "return"; x.top().lines = [`n = ${m}`, "returns 1"];
        x.step(`factorial(${m}) returns 1; its frame is about to be popped`);
        x.pop();
        return 1;
      }
      x.top().lines = [`n = ${m}`, `${m} <= 1: no`];
      x.step(`is n <= 1? ${m} <= 1 is false: the recursive case`);
      x.top().lines = [`n = ${m}`, `${m} * factorial(${m - 1}) = ?`];
      x.step(`factorial(${m}) needs factorial(${m - 1}) before it can multiply, so it calls it and waits`);
      const r = run(node.kids[0]);
      t.count("multiply");
      x.top().lines = [`n = ${m}`, `${m} * ${r} = ${m * r}`];
      x.step(`back in factorial(${m}): the call returned ${r}, so ${m} * ${r} = ${m * r}`);
      node.value = m * r;
      x.top().state = "return"; x.top().lines = [`n = ${m}`, `returns ${m * r}`];
      x.step(`factorial(${m}) returns ${m * r}; its frame is about to be popped`);
      x.pop();
      return m * r;
    };
    const value = run(this.root);
    const ref = Recursion.factorial(n);
    this.summary = `factorial(${n}) = ${value}: ${plural(ref.calls, "call", "calls")}, stack ${ref.depth} deep, ${plural(ref.multiplies, "multiplication", "multiplications")}`;
    x.step(`done: factorial(${n}) = ${value}. ${plural(ref.calls, "call", "calls")}, and the stack was ${plural(ref.depth, "frame", "frames")} deep at the base case. Every multiplication happened on the way back up`,
      { path: [], cur: [], done: chain.map((c) => c.key) });
    return t.trace();
  }

  // ── k-sum: the recursion ──

  _kTree(a, k, target, loops) {
    let id = 0;
    const spacer = () => ({ key: `s${id++}`, label: "", ghost: true, spacer: true, kids: [] });
    const build = (start, kk, tgt, edge, picked) => {
      const node = { key: `c${id++}`, start, k: kk, target: tgt, picked, ghost: true, kids: [] };
      // a node shows the element its call was made FOR, so a path from the
      // root reads as the choice made so far; the root has picked nothing
      node.label = edge == null ? "\u2205" : String(edge);
      if (kk > 0) {
        if (!loops) node.value = "";          // an internal call has a count to report
        for (let i = start; i < a.length; i++) node.kids.push(build(i + 1, kk - 1, tgt - a[i], a[i], picked.concat(a[i])));
        // a call with nothing left to pick has no children, and its two-cell
        // node is wider than one leaf slot: two SPACERS (ghosts that are never
        // revealed) reserve the room, so neighbours do not overlap
        if (!node.kids.length && !loops) node.kids.push(spacer(), spacer());
      }
      return node;
    };
    const root = build(0, k, target, null, []);
    root.ghost = false;
    return root;
  }

  _checkInput(a, k, what) {
    if (!a.length) return `${what} needs at least one integer in the array`;
    if (a.length > REC_LIMITS.nMax) return `${what} accepts up to ${REC_LIMITS.nMax} integers; this array has ${a.length}`;
    if (!Number.isFinite(k)) return `k must be a whole number from 0 to ${a.length}, the length of the array`;
    if (k < 0 || k > a.length) return `k must be from 0 to ${a.length}, the length of the array; ${k} of ${a.length} cannot be chosen`;
    return "";
  }

  /** the paths to draw green at the end: every node from the root to each hit leaf */
  _bestPaths(root, hitKeys) {
    const out = new Set(); const want = new Set(hitKeys);
    (function walk(node, path) {
      const here = path.concat(node.key);
      if (want.has(node.key)) here.forEach((key) => out.add(key));
      node.kids.forEach((c) => walk(c, here));
    })(root, []);   // spacers are never hits, so they never join a path
    return [...out];
  }

  kSum(a = [-3, -1, 0, 1, 4], k = 3, target = 0) {
    const read = intake(a); a = read.values;
    k = Math.trunc(Number(k)); target = Math.trunc(Number(target)) || 0;
    const bad = this._checkInput(a, k, "k-sum");
    if (bad) { this.root = { key: "c0", label: "\u2205", value: "", kids: [] }; return this._tooLarge(read.note + bad); }
    const ref = Recursion.countK(a, k, target);
    const slots = Recursion.leafSlots(a.length, k);
    if (slots > REC_LIMITS.leafDraw) {
      this.root = { key: "c0", label: "\u2205", value: ref.count, kids: [] };
      return this._tooLarge(`${read.note}countK found ${plural(ref.count, "way", "ways")} with ${plural(ref.checks, "check", "checks")} and ${plural(ref.calls, "call", "calls")}, on a stack ${ref.depth} deep. That tree has ${slots} leaves, too many to draw: try fewer integers or a smaller k`);
    }

    this.root = this._kTree(a, k, target, false);
    const x = this._begin("countK(start, k, target)");
    const { t } = x;
    const n = a.length;
    x.step(`${read.note}count the ways to choose ${k} of ${tuple(a)} that sum to ${target}. A node is an element picked, so a path from the root is a choice; the root has picked nothing`);

    const run = (node) => {
      const { start, k: kk, target: tgt, picked } = node;
      const title = `countK(${start}, ${kk}, ${tgt})`;
      x.push(node, title, [picked.length ? `picked ${tuple(picked)}` : "picked nothing yet"]);
      x.step(`call ${title}: a frame is pushed${picked.length ? `, ${tuple(picked)} picked so far` : ""}`);
      t.count("compare");
      if (kk === 0) {
        t.count("check");
        const hit = tgt === 0;
        x.top().lines = [`picked ${tuple(picked)}`, hit ? "target == 0: yes" : `target == 0: no`];
        if (hit) x.hits.push(node.key);
        x.step(`k == 0: nothing is left to pick, so ${tuple(picked)} is a complete choice. Is target == 0? ${hit ? "yes, it sums to " + target : `no, ${tgt} is left over`}`);
        x.top().state = "return"; x.top().lines = [`picked ${tuple(picked)}`, `returns ${hit ? 1 : 0}`];
        x.step(`${title} returns ${hit ? 1 : 0}; its frame is about to be popped`);
        x.pop();
        return hit ? 1 : 0;
      }
      x.top().lines = [picked.length ? `picked ${tuple(picked)}` : "picked nothing yet", `cnt = 0`];
      if (start >= n) {
        x.step(`k == 0? no, ${plural(kk, "element is", "elements are")} still to be picked. The loop starts at i = ${start}, which is the end of the array, so its body never runs`);
      } else {
        x.step(`k == 0? no, ${plural(kk, "element is", "elements are")} still to be picked: loop i from ${start} to ${n - 1}`);
      }
      let cnt = 0;
      node.kids.filter((c) => !c.spacer).forEach((child, j) => {
        const i = start + j;
        x.top().lines = [`i = ${i}: pick a[${i}] = ${a[i]}`, `cnt = ${cnt}`];
        x.step(`i = ${i}: pick a[${i}] = ${a[i]}, then choose ${kk - 1} more from a[${i + 1}..] summing to ${tgt} - ${a[i] < 0 ? `(${a[i]})` : a[i]} = ${tgt - a[i]}`);
        const r = run(child);
        cnt += r;
        x.top().lines = [`i = ${i}: a[${i}] = ${a[i]} gave ${r}`, `cnt = ${cnt}`];
        x.step(`back in ${title}: that call returned ${r}, so cnt = ${cnt}`);
      });
      node.value = cnt;
      x.top().state = "return"; x.top().lines = [`cnt = ${cnt}`, `returns ${cnt}`];
      x.step(`${title}: the loop is finished, it returns cnt = ${cnt}; its frame is about to be popped`);
      x.pop();
      return cnt;
    };
    const count = run(this.root);

    this.summary = `${plural(count, "way", "ways")}: ${ref.hits.map(tuple).join(", ") || "none"} · ${plural(ref.checks, "check", "checks")} · ${plural(ref.calls, "call", "calls")} · stack ${ref.depth} deep`;
    x.step(`done: ${plural(count, "way", "ways")}${count ? ", " + ref.hits.map(tuple).join(" and ") : ""}. ${plural(ref.checks, "check", "checks")}, one per way of choosing ${k} of ${n}; ${plural(ref.calls, "call", "calls")} in all; the stack was never deeper than ${plural(ref.depth, "frame", "frames")}`,
      { path: [], cur: [], best: this._bestPaths(this.root, x.hits) });
    return t.trace();
  }

  // ── 3-sum: the same tree, walked by three nested loops ──

  threeSumLoops(a = [-3, -1, 0, 1, 4], target = 0) {
    const read = intake(a); a = read.values;
    target = Math.trunc(Number(target)) || 0;
    const bad = this._checkInput(a, Math.min(3, a.length), "3-sum");
    if (bad) { this.root = { key: "c0", label: "\u2205", kids: [] }; return this._tooLarge(read.note + bad); }
    const ref = Recursion.count3(a, target);
    const slots = Recursion.leafSlots(a.length, 3);
    if (slots > REC_LIMITS.leafDraw) {
      this.root = { key: "c0", label: "\u2205", kids: [] };
      return this._tooLarge(`${read.note}count3 found ${plural(ref.count, "triple", "triples")} with ${plural(ref.checks, "check", "checks")}, in one frame. That tree has ${slots} leaves, too many to draw: try fewer integers`);
    }

    this.root = this._kTree(a, 3, target, true);
    const x = this._begin("count3(a)");
    const { t } = x;
    const n = a.length;
    const frame = { node: this.root, title: "count3(a)", lines: ["cnt = 0"], state: "run" };
    x.stack.push(frame); this.maxDepth = 1; t.count("call");
    // the single frame stays put; the position in the tree lives in i, j, k
    const at = (nodes, cur) => ({ path: nodes.map((q) => q.key), cur: cur ? [cur.key] : [], best: x.hits.slice() });
    const show = (msg, nodes, cur) => t.step(msg, { snapshot: x.snap(), highlight: at(nodes, cur) });

    show(`${read.note}count the triples of ${tuple(a)} that sum to ${target}, with three nested loops. A node is an element picked: level 1 is a[i], level 2 is a[j], level 3 is a[k]. One call, one frame`, [], this.root);
    let cnt = 0;
    this.root.kids.forEach((ni, i) => {
      ni.ghost = false;
      frame.lines = [`i = ${i}`, `cnt = ${cnt}`];
      show(`i = ${i}: a[${i}] = ${a[i]} is the first element`, [this.root], ni);
      if (!ni.kids.length) { show(`j would start at ${i + 1}, the end of the array: the j loop does not run`, [this.root], ni); return; }
      ni.kids.forEach((nj, dj) => {
        const j = i + 1 + dj;
        nj.ghost = false;
        frame.lines = [`i = ${i}  j = ${j}`, `cnt = ${cnt}`];
        show(`j = ${j}: a[${j}] = ${a[j]} is the second, sum so far ${a[i] + a[j]}`, [this.root, ni], nj);
        if (!nj.kids.length) { show(`k would start at ${j + 1}, the end of the array: the k loop does not run`, [this.root, ni], nj); return; }
        nj.kids.forEach((nk, dk) => {
          const k = j + 1 + dk;
          nk.ghost = false;
          t.count("check");
          const sum = a[i] + a[j] + a[k];
          const hit = sum === target;
          if (hit) { cnt++; x.hits.push(nk.key); }
          frame.lines = [`i = ${i}  j = ${j}  k = ${k}`, `cnt = ${cnt}`];
          show(`k = ${k}: ${tuple([a[i], a[j], a[k]])} sums to ${sum}. Is it ${target}? ${hit ? `yes, cnt = ${cnt}` : "no"}`, [this.root, ni, nj], nk);
        });
      });
    });
    frame.state = "return"; frame.lines = [`cnt = ${cnt}`, `returns ${cnt}`];
    this.summary = `${plural(cnt, "triple", "triples")}: ${ref.hits.map(tuple).join(", ") || "none"} · ${plural(ref.checks, "check", "checks")} · 1 call · stack 1 deep`;
    t.step(`done: ${plural(cnt, "triple", "triples")}${cnt ? ", " + ref.hits.map(tuple).join(" and ") : ""}. ${plural(ref.checks, "check", "checks")}, the same tree the recursion walks, in one frame: i, j and k hold the position the recursion keeps on its stack`,
      { snapshot: x.snap(), highlight: { path: [], cur: [], best: this._bestPaths(this.root, x.hits) } });
    return t.trace();
  }
}
