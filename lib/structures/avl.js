// CSS 343 unified library — structures/avl.js
// The AVL tree, implemented ONCE and instrumented via the Tracer. build() is
// silent (sets up an initial tree); insert()/search() return a Trace the Player
// scrubs. Snapshots are whole-tree clones (demo inputs are small), so stepping
// backward is free. Renders with the shared TreeRenderer (labels: "bf").

import { Tracer } from "../core/tracer.js";

const node = (key) => ({ key, left: null, right: null, height: 0 });
const h = (t) => (t ? t.height : -1);
const bf = (t) => (t ? h(t.left) - h(t.right) : 0);
const fix = (t) => { if (t) t.height = 1 + Math.max(h(t.left), h(t.right)); };
const clone = (t) => (t ? { key: t.key, height: t.height, left: clone(t.left), right: clone(t.right) } : null);
const keysOf = (t, o = []) => { if (t) { keysOf(t.left, o); o.push(t.key); keysOf(t.right, o); } return o; };

function rotR(y, t) { const x = y.left; y.left = x.right; x.right = y; fix(y); fix(x); t.count("rotation").count("link", 3); return x; }
function rotL(x, t) { const y = x.right; x.right = y.left; y.left = x; fix(x); fix(y); t.count("rotation").count("link", 3); return y; }

// silent insert (for build)
function insSilent(root, key) {
  if (!root) return node(key);
  if (key < root.key) root.left = insSilent(root.left, key);
  else if (key > root.key) root.right = insSilent(root.right, key);
  else return root;
  fix(root);
  const b = bf(root);
  if (b > 1) { if (bf(root.left) < 0) root.left = rotL(root.left, new Tracer()); return rotR(root, new Tracer()); }
  if (b < -1) { if (bf(root.right) > 0) root.right = rotR(root.right, new Tracer()); return rotL(root, new Tracer()); }
  return root;
}

export class AVL {
  constructor() { this.root = null; }

  build(keys) { for (const k of keys) this.root = insSilent(this.root, k); return this; }
  snapshot() { return clone(this.root); }
  inorder() { return keysOf(this.root); }

  /** Insert with a full trace: descend (compares) → add leaf → recompute bf up → rebalance.
      opts.pause: halt autoplay at the detected imbalance so students predict the rotation. */
  insert(key, opts = {}) {
    const t = new Tracer();
    if (this.root == null) {
      this.root = node(key);
      t.count("alloc").step(`insert ${key}: empty tree → ${key} becomes the root`, { snapshot: clone(this.root), highlight: { appear: key } });
      return t.trace();
    }
    // descend, remembering the path
    const path = [];
    let cur = this.root;
    while (true) {
      path.push(cur);
      t.count("compare");
      t.step(`compare ${key} vs ${cur.key} — go ${key < cur.key ? "left" : key > cur.key ? "right" : "(equal)"}`,
        { snapshot: clone(this.root), highlight: { cur: cur.key, path: path.map((p) => p.key) } });
      if (key < cur.key) { if (!cur.left) break; cur = cur.left; }
      else if (key > cur.key) { if (!cur.right) break; cur = cur.right; }
      else { t.step(`${key} already present — no insert`, { snapshot: clone(this.root), highlight: { danger: key } }); return t.trace(); }
    }
    // attach leaf
    const leaf = node(key);
    if (key < cur.key) cur.left = leaf; else cur.right = leaf;
    t.count("alloc").count("link");
    t.step(`insert ${key} as a ${key < cur.key ? "left" : "right"} child of ${cur.key}`,
      { snapshot: clone(this.root), highlight: { appear: key, path: path.map((p) => p.key) } });

    // walk back up: fix heights, rebalance at the first ±2 (insert needs ≤ 1 rotation)
    for (let i = path.length - 1; i >= 0; i--) {
      const n = path[i]; fix(n); t.count("visit");
      const b = bf(n);
      t.step(`back up: bf(${n.key}) = ${b > 0 ? "+" + b : b}`,
        { snapshot: clone(this.root), highlight: { cur: n.key, path: path.slice(0, i + 1).map((p) => p.key) } });
      if (Math.abs(b) === 2) {
        t.step(`imbalance at ${n.key} (bf ${b > 0 ? "+" + b : b}) — predict the rotation, then continue`,
          { snapshot: clone(this.root), highlight: { danger: n.key }, pause: opts.pause });
        const parent = path[i - 1] || null;
        const fixed = rebalance(n, t);
        if (!parent) this.root = fixed;
        else if (parent.left === n) parent.left = fixed; else parent.right = fixed;
        t.step(`rotated — subtree rebalanced`, { snapshot: clone(this.root), highlight: { done: fixed.key } });
        break;
      }
    }
    t.step(`done — ${key} inserted, tree is balanced`, { snapshot: clone(this.root), highlight: { done: key } });
    return t.trace();
  }

