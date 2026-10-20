// CSS 343 unified library: structures/top-down.js
// Top-down balanced trees: every repair happens on the way DOWN, before the
// search enters a node, so the change at the bottom never needs one. The
// bottom-up versions (btree.js, two-three.js, redblack.js) change the bottom
// first and repair on the way back up; textbook/trees/ds-top-down-trees.html
// compares the two.
//
//   TopDownBTree(M)   a B-tree of EVEN order M (minimum degree t = M/2: a node
//                     holds t-1 to 2t-1 keys, the root 1 to 2t-1), as in CLRS.
//                     insert: split every full node the search meets, the root
//                     included, before entering it; the leaf then has room.
//                     delete: never enter a node with only t-1 keys: borrow
//                     from a sibling or merge with one first; a key found in an
//                     internal node is replaced by its predecessor (or
//                     successor), or merged down. M = 4 is the 2-3-4 tree.
//                     An odd order cannot work this way: a full node of M-1
//                     keys has no middle key that leaves two legal halves.
//   llrbInsert(root, key, {flipFirst})   the left-leaning red-black insert
//                     (Sedgewick 2008); flipFirst splits 4-nodes on the way
//                     down, which makes the tree a 2-3-4 tree; without it,
//                     the same code is the 2-3 tree insert of redblack.js.
//   llrbDeleteTopDown(root, key)   Sedgewick's LLRB 2-3 delete: on the way
//                     down, moveRedLeft/moveRedRight keep the current node or
//                     its left child red (so the search never ends on a
//                     2-node), then the insert's fix-ups run on the way back
//                     up. It replaces a key that has two children with its
//                     SUCCESSOR, as the paper does.
//   TopDownLLRB       RedBlack (insert, search, build) with that delete: the
//                     llrb-top-down demo, the red-black demo as it was before
//                     redblack.js moved to a bottom-up delete.
//
// Snapshots: {keys, children} for the B-tree (MultiwayTreeRenderer), cloned
// node trees for the LLRB functions (TreeRenderer), {tree, multi} for
// TopDownLLRB. Each frame's highlight.act names the repair it shows ({kind,
// ...}), for tools/gen-topdown-figures.mjs.

import { Tracer } from "../core/tracer.js";
import { RedBlack, isRed, clone as cloneRB, rotateLeft, rotateRight, flipColors, toTwoThree } from "./redblack.js";

const QUIET = { count() { return this; }, step() { return this; } };
const cloneM = (n) => (n ? { keys: n.keys.slice(), children: n.children.map(cloneM) } : null);
const isLeaf = (n) => n.children.length === 0;
const show = (s) => `[${s.keys.join("|")}]`;

/** In-order keys of a multiway tree. */
function keysOf(n, out = []) {
  if (!n) return out;
  n.keys.forEach((k, i) => { if (n.children[i]) keysOf(n.children[i], out); out.push(k); });
  if (n.children[n.keys.length]) keysOf(n.children[n.keys.length], out);
  return out;
}
/** Index of the first key >= key: the child to descend into when key is absent. */
const slot = (keys, key) => { let i = 0; while (i < keys.length && key > keys[i]) i++; return i; };

export class TopDownBTree {
  /** @param {number} order M, even and at least 4: a node holds M/2-1 to M-1 keys. */
  constructor(order = 4) {
    if (order < 4 || order % 2) throw new Error(`top-down needs an even order of at least 4, not ${order}: a full node of ${order - 1} keys has no middle key that leaves two legal halves`);
    this.M = order;
    this.t = order / 2;
    this.root = null;
  }
  get maxKeys() { return 2 * this.t - 1; }
  get minKeys() { return this.t - 1; }
  snapshot() { return cloneM(this.root); }
  inorder() { return keysOf(this.root); }
  build(keys) { for (const k of keys) this._insert(k, QUIET); return this; }
  insert(key) { const t = new Tracer(); this._insert(key, t); return t.trace(); }
  delete(key) { const t = new Tracer(); this._delete(key, t); return t.trace(); }

