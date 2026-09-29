// CSS 343 unified library — structures/redblack.js
// The left-leaning red-black BST (Sedgewick), implemented ONCE and instrumented
// via the Tracer. A red-black BST is a BST plus one bit per node — `red` — that
// marks the LINK from its parent as red or black; a red link glues two BST nodes
// into one 2-3-tree node. Left-leaning keeps every 3-node's extra link on the
// left, which collapses the six red-black rebalancing cases down to three:
// right-red → rotateLeft, left-left red-red → rotateRight, both-red → flipColors.
// build() is silent; insert()/search() return a Trace the Player scrubs.
// Snapshots are whole-tree clones INCLUDING the `red` flags (demo inputs are
// small), so stepping backward is free. Renders with the shared TreeRenderer,
// which paints an edge red when the child's `red` flag is truthy.

import { Tracer } from "../core/tracer.js";

const node = (key) => ({ key, left: null, right: null, red: true }); // new nodes attach via a red link
const isRed = (x) => x !== null && x.red === true; // null links are black
const clone = (t) => (t ? { key: t.key, red: t.red, left: clone(t.left), right: clone(t.right) } : null);
const keysOf = (t, o = []) => { if (t) { keysOf(t.left, o); o.push(t.key); keysOf(t.right, o); } return o; };

// rotateLeft: x = h.right rises; h becomes x's left child and turns red (it just
// lost its black-root status); x inherits h's old color. Used to fix a right-
// leaning red link ("lean it left").
function rotateLeft(h, t) {
  const x = h.right;
  h.right = x.left;
  x.left = h;
  x.red = h.red;
  h.red = true;
  t.count("rotation").count("link", 3);
  return x;
}

// rotateRight: x = h.left rises; mirror image of rotateLeft. Used to straighten
// two reds in a row leaning left (left-left).
function rotateRight(h, t) {
  const x = h.left;
  h.left = x.right;
  x.right = h;
  x.red = h.red;
  h.red = true;
  t.count("rotation").count("link", 3);
  return x;
}

// flipColors: h has two red children — that's a temporary 4-node. Split it:
// push the color up (h turns red, its children turn black).
function flipColors(h, t) {
  h.red = !h.red;
  h.left.red = !h.left.red;
  h.right.red = !h.right.red;
  t.count("visit", 3);
}

// The three LLRB fix-up checks, applied bottom-up, in this exact order (a
// rotateLeft can create the setup rotateRight looks for, and either can create
// two red children for flipColors — so each check re-reads the CURRENT h).
function fixUp(h, t) {
  if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h, t);
  if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h, t);
  if (isRed(h.left) && isRed(h.right)) flipColors(h, t);
  return h;
}

// silent insert (for build) — same logic as insert(), no trace.
function insSilent(h, key) {
  if (!h) return node(key);
  if (key < h.key) h.left = insSilent(h.left, key);
  else if (key > h.key) h.right = insSilent(h.right, key);
  else return h;
  return fixUp(h, new Tracer());
}

function minNode(h) { while (h.left) h = h.left; return h; }

