// CSS 343 unified library: structures/bplus.js
// The B+ tree of order M, as databases use it. Every key (with its record)
// lives in a LEAF, and the leaves are linked left to right into a sorted
// chain; internal nodes hold only ROUTERS, copies of keys that direct a
// descent. Router rule: at a node with routers s1 < s2 < ..., a key k goes
// to child i, where i = the number of routers <= k (equal goes RIGHT), so a
// router is the smallest key of the subtree to its right when it is made.
//
//   leaf:     M-1 keys at most; a non-root leaf keeps >= floor(M/2)
//   internal: M-1 routers / M children at most; a non-root one keeps
//             >= ceil(M/2)-1 routers (the B-tree bound)
//
// Insert lands in a leaf. A leaf that reaches M keys splits: the left half
// keeps ceil(M/2) keys, the new right leaf is linked into the chain, and its
// first key is COPIED up as a router (it stays in the leaf: its record lives
// there). A router node that reaches M routers splits B-tree style: its
// middle router MOVES up. Delete removes from the leaf; an underflowing leaf
// borrows from a sibling (the router between them becomes the new boundary)
// or merges with one (unlinking a leaf and DROPPING the router; nothing comes
// down, since leaf routers are copies). Router nodes underflow and borrow or
// merge exactly as in a B-tree. A router whose key has been deleted stays: it
// still separates its children correctly. Range [lo, hi] descends ONCE for lo
// and then walks the leaf chain, never returning to the routers.
//
// Snapshots are {id, keys, children, next?} trees for MultiwayTreeRenderer
// with its leafLinks option: node ids make highlights point at ONE copy of a
// key (a key can be a router and a leaf key at once), `next` is the leaf
// chain as ids. Cost model: `read` = one node read (one disk block),
// `compare` = one key comparison, `write` = one key written, `alloc` = a node.

import { Tracer } from "../core/tracer.js";

const isLeaf = (n) => !n.children.length;
const list = (keys) => `[${keys.join("|") || " "}]`;
const short = (n, min) => `has ${n} router${n === 1 ? "" : "s"} (needs at least ${min})`;

/** A tracer that records nothing: build() and the untraced references run the
 *  same algorithms as the traced ops, without the frames. */
const SILENT = { silent: true, step() {}, count() {} };

export class BPlusTree {
  /** @param {number} order M: a node holds up to M-1 keys, a router node up to M children. */
  constructor(order = 4) {
    this.M = Math.max(3, order | 0);
    this.root = null;
    this._nid = 0;
  }

  get leafMin() { return Math.floor(this.M / 2); }
  get routerMin() { return Math.ceil(this.M / 2) - 1; }

  _leaf(keys) { this._nid++; return { id: this._nid, keys, children: [], next: null }; }
  _router(keys, children) { this._nid++; return { id: this._nid, keys, children }; }

  // ── state ───────────────────────────────────────────────────────────
  build(keys) { for (const k of keys) this._insert(k, SILENT); return this; }

  snapshot() {
    const copy = (n) => (isLeaf(n)
      ? { id: n.id, keys: n.keys.slice(), children: [], next: n.next ? n.next.id : null }
      : { id: n.id, keys: n.keys.slice(), children: n.children.map(copy) });
    return this.root ? copy(this.root) : null;
  }

  /** Every key, read along the leaf chain (the B+ tree's sorted order). */
  keys() {
    const out = [];
    for (let l = this._leftmostLeaf(); l; l = l.next) out.push(...l.keys);
    return out;
  }
  inorder() { return this.keys(); }
  height() { let h = -1; for (let n = this.root; n; n = n.children[0]) h++; return h; }
  leafCount() { let c = 0; for (let l = this._leftmostLeaf(); l; l = l.next) c++; return c; }
  _leftmostLeaf() { let n = this.root; while (n && !isLeaf(n)) n = n.children[0]; return n; }