  /** Every rule: keys sorted, sizes in bounds, n+1 children, leaves at one depth. Returns the broken rules. */
  violations() {
    const out = [], depths = new Set(), r = this.root;
    if (!r) return out;
    const walk = (n, d, lo, hi) => {
      const k = n.keys.length;
      if (k > this.maxKeys) out.push(`${show(n)} holds ${k} keys (max ${this.maxKeys})`);
      if (n !== r && k < this.minKeys) out.push(`${show(n)} holds ${k} keys (min ${this.minKeys})`);
      if (n === r && k < 1) out.push("the root holds no key");
      n.keys.forEach((x, i) => {
        if (i && n.keys[i - 1] >= x) out.push(`${show(n)} is not sorted`);
        if ((lo != null && x <= lo) || (hi != null && x >= hi)) out.push(`${x} is out of its range`);
      });
      if (isLeaf(n)) { depths.add(d); return; }
      if (n.children.length !== k + 1) out.push(`${show(n)} has ${n.children.length} children`);
      n.children.forEach((c, i) => walk(c, d + 1, i ? n.keys[i - 1] : lo, i < k ? n.keys[i] : hi));
    };
    walk(r, 0, null, null);
    if (depths.size > 1) out.push("the leaves are not all at one depth");
    return out;
  }
  isValid() { return this.violations().length === 0; }

  _frame(t, msg, hl = {}) { t.step(msg, { snapshot: cloneM(this.root), highlight: hl }); }

  /** Split the full child x.children[i] around its middle key, which moves up into x (not full). */
  _splitChild(x, i, t) {
    const c = x.children[i], m = this.t - 1, mid = c.keys[m];
    const right = { keys: c.keys.slice(m + 1), children: c.children.slice(m + 1) };
    c.keys = c.keys.slice(0, m);
    c.children = c.children.slice(0, m + 1);
    x.keys.splice(i, 0, mid);
    x.children.splice(i + 1, 0, right);
    t.count("alloc").count("write", 2).count("link", 2);
    return mid;
  }

  _insert(key, t) {
    if (!this.root) {
      this.root = { keys: [key], children: [] };
      t.count("alloc");
      this._frame(t, `insert ${key}: empty tree; ${key} becomes the root leaf`, { done: [key], act: { kind: "new" } });
      return;
    }
    if (this.root.keys.length === this.maxKeys) {
      const old = this.root.keys.slice();
      this.root = { keys: [], children: [this.root] };
      const mid = this._splitChild(this.root, 0, t);
      this._frame(t, `insert ${key}: the root [${old.join("|")}] is full, so split it before going down: ${mid} becomes a new root, and the tree grows one level`,
        { key: [mid], node: [mid], act: { kind: "split", root: true, up: mid, from: old } });
    }
    let x = this.root;
    for (;;) {
      let i = slot(x.keys, key);
      t.count("compare", Math.min(i + 1, x.keys.length));
      if (i < x.keys.length && x.keys[i] === key) {
        this._frame(t, `${key} is already in [${x.keys.join("|")}]: no change`, { danger: [key], act: { kind: "present" } });
        return;
      }
      if (isLeaf(x)) {
        x.keys.splice(i, 0, key);
        t.count("write");
        this._frame(t, `the leaf has room: ${key} goes in, giving [${x.keys.join("|")}]`, { node: x.keys.slice(), key: [key], done: [key], act: { kind: "leaf" } });
        return;
      }
      const c = x.children[i];
      if (c.keys.length === this.maxKeys) {
        const old = c.keys.slice(), mid = this._splitChild(x, i, t);
        this._frame(t, `at [${x.keys.join("|")}]: the child [${old.join("|")}] is full, so split it before entering: ${mid} moves up into this node, which has room`,
          { key: [mid], node: x.keys.slice(), act: { kind: "split", up: mid, from: old } });
        if (key === mid) { this._frame(t, `${key} is the key that moved up: already present, no change`, { danger: [key], act: { kind: "present" } }); return; }
        if (key > mid) i++;
      }
      this._frame(t, `at [${x.keys.join("|")}]: ${key} goes to child ${i}, [${x.children[i].keys.join("|")}]`, { node: x.keys.slice(), path: x.keys.slice(), act: { kind: "descend" } });
      x = x.children[i];
    }
  }

