// CSS 343 unified library — structures/bst.js
// The (unbalanced) binary search tree as an ORDERED symbol table, implemented
// once and instrumented via the Tracer. Nodes carry subtree size so rank/select
// are O(height). Every op returns a Trace the Player scrubs; snapshots are whole-
// tree clones (demo-sized), so stepping backward is free. Renders with the shared
// TreeRenderer (labels: "size"). Replaces the per-session bst-engine.js.

import { Tracer } from "../core/tracer.js";

const node = (key) => ({ key, left: null, right: null, size: 1 });
const size = (t) => (t ? t.size : 0);
const fixsize = (t) => { if (t) t.size = 1 + size(t.left) + size(t.right); };
const clone = (t) => (t ? { key: t.key, size: t.size, left: clone(t.left), right: clone(t.right) } : null);
const keysOf = (t, o = []) => { if (t) { keysOf(t.left, o); o.push(t.key); keysOf(t.right, o); } return o; };
const sgn = (v) => (v > 0 ? "+" + v : "" + v);

function insSilent(root, key) {
  if (!root) return node(key);
  if (key < root.key) root.left = insSilent(root.left, key);
  else if (key > root.key) root.right = insSilent(root.right, key);
  fixsize(root); return root;
}
function rotRt(y) { const x = y.left; y.left = x.right; x.right = y; fixsize(y); fixsize(x); return x; }
function rotLt(x) { const y = x.right; x.right = y.left; y.left = x; fixsize(x); fixsize(y); return y; }

export class BST {
  constructor() { this.root = null; }
  build(keys) { for (const k of keys) this.root = insSilent(this.root, k); return this; }
  snapshot() { return clone(this.root); }
  inorder() { return keysOf(this.root); }

  /** insert — descend by comparison, attach a leaf (NO rebalancing: a BST can grow tall). */
  insert(key) {
    const t = new Tracer();
    if (!this.root) { this.root = node(key); t.count("alloc").step(`insert ${key}: empty tree → ${key} is the root`, { snapshot: clone(this.root), highlight: { appear: key } }); return t.trace(); }
    const path = []; let cur = this.root;
    while (true) {
      path.push(cur); t.count("compare");
      t.step(`compare ${key} vs ${cur.key} — go ${key < cur.key ? "left" : key > cur.key ? "right" : "(equal)"}`,
        { snapshot: clone(this.root), highlight: { cur: cur.key, path: path.map((p) => p.key) } });
      if (key < cur.key) { if (!cur.left) break; cur = cur.left; }
      else if (key > cur.key) { if (!cur.right) break; cur = cur.right; }
      else { t.step(`${key} already present — a BST holds a set, no change`, { snapshot: clone(this.root), highlight: { danger: key } }); return t.trace(); }
    }
    const leaf = node(key); if (key < cur.key) cur.left = leaf; else cur.right = leaf;
    t.count("alloc").count("link");
    for (let i = path.length - 1; i >= 0; i--) fixsize(path[i]);
    t.step(`insert ${key} as the ${key < cur.key ? "left" : "right"} child of ${cur.key}`, { snapshot: clone(this.root), highlight: { appear: key, path: path.map((p) => p.key) } });
    t.step(`done — ${key} inserted`, { snapshot: clone(this.root), highlight: { done: key } });
    return t.trace();
  }