  /** Untraced references (the tests compare the traced ops against these). */
  has(key) { const leaf = this._descend(key, SILENT).leaf; return !!leaf && leaf.keys.includes(key); }
  rangeKeys(lo, hi) { return this.keys().filter((k) => k >= lo && k <= hi); }

  /** The invariants, as a list of violations (empty = a valid B+ tree):
   *  every leaf at one depth, node sizes within bounds, routers sorted and
   *  separating their children, and the leaf chain visiting every leaf in
   *  left-to-right order with strictly increasing keys. */
  violations() {
    const bad = [];
    if (!this.root) return bad;
    const M = this.M, leaves = [];
    let leafDepth = -1;
    const walk = (n, depth, lo, hi, isRoot) => {
      for (let i = 1; i < n.keys.length; i++) if (!(n.keys[i - 1] < n.keys[i])) bad.push(`node ${list(n.keys)}: keys not increasing`);
      if (n.keys.length > M - 1) bad.push(`node ${list(n.keys)}: more than ${M - 1} keys`);
      if (isLeaf(n)) {
        if (leafDepth < 0) leafDepth = depth; else if (depth !== leafDepth) bad.push(`leaf ${list(n.keys)} at depth ${depth}, others at ${leafDepth}`);
        if (!isRoot && n.keys.length < this.leafMin) bad.push(`leaf ${list(n.keys)}: fewer than ${this.leafMin} keys`);
        if (!n.keys.length && !isRoot) bad.push("empty leaf");
        n.keys.forEach((k) => { if ((lo != null && k < lo) || (hi != null && k >= hi)) bad.push(`key ${k} outside its routers [${lo}, ${hi})`); });
        leaves.push(n);
        return;
      }
      if (n.children.length !== n.keys.length + 1) bad.push(`router node ${list(n.keys)}: ${n.children.length} children`);
      if (!isRoot && n.keys.length < this.routerMin) bad.push(`router node ${list(n.keys)}: fewer than ${this.routerMin} routers`);
      if (isRoot && !n.keys.length) bad.push("router root with no routers");
      n.keys.forEach((k) => { if ((lo != null && k < lo) || (hi != null && k >= hi)) bad.push(`router ${k} outside [${lo}, ${hi})`); });
      n.children.forEach((c, i) => walk(c, depth + 1, i ? n.keys[i - 1] : lo, i < n.keys.length ? n.keys[i] : hi, false));
    };
    walk(this.root, 0, null, null, true);
    let l = this._leftmostLeaf(), i = 0, prev = -Infinity;
    for (; l && i <= leaves.length; l = l.next, i++) {
      if (l !== leaves[i]) { bad.push(`leaf chain step ${i} is not the next leaf in tree order`); break; }
      for (const k of l.keys) { if (!(k > prev)) bad.push(`leaf chain not increasing at ${k}`); prev = k; }
    }
    if (i !== leaves.length) bad.push(`leaf chain visits ${i} of ${leaves.length} leaves`);
    return bad;
  }
  isValid() { return this.violations().length === 0; }

  // ── frames ──────────────────────────────────────────────────────────
  _f(t, msg, hl = {}) { if (!t.silent) t.step(msg, { snapshot: this.snapshot(), highlight: hl }); }
  static _cells(n, keys) { return keys.map((k) => `${n.id}:${k}`); }

  /** Router choice at an internal node, with the comparisons that decide it. */
  _route(n, key, t) {
    let i = 0;
    while (i < n.keys.length) { t.count("compare"); if (key < n.keys[i]) break; i++; }
    const ks = n.keys;
    const why = i === 0 ? `${key} < ${ks[0]}`
      : i === ks.length ? `${key} ≥ ${ks[ks.length - 1]}`
        : `${ks[i - 1]} ≤ ${key} < ${ks[i]}`;
    const deciding = [ks[i - 1], ks[i]].filter((k) => k != null);
    return { i, why, deciding };
  }