// balance: the same three checks as fixUp, applied once on the way back UP
// from a delete — with its own trace messages (delete's are phrased as
// "restoring balance", not "promoting a new key" like insert's). `box` is a
// {current: root} cell — see deleteMin/delNode below for why it exists.
function balance(h, t, box) {
  if (isRed(h.right) && !isRed(h.left)) {
    h = rotateLeft(h, t);
    t.step(`right-red link at ${h.key} on the way back up — rotateLeft to re-lean it`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  }
  if (isRed(h.left) && isRed(h.left.left)) {
    h = rotateRight(h, t);
    t.step(`two reds in a row at ${h.key} — rotateRight to straighten`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  }
  if (isRed(h.left) && isRed(h.right)) {
    flipColors(h, t);
    t.step(`both children of ${h.key} are red — flipColors to re-balance on the way up`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  }
  return h;
}

// moveRedLeft: h is red, h.left and h.left.left are black — descending left
// would delete through an all-black link, which breaks black-balance. Borrow:
// flip a red down onto h.left (temporarily making it a 3-node), taking it
// either from h.right directly (flipColors) or, if h.right leans left itself,
// via a rotation first so the borrowed key ends up on the correct side.
function moveRedLeft(h, t, box) {
  flipColors(h, t);
  if (isRed(h.right.left)) {
    h.right = rotateRight(h.right, t);
    h = rotateLeft(h, t);
    flipColors(h, t);
    t.step(`moveRedLeft at ${h.key}: its right sibling can't lend directly — rotate through it first`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  } else {
    t.step(`moveRedLeft at ${h.key}: borrow a red from the right so we can delete out of the left subtree`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  }
  return h;
}

// moveRedRight: mirror image, used when descending right.
function moveRedRight(h, t, box) {
  flipColors(h, t);
  if (isRed(h.left.left)) {
    h = rotateRight(h, t);
    flipColors(h, t);
    t.step(`moveRedRight at ${h.key}: the left sibling can lend directly — rotateRight then flip`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  } else {
    t.step(`moveRedRight at ${h.key}: borrow a red from the left so we can delete out of the right subtree`, { snapshot: clone(box.current), highlight: { cur: h.key } });
  }
  return h;
}

// deleteMin/delNode thread a `box` — {current: <the true root>} — through the
// whole recursion instead of returning a new root and waiting for the caller
// to reassign it. `setH` writes DIRECTLY into whichever field pointed at h (a
// parent's .left/.right, or box.current itself), so the live tree — and every
// t.step snapshot taken from box.current — stays fully consistent even many
// stack frames deep, with nothing waiting on a return value to propagate up.
function deleteMin(h, setH, t, box) {
  if (h.left === null) {
    t.step(`${h.key} is the minimum of this subtree — splice it out`, { snapshot: clone(box.current), highlight: { danger: h.key } });
    setH(null);
    return;
  }
  if (!isRed(h.left) && !isRed(h.left.left)) {
    h = moveRedLeft(h, t, box);
    setH(h);
  }
  deleteMin(h.left, (x) => { h.left = x; }, t, box);
  const b = balance(h, t, box);
  if (b !== h) setH(b);
}

// delNode — remove `key` from the subtree rooted at h (key is guaranteed present).
function delNode(h, setH, key, t, box) {
  if (key < h.key) {
    if (!isRed(h.left) && !isRed(h.left.left)) {
      h = moveRedLeft(h, t, box);
      setH(h);
    }
    delNode(h.left, (x) => { h.left = x; }, key, t, box);
  } else {
    if (isRed(h.left)) {
      h = rotateRight(h, t);
      setH(h);
      t.step(`${h.key} leans left — rotateRight before continuing right`, { snapshot: clone(box.current), highlight: { cur: h.key } });
    }
    if (key === h.key && h.right === null) {
      t.step(`${h.key} is a leaf — remove it`, { snapshot: clone(box.current), highlight: { danger: h.key } });
      setH(null);
      return;
    }
    if (!isRed(h.right) && !isRed(h.right.left)) {
      h = moveRedRight(h, t, box);
      setH(h);
    }
    if (key === h.key) {
      const succ = minNode(h.right);
      t.step(`${h.key} has two children — copy in the in-order successor ${succ.key}, then delete ${succ.key} from the right subtree`,
        { snapshot: clone(box.current), highlight: { cur: h.key, key: [succ.key] } });
      h.key = succ.key;
      t.count("write");
      deleteMin(h.right, (x) => { h.right = x; }, t, box);
    } else {
      delNode(h.right, (x) => { h.right = x; }, key, t, box);
    }
  }
  const b = balance(h, t, box);
  if (b !== h) setH(b);
}

export class RedBlack {
  constructor() { this.root = null; }

  build(keys) { for (const k of keys) { this.root = insSilent(this.root, k); this.root.red = false; } return this; }
  snapshot() { return clone(this.root); }
  inorder() { return keysOf(this.root); }
  isRed(x) { return isRed(x); }

  /** Insert with a full trace: BST descend (compares) → new node appears RED →
      walk back up applying the three LLRB fix-ups, one frame per rotation/flip →
      recolor the root black. */
  insert(key, opts = {}) {
    const t = new Tracer();
    if (this.root == null) {
      this.root = node(key);
      this.root.red = false; // the root of an LLRB is always black
      t.count("alloc").step(`insert ${key}: empty tree → ${key} becomes the (black) root`,
        { snapshot: clone(this.root), highlight: { appear: key } });
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

    // attach the new node with a RED link (a BST insert that leans on its parent)
    const leaf = node(key);
    if (key < cur.key) cur.left = leaf; else cur.right = leaf;
    t.count("alloc").count("link");
    t.step(`insert ${key} as a new RED node — a red link temporarily glues it to ${cur.key}`,
      { snapshot: clone(this.root), highlight: { appear: key, path: path.map((p) => p.key) } });

    // walk back up the path, fixing up at every level
    for (let i = path.length - 1; i >= 0; i--) {
      let h = path[i];
      const parent = i > 0 ? path[i - 1] : null;
      const wasLeft = parent ? parent.left === path[i] : null;

      if (isRed(h.right) && !isRed(h.left)) {
        h = rotateLeft(h, t);
        rewire(this, parent, wasLeft, h);
        t.step(`right-red link at ${h.key} — a 3-node must lean LEFT → rotateLeft`,
          { snapshot: clone(this.root), highlight: { cur: h.key, done: key } });
      }
      if (isRed(h.left) && isRed(h.left.left)) {
        h = rotateRight(h, t);
        rewire(this, parent, wasLeft, h);
        t.step(`two reds in a row on the left at ${h.key} — rotateRight to straighten the lean`,
          { snapshot: clone(this.root), highlight: { cur: h.key, done: key } });
      }
      if (isRed(h.left) && isRed(h.right)) {
        flipColors(h, t);
        t.step(`both children of ${h.key} are red — a temporary 4-node → flipColors (split it, push the middle key up)`,
          { snapshot: clone(this.root), highlight: { cur: h.key, done: key } });
      }
      rewire(this, parent, wasLeft, h);
    }

    if (this.root.red) {
      this.root.red = false;
      t.step(`recolor the root BLACK — the root of an LLRB is always black`,
        { snapshot: clone(this.root), highlight: { done: key } });
    }
    t.step(`done — ${key} inserted`, { snapshot: clone(this.root), highlight: { done: key } });
    return t.trace();
  }

  /** Delete with a full trace: this is genuinely more work than insert — instead
      of one bottom-up fix-up pass, we may need to moveRedLeft/moveRedRight on the
      way DOWN (so we never delete through an all-black link) before balancing on
      the way back UP. Mirrors a 2-3 tree's borrow/merge, expressed in color. */
  delete(key) {
    const t = new Tracer();
    if (this.root == null) { t.step(`delete ${key}: empty tree — nothing to do`, { snapshot: null }); return t.trace(); }

    // find first (silently) — the recursive algorithm below assumes the key exists
    let probe = this.root;
    while (probe && probe.key !== key) probe = key < probe.key ? probe.left : probe.right;
    if (!probe) { t.step(`${key} not found — nothing to delete`, { snapshot: clone(this.root) }); return t.trace(); }

    const box = { current: this.root };
    if (!isRed(box.current.left) && !isRed(box.current.right)) {
      box.current.red = true; // temporarily color the root red so the top-down invariant holds uniformly
      t.step(`root has two black children — color it RED so moveRedLeft/moveRedRight can assume a red root`, { snapshot: clone(box.current) });
    }
    delNode(box.current, (x) => { box.current = x; }, key, t, box);
    this.root = box.current;
    if (this.root) { this.root.red = false; }
    t.step(`done — ${key} deleted`, { snapshot: clone(this.root), highlight: {} });
    return t.trace();
  }

  /** Search with a trace of key comparisons down one root-to-leaf path. */
  search(key) {
    const t = new Tracer();
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`found ${key}`, { snapshot: clone(this.root), highlight: { done: key, path } }); return t.trace(); }
      t.step(`compare ${key} vs ${cur.key} — go ${key < cur.key ? "left" : "right"}`,
        { snapshot: clone(this.root), highlight: { cur: cur.key, path } });
      cur = key < cur.key ? cur.left : cur.right;
    }
    t.step(`${key} not found`, { snapshot: clone(this.root), highlight: { path } });
    return t.trace();
  }
}

// Wire the (possibly new) subtree root `h` back into its parent, or into
// this.root if there is no parent. `wasLeft` was captured BEFORE any rotation
// touched this level, so it still reflects which side of the parent `h` hangs on.
function rewire(self, parent, wasLeft, h) {
  if (!parent) self.root = h;
  else if (wasLeft) parent.left = h;
  else parent.right = h;
}