  /** search — a trace of key comparisons down one root-to-leaf path. */
  search(key) {
    const t = new Tracer(); let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`found ${key} (${path.length} comparison${path.length === 1 ? "" : "s"})`, { snapshot: clone(this.root), highlight: { done: key, path } }); return t.trace(); }
      t.step(`compare ${key} vs ${cur.key} — go ${key < cur.key ? "left" : "right"}`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
      cur = key < cur.key ? cur.left : cur.right;
    }
    t.step(`${key} not found`, { snapshot: clone(this.root), highlight: { path } });
    return t.trace();
  }

  /** Hibbard deletion — leaf/one-child splice, or two-child replace-with-successor. */
  remove(key) {
    const t = new Tracer();
    if (!this.root) { t.step(`remove ${key}: the tree is empty`, { snapshot: null }); return t.trace(); }
    const path = []; let z = this.root;
    while (z && z.key !== key) {
      path.push(z); t.count("compare");
      t.step(`compare ${key} vs ${z.key} — go ${key < z.key ? "left" : "right"}`, { snapshot: clone(this.root), highlight: { cur: z.key, path: path.map((p) => p.key) } });
      z = key < z.key ? z.left : z.right;
    }
    t.count("compare");
    if (!z) { t.step(`${key} not found — nothing to remove`, { snapshot: clone(this.root), highlight: {} }); return t.trace(); }
    path.push(z);
    t.step(`found ${key}`, { snapshot: clone(this.root), highlight: { cur: z.key, path: path.map((p) => p.key) } });

    let victim = z;
    if (z.left && z.right) {
      const spath = [z]; let s = z.right;
      while (s.left) { spath.push(s); s = s.left; }
      t.step(`${z.key} has two children → Hibbard: successor is ${s.key} (smallest in the right subtree)`, { snapshot: clone(this.root), highlight: { cur: s.key, path: path.map((p) => p.key) } });
      z.key = s.key;
      t.step(`copy ${s.key} up into the node, then splice out the old ${s.key}`, { snapshot: clone(this.root), highlight: { cur: z.key } });
      for (let k = 1; k < spath.length; k++) path.push(spath[k]);
      path.push(s); victim = s;
    }
    const child = victim.left || victim.right || null;
    const parent = path.length >= 2 ? path[path.length - 2] : null;
    if (!parent) this.root = child;
    else if (parent.left === victim) parent.left = child; else parent.right = child;
    t.count("link"); path.pop();
    t.step(`remove ${victim.key} — ${child ? "splice in its only child, " + child.key : "it was a leaf"}`, { snapshot: clone(this.root), highlight: child ? { appear: child.key } : {} });
    for (let i = path.length - 1; i >= 0; i--) { fixsize(path[i]); t.count("visit"); }
    t.step(`done — ${key} removed`, { snapshot: clone(this.root), highlight: {} });
    return t.trace();
  }

  min() { return this._edge("min", "left"); }
  max() { return this._edge("max", "right"); }
  _edge(name, dir) {
    const t = new Tracer(); if (!this.root) { t.step(`${name}: empty tree`, { snapshot: null }); return t.trace(); }
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (!cur[dir]) { t.step(`${name} = ${cur.key} (no ${dir} child — the ${dir === "left" ? "leftmost" : "rightmost"} node)`, { snapshot: clone(this.root), highlight: { done: cur.key, path } }); break; }
      t.step(`${cur.key} has a ${dir} child — go ${dir}`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
      cur = cur[dir];
    }
    return t.trace();
  }

  /** floor(key) — largest key ≤ key. */
  floor(key) { return this._bound("floor", key, true); }
  /** ceiling(key) — smallest key ≥ key. */
  ceiling(key) { return this._bound("ceiling", key, false); }
  _bound(name, key, isFloor) {
    const t = new Tracer(); let cur = this.root, best = null; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`${key} is present → ${name} = ${key}`, { snapshot: clone(this.root), highlight: { done: cur.key, path } }); return t.trace(); }
      const goLeft = key < cur.key;
      if (goLeft === isFloor) { // floor & key<node → left ; ceiling & key>node → right
        t.step(`${key} ${isFloor ? "<" : ">"} ${cur.key} → ${name} is ${isFloor ? "in the left" : "in the right"} subtree`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
        cur = isFloor ? cur.left : cur.right;
      } else {
        best = cur.key;
        t.step(`${cur.key} ${isFloor ? "≤" : "≥"} ${key} → candidate ${name} ${cur.key}; try the ${isFloor ? "right" : "left"} for a ${isFloor ? "closer, larger" : "closer, smaller"} one`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
        cur = isFloor ? cur.right : cur.left;
      }
    }
    t.step(`${name}(${key}) = ${best === null ? "none" : best}`, { snapshot: clone(this.root), highlight: best === null ? { path } : { done: best, path } });
    return t.trace();
  }

  /** select(k) — the key of rank k (k smaller keys), using subtree sizes. */
  select(k) {
    const t = new Tracer(); const K = k;
    if (k < 0 || k >= size(this.root)) { t.step(`select(${k}) — out of range (0..${size(this.root) - 1})`, { snapshot: clone(this.root) }); return t.trace(); }
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); const ls = size(cur.left); t.count("compare");
      if (k < ls) { t.step(`rank ${k} < ${ls} keys in the left subtree → go left`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } }); cur = cur.left; }
      else if (k > ls) { t.step(`skip ${cur.key} and its ${ls} left keys → find rank ${k - ls - 1} on the right`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } }); k = k - ls - 1; cur = cur.right; }
      else { t.step(`select(${K}) = ${cur.key} — exactly ${ls} keys are smaller`, { snapshot: clone(this.root), highlight: { done: cur.key, path } }); break; }
    }
    return t.trace();
  }

  /** rank(key) — how many keys are strictly less than key. */
  rank(key) {
    const t = new Tracer(); let cur = this.root, r = 0; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key < cur.key) { t.step(`${key} < ${cur.key} → the ${size(cur.left)} left keys and ${cur.key} are all ≥ key, go left`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } }); cur = cur.left; }
      else if (key > cur.key) { r += size(cur.left) + 1; t.step(`${key} > ${cur.key} → count ${cur.key} + its ${size(cur.left)} left keys (rank so far ${r}), go right`, { snapshot: clone(this.root), highlight: { cur: cur.key, path } }); cur = cur.right; }
      else { r += size(cur.left); t.step(`found ${key} → rank = ${r}`, { snapshot: clone(this.root), highlight: { done: cur.key, path } }); return t.trace(); }
    }
    t.step(`${key} not present → rank = ${r}`, { snapshot: clone(this.root), highlight: { path } });
    return t.trace();
  }

  /** range(lo,hi) — keys in [lo,hi], in order, pruning subtrees that can't contain them. */
  range(lo, hi) {
    const t = new Tracer(); const out = []; const root = this.root; const self = this;
    (function rec(nd) {
      if (!nd) return; t.count("visit");
      if (lo < nd.key) rec(nd.left);
      if (lo <= nd.key && nd.key <= hi) {
        out.push(nd.key);
        t.step(`${nd.key} ∈ [${lo},${hi}] — collect → {${out.join(", ")}}`, { snapshot: clone(root), highlight: { cur: nd.key, done: [...out] } });
      } else {
        t.step(`${nd.key} ∉ [${lo},${hi}] — skip`, { snapshot: clone(root), highlight: { cur: nd.key, done: [...out] } });
      }
      if (nd.key < hi) rec(nd.right);
    })(this.root);
    t.step(`range [${lo},${hi}] = {${out.join(", ")}} (${out.length} keys)`, { snapshot: clone(this.root), highlight: { done: [...out] } });
    return t.trace();
  }

  /** Rotate the subtree rooted at `key` (dir "R"/"L"). Order-preserving; the middle
      subtree B re-hangs to the other node. Returns {trace, sel:<risen key>} so an
      interactive demo can keep the SAME subtree selected (now rooted at the risen node). */
  rotate(key, dir) {
    const t = new Tracer();
    let par = null, y = this.root;
    while (y && y.key !== key) { par = y; y = key < y.key ? y.left : y.right; }
    if (!y) { t.step(`no node ${key}`, { snapshot: clone(this.root) }); return { trace: t.trace(), sel: null }; }
    const x = dir === "R" ? y.left : y.right;
    if (!x) { t.step(`${key} has no ${dir === "R" ? "left" : "right"} child — can't ${dir === "R" ? "right" : "left"}-rotate`, { snapshot: clone(this.root), highlight: { danger: key } }); return { trace: t.trace(), sel: key }; }
    const B = dir === "R" ? x.right : x.left;
    const bKeys = keysOf(B);
    t.step(`${dir === "R" ? "right" : "left"}-rotate at ${y.key}: ${x.key} rises; the middle subtree ${B ? "(" + B.key + "…)" : "(empty)"} — keys between ${x.key} and ${y.key} — re-hangs`,
      { snapshot: clone(this.root), highlight: { cur: y.key, path: [x.key], compare: bKeys } });
    const fixed = dir === "R" ? rotRt(y) : rotLt(y);
    t.count("link", 3);
    if (!par) this.root = fixed; else if (par.left === y) par.left = fixed; else par.right = fixed;
    t.step(`${x.key} is now the subtree root; ${B ? "the orange middle subtree re-hung to " + y.key : "nothing re-hung"} — in-order unchanged`,
      { snapshot: clone(this.root), highlight: { cur: x.key, compare: bKeys } });
    return { trace: t.trace(), sel: x.key };
  }
}