  /** Descend from the root to the leaf where `key` belongs, one frame per
   *  router node read. Returns the leaf and the path [{node, idx}]. */
  _descend(key, t, verb = "") {
    const path = [], seen = [];
    let n = this.root;
    if (!n) return { leaf: null, path };
    while (!isLeaf(n)) {
      t.count("read");
      const { i, why, deciding } = this._route(n, key, t);
      seen.push(n.id);
      const routerHit = n.keys.includes(key)
        ? ` (equal goes right: router ${key} is a copy of the first key of the subtree to its right, with no record, so keep going down to the leaf)` : "";
      this._f(t, `${verb}router node ${list(n.keys)}: ${why}, so follow child ${i}${routerHit}`,
        { nodeId: [n.id], pathId: seen.slice(), cell: BPlusTree._cells(n, deciding) });
      path.push({ node: n, idx: i });
      n = n.children[i];
    }
    t.count("read");
    return { leaf: n, path, seen };
  }

  // ── search ──────────────────────────────────────────────────────────
  search(key) {
    const t = new Tracer();
    if (!this.root) { t.step(`search ${key}: the tree is empty`, { snapshot: null }); return t.trace(); }
    const { leaf, seen } = this._descend(key, t, `search ${key}: `);
    const pathId = [...seen, leaf.id];
    let at = -1;
    for (let j = 0; j < leaf.keys.length; j++) { t.count("compare"); if (leaf.keys[j] >= key) { at = j; break; } }
    if (at >= 0 && leaf.keys[at] === key) {
      this._f(t, `leaf ${list(leaf.keys)}: found ${key}; its record lives here, in the leaf (${t.counters.read} node reads)`,
        { nodeId: [leaf.id], pathId, doneCell: [`${leaf.id}:${key}`] });
    } else {
      this._f(t, `leaf ${list(leaf.keys)}: no ${key} here, so ${key} is not in the tree (every key lives in a leaf)`,
        { dangerId: [leaf.id], pathId });
    }
    return t.trace();
  }

  // ── range ───────────────────────────────────────────────────────────
  /** Every key in [lo, hi]: ONE descent for lo, then a walk along the leaf chain. */
  range(lo, hi) {
    const t = new Tracer();
    if (hi < lo) [lo, hi] = [hi, lo];
    if (!this.root) { t.step(`range ${lo}..${hi}: the tree is empty`, { snapshot: null }); return t.trace(); }
    const { leaf, seen } = this._descend(lo, t, `range ${lo}..${hi}, descend for ${lo}: `);
    const out = [], emitted = [], leafIds = [leaf.id];
    const hl = (extra) => ({ pathId: seen.slice(), doneCell: emitted.slice(), visitId: leafIds.slice(), ...extra });
    let n = leaf, j = 0;
    while (j < n.keys.length && (t.count("compare"), n.keys[j] < lo)) j++;
    this._f(t, j < n.keys.length
      ? `leaf ${list(n.keys)}: the first key ≥ ${lo} is ${n.keys[j]}; start the scan there`
      : `leaf ${list(n.keys)}: every key here is < ${lo}; the scan starts in the next leaf`,
    hl({ nodeId: [n.id], cell: j < n.keys.length ? [`${n.id}:${n.keys[j]}`] : [] }));
    for (;;) {
      if (j >= n.keys.length) {
        if (!n.next) {
          this._f(t, `end of the leaf chain: stop. Result ${out.join(", ") || "(none)"}: ${out.length} key${out.length === 1 ? "" : "s"}, ${t.counters.read} node reads`, hl({}));
          return t.trace();
        }
        t.count("read");
        const from = n;
        n = n.next; j = 0; leafIds.push(n.id);
        this._f(t, `end of leaf ${list(from.keys)}: follow its NEXT link to ${list(n.keys)} (no climb back through the routers)`,
          hl({ nodeId: [n.id], link: [from.id] }));
        continue;
      }
      const k = n.keys[j];
      t.count("compare");
      if (k > hi) {
        this._f(t, `${k} > ${hi}: past the high end, stop. Result ${out.join(", ") || "(none)"}: ${out.length} key${out.length === 1 ? "" : "s"}, ${t.counters.read} node reads (${seen.length} router${seen.length === 1 ? "" : "s"}, ${leafIds.length} lea${leafIds.length === 1 ? "f" : "ves"})`,
          hl({ nodeId: [n.id], dangerCell: [`${n.id}:${k}`] }));
        return t.trace();
      }
      out.push(k); emitted.push(`${n.id}:${k}`);
      this._f(t, `${k} is in [${lo}, ${hi}]: emit it (${out.length} so far)`, hl({ nodeId: [n.id] }));
      j++;
    }
  }