  /** x.children[i] holds the minimum t-1 keys: give it one more before entering.
   *  Borrow from the left sibling, else the right; else merge with the left,
   *  else the right. Returns the index of the child to enter. */
  _fixChild(x, i, t) {
    const c = x.children[i], left = i > 0 ? x.children[i - 1] : null, right = i < x.keys.length ? x.children[i + 1] : null;
    const was = c.keys.slice();
    if (left && left.keys.length > this.minKeys) {
      const down = x.keys[i - 1], up = left.keys.pop();
      c.keys.unshift(down); x.keys[i - 1] = up;
      if (!isLeaf(left)) c.children.unshift(left.children.pop());
      t.count("write", 3);
      this._frame(t, `[${was.join("|")}] holds only ${this.minKeys} key${this.minKeys > 1 ? "s" : ""}; its left sibling can spare one: BORROW, ${down} comes down, ${up} goes up`,
        { key: [up], node: c.keys.slice(), act: { kind: "borrow", side: "left", down, up } });
      return i;
    }
    if (right && right.keys.length > this.minKeys) {
      const down = x.keys[i], up = right.keys.shift();
      c.keys.push(down); x.keys[i] = up;
      if (!isLeaf(right)) c.children.push(right.children.shift());
      t.count("write", 3);
      this._frame(t, `[${was.join("|")}] holds only ${this.minKeys} key${this.minKeys > 1 ? "s" : ""}; its right sibling can spare one: BORROW, ${down} comes down, ${up} goes up`,
        { key: [up], node: c.keys.slice(), act: { kind: "borrow", side: "right", down, up } });
      return i;
    }
    const j = left ? i - 1 : i, down = x.keys[j];
    this._merge(x, j, t);
    const root = x === this.root && x.keys.length === 0;
    this._frame(t, `[${was.join("|")}] holds only ${this.minKeys} key${this.minKeys > 1 ? "s" : ""} and so does its ${left ? "left" : "right"} sibling: MERGE them with ${down} between them, giving [${x.children[j].keys.join("|")}]${root ? "; the root is now empty" : ""}`,
      { node: x.children[j].keys.slice(), danger: [down], act: { kind: "merge", side: left ? "left" : "right", down, root } });
    return j;
  }
  /** x.children[j] + x.keys[j] + x.children[j+1] become one node at x.children[j]. */
  _merge(x, j, t) {
    const a = x.children[j], b = x.children[j + 1];
    a.keys.push(x.keys[j], ...b.keys);
    a.children.push(...b.children);
    x.keys.splice(j, 1);
    x.children.splice(j + 1, 1);
    t.count("write", 2).count("link").count("free");
  }
  /** A merge that took the root's last key: its one child becomes the root. */
  _dropEmptyRoot(t) {
    if (this.root.keys.length === 0 && this.root.children.length === 1) {
      this.root = this.root.children[0];
      t.count("free");
      this._frame(t, `the root is empty: its one child becomes the root, and the tree is one level shorter`, { act: { kind: "shrink" } });
    }
  }