  /** Remove with a full trace: find → splice (leaf / one-child / successor) → rebalance up.
      Unlike insert, a delete can rotate at MULTIPLE levels — the cascade. */
  remove(key) {
    const t = new Tracer();
    if (this.root == null) { t.step(`remove ${key}: the tree is empty`, { snapshot: null }); return t.trace(); }
    // find the target, remembering the path
    const path = []; let z = this.root;
    while (z && z.key !== key) {
      path.push(z); t.count("compare");
      t.step(`compare ${key} vs ${z.key} — go ${key < z.key ? "left" : "right"}`,
        { snapshot: clone(this.root), highlight: { cur: z.key, path: path.map((p) => p.key) } });
      z = key < z.key ? z.left : z.right;
    }
    t.count("compare");
    if (!z) { t.step(`${key} not found — nothing to remove`, { snapshot: clone(this.root), highlight: {} }); return t.trace(); }
    path.push(z);
    t.step(`found ${key}`, { snapshot: clone(this.root), highlight: { cur: z.key, path: path.map((p) => p.key) } });

    // two children → copy the in-order successor up, then delete the successor
    let victim = z;
    if (z.left && z.right) {
      const spath = [z]; let s = z.right;
      while (s.left) { spath.push(s); s = s.left; }
      t.step(`${z.key} has two children → successor is ${s.key} (smallest in its right subtree)`,
        { snapshot: clone(this.root), highlight: { cur: s.key, path: path.map((p) => p.key) } });
      z.key = s.key;
      t.step(`copy ${s.key} up into the node — now splice out the old ${s.key}`,
        { snapshot: clone(this.root), highlight: { cur: z.key } });
      for (let k = 1; k < spath.length; k++) path.push(spath[k]);
      path.push(s); victim = s;
    }

    // splice the victim (it has ≤ 1 child)
    const child = victim.left || victim.right || null;
    const parent = path.length >= 2 ? path[path.length - 2] : null;
    if (!parent) this.root = child;
    else if (parent.left === victim) parent.left = child; else parent.right = child;
    t.count("link"); path.pop();
    t.step(`remove ${victim.key} — ${child ? "splice in its only child, " + child.key : "it was a leaf"}`,
      { snapshot: clone(this.root), highlight: child ? { appear: child.key } : {} });

    // rebalance up the whole path — the cascade (rotate at EVERY ±2, don't stop)
    for (let i = path.length - 1; i >= 0; i--) {
      const n = path[i]; fix(n); t.count("visit");
      const b = bf(n);
      t.step(`back up: bf(${n.key}) = ${b > 0 ? "+" + b : b}`,
        { snapshot: clone(this.root), highlight: { cur: n.key, path: path.slice(0, i + 1).map((p) => p.key) } });
      if (Math.abs(b) === 2) {
        t.step(`imbalance at ${n.key} (bf ${b > 0 ? "+" + b : b}) — rotate`,
          { snapshot: clone(this.root), highlight: { danger: n.key } });
        const par = path[i - 1] || null;
        const fixed = rebalance(n, t);
        if (!par) this.root = fixed; else if (par.left === n) par.left = fixed; else par.right = fixed;
        t.step(`rotated at ${n.key} — keep checking upward (a delete can cascade)`,
          { snapshot: clone(this.root), highlight: { done: fixed.key } });
      }
    }
    t.step(`done — ${key} removed, tree is balanced`, { snapshot: clone(this.root), highlight: {} });
    return t.trace();
  }

  /** Search with a trace of key comparisons. */
  search(key) {
    const t = new Tracer();
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`found ${key} (${path.length} comparison${path.length === 1 ? "" : "s"})`, { snapshot: clone(this.root), highlight: { done: key, path } }); return t.trace(); }
      t.step(`compare ${key} vs ${cur.key} — go ${key < cur.key ? "left" : "right"}`,
        { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
      cur = key < cur.key ? cur.left : cur.right;
    }
    t.step(`${key} not found`, { snapshot: clone(this.root), highlight: { path } });
    return t.trace();
  }
}

function rebalance(n, t) {
  if (bf(n) > 1) { // left-heavy
    if (bf(n.left) < 0) n.left = rotL(n.left, t); // LR: straighten the kink first
    return rotR(n, t);
  }
  // right-heavy
  if (bf(n.right) > 0) n.right = rotR(n.right, t); // RL: straighten the kink first
  return rotL(n, t);
}