  // ── insert ──────────────────────────────────────────────────────────
  insert(key) { const t = new Tracer(); this._insert(key, t); return t.trace(); }

  _insert(key, t) {
    const M = this.M;
    if (!this.root) {
      this.root = this._leaf([key]);
      t.count("alloc"); t.count("write");
      this._f(t, `insert ${key}: the tree is empty; ${key} becomes the root leaf`, { doneCell: [`${this.root.id}:${key}`] });
      return;
    }
    const { leaf, path, seen } = this._descend(key, t, `insert ${key}: `);
    const pathId = [...seen, leaf.id];
    let at = 0;
    while (at < leaf.keys.length && (t.count("compare"), leaf.keys[at] < key)) at++;
    if (leaf.keys[at] === key) {
      this._f(t, `${key} is already in leaf ${list(leaf.keys)}: an index holds each key once, no change`,
        { dangerCell: [`${leaf.id}:${key}`], pathId });
      return;
    }
    leaf.keys.splice(at, 0, key);
    t.count("write");
    this._f(t, `insert ${key} into leaf → ${list(leaf.keys)}`, { nodeId: [leaf.id], pathId, doneCell: [`${leaf.id}:${key}`] });
    if (leaf.keys.length < M) { this._f(t, `done: ${key} inserted; the leaf has room (at most ${M - 1} keys)`, { doneCell: [`${leaf.id}:${key}`] }); return; }

    // leaf split: the left half stays in place (the previous leaf's link still points at it)
    this._f(t, `leaf ${list(leaf.keys)} holds ${M} keys (at most ${M - 1}): split it`, { dangerId: [leaf.id] });
    const keep = Math.ceil(M / 2);
    const right = this._leaf(leaf.keys.splice(keep));
    right.next = leaf.next; leaf.next = right;
    const sep = right.keys[0];
    t.count("alloc"); t.count("write", right.keys.length); t.count("link", 2);
    const told = `split into ${list(leaf.keys)} → ${list(right.keys)}, the new leaf linked into the chain; COPY ${sep} up as a router (${sep} stays in the leaf, where its record lives)`;
    if (!path.length) {
      this.root = this._router([sep], [leaf, right]);
      t.count("alloc"); t.count("write");
      this._f(t, `${told}: into a NEW root, so the tree grows one level`,
        { nodeId: [this.root.id], cell: [`${this.root.id}:${sep}`], link: [leaf.id] });
      this._f(t, `done: ${key} inserted; every leaf is at the same depth`, {});
      return;
    }
    let { node: parent, idx } = path.pop();
    parent.keys.splice(idx, 0, sep);
    parent.children.splice(idx + 1, 0, right);
    t.count("write");
    this._f(t, `${told}: router node → ${list(parent.keys)}`, { nodeId: [parent.id], cell: [`${parent.id}:${sep}`], link: [leaf.id] });

    // router splits cascade: the middle router MOVES up (B-tree style)
    let node = parent;
    while (node.keys.length === M) {
      this._f(t, `router node ${list(node.keys)} holds ${M} routers (at most ${M - 1}): split it`, { dangerId: [node.id] });
      const mid = Math.floor((M - 1) / 2);
      const up = node.keys[mid];
      const sib = this._router(node.keys.splice(mid + 1), node.children.splice(mid + 1));
      node.keys.pop(); // `up` leaves this node: a router is only a signpost, no copy stays below
      t.count("alloc"); t.count("write", sib.keys.length + 1);
      const told2 = `split into ${list(node.keys)} and ${list(sib.keys)}; MOVE ${up} up (unlike a leaf split, no copy stays below)`;
      if (!path.length) {
        this.root = this._router([up], [node, sib]);
        t.count("alloc");
        this._f(t, `${told2}: into a NEW root, so the tree grows one level`, { nodeId: [this.root.id], cell: [`${this.root.id}:${up}`] });
        break;
      }
      ({ node: parent, idx } = path.pop());
      parent.keys.splice(idx, 0, up);
      parent.children.splice(idx + 1, 0, sib);
      this._f(t, `${told2}: router node → ${list(parent.keys)}`, { nodeId: [parent.id], cell: [`${parent.id}:${up}`] });
      node = parent;
    }
    this._f(t, `done: ${key} inserted; every leaf is at the same depth and the chain lists every key in order`, {});
  }