  _delete(key, t) {
    if (!this.root) { this._frame(t, `delete ${key}: empty tree; nothing to do`, { act: { kind: "missing" } }); return; }
    let x = this.root;
    for (;;) {
      let i = slot(x.keys, key);
      t.count("compare", Math.min(i + 1, x.keys.length));
      const here = i < x.keys.length && x.keys[i] === key;
      if (isLeaf(x)) {
        if (!here) { this._frame(t, `${key} is not in the leaf [${x.keys.join("|")}]: not in the tree`, { act: { kind: "missing" } }); return; }
        x.keys.splice(i, 1);
        t.count("write");
        if (x === this.root && !x.keys.length) { this.root = null; this._frame(t, `remove ${key}: the tree is now empty`, { act: { kind: "remove" } }); return; }
        this._frame(t, `remove ${key} from the leaf, leaving [${x.keys.join("|")}]: ${x === this.root ? "the root" : `it held ${x.keys.length + 1} keys`}, so nothing else changes`,
          { node: x.keys.slice(), act: { kind: "remove", key } });
        return;
      }
      if (here) {
        const y = x.children[i], z = x.children[i + 1];
        if (y.keys.length > this.minKeys) {
          let p = y; while (!isLeaf(p)) p = p.children[p.children.length - 1];
          const pred = p.keys[p.keys.length - 1];
          x.keys[i] = pred;
          t.count("write");
          this._frame(t, `${key} is in an internal node, and the child before it can spare a key: its predecessor ${pred} takes its place; now delete ${pred} from that child`,
            { key: [pred], danger: [key], act: { kind: "pred", key, by: pred } });
          key = pred;
        } else if (z.keys.length > this.minKeys) {
          let s = z; while (!isLeaf(s)) s = s.children[0];
          const succ = s.keys[0];
          x.keys[i] = succ;
          t.count("write");
          this._frame(t, `${key} is in an internal node; the child before it has only ${this.minKeys} key${this.minKeys > 1 ? "s" : ""}, the child after it can spare one: its successor ${succ} takes its place; now delete ${succ} from that child`,
            { key: [succ], danger: [key], act: { kind: "succ", key, by: succ } });
          key = succ;
          i++;
        } else {
          this._merge(x, i, t);
          this._frame(t, `${key} is in an internal node and both children around it hold only ${this.minKeys} key${this.minKeys > 1 ? "s" : ""}: MERGE them with ${key} between them, then delete ${key} from [${x.children[i].keys.join("|")}]`,
            { node: x.children[i].keys.slice(), danger: [key], act: { kind: "merge-key", key } });
        }
      } else if (x.children[i].keys.length === this.minKeys) {
        i = this._fixChild(x, i, t);
      }
      const next = x.children[i];
      if (x === this.root) this._dropEmptyRoot(t);
      this._frame(t, `go down to [${next.keys.join("|")}]`, { node: next.keys.slice(), act: { kind: "descend" } });
      x = next;
    }
  }
}

// ── left-leaning red-black trees ──────────────────────────────────────────
const rbNode = (key) => ({ key, left: null, right: null, red: true });

/** LLRB insert (silent). flipFirst: split a 4-node (two red children) on the
 *  way DOWN, before the comparison: the tree is then a 2-3-4 tree. Without it,
 *  the flip comes last, after the rotations, and the tree is a 2-3 tree. */
export function llrbInsert(root, key, { flipFirst = false } = {}) {
  const put = (h) => {
    if (!h) return rbNode(key);
    if (flipFirst && isRed(h.left) && isRed(h.right)) flipColors(h);
    if (key < h.key) h.left = put(h.left);
    else if (key > h.key) h.right = put(h.right);
    if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
    if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
    if (!flipFirst && isRed(h.left) && isRed(h.right)) flipColors(h);
    return h;
  };
  const r = put(root);
  r.red = false;
  return r;
}
/** The broken rules of a left-leaning 2-3-4 tree: a red link leans right only
 *  as half of a 4-node (both children red), no two reds in a row, every path
 *  the same number of black links. */
export function llrb234Violations(root) {
  const out = []; let black = null;
  (function walk(h, b) {
    if (!h) { if (black == null) black = b; else if (black !== b) out.push("unequal black heights"); return; }
    if (isRed(h.right) && !isRed(h.left)) out.push(`${h.key}: a red link leans right`);
    if (isRed(h) && (isRed(h.left) || isRed(h.right))) out.push(`${h.key}: two reds in a row`);
    walk(h.left, b + (isRed(h.left) ? 0 : 1));
    walk(h.right, b + (isRed(h.right) ? 0 : 1));
  })(root, 0);
  if (isRed(root)) out.push("a red root");
  return out;
}

/** Sedgewick's top-down LLRB 2-3 delete, traced. Mutates `root`, so pass a
 *  copy. Returns {root, trace}. Frames show the whole tree after each move;
 *  highlight.act is {kind: "root-red" | "move-red" | "flip" | "rotate" |
 *  "descend" | "remove" | "succ" | "fix" | "root-black", ...}. */
