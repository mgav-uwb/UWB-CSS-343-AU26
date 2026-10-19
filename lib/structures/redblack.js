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
/** A node with a given color, for hand-shaped trees (RedBlack.from). */
export const rbNode = (key, red = false, left = null, right = null) => ({ key, red, left, right });
export const isRed = (x) => x != null && x.red === true; // null links are black
export const clone = (t) => (t ? { key: t.key, red: t.red, left: clone(t.left), right: clone(t.right) } : null);
// a tracer that records nothing: the primitives below are also called bare
// (tools/gen-redblack-figures.mjs applies them to node clones)
const QUIET = { count() { return this; }, step() { return this; } };
const keysOf = (t, o = []) => { if (t) { keysOf(t.left, o); o.push(t.key); keysOf(t.right, o); } return o; };

// rotateLeft: x = h.right rises; h becomes x's left child and turns red (it just
// lost its black-root status); x inherits h's old color. Used to fix a right-
// leaning red link ("lean it left").
export function rotateLeft(h, t = QUIET) {
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
export function rotateRight(h, t = QUIET) {
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
export function flipColors(h, t = QUIET) {
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

// One frame of the delete: the whole tree (box.current is the true root, kept
// current by setH, see deleteMin/delNode below) with the given highlight.
function show(t, box, msg, hl = {}) { t.step(msg, { snapshot: clone(box.current), highlight: hl }); }

// balance: the same three checks as fixUp, applied once on the way back UP
// from a delete, one frame per move that fires, phrased as restoring the
// invariants rather than promoting a new key. `setH` rewires h's parent link
// at once, so every frame shows the live tree.
function balance(h, setH, t, box) {
  if (isRed(h.right) && !isRed(h.left)) {
    const was = h.key;
    h = rotateLeft(h, t); setH(h);
    show(t, box, `on the way back up at ${was}: a right-leaning red link: rotateLeft(${was}) leans it left`, { cur: h.key, compare: [was] });
  }
  if (isRed(h.left) && isRed(h.left.left)) {
    const was = h.key;
    h = rotateRight(h, t); setH(h);
    show(t, box, `on the way back up at ${was}: two red links in a row on the left: rotateRight(${was})`, { cur: h.key, compare: [was] });
  }
  if (isRed(h.left) && isRed(h.right)) {
    flipColors(h, t);
    show(t, box, `on the way back up at ${h.key}: both children red, a temporary 4-node: flipColors(${h.key}) splits it`, { cur: h.key });
  }
  return h;
}

// moveRedLeft: about to descend into h.left, which is a 2-node (its link and
// its left child's link are both black), and a key cannot be removed from a
// 2-node. h itself is red (the descent keeps that true). flipColors brings h's
// key down: h.left, h and h.right become one temporary 4-node, the 2-3 MERGE.
// If the right sibling is a 3-node (h.right.left red), a merge would overfill;
// two rotations and a second flip turn it into the 2-3 BORROW instead: the
// sibling's smaller key goes up, h's key comes down onto the left.
function moveRedLeft(h, setH, t, box) {
  const L = h.left.key, P = h.key, R = h.right.key;
  show(t, box, `${L} is a 2-node (black link, black left child) and a key cannot be removed from a 2-node: moveRedLeft(${P}) first`,
    { cur: P, compare: [L] });
  flipColors(h, t);
  show(t, box, `flipColors(${P}): ${P} comes down between ${L} and ${R}, which are now both red: one temporary node [${L} | ${P} | ${R}], the 2-3 MERGE`,
    { cur: P, compare: [L, R] });
  if (isRed(h.right.left)) {
    const S = h.right.left.key;
    h.right = rotateRight(h.right, t);
    show(t, box, `but ${R}'s left link is red: the right sibling is a 3-node and can lend, so BORROW instead: rotateRight(${R}) lifts ${S}`,
      { cur: P, compare: [S] });
    h = rotateLeft(h, t); setH(h);
    show(t, box, `rotateLeft(${P}): ${S} rises into the parent's place, ${P} drops to the left`, { cur: S, compare: [P] });
    flipColors(h, t);
    show(t, box, `flipColors(${S}): ${S} goes back to its parent, ${L} and ${P} form a 3-node on the left (the 2-3 BORROW: ${S} up, ${P} down)`,
      { cur: S, compare: [L, P] });
  }
  return h;
}

// moveRedRight: the mirror, descending into h.right when it is a 2-node. The
// borrow case needs only one rotation, because red links lean left.
function moveRedRight(h, setH, t, box) {
  const L = h.left.key, P = h.key, R = h.right.key;
  show(t, box, `${R} is a 2-node and a key cannot be removed from a 2-node: moveRedRight(${P}) first`, { cur: P, compare: [R] });
  flipColors(h, t);
  show(t, box, `flipColors(${P}): ${P} comes down between ${L} and ${R}, which are now both red: one temporary node [${L} | ${P} | ${R}], the 2-3 MERGE`,
    { cur: P, compare: [L, R] });
  if (isRed(h.left.left)) {
    const S = h.left.left.key;
    h = rotateRight(h, t); setH(h);
    show(t, box, `but ${L}'s left link is red: the left sibling is a 3-node and can lend, so BORROW instead: rotateRight(${P}) lifts ${L}`,
      { cur: L, compare: [P, S] });
    flipColors(h, t);
    show(t, box, `flipColors(${L}): ${L} goes back to its parent, ${P} and ${R} form a 3-node on the right (the 2-3 BORROW: ${L} up, ${P} down)`,
      { cur: L, compare: [P, R] });
  }
  return h;
}

// deleteMin/delNode thread a `box`, {current: <the true root>}, through the
// whole recursion instead of returning a new root and waiting for the caller
// to reassign it. `setH` writes DIRECTLY into whichever field pointed at h (a
// parent's .left/.right, or box.current itself), so the live tree, and every
// frame taken from box.current, stays consistent even many stack frames
// deep, with nothing waiting on a return value to propagate up.
function deleteMin(h, setH, t, box) {
  if (h.left === null) {
    show(t, box, `${h.key} has no left child: it is the minimum, and it sits in a 3-node or 4-node here, so removing it is safe`, { danger: h.key });
    setH(null);
    t.count("free");
    return;
  }
  t.count("compare");
  if (!isRed(h.left) && !isRed(h.left.left)) { h = moveRedLeft(h, setH, t, box); }
  show(t, box, `at ${h.key}: go left toward the minimum`, { cur: h.key, edges: [[h.key, h.left.key]] });
  deleteMin(h.left, (x) => { h.left = x; }, t, box);
  balance(h, setH, t, box);
}

// delNode: remove `key` from the subtree rooted at h (key is guaranteed present).
function delNode(h, setH, key, t, box) {
  t.count("compare");
  if (key < h.key) {
    if (!isRed(h.left) && !isRed(h.left.left)) { h = moveRedLeft(h, setH, t, box); }
    show(t, box, `at ${h.key}: ${key} < ${h.key}, go left`, { cur: h.key, edges: [[h.key, h.left.key]] });
    delNode(h.left, (x) => { h.left = x; }, key, t, box);
  } else {
    if (isRed(h.left)) {
      const was = h.key;
      h = rotateRight(h, t); setH(h);
      show(t, box, `${was} has a red left link, and the search continues right or ends here: rotateRight(${was}) moves the red link onto that side`,
        { cur: h.key, compare: [was] });
    }
    if (key === h.key && h.right === null) {
      show(t, box, `found ${key}: no right child, so it is a red leaf at the bottom: remove it`, { danger: key });
      setH(null);
      t.count("free");
      return;
    }
    if (!isRed(h.right) && !isRed(h.right.left)) { h = moveRedRight(h, setH, t, box); }
    if (key === h.key) {
      const succ = minNode(h.right).key;
      show(t, box, `found ${key}, with two children: its in-order successor is ${succ}, the minimum of its right subtree. Delete ${succ} there, then write ${succ} in place of ${key}`,
        { cur: key, compare: [succ] });
      deleteMin(h.right, (x) => { h.right = x; }, t, box);
      h.key = succ;
      t.count("write");
      show(t, box, `write ${succ} in place of ${key}: the tree keeps its order`, { cur: succ });
    } else {
      show(t, box, `at ${h.key}: ${key} > ${h.key}, go right`, { cur: h.key, edges: [[h.key, h.right.key]] });
      delNode(h.right, (x) => { h.right = x; }, key, t, box);
    }
  }
  balance(h, setH, t, box);
}

export class RedBlack {
  constructor() { this.root = null; }

  /** A tree given by its shape (rbNode), for a demo that starts from a state an
   *  insert passes through, such as a right-leaning red link. */
  static from(root) { const s = new RedBlack(); s.root = root; return s; }

  /** ONE primitive move at the node holding `key`, traced before and after
   *  (the moves demo): what it does to the links, the colors and the order.
   *  name: "rotateLeft" | "rotateRight" | "flipColors". */
  move(name, key) {
    const t = new Tracer();
    let parent = null, h = this.root;
    while (h && h.key !== key) { parent = h; h = key < h.key ? h.left : h.right; }
    if (!h) { t.step(`${name}(${key}): no node holds ${key}`, { snapshot: clone(this.root) }); return t.trace(); }
    const setH = (x) => { if (!parent) this.root = x; else if (parent.left === h) parent.left = x; else parent.right = x; };
    const color = (n) => (isRed(n) ? "red" : "black");
    const order = () => keysOf(this.root).join(" ");
    const step = (msg, hl) => t.step(msg, { snapshot: clone(this.root), highlight: hl });
    if (name === "flipColors") {
      const l = h.left, r = h.right;
      step(`before flipColors(${key}): ${key} has two red children, ${l.key} and ${r.key}: together one temporary 4-node [${l.key} | ${key} | ${r.key}]`,
        { cur: key, compare: [l.key, r.key] });
      flipColors(h, t);
      step(parent
        ? `after: ${l.key} and ${r.key} are black 2-nodes, and ${key}'s link is red: ${key} has moved up into ${parent.key}'s node. That is the 2-3 split: the middle key goes up, the outer two separate`
        : `after: ${l.key} and ${r.key} are black 2-nodes and ${key} is red; at the root the link is black by definition, so the tree grows one level`,
      { cur: key, ...(parent ? { compare: [parent.key] } : {}) });
      return t.trace();
    }
    const right = name === "rotateLeft";
    const x = right ? h.right : h.left, B = right ? x.left : x.right;
    const side = right ? "right" : "left", other = right ? "left" : "right";
    step(`before ${name}(${key}): ${x.key} is ${key}'s ${side} child by a ${color(x)} link; ${B ? `${x.key}'s ${other} subtree (${B.key}) holds the keys between ${Math.min(key, x.key)} and ${Math.max(key, x.key)}` : `${x.key} has no ${other} child`}`,
      { cur: key, compare: [x.key], ...(B ? { edges: [[x.key, B.key]] } : {}) });
    const was = color(h);
    const top = right ? rotateLeft(h, t) : rotateRight(h, t);
    setH(top);
    step(`after: ${x.key} rose and took ${key}'s old ${was} link; ${key} hangs from it by a RED ${other} link${B ? `; ${B.key} moved across to be ${key}'s ${side} child` : ""}. In-order is unchanged: ${order()}`,
      { cur: x.key, compare: [key], ...(B ? { edges: [[key, B.key]] } : {}) });
    return t.trace();
  }

  build(keys) { for (const k of keys) { this.root = insSilent(this.root, k); this.root.red = false; } return this; }
  snapshot() { return clone(this.root); }
  inorder() { return keysOf(this.root); }
  isRed(x) { return isRed(x); }

  /** The LLRB invariants as a list of violations (empty = valid): BST order,
   *  a black root, no right-leaning red link, no two red links in a row, and
   *  the same number of black links on every root-to-null path. */
  violations() {
    const bad = [];
    if (isRed(this.root)) bad.push("the root is red");
    let blackHeight = -1;
    (function walk(h, lo, hi, blacks) {
      if (!h) {
        if (blackHeight < 0) blackHeight = blacks;
        else if (blacks !== blackHeight) bad.push(`black height ${blacks} on one path, ${blackHeight} on another`);
        return;
      }
      if ((lo != null && h.key <= lo) || (hi != null && h.key >= hi)) bad.push(`${h.key} out of BST order`);
      if (isRed(h.right)) bad.push(`right-leaning red link ${h.key}-${h.right.key}`);
      if (isRed(h) && isRed(h.left)) bad.push(`two red links in a row at ${h.key}`);
      const b = blacks + (isRed(h) ? 0 : 1);
      walk(h.left, lo, h.key, b);
      walk(h.right, h.key, hi, b);
    })(this.root, null, null, 0);
    return bad;
  }
  isValid() { return this.violations().length === 0; }

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
      t.step(`compare ${key} vs ${cur.key}: go ${key < cur.key ? "left" : key > cur.key ? "right" : "(equal)"}`,
        { snapshot: clone(this.root), highlight: { cur: cur.key, path: path.map((p) => p.key) } });
      if (key < cur.key) { if (!cur.left) break; cur = cur.left; }
      else if (key > cur.key) { if (!cur.right) break; cur = cur.right; }
      else { t.step(`${key} already present: no insert`, { snapshot: clone(this.root), highlight: { danger: key } }); return t.trace(); }
    }

    // attach the new node with a RED link (a BST insert that leans on its parent)
    const leaf = node(key);
    if (key < cur.key) cur.left = leaf; else cur.right = leaf;
    t.count("alloc").count("link");
    t.step(`insert ${key} as a new RED node: a red link temporarily glues it to ${cur.key}`,
      { snapshot: clone(this.root), highlight: { appear: key, path: path.map((p) => p.key) } });

    // walk back up the path, fixing up at every level
    for (let i = path.length - 1; i >= 0; i--) {
      let h = path[i];
      const parent = i > 0 ? path[i - 1] : null;
      const wasLeft = parent ? parent.left === path[i] : null;

      if (isRed(h.right) && !isRed(h.left)) {
        const was = h.key, up = h.right.key;
        h = rotateLeft(h, t);
        rewire(this, parent, wasLeft, h);
        t.step(`at ${was}: red right link, black left link; a 3-node must lean left: rotateLeft(${was}) lifts ${up}`,
          { snapshot: clone(this.root), highlight: { cur: h.key, compare: [was], done: key } });
      }
      if (isRed(h.left) && isRed(h.left.left)) {
        const was = h.key, a = h.left.key, b = h.left.left.key;
        h = rotateRight(h, t);
        rewire(this, parent, wasLeft, h);
        t.step(`at ${was}: two red links in a row on the left (${was} to ${a} to ${b}), a 4-node leaning one way: rotateRight(${was}) balances it around ${a}`,
          { snapshot: clone(this.root), highlight: { cur: h.key, compare: [was], done: key } });
      }
      if (isRed(h.left) && isRed(h.right)) {
        const l = h.left.key, r = h.right.key;
        flipColors(h, t);
        t.step(`at ${h.key}: both children red, the temporary 4-node [${l} | ${h.key} | ${r}]: flipColors(${h.key}) splits it, ${h.key} moves up into its parent's node (the 2-3 split)`,
          { snapshot: clone(this.root), highlight: { cur: h.key, compare: [l, r], done: key } });
      }
      rewire(this, parent, wasLeft, h);
    }

    if (this.root.red) {
      this.root.red = false;
      t.step(`the root link is black by definition: recolor ${this.root.key} black (the tree grew one level if the split reached the top)`,
        { snapshot: clone(this.root), highlight: { done: key } });
    }
    t.step(`done: ${key} inserted`, { snapshot: clone(this.root), highlight: { done: key } });
    return t.trace();
  }

  /** Delete with a full trace: this is genuinely more work than insert — instead
      of one bottom-up fix-up pass, we may need to moveRedLeft/moveRedRight on the
      way DOWN (so we never delete through an all-black link) before balancing on
      the way back UP. Mirrors a 2-3 tree's borrow/merge, expressed in color. */
  delete(key) {
    const t = new Tracer();
    if (this.root == null) { t.step(`delete ${key}: empty tree; nothing to do`, { snapshot: null }); return t.trace(); }

    // find first (silently) — the recursive algorithm below assumes the key exists
    let probe = this.root;
    while (probe && probe.key !== key) probe = key < probe.key ? probe.left : probe.right;
    if (!probe) { t.step(`${key} not found: nothing to delete`, { snapshot: clone(this.root) }); return t.trace(); }

    const box = { current: this.root };
    if (!isRed(box.current.left) && !isRed(box.current.right)) {
      box.current.red = true; // temporarily color the root red so the top-down invariant holds uniformly
      t.step(`delete ${key}: both of the root's links down are black, so color the root RED for now: the descent keeps the current node or its left child red, and moveRedLeft/moveRedRight rely on it`, { snapshot: clone(box.current), highlight: { cur: box.current.key } });
    }
    delNode(box.current, (x) => { box.current = x; }, key, t, box);
    this.root = box.current;
    if (this.root && this.root.red) {
      this.root.red = false;
      t.step(`the root link is always black: recolor the root ${this.root.key} black`, { snapshot: clone(this.root), highlight: { cur: this.root.key } });
    }
    t.step(`done: ${key} deleted; every root-to-null path still crosses the same number of black links`, { snapshot: clone(this.root), highlight: {} });
    return t.trace();
  }

  /** Search with a trace of key comparisons down one root-to-leaf path. */
  search(key) {
    const t = new Tracer();
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`found ${key}`, { snapshot: clone(this.root), highlight: { done: key, path } }); return t.trace(); }
      t.step(`compare ${key} vs ${cur.key}: go ${key < cur.key ? "left" : "right"}`,
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
