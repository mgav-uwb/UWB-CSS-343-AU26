// CSS 343 unified library: structures/redblack.js
// The left-leaning red-black BST (Sedgewick), implemented ONCE and instrumented
// via the Tracer. A red-black BST is a BST plus one bit per node, `red`, that
// marks the LINK from its parent as red or black; a red link glues two BST nodes
// into one 2-3-tree node. Left-leaning keeps every 3-node's extra link on the
// left, so each 2-3 tree has exactly one encoding.
//
// Every trace is told violation first: insert is a BST insert with a RED new
// node, then each broken rule is named and fixed (a right-leaning red link:
// rotateLeft; two reds in a row: rotateRight; two red children: flipColors; a
// red root: recolor). Delete is a BST delete (a key with two children swaps
// with its in-order PREDECESSOR, as the 2-3 delete does), then, when a black
// leaf goes, the missing black is shown as an EMPTY node and repaired bottom-up
// by the 2-3 borrow or merge, expressed as rotations and recolorings. The
// result is the same 2-3 tree TwoThree.delete produces (tests/redblack.test.mjs).
//
// Frames carry {tree, multi}: TreeRenderer draws `tree`, MultiwayTreeRenderer
// draws `multi`, the 2-3 tree the red-black tree encodes (toTwoThree). build()
// is silent; insert/delete/search/move return a Trace the Player scrubs.

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

// rotateLeft: x = h.right rises; h becomes x's left child and turns red; x
// inherits h's old color. Fixes a right-leaning red link ("lean it left").
export function rotateLeft(h, t = QUIET) {
  const x = h.right;
  h.right = x.left;
  x.left = h;
  x.red = h.red;
  h.red = true;
  t.count("rotation").count("link", 3);
  return x;
}

// rotateRight: x = h.left rises; mirror image of rotateLeft. Fixes two reds
// in a row leaning left.
export function rotateRight(h, t = QUIET) {
  const x = h.left;
  h.left = x.right;
  x.right = h;
  x.red = h.red;
  h.red = true;
  t.count("rotation").count("link", 3);
  return x;
}

// flipColors: h has two red children, a temporary 4-node. Split it: push the
// color up (h turns red, its children turn black).
export function flipColors(h, t = QUIET) {
  h.red = !h.red;
  h.left.red = !h.left.red;
  h.right.red = !h.right.red;
  t.count("visit", 3);
}

// The three insert fixes, applied bottom-up in this order (a rotateLeft can
// create the setup rotateRight looks for, and either can create two red
// children for flipColors, so each check re-reads the CURRENT h).
function fixUp(h, t) {
  if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h, t);
  if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h, t);
  if (isRed(h.left) && isRed(h.right)) flipColors(h, t);
  return h;
}

// silent insert (for build): same logic as insert(), no trace.
function insSilent(h, key) {
  if (!h) return node(key);
  if (key < h.key) h.left = insSilent(h.left, key);
  else if (key > h.key) h.right = insSilent(h.right, key);
  else return h;
  return fixUp(h, QUIET);
}

// ── the 2-3 tree a red-black tree encodes ─────────────────────────────────
/** The key of the EMPTY node a delete frame draws where a black link is
 *  missing (the 2-3 node that lost its only key). Never in the live tree. */
export const EMPTY = "∅";

/** Collapse every red link into its parent: the 2-3 tree, as {keys, children}
 *  (MultiwayTreeRenderer's shape). An EMPTY node becomes a node with no keys.
 *  Mid-repair states can leave a cluster with some children missing; the
 *  children that exist are kept in order. */
export function toTwoThree(t) {
  if (!t) return null;
  if (t.hole) return { keys: [], children: t.left ? [toTwoThree(t.left)] : [] };
  const keys = [], kids = [];
  (function walk(n) {
    if (isRed(n.left)) walk(n.left); else kids.push(n.left);
    keys.push(n.key);
    if (isRed(n.right)) walk(n.right); else kids.push(n.right);
  })(t);
  return { keys, children: kids.filter(Boolean).map(toTwoThree) };
}

/** Encode a 2-3 tree ({keys, children}) as a red-black BST. A 2-node is one
 *  black node; a 3-node [a|b] is b black with a red left child a ("left"), or
 *  a black with a red right child b ("right"). */
export function fromTwoThree(n, lean = "left") {
  if (!n) return null;
  const k = (n.children || []).map((c) => fromTwoThree(c, lean));
  if (n.keys.length === 1) return rbNode(n.keys[0], false, k[0] ?? null, k[1] ?? null);
  const [a, b] = n.keys;
  return lean === "left"
    ? rbNode(b, false, rbNode(a, true, k[0] ?? null, k[1] ?? null), k[2] ?? null)
    : rbNode(a, false, k[0] ?? null, rbNode(b, true, k[1] ?? null, k[2] ?? null));
}

/** A frame's snapshot: a copy of the tree with an EMPTY node at `hole`
 *  ({parent, side}; parent null = above the root) holding the short subtree,
 *  and the 2-3 tree it encodes (`multi`, unless given: a repair in progress
 *  keeps showing the 2-3 tree it started from). */