export function llrbDeleteTopDown(root, key) {
  const t = new Tracer();
  const box = { current: root };
  const frame = (msg, hl = {}) => t.step(msg, { snapshot: cloneRB(box.current), highlight: hl });
  let probe = root;
  while (probe && probe.key !== key) probe = key < probe.key ? probe.left : probe.right;
  if (!probe) { frame(`${key} is not in the tree: nothing to delete`, { act: { kind: "missing" } }); return { root, trace: t.trace() }; }

  // balance: the insert's three fix-ups, once per node on the way back up
  const balance = (h, setH) => {
    if (isRed(h.right) && !isRed(h.left)) {
      const was = h.key; h = rotateLeft(h, t); setH(h);
      frame(`on the way back up at ${was}: a red link leans right: rotateLeft(${was})`, { cur: h.key, act: { kind: "fix", move: `rotateLeft(${was})` } });
    }
    if (isRed(h.left) && isRed(h.left.left)) {
      const was = h.key; h = rotateRight(h, t); setH(h);
      frame(`on the way back up at ${was}: two reds in a row: rotateRight(${was})`, { cur: h.key, act: { kind: "fix", move: `rotateRight(${was})` } });
    }
    if (isRed(h.left) && isRed(h.right)) {
      flipColors(h, t);
      frame(`on the way back up at ${h.key}: two red children, a temporary 4-node: flipColors(${h.key}) splits it`, { cur: h.key, act: { kind: "fix", move: `flipColors(${h.key})` } });
    }
    return h;
  };
  // moveRedLeft: h.left is a 2-node. flipColors merges h.left, h and h.right
  // into one temporary 4-node; if h.right is a 3-node, two rotations and a
  // second flip turn the merge into a borrow.
  const moveRedLeft = (h, setH) => {
    const L = h.left.key, P = h.key, R = h.right.key, moves = [`flipColors(${P})`];
    flipColors(h, t);
    if (!isRed(h.right.left)) frame(`${L} is a 2-node: moveRedLeft(${P}). flipColors(${P}) brings ${P} down: ${L}, ${P} and ${R} form one temporary 4-node (a merge)`, { cur: P, compare: [L, R], multi: { node: [P] }, act: { kind: "flip", move: `flipColors(${P})` } });
    else frame(`${L} is a 2-node: moveRedLeft(${P}). flipColors(${P}) brings ${P} down into one node with ${L} and the 3-node [${h.right.left.key}|${R}]: four keys, too many, so the merge becomes a borrow`, { cur: P, compare: [L, R], multi: { node: [P] }, act: { kind: "flip", move: `flipColors(${P})` } });
    if (isRed(h.right.left)) {
      const S = h.right.left.key;
      h.right = rotateRight(h.right, t);
      frame(`rotateRight(${R}): ${S} rises above ${R}`, { cur: S, compare: [R], act: { kind: "rotate", move: `rotateRight(${R})` } });
      h = rotateLeft(h, t); setH(h);
      frame(`rotateLeft(${P}): ${S} rises above ${P}`, { cur: S, compare: [P], act: { kind: "rotate", move: `rotateLeft(${P})` } });
      flipColors(h, t);
      frame(`flipColors(${S}): ${S} goes up, and ${L} and ${P} form a 3-node (the borrow: ${P} down, ${S} up)`, { cur: S, compare: [L, P], multi: { node: [L], key: [S] }, act: { kind: "flip", move: `flipColors(${S})` } });
      moves.push(`rotateRight(${R})`, `rotateLeft(${P})`, `flipColors(${S})`);
    }
    t.frames[t.frames.length - 1].highlight.act.moveRed = { side: "left", moves, borrow: moves.length > 1 };
    return h;
  };
  // moveRedRight: the mirror; the borrow needs one rotation, as reds lean left
  const moveRedRight = (h, setH) => {
    const L = h.left.key, P = h.key, R = h.right.key, moves = [`flipColors(${P})`];
    flipColors(h, t);
    if (!isRed(h.left.left)) frame(`${R} is a 2-node: moveRedRight(${P}). flipColors(${P}) brings ${P} down: ${L}, ${P} and ${R} form one temporary 4-node (a merge)`, { cur: P, compare: [L, R], multi: { node: [P] }, act: { kind: "flip", move: `flipColors(${P})` } });
    else frame(`${R} is a 2-node: moveRedRight(${P}). flipColors(${P}) brings ${P} down into one node with ${R} and the 3-node [${h.left.left.key}|${L}]: four keys, too many, so the merge becomes a borrow`, { cur: P, compare: [L, R], multi: { node: [P] }, act: { kind: "flip", move: `flipColors(${P})` } });
    if (isRed(h.left.left)) {
      h = rotateRight(h, t); setH(h);
      frame(`rotateRight(${P}): ${L} rises above ${P}`, { cur: L, compare: [P], act: { kind: "rotate", move: `rotateRight(${P})` } });
      flipColors(h, t);
      frame(`flipColors(${L}): ${L} goes up, and ${P} and ${R} form a 3-node (the borrow: ${P} down, ${L} up)`, { cur: L, compare: [P, R], multi: { node: [R], key: [L] }, act: { kind: "flip", move: `flipColors(${L})` } });
      moves.push(`rotateRight(${P})`, `flipColors(${L})`);
    }
    t.frames[t.frames.length - 1].highlight.act.moveRed = { side: "right", moves, borrow: moves.length > 1 };
    return h;
  };
  const deleteMin = (h, setH) => {
    if (h.left === null) {
      frame(`${h.key} has no left child: it is the minimum, in a 3-node or a 4-node here, so remove it`, { danger: h.key, act: { kind: "remove", key: h.key } });
      setH(null); t.count("free");
      return;
    }
    if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h, setH);
    frame(`at ${h.key}: go left, toward the minimum`, { cur: h.key, edges: [[h.key, h.left.key]], act: { kind: "descend" } });
    deleteMin(h.left, (x) => { h.left = x; });
    balance(h, setH);
  };
  const del = (h, setH) => {
    t.count("compare");
    if (key < h.key) {
      if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h, setH);
      frame(`at ${h.key}: ${key} < ${h.key}, go left`, { cur: h.key, edges: [[h.key, h.left.key]], act: { kind: "descend" } });
      del(h.left, (x) => { h.left = x; });
    } else {
      if (isRed(h.left)) {
        const was = h.key; h = rotateRight(h, t); setH(h);
        frame(`${was} has a red left link and the search goes right or stops here: rotateRight(${was}) moves the red link onto the path`, { cur: h.key, compare: [was], act: { kind: "rotate", move: `rotateRight(${was})` } });
      }
      if (key === h.key && h.right === null) {
        frame(`found ${key}, with no right child: a red leaf at the bottom, so remove it`, { danger: key, act: { kind: "remove", key } });
        setH(null); t.count("free");
        return;
      }
      if (!isRed(h.right) && !isRed(h.right.left)) h = moveRedRight(h, setH);
      if (key === h.key) {
        let m = h.right; while (m.left) m = m.left;
        frame(`found ${key}, with two children: its successor ${m.key}, the minimum of its right subtree, takes its place; delete ${m.key} there`, { cur: key, compare: [m.key], act: { kind: "succ", key, by: m.key } });
        h.key = m.key; t.count("write");
        deleteMin(h.right, (x) => { h.right = x; });
      } else {
        frame(`at ${h.key}: ${key} > ${h.key}, go right`, { cur: h.key, edges: [[h.key, h.right.key]], act: { kind: "descend" } });
        del(h.right, (x) => { h.right = x; });
      }
    }
    balance(h, setH);
  };

  if (!isRed(root.left) && !isRed(root.right)) {
    root.red = true;
    frame(`delete ${key}: the root's links down are both black, so color the root red for now: the descent keeps the current node or its left child red`, { cur: root.key, act: { kind: "root-red" } });
  }
  del(box.current, (x) => { box.current = x; });
  if (box.current && box.current.red) {
    box.current.red = false;
    frame(`the root is always black: recolor ${box.current.key}`, { cur: box.current.key, act: { kind: "root-black" } });
  }
  frame(`done: ${key} deleted`, { act: { kind: "done" } });
  return { root: box.current, trace: t.trace() };
}

/** The demo's structure: the left-leaning red-black BST of redblack.js (its
 *  insert, search and build) with Sedgewick's top-down delete. Frames are
 *  {tree, multi}, the red-black BST and the 2-3 tree it encodes; mid-delete,
 *  the 2-3 view shows the temporary 4-nodes the descent makes. */
export class TopDownLLRB extends RedBlack {
  static from(root) { const s = new TopDownLLRB(); s.root = root; return s; }
  delete(key) {
    if (!this.root) { const t = new Tracer(); t.step(`delete ${key}: empty tree; nothing to do`, { snapshot: { tree: null, multi: null } }); return t.trace(); }
    const { root, trace } = llrbDeleteTopDown(this.root, key);
    this.root = root;
    trace.frames.forEach((f) => { f.snapshot = { tree: f.snapshot, multi: toTwoThree(f.snapshot) }; });
    return trace;
  }
}