  // ── delete ──────────────────────────────────────────────────────────
  delete(key) { const t = new Tracer(); this._delete(key, t); return t.trace(); }

  _delete(key, t) {
    if (!this.root) { this._f(t, `delete ${key}: the tree is empty`, {}); return; }
    const { leaf, path, seen } = this._descend(key, t, `delete ${key}: `);
    const pathId = [...seen, leaf.id];
    let at = -1;
    for (let j = 0; j < leaf.keys.length; j++) { t.count("compare"); if (leaf.keys[j] >= key) { at = leaf.keys[j] === key ? j : -1; break; } }
    if (at < 0) { this._f(t, `leaf ${list(leaf.keys)}: no ${key} here, so there is nothing to delete`, { dangerId: [leaf.id], pathId }); return; }
    this._f(t, `leaf ${list(leaf.keys)}: found ${key}`, { nodeId: [leaf.id], pathId, dangerCell: [`${leaf.id}:${key}`] });
    leaf.keys.splice(at, 1);
    t.count("write");
    const router = path.find((p) => p.node.keys.includes(key));
    const stale = router ? `. Router ${key} upstairs stays: it still separates its two sides correctly (routers are signposts, not keys)` : "";
    this._f(t, `remove ${key} from the leaf → ${list(leaf.keys)}${stale}`,
      { nodeId: [leaf.id], cell: router ? [`${router.node.id}:${key}`] : [] });

    if (!path.length) {
      if (!leaf.keys.length) { this.root = null; this._f(t, `${key} deleted: the tree is now empty`, {}); return; }
      this._f(t, `done: ${key} deleted (the root leaf may hold any number of keys)`, {});
      return;
    }
    const lmin = this.leafMin;
    if (leaf.keys.length >= lmin) { this._f(t, `done: ${key} deleted; the leaf still holds ≥ ${lmin} keys`, {}); return; }

    // ── leaf underflow ──
    const { node: parent, idx } = path.pop();
    const left = idx > 0 ? parent.children[idx - 1] : null;
    const right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
    t.count("read", (left ? 1 : 0) + (right ? 1 : 0));
    this._f(t, `leaf ${list(leaf.keys)} has fewer than ${lmin} keys: look at its siblings ${[left, right].filter(Boolean).map((s) => list(s.keys)).join(" and ")}`,
      { dangerId: [leaf.id], nodeId: [left, right].filter(Boolean).map((s) => s.id) });
    if (left && left.keys.length > lmin) {
      const k = left.keys.pop();
      leaf.keys.unshift(k);
      parent.keys[idx - 1] = k;
      t.count("write", 2);
      this._f(t, `BORROW ${k} from the left sibling; the router between them becomes ${k} → parent ${list(parent.keys)}`,
        { nodeId: [leaf.id], doneCell: [`${leaf.id}:${k}`], cell: [`${parent.id}:${k}`] });
    } else if (right && right.keys.length > lmin) {
      const k = right.keys.shift();
      leaf.keys.push(k);
      parent.keys[idx] = right.keys[0];
      t.count("write", 2);
      this._f(t, `BORROW ${k} from the right sibling; the router between them becomes ${right.keys[0]}, the right leaf's new first key → parent ${list(parent.keys)}`,
        { nodeId: [leaf.id], doneCell: [`${leaf.id}:${k}`], cell: [`${parent.id}:${right.keys[0]}`] });
    } else {
      // merge: the right one of the pair empties into the left one, leaves the chain, and its router is DROPPED
      const [a, b, r] = left ? [left, leaf, idx - 1] : [leaf, right, idx];
      const sep = parent.keys[r], pair = `${list(a.keys)} and ${list(b.keys)}`;
      a.keys.push(...b.keys);
      a.next = b.next;
      parent.keys.splice(r, 1);
      parent.children.splice(r + 1, 1);
      t.count("write", b.keys.length + 1); t.count("link"); t.count("free");
      this._f(t, `no sibling can lend: MERGE leaves ${pair} into ${list(a.keys)}, unlink the right one from the chain, and DROP router ${sep} (a leaf router is a copy, so nothing comes down) → parent ${list(parent.keys)}`,
        { nodeId: [a.id], dangerId: parent.keys.length < this.routerMin && parent !== this.root ? [parent.id] : [] });
      this._fixRouters(parent, path, t);
    }
    this._f(t, `done: ${key} deleted; every leaf is at the same depth and the chain lists every key in order`, {});
  }