function view(root, hole = null, multi) {
  const copy = new Map();
  const cp = (t) => { if (!t) return null; const c = { key: t.key, red: t.red, left: cp(t.left), right: cp(t.right) }; copy.set(t, c); return c; };
  let tree = cp(root);
  if (hole) {
    const e = { key: EMPTY, red: false, hole: true, left: null, right: null };
    if (!hole.parent) { e.left = tree; tree = e; }
    else { const p = copy.get(hole.parent); e.left = p[hole.side]; p[hole.side] = e; }
  }
  return { tree, multi: multi !== undefined ? multi : toTwoThree(tree) };
}

const n23 = (n) => `[${toTwoThree(n).keys.join("|")}]`;          // the 2-3 node rooted at black node n
const kind23 = (n) => (isRed(n.left) ? "3-node" : "2-node");

/** The conversion demo: a 2-3 tree encoded as a red-black BST one 2-3 node
 *  at a time (top down), then decoded back by collapsing red links. */
export function encodeTrace(tt, lean = "left") {
  const t = new Tracer();
  const order = []; const q = [tt];
  while (q.length) { const n = q.shift(); order.push(n); (n.children || []).forEach((c) => q.push(c)); }
  const idx = new Map(order.map((n, i) => [n, i]));
  const enc = (n) => {
    const k = (n.children || []).map(enc), i = idx.get(n);
    const mk = (key, red, l, r) => ({ key, red, left: l ?? null, right: r ?? null, at: i });
    if (n.keys.length === 1) return mk(n.keys[0], false, k[0], k[1]);
    const [a, b] = n.keys;
    return lean === "left" ? mk(b, false, mk(a, true, k[0], k[1]), k[2]) : mk(a, false, k[0], mk(b, true, k[1], k[2]));
  };
  const full = enc(tt);
  const rbUpTo = (x, i) => (x && x.at <= i ? { key: x.key, red: x.red, left: rbUpTo(x.left, i), right: rbUpTo(x.right, i) } : null);
  const ttUpTo = (n, i) => ({ keys: n.keys.slice(), children: (n.children || []).filter((c) => idx.get(c) <= i).map((c) => ttUpTo(c, i)) });
  const levels = (function d(n) { return 1 + ((n.children || []).length ? d(n.children[0]) : 0); })(tt);
  const side = lean === "left" ? "LEFT" : "RIGHT";
  const all = ttUpTo(tt, order.length);

  t.step(`a 2-3 tree with ${order.length} nodes on ${levels} level${levels > 1 ? "s" : ""}. Encode it one node at a time from the top: a 2-node becomes one black node, a 3-node two nodes joined by a red link`,
    { snapshot: { tree: null, multi: all }, highlight: {} });
  order.forEach((n, i) => {
    const kids = (n.children || []).length;
    let msg;
    if (n.keys.length === 1) msg = `[${n.keys[0]}] is a 2-node: it becomes the black node ${n.keys[0]}`;
    else {
      const [a, b] = n.keys, top = lean === "left" ? b : a, low = lean === "left" ? a : b;
      msg = `[${a}|${b}] is a 3-node: it becomes ${top}, black, with ${low} as its red ${side} child; the red link is the glue inside the 3-node`;
      if (kids) msg += lean === "left"
        ? `. Its three subtrees hang from ${a}'s left (keys below ${a}), ${a}'s right (between ${a} and ${b}) and ${b}'s right (above ${b})`
        : `. Its three subtrees hang from ${a}'s left (keys below ${a}), ${b}'s left (between ${a} and ${b}) and ${b}'s right (above ${b})`;
    }
    if (i && n.keys.length === 1) msg += `, hung from its parent by a black link`;
    t.step(msg, { snapshot: { tree: rbUpTo(full, i), multi: all }, highlight: { appear: n.keys, multi: { node: n.keys } } });
  });
  const clean = rbUpTo(full, order.length);
  t.step(lean === "left"
    ? `encoded. Every 2-3 edge became a black link, so every path from the root down crosses ${levels} black link${levels > 1 ? "s" : ""} (counting the root's), one per 2-3 level; every red link leans left. This is the left-leaning red-black BST of this 2-3 tree, and it is the only one`
    : `encoded, leaning RIGHT. It is just as valid an encoding: still a BST, ${levels} black link${levels > 1 ? "s" : ""} on every path. Left-leaning only picks one of the two ways to draw each 3-node, so that a 2-3 tree has exactly one encoding; a right-leaning tree would mirror every rule and every fix`,
  { snapshot: { tree: clean, multi: all }, highlight: {} });
  t.step(`now back: start from the red-black BST alone and collapse each red link into its parent, one 2-3 node at a time from the top`,
    { snapshot: { tree: clean, multi: null }, highlight: {} });
  order.forEach((n, i) => {
    const one = n.keys.length === 1;
    const [a, b] = n.keys, top = one ? a : lean === "left" ? b : a, low = lean === "left" ? a : b;
    const msg = one ? `${a} is black with no red child: the 2-node [${a}]`
      : `${top} is black and ${low} hangs from it by a red link: together the 3-node [${a}|${b}]`;
    t.step(msg, { snapshot: { tree: clean, multi: ttUpTo(tt, i) }, highlight: { cur: top, compare: one ? [] : [low], multi: { done: n.keys } } });
  });
  t.step(`the same 2-3 tree: collapsing the red links undoes the encoding, so a 2-3 tree and its red-black BST hold the same keys in the same order with the same height in black links`,
    { snapshot: { tree: clean, multi: all }, highlight: {} });
  return t.trace();
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
    if (!h) { t.step(`${name}(${key}): no node holds ${key}`, { snapshot: view(this.root) }); return t.trace(); }
    const setH = (x) => { if (!parent) this.root = x; else if (parent.left === h) parent.left = x; else parent.right = x; };
    const color = (n) => (isRed(n) ? "red" : "black");
    const order = () => keysOf(this.root).join(" ");
    const step = (msg, hl) => t.step(msg, { snapshot: view(this.root), highlight: hl });
    if (name === "flipColors") {
      const l = h.left, r = h.right;
      step(`before flipColors(${key}): ${key} has two red children, ${l.key} and ${r.key}: together one temporary 4-node [${l.key} | ${key} | ${r.key}]`,
        { cur: key, compare: [l.key, r.key], multi: { key: [l.key, key, r.key] } });
      flipColors(h, t);
      step(parent
        ? `after: ${l.key} and ${r.key} are black 2-nodes, and ${key}'s link is red: ${key} has moved up into ${parent.key}'s node. That is the 2-3 split: the middle key goes up, the outer two separate`
        : `after: ${l.key} and ${r.key} are black 2-nodes and ${key} is red; at the root the link is black by definition, so the tree grows one level`,
      { cur: key, ...(parent ? { compare: [parent.key] } : {}), multi: { key: [key] } });
      return t.trace();
    }
    const right = name === "rotateLeft";
    const x = right ? h.right : h.left, B = right ? x.left : x.right;
    const side = right ? "right" : "left", other = right ? "left" : "right";
    step(`before ${name}(${key}): ${x.key} is ${key}'s ${side} child by a ${color(x)} link; ${B ? `${x.key}'s ${other} subtree (${B.key}, the purple link) holds the keys between ${Math.min(key, x.key)} and ${Math.max(key, x.key)}` : `${x.key} has no ${other} child`}`,
      { cur: key, compare: [x.key], ...(B ? { edges: [[x.key, B.key]] } : {}), multi: { key: [key, x.key] } });
    const was = color(h), wasRed = isRed(x);
    const top = right ? rotateLeft(h, t) : rotateRight(h, t);
    setH(top);
    step(`after: ${x.key} rose and took ${key}'s old ${was} link; ${key} hangs from it by a RED ${other} link${B ? `; ${B.key} moved across to be ${key}'s ${side} child (the purple link)` : ""}. In-order is unchanged: ${order()}${wasRed ? ". The link turned was red, so the 2-3 tree is unchanged: the same 3-node, drawn the other way" : ""}`,
      { cur: x.key, compare: [key], ...(B ? { edges: [[key, B.key]] } : {}), multi: { key: [key, x.key] } });
    return t.trace();
  }

  build(keys) { for (const k of keys) { this.root = insSilent(this.root, k); this.root.red = false; } return this; }
  snapshot() { return view(this.root); }
  inorder() { return keysOf(this.root); }
  isRed(x) { return isRed(x); }
  /** The 2-3 tree this red-black tree encodes. */
  twoThree() { return toTwoThree(this.root); }

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

  /** Insert, violation first: BST descent (compares), the new node RED (why
   *  red), which rule that broke (in 2-3 terms), then each fix on the way up,
   *  each frame naming the violation it repairs. opts.fix === false stops
   *  after naming the violation (the catalog demo). */
  insert(key, opts = {}) {
    const fix = opts.fix !== false;
    const t = new Tracer();
    const step = (msg, hl = {}) => t.step(msg, { snapshot: view(this.root), highlight: hl });
    if (this.root == null) {
      this.root = node(key);
      this.root.red = false; // the root of an LLRB is always black
      t.count("alloc");
      step(`insert ${key}: the tree is empty, so ${key} becomes the root, black (the root's link is black by definition)`, { appear: key, multi: { done: [key] } });
      return t.trace();
    }

    // 1. the BST descent, remembering the path
    const path = [];
    let cur = this.root;
    for (;;) {
      path.push(cur);
      t.count("compare");
      const ks = path.map((p) => p.key);
      if (key === cur.key) { step(`${key} is already in the tree: no insert`, { danger: key, path: ks }); return t.trace(); }
      const dir = key < cur.key ? "left" : "right";
      step(`compare ${key} with ${cur.key}: go ${dir}${cur[dir] ? "" : `; ${cur.key} has no ${dir} child, so ${key} goes there`}`,
        { cur: cur.key, path: ks, multi: { path: ks } });
      if (!cur[dir]) break;
      cur = cur[dir];
    }

    // 2. attach the new node, RED
    const p = cur, dir = key < p.key ? "left" : "right";
    p[dir] = node(key);
    t.count("alloc").count("link");
    step(`${key} goes in as ${p.key}'s new ${dir} child, colored RED. A red link adds no black link to any path, so every path still crosses the same number of black links; a black ${key} would add one to the paths through it and to no others`,
      { appear: key, multi: { key: [key] } });

    // 3. which rule broke: the parent's 2-3 node, before and after
    const g = path.length > 1 ? path[path.length - 2] : null;
    let msg, ok = false;
    if (!isRed(p) && dir === "left") { ok = true; msg = `no violation: [${p.key}] was a 2-node, and ${key}'s red left link makes it the 3-node [${key}|${p.key}], leaning left as it should`; }
    else if (!isRed(p) && !isRed(p.left)) msg = `violation: a red link leans RIGHT. [${p.key}] was a 2-node and is now the 3-node [${p.key}|${key}], a legal 2-3 node drawn the wrong way: red links must lean left`;
    else if (!isRed(p)) msg = `violation: ${p.key} has two red links. [${p.left.key}|${p.key}] was a 3-node and now holds three keys, [${p.left.key}|${p.key}|${key}]: a 4-node, which a 2-3 tree does not allow`;
    else if (dir === "left") msg = `violation: two red links in a row (${g.key} to ${p.key} to ${key}). [${p.key}|${g.key}] was a 3-node and now holds [${key}|${p.key}|${g.key}]: a 4-node`;
    else msg = `violation: two red links in a row (${g.key} to ${p.key} to ${key}), the second leaning right. [${p.key}|${g.key}] was a 3-node and now holds [${p.key}|${key}|${g.key}]: a 4-node`;
    step(msg, { [ok ? "done" : "compare"]: [key], edges: [[p.key, key]], multi: { [ok ? "done" : "danger"]: [key] } });
    if (ok || !fix) return t.trace();

    // 4. the fixes, bottom-up along the path, each after the violation it
    // repairs; a flip passes a red link up, and the parent is checked the same way
    let named = true;   // the frame above named the first violation
    let raised = null;  // the key a flip just sent up, while it may still break a rule
    for (let i = path.length - 1; i >= 0; i--) {
      let h = path[i];
      const parent = i > 0 ? path[i - 1] : null;
      const wasLeft = parent ? parent.left === h : null;
      const put = (x) => rewire(this, parent, wasLeft, x);
      let fired = false;
      if (isRed(h.right) && !isRed(h.left)) {
        const was = h.key, up = h.right.key;
        if (!named) step(`violation at ${was}: a red link leans right (${was} to ${up})`,
          { cur: was, compare: [up], edges: [[was, up]], multi: { node: [was] } });
        h = rotateLeft(h, t); put(h); fired = true; named = false;
        step(`fix: rotateLeft(${was}). ${up} rises and ${was} hangs from it by a red LEFT link: the same 2-3 node, now leaning left`,
          { cur: h.key, compare: [was], edges: [[h.key, was]], multi: { node: [was] } });
      }
      if (isRed(h.left) && isRed(h.left.left)) {
        const was = h.key, a = h.left.key, b = h.left.left.key;
        if (!named) step(`violation at ${was}: two red links in a row on the left (${was} to ${a} to ${b}), the 4-node [${b}|${a}|${was}]`,
          { cur: was, compare: [a, b], edges: [[was, a], [a, b]], multi: { danger: [was] } });
        h = rotateRight(h, t); put(h); fired = true; named = false;
        step(`fix: rotateRight(${was}). ${a} rises, with ${b} and ${was} as its two red children: still the 4-node [${b}|${a}|${was}], now balanced around its middle key`,
          { cur: a, compare: [was, b], multi: { danger: [a] } });
      }
      if (isRed(h.left) && isRed(h.right)) {
        const l = h.left.key, r = h.right.key, m = h.key;
        if (!named) step(`violation at ${m}: two red children, the 4-node [${l}|${m}|${r}]`,
          { cur: m, compare: [l, r], edges: [[m, l], [m, r]], multi: { danger: [m] } });
        flipColors(h, t); named = false;
        step(`fix: flipColors(${m}). ${l} and ${r} turn black and ${m} turns red: the 2-3 split. ${l} and ${r} are 2-nodes, and ${m} moves up ${parent ? `into its parent's 2-3 node, so check there the same way` : "to the top"}`,
          { cur: m, compare: [l, r], multi: { node: [m], key: [m] } });
        raised = m;
        continue;
      }
      if (fired) { raised = null; continue; }
      // a red link sent up from below that breaks no rule at a BLACK node is
      // home: [.. | m | ..] has at most two keys and leans left. (At a red node
      // it is two reds in a row, which the next level up fixes.)
      if (raised != null && !isRed(h)) {
        step(`no violation at ${h.key}: ${raised} joins it as the 3-node ${n23(h)}, leaning left, so the repair stops here`,
          { cur: h.key, compare: [raised], multi: { done: [raised] } });
        raised = null;
        break;
      }
    }
    if (this.root.red) {
      const r = this.root.key;
      step(`violation: the root ${r} is red, but the root's link is black by definition`, { cur: r, multi: { node: [r] } });
      this.root.red = false;
      step(`fix: recolor ${r} black. Every path gains one black link, so the black heights stay equal: the tree is one level taller`, { cur: r, multi: { done: [r] } });
    }
    step(`done: ${key} inserted; red links lean left, no two reds in a row, and every path crosses the same number of black links`, { done: key, multi: { done: [key] } });
    return t.trace();
  }

  /** Delete, violation first: the BST delete (a key with two children swaps
   *  with its in-order predecessor), the removal at the bottom (a red leaf or
   *  a node with one child: no violation; a black leaf: a missing black, drawn
   *  as an EMPTY node), then the 2-3 repair one level at a time: BORROW when a
   *  sibling is a 3-node, MERGE otherwise (a merge under a 2-node parent moves
   *  the empty node up). opts.fix === false stops after naming the situation. */
  delete(key, opts = {}) {
    const fix = opts.fix !== false;
    const t = new Tracer();
    const step = (msg, hl = {}, hole = null, multi) => t.step(msg, { snapshot: view(this.root, hole, multi), highlight: hl });
    if (this.root == null) { step(`delete ${key}: the tree is empty; nothing to do`); return t.trace(); }

    // 1. the BST search
    const path = [];
    let h = this.root;
    while (h && h.key !== key) {
      path.push(h); t.count("compare");
      const dir = key < h.key ? "left" : "right", ks = path.map((p) => p.key);
      step(`compare ${key} with ${h.key}: go ${dir}`, { cur: h.key, path: ks, multi: { path: ks } });
      h = h[dir];
    }
    if (!h) { step(`${key} is not in the tree: nothing to delete`, { path: path.map((p) => p.key) }); return t.trace(); }
    t.count("compare");

    // 2. two children: swap with the in-order predecessor, so the key to
    // remove sits at the bottom with at most one child
    if (h.left && h.right) {
      path.push(h);
      let m = h.left;
      while (m.right) { path.push(m); m = m.right; }
      step(`found ${key}, with two children. Its in-order predecessor is ${m.key}, the largest key in its left subtree (one step left, then right to the end). The in-order successor, the smallest key in its right subtree, would work the same way, mirrored`,
        { cur: key, compare: [m.key], path: path.map((p) => p.key), multi: { key: [key, m.key] } });
      const pk = m.key;
      m.key = key; h.key = pk; t.count("write", 2);
      step(`swap ${key} and ${pk}: ${pk} takes ${key}'s place, where the order stays correct once ${key} is gone, and ${key} moves down to the bottom, where it has at most one child`,
        { danger: key, compare: [pk], multi: { danger: [key] } });
      h = m;
    }

    // 3. remove it: a red leaf, a node with one (red) child, or a black leaf
    const parent = path.length ? path[path.length - 1] : null;
    const side = parent ? (parent.left === h ? "left" : "right") : null;
    const set = (x) => { if (!parent) this.root = x; else parent[side] = x; };
    const done = () => { step(`done: ${key} deleted; every path crosses the same number of black links, and every red link leans left`); return t.trace(); };
    if (h.left || h.right) {
      const c = h.left || h.right;
      step(`${key} has one child, ${c.key}, a red leaf: [${c.key}|${key}] is a 3-node at the bottom of the 2-3 tree`, { danger: key, compare: [c.key], multi: { danger: [key] } });
      c.red = false; set(c); t.count("free");
      step(`remove ${key}: ${c.key} takes its place and turns black, so every path through it crosses the black links it did before. No violation: [${c.key}|${key}] is now the 2-node [${c.key}]`,
        { done: c.key, multi: { done: [c.key] } });
      return done();
    }
    if (isRed(h)) {
      step(`${key} is a red leaf: the smaller key of the 3-node [${key}|${parent.key}] at the bottom of the 2-3 tree`, { danger: key, multi: { danger: [key] } });
      set(null); t.count("free");
      step(`remove ${key}: only a red link goes with it, so every path keeps its black links. No violation: [${key}|${parent.key}] is now the 2-node [${parent.key}]`,
        { done: parent.key, multi: { done: [parent.key] } });
      return done();
    }
    if (!parent) { this.root = null; t.count("free"); step(`${key} was the only key: the tree is empty`); return t.trace(); }
    step(`${key} is a black leaf: [${key}], a 2-node at the bottom of the 2-3 tree`, { danger: key, multi: { danger: [key] } });
    set(null); t.count("free");
    let hole = { parent, side };
    step(`remove ${key}: its black link goes with it, so the paths through it now cross one black link fewer than every other path. Violation: unequal black heights. The dashed empty node marks the missing black: it is the empty 2-3 node a 2-3 delete leaves`,
      {}, hole);

    // 4. repair, bottom-up: each round looks at the empty node's parent and
    // sibling, exactly as the 2-3 delete does
    const anc = path.slice();                                  // root .. the empty node's parent
    const up = (n) => { const i = anc.indexOf(n); return i > 0 ? anc[i - 1] : null; };
    const put = (n, x) => { const q = up(n); if (!q) this.root = x; else if (q.left === n) q.left = x; else q.right = x; };
    while (hole) {
      const p = hole.parent;
      if (!p) {
        step(`the empty node is above the root: every path is missing the same black link, so the black heights are equal again. Remove it: the tree is one level shorter (in the 2-3 tree, the empty root goes and its child becomes the root)`, {}, hole);
        hole = null;
        break;
      }
      const sib = (n) => (isRed(n.left) ? `[${n.left.key}|${n.key}]` : `[${n.key}]`);
      let frozen;
      const situation = (msg, hl) => { step(msg, hl, hole); frozen = view(this.root, hole).multi; };
      const plan = (msg, hl) => step(msg, hl, hole, frozen);
      const move = (msg, hl) => step(msg, hl, hole, frozen);
      const finish = (msg, hl) => { hole = null; step(msg, hl); };

      if (!isRed(p) && hole.side === "left") {            // [p] a 2-node, the empty node its left child
        const s = p.right;
        situation(`the empty node is the left child of the 2-node [${p.key}]; its sibling ${sib(s)} is a ${kind23(s)}${isRed(s.left) ? ", which can spare a key" : ""}`,
          { cur: p.key, compare: [s.key], multi: { node: [p.key, s.key] } });
        if (!fix) break;
        if (isRed(s.left)) {
          const c = s.left;
          plan(`fix: BORROW, as in a 2-3 tree: ${p.key} comes down into the empty node and ${c.key} goes up to take its place. In red-black terms: rotateRight(${s.key}), rotateLeft(${p.key}), then recolor ${p.key} and ${s.key} black`,
            { cur: p.key, compare: [c.key], multi: { key: [p.key, c.key] } });
          p.right = rotateRight(s, t);
          move(`rotateRight(${s.key}): ${c.key} rises inside the sibling, next to ${p.key}`, { cur: c.key, compare: [s.key] });
          const top = rotateLeft(p, t); put(p, top);
          move(`rotateLeft(${p.key}): ${c.key} rises into ${p.key}'s place, and ${p.key} drops toward the empty node`, { cur: c.key, compare: [p.key] });
          p.red = false; s.red = false;
          finish(`recolor ${p.key} and ${s.key} black: ${p.key} fills the empty node and ${s.key} is a 2-node again. The 2-3 tree reads [${c.key}] over [${p.key}] and [${s.key}], and every path has its black links back`,
            { cur: c.key, compare: [p.key, s.key], multi: { key: [p.key, c.key] } });
        } else {
          plan(`fix: MERGE, as in a 2-3 tree: ${p.key} comes down and joins ${s.key}, so the empty node, ${p.key} and [${s.key}] become the one 3-node [${p.key}|${s.key}]. [${p.key}] loses its only key, so the empty node moves up a level. In red-black terms: recolor ${s.key} red, then rotateLeft(${p.key})`,
            { cur: p.key, compare: [s.key], multi: { key: [p.key, s.key] } });
          s.red = true;
          move(`recolor ${s.key} red: ${s.key} joins ${p.key}'s 2-3 node, but that red link leans right`, { cur: p.key, compare: [s.key], edges: [[p.key, s.key]] });
          const top = rotateLeft(p, t); put(p, top);
          const pp = up(p); anc.pop();
          hole = { parent: pp, side: pp ? (pp.left === top ? "left" : "right") : null };
          step(`rotateLeft(${p.key}), the insert fix for a right-leaning red link: [${p.key}|${s.key}] is ${s.key} with a red left child ${p.key}. The 2-node [${p.key}] gave up its only key, so the empty node is now one level up: the whole subtree below it is one black link short, and the repair repeats there`,
            { cur: s.key, compare: [p.key], multi: { node: [s.key] } }, hole);
        }
        continue;
      }
      if (!isRed(p) && !isRed(p.left)) {                   // [p] a 2-node, the empty node its right child
        const s = p.left;
        situation(`the empty node is the right child of the 2-node [${p.key}]; its sibling ${sib(s)} is a ${kind23(s)}${isRed(s.left) ? ", which can spare a key" : ""}`,
          { cur: p.key, compare: [s.key], multi: { node: [p.key, s.key] } });
        if (!fix) break;
        if (isRed(s.left)) {
          const c = s.left;
          plan(`fix: BORROW: ${p.key} comes down into the empty node and ${s.key} goes up to take its place. In red-black terms: rotateRight(${p.key}), then recolor ${c.key} and ${p.key} black`,
            { cur: p.key, compare: [s.key], multi: { key: [p.key, s.key] } });
          const top = rotateRight(p, t); put(p, top);
          move(`rotateRight(${p.key}): ${s.key} rises into ${p.key}'s place, and ${p.key} drops toward the empty node`, { cur: s.key, compare: [p.key] });
          c.red = false; p.red = false;
          finish(`recolor ${c.key} and ${p.key} black: ${p.key} fills the empty node and ${c.key} is a 2-node. The 2-3 tree reads [${s.key}] over [${c.key}] and [${p.key}], and every path has its black links back`,
            { cur: s.key, compare: [c.key, p.key], multi: { key: [p.key, s.key] } });
        } else {
          plan(`fix: MERGE: [${s.key}], ${p.key} and the empty node become the one 3-node [${s.key}|${p.key}]. [${p.key}] loses its only key, so the empty node moves up a level. In red-black terms: recolor ${s.key} red`,
            { cur: p.key, compare: [s.key], multi: { key: [p.key, s.key] } });
          s.red = true;
          const pp = up(p); anc.pop();
          hole = { parent: pp, side: pp ? (pp.left === p ? "left" : "right") : null };
          step(`recolor ${s.key} red: [${s.key}|${p.key}] is ${p.key} with a red left child, a valid 3-node. The 2-node [${p.key}] gave up its only key, so the empty node is now one level up, and the repair repeats there`,
            { cur: p.key, compare: [s.key], multi: { node: [p.key] } }, hole);
        }
        continue;
      }

      // a 3-node parent [r|g]: g black, r its red left child
      const r = isRed(p) ? p : p.left, g = isRed(p) ? up(p) : p;
      const P = `[${r.key}|${g.key}]`;
      if (isRed(p) && hole.side === "left") {             // the empty node is the 3-node's left child
        const t1 = r.right;
        situation(`the empty node is the left child of the 3-node ${P}; its sibling ${sib(t1)} (the middle child) is a ${kind23(t1)}${isRed(t1.left) ? ", which can spare a key" : ""}`,
          { cur: r.key, compare: [t1.key], multi: { node: [r.key, t1.key] } });
        if (!fix) break;
        if (isRed(t1.left)) {
          const c = t1.left;
          plan(`fix: BORROW: ${r.key} comes down into the empty node and ${c.key} goes up to take its place, so the parent becomes [${c.key}|${g.key}]. In red-black terms: rotateRight(${t1.key}), rotateLeft(${r.key}), then recolor ${r.key} and ${t1.key} black`,
            { cur: r.key, compare: [c.key], multi: { key: [r.key, c.key] } });
          r.right = rotateRight(t1, t);
          move(`rotateRight(${t1.key}): ${c.key} rises inside the sibling, next to ${r.key}`, { cur: c.key, compare: [t1.key] });
          g.left = rotateLeft(r, t);
          move(`rotateLeft(${r.key}): ${c.key} rises into ${r.key}'s place, and ${r.key} drops toward the empty node`, { cur: c.key, compare: [r.key] });
          r.red = false; t1.red = false;
          finish(`recolor ${r.key} and ${t1.key} black: ${r.key} fills the empty node and ${t1.key} is a 2-node again. The parent reads [${c.key}|${g.key}], and every path has its black links back`,
            { cur: c.key, compare: [r.key, t1.key], multi: { key: [r.key, c.key] } });
        } else {
          plan(`fix: MERGE: ${r.key} comes down and joins ${t1.key}, so the empty node, ${r.key} and [${t1.key}] become [${r.key}|${t1.key}]. ${P} was a 3-node, so it keeps ${g.key} and nothing moves up. In red-black terms: recolor ${r.key} black and ${t1.key} red, then rotateLeft(${r.key})`,
            { cur: r.key, compare: [t1.key], multi: { key: [r.key, t1.key] } });
          r.red = false; t1.red = true;
          move(`recolor ${r.key} black and ${t1.key} red: ${r.key} leaves ${g.key}'s 2-3 node and ${t1.key} joins ${r.key}'s, but that red link leans right`, { cur: r.key, compare: [t1.key], edges: [[r.key, t1.key]] });
          g.left = rotateLeft(r, t);
          finish(`rotateLeft(${r.key}), the insert fix for a right-leaning red link: [${r.key}|${t1.key}] is ${t1.key} with a red left child ${r.key}, under the 2-node [${g.key}]. Every path has its black links back`,
            { cur: t1.key, compare: [r.key], multi: { key: [r.key, t1.key] } });
        }
        continue;
      }
      if (isRed(p)) {                                      // the empty node is the 3-node's middle child
        const t0 = r.left, t2 = g.right;
        situation(`the empty node is the middle child of the 3-node ${P}; its siblings are ${sib(t0)} on the left, a ${kind23(t0)}, and ${sib(t2)} on the right, a ${kind23(t2)}`,
          { cur: r.key, compare: [t0.key, t2.key], multi: { node: [r.key, t0.key, t2.key] } });
        if (!fix) break;
        if (isRed(t0.left)) {
          const c = t0.left;
          plan(`fix: BORROW from the left sibling: ${r.key} comes down into the empty node and ${t0.key} goes up to take its place, so the parent becomes [${t0.key}|${g.key}]. In red-black terms: rotateRight(${r.key}), then recolor ${c.key} and ${r.key} black`,
            { cur: r.key, compare: [t0.key], multi: { key: [r.key, t0.key] } });
          g.left = rotateRight(r, t);
          move(`rotateRight(${r.key}): ${t0.key} rises into ${r.key}'s place, and ${r.key} drops toward the empty node`, { cur: t0.key, compare: [r.key] });
          c.red = false; r.red = false;
          finish(`recolor ${c.key} and ${r.key} black: ${r.key} fills the empty node and ${c.key} is a 2-node. The parent reads [${t0.key}|${g.key}], and every path has its black links back`,
            { cur: t0.key, compare: [c.key, r.key], multi: { key: [r.key, t0.key] } });
        } else if (isRed(t2.left)) {
          const c = t2.left;
          plan(`fix: the left sibling is a 2-node, so BORROW from the right one: ${g.key} comes down into the empty node and ${c.key} goes up to take its place, so the parent becomes [${r.key}|${c.key}]. In red-black terms: rotateRight(${t2.key}), rotateLeft(${g.key}), rotateRight(${g.key}), then recolor ${g.key} and ${t2.key} black`,
            { cur: g.key, compare: [c.key], multi: { key: [g.key, c.key] } });
          g.right = rotateRight(t2, t);
          move(`rotateRight(${t2.key}): ${c.key} rises inside the right sibling, next to ${g.key}`, { cur: c.key, compare: [t2.key] });
          const top = rotateLeft(g, t); put(g, top);
          move(`rotateLeft(${g.key}): ${c.key} rises into ${g.key}'s place; ${g.key} drops, with ${r.key} still its red left child`, { cur: c.key, compare: [g.key] });
          c.left = rotateRight(g, t);
          hole = { parent: g, side: "left" };
          move(`rotateRight(${g.key}): ${r.key} rises above ${g.key}, so [${r.key}|${c.key}] leans left again, and ${g.key} sits just above the empty node`, { cur: r.key, compare: [g.key] });
          g.red = false; t2.red = false;
          finish(`recolor ${g.key} and ${t2.key} black: ${g.key} fills the empty node and ${t2.key} is a 2-node again. The parent reads [${r.key}|${c.key}], and every path has its black links back`,
            { cur: c.key, compare: [g.key, t2.key], multi: { key: [g.key, c.key] } });
        } else {
          plan(`fix: no sibling can spare a key, so MERGE with the left sibling: [${t0.key}], ${r.key} and the empty node become [${t0.key}|${r.key}]. ${P} was a 3-node, so it keeps ${g.key} and nothing moves up. In red-black terms: recolor ${r.key} black and ${t0.key} red`,
            { cur: r.key, compare: [t0.key], multi: { key: [r.key, t0.key] } });
          r.red = false; t0.red = true;
          finish(`recolor ${r.key} black and ${t0.key} red: [${t0.key}|${r.key}] is ${r.key} with a red left child ${t0.key}, under the 2-node [${g.key}]. Every path has its black links back`,
            { cur: r.key, compare: [t0.key], multi: { key: [r.key, t0.key] } });
        }
        continue;
      }
      // the empty node is the 3-node's right child (g's right)
      const t1 = r.right;
      situation(`the empty node is the right child of the 3-node ${P}; its sibling ${sib(t1)} (the middle child) is a ${kind23(t1)}${isRed(t1.left) ? ", which can spare a key" : ""}`,
        { cur: g.key, compare: [t1.key], multi: { node: [g.key, t1.key] } });
      if (!fix) break;
      if (isRed(t1.left)) {
        const c = t1.left;
        plan(`fix: BORROW: ${g.key} comes down into the empty node and ${t1.key} goes up to take its place, so the parent becomes [${r.key}|${t1.key}]. In red-black terms: rotateLeft(${r.key}), rotateRight(${g.key}), then recolor ${c.key} and ${g.key} black`,
          { cur: g.key, compare: [t1.key], multi: { key: [g.key, t1.key] } });
        g.left = rotateLeft(r, t);
        move(`rotateLeft(${r.key}): ${t1.key} rises above ${r.key}, next to ${g.key}`, { cur: t1.key, compare: [r.key] });
        const top = rotateRight(g, t); put(g, top);
        move(`rotateRight(${g.key}): ${t1.key} rises into ${g.key}'s place, and ${g.key} drops toward the empty node`, { cur: t1.key, compare: [g.key] });
        c.red = false; g.red = false;
        finish(`recolor ${c.key} and ${g.key} black: ${g.key} fills the empty node and ${c.key} is a 2-node. The parent reads [${r.key}|${t1.key}], and every path has its black links back`,
          { cur: t1.key, compare: [c.key, g.key], multi: { key: [g.key, t1.key] } });
      } else {
        plan(`fix: MERGE: [${t1.key}], ${g.key} and the empty node become [${t1.key}|${g.key}]. ${P} was a 3-node, so it keeps ${r.key} and nothing moves up. In red-black terms: rotateRight(${g.key}), then recolor ${g.key} black and ${t1.key} red`,
          { cur: g.key, compare: [t1.key], multi: { key: [g.key, t1.key] } });
        const top = rotateRight(g, t); put(g, top);
        move(`rotateRight(${g.key}): ${r.key} rises into ${g.key}'s place, and ${g.key} hangs from it by a red link, above ${t1.key} and the empty node`, { cur: r.key, compare: [g.key] });
        g.red = false; t1.red = true;
        finish(`recolor ${g.key} black and ${t1.key} red: [${t1.key}|${g.key}] is ${g.key} with a red left child ${t1.key}, under the 2-node [${r.key}]. Every path has its black links back`,
          { cur: g.key, compare: [t1.key], multi: { key: [g.key, t1.key] } });
      }
    }
    if (!fix) return t.trace();
    return done();
  }

  /** Search with a trace of key comparisons down one root-to-leaf path. */
  search(key) {
    const t = new Tracer();
    let cur = this.root; const path = [];
    while (cur) {
      path.push(cur.key); t.count("compare");
      if (key === cur.key) { t.step(`found ${key}`, { snapshot: view(this.root), highlight: { done: key, path, multi: { done: [key] } } }); return t.trace(); }
      t.step(`compare ${key} with ${cur.key}: go ${key < cur.key ? "left" : "right"}`,
        { snapshot: view(this.root), highlight: { cur: cur.key, path, multi: { path } } });
      cur = key < cur.key ? cur.left : cur.right;
    }
    t.step(`${key} not found`, { snapshot: view(this.root), highlight: { path } });
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