  /** Router-node underflow after a merge removed a router: borrow through the
   *  parent or merge (the separator comes DOWN), cascading toward the root. */
  _fixRouters(node, path, t) {
    const rmin = this.routerMin;
    while (node !== this.root && node.keys.length < rmin) {
      const { node: parent, idx } = path.pop();
      const left = idx > 0 ? parent.children[idx - 1] : null;
      const right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
      t.count("read", (left ? 1 : 0) + (right ? 1 : 0));
      if (left && left.keys.length > rmin) {
        const down = parent.keys[idx - 1], up = left.keys.pop();
        node.keys.unshift(down); node.children.unshift(left.children.pop());
        parent.keys[idx - 1] = up;
        t.count("write", 3);
        this._f(t, `router node ${list(node.keys.slice(1))} ${short(node.keys.length - 1, rmin)}: BORROW through the parent: router ${down} comes down, ${up} goes up, and ${list(left.keys)}'s last child moves across → ${list(node.keys)}`,
          { nodeId: [node.id], cell: [`${node.id}:${down}`, `${parent.id}:${up}`] });
        return;
      }
      if (right && right.keys.length > rmin) {
        const down = parent.keys[idx], up = right.keys.shift();
        node.keys.push(down); node.children.push(right.children.shift());
        parent.keys[idx] = up;
        t.count("write", 3);
        this._f(t, `router node ${list(node.keys.slice(0, -1))} ${short(node.keys.length - 1, rmin)}: BORROW through the parent: router ${down} comes down, ${up} goes up, and the right sibling's first child moves across → ${list(node.keys)}`,
          { nodeId: [node.id], cell: [`${node.id}:${down}`, `${parent.id}:${up}`] });
        return;
      }
      const [a, b, r] = left ? [left, node, idx - 1] : [node, right, idx];
      const down = parent.keys[r], was = `router node ${list(node.keys)} ${short(node.keys.length, rmin)}`;
      a.keys.push(down, ...b.keys); a.children.push(...b.children);
      parent.keys.splice(r, 1); parent.children.splice(r + 1, 1);
      t.count("write", b.keys.length + 1); t.count("free");
      this._f(t, `${was} and no sibling can lend: MERGE the two router nodes, pulling router ${down} DOWN from the parent between them (a router node needs a separator for every child) → ${list(a.keys)}`,
        { nodeId: [a.id], cell: [`${a.id}:${down}`] });
      node = parent;
    }
    if (this.root.keys.length === 0 && !isLeaf(this.root)) {
      this.root = this.root.children[0];
      t.count("free");
      this._f(t, `the root lost its last router: its one child becomes the root, so the tree shrinks one level`, { nodeId: [this.root.id] });
    }
  }
}
