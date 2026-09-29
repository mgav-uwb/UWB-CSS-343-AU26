// CSS 343 unified library — structures/btree.js
// The B-tree of order M: the 2-3 tree's algorithm generalized to wide fan-out.
// Every node holds between ⌈M/2⌉−1 and M−1 keys (the root is exempt from the
// lower bound); an internal node with k keys has k+1 children. Insert always
// lands in a LEAF; if that leaf overflows to M keys, it SPLITS — the middle
// key promotes to the parent, splitting into two nodes of ⌊(M−1)/2⌋ keys each,
// and the split may cascade upward. A root split creates a new root, growing
// the tree by exactly one level uniformly, so every leaf's depth increases by
// 1 together — the invariant "all leaves at the same depth" is never broken.
// Traced via Tracer; snapshots are whole-tree clones in the shared
// {keys,children} shape drawn by MultiwayTreeRenderer (same shape as
// structures/two-three.js, which is simply BTree with M = 3).

import { Tracer } from "../core/tracer.js";

const leaf = (key) => ({ keys: [key], children: [] });
const clone = (n) => (n ? { keys: n.keys.slice(), children: (n.children && n.children.length) ? n.children.map(clone) : [] } : null);

/** In-order traversal of a multiway node: child0 key0 child1 key1 child2 … */
function keysOf(n, out = []) {
  if (!n) return out;
  const kids = n.children || [];
  for (let i = 0; i < n.keys.length; i++) {
    if (kids[i]) keysOf(kids[i], out);
    out.push(n.keys[i]);
  }
  if (kids[n.keys.length]) keysOf(kids[n.keys.length], out);
  return out;
}

/** Locate `key` within a node's keys (left-to-right scan): { matched: keyIdx|-1, idx: childIdx (if no match) }.
    Counts a `compare` per key examined when a Tracer is supplied (silent build passes none). */
function locate(keys, key, t) {
  for (let i = 0; i < keys.length; i++) {
    if (t) t.count("compare");
    if (key === keys[i]) return { matched: i, idx: -1 };
    if (key < keys[i]) return { matched: -1, idx: i };
  }
  return { matched: -1, idx: keys.length };
}

export class BTree {
  /** @param {number} order M — a node holds up to M−1 keys and up to M children. */
  constructor(order = 5) {
    this.M = order;
    this.root = null;
  }

  /** Silent insert (for build) — same algorithm as insert(), no Tracer overhead. */
  build(keys) { for (const k of keys) this._insertSilent(k); return this; }
  snapshot() { return clone(this.root); }
  inorder() { return keysOf(this.root); }

  _insertSilent(key) {
    if (!this.root) { this.root = leaf(key); return; }
    const ancestors = []; let cur = this.root;
    while (cur.children && cur.children.length) {
      const loc = locate(cur.keys, key);
      if (loc.matched >= 0) return; // already present — a B-tree holds a set
      ancestors.push(cur);
      cur = cur.children[loc.idx];
    }
    const loc = locate(cur.keys, key);
    if (loc.matched >= 0) return;
    cur.keys.push(key); cur.keys.sort((a, b) => a - b);
    let node = cur;
    while (node.keys.length === this.M) {
      const mid = Math.floor((this.M - 1) / 2);
      const midKey = node.keys[mid];
      const hasKids = node.children && node.children.length > 0;
      const left = { keys: node.keys.slice(0, mid), children: hasKids ? node.children.slice(0, mid + 1) : [] };
      const right = { keys: node.keys.slice(mid + 1), children: hasKids ? node.children.slice(mid + 1) : [] };
      if (ancestors.length === 0) { this.root = { keys: [midKey], children: [left, right] }; return; }
      const parent = ancestors.pop();
      const idxInParent = parent.children.indexOf(node);
      parent.children.splice(idxInParent, 1, left, right);
      parent.keys.splice(idxInParent, 0, midKey);
      node = parent;
    }
  }

  /** search — descend by scanning each node's keys; found (highlight key) or not (leaf reached). */
  search(key) {
    const t = new Tracer();
    if (!this.root) { t.step(`search ${key}: empty tree`, { snapshot: null }); return t.trace(); }
    let cur = this.root; const visited = [];
    while (cur) {
      const loc = locate(cur.keys, key, t);
      visited.push(...cur.keys);
      if (loc.matched >= 0) {
        t.step(`found ${key} in node [${cur.keys.join(",")}]`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), key: [key], path: visited.slice() } });
        return t.trace();
      }
      if (!cur.children || !cur.children.length) {
        t.step(`${key} not found — reached leaf [${cur.keys.join(",")}]`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), path: visited.slice() } });
        return t.trace();
      }
      t.step(`at [${cur.keys.join(",")}]: ${key} not here — descend into child ${loc.idx}`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), path: visited.slice() } });
      cur = cur.children[loc.idx];
    }
    return t.trace();
  }

  /** insert — descend to a leaf, add the key, then split-and-promote up while a node overflows to M keys. */
  insert(key) {
    const t = new Tracer();
    const M = this.M;
    if (!this.root) {
      this.root = leaf(key);
      t.count("alloc");
      t.step(`insert ${key}: empty tree — ${key} becomes the root leaf`, { snapshot: clone(this.root), highlight: { done: [key] } });
      return t.trace();
    }

    const ancestors = []; const visited = []; let cur = this.root;
    while (cur.children && cur.children.length) {
      const loc = locate(cur.keys, key, t);
      visited.push(...cur.keys);
      if (loc.matched >= 0) {
        t.step(`${key} already present in node [${cur.keys.join(",")}] — a B-tree holds a set, no change`, { snapshot: clone(this.root), highlight: { danger: [key], path: visited.slice() } });
        return t.trace();
      }
      t.step(`at [${cur.keys.join(",")}]: ${key} → descend into child ${loc.idx}`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), path: visited.slice() } });
      ancestors.push(cur);
      cur = cur.children[loc.idx];
    }

    // cur is the leaf
    const leafLoc = locate(cur.keys, key, t);
    if (leafLoc.matched >= 0) {
      t.step(`${key} already present in leaf [${cur.keys.join(",")}] — no change`, { snapshot: clone(this.root), highlight: { danger: [key] } });
      return t.trace();
    }

    cur.keys.push(key); cur.keys.sort((a, b) => a - b);
    t.count("write");
    t.step(`insert ${key} into leaf → [${cur.keys.join(",")}]`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), key: [key], path: visited.slice() } });

    let node = cur;
    while (node.keys.length === M) {
      t.step(`node [${node.keys.join(",")}] now holds ${M} keys — overflow (max is ${M - 1}), must split`, { snapshot: clone(this.root), highlight: { danger: node.keys.slice() } });

      const mid = Math.floor((M - 1) / 2);
      const midKey = node.keys[mid];
      const hasKids = node.children && node.children.length > 0;
      const left = { keys: node.keys.slice(0, mid), children: hasKids ? node.children.slice(0, mid + 1) : [] };
      const right = { keys: node.keys.slice(mid + 1), children: hasKids ? node.children.slice(mid + 1) : [] };
      t.count("alloc", 2); t.count("write", 2);

      if (ancestors.length === 0) {
        this.root = { keys: [midKey], children: [left, right] };
        t.count("alloc");
        t.step(`split [${node.keys.join(",")}] into [${left.keys.join(",")}] and [${right.keys.join(",")}]; ${midKey} promotes to a NEW root — the tree grows one level (every leaf's depth +1)`,
          { snapshot: clone(this.root), highlight: { key: [midKey], done: [midKey] } });
        t.step(`done — ${key} inserted, all leaves remain at the same depth`, { snapshot: clone(this.root), highlight: { done: [key] } });
        return t.trace();
      }

      const parent = ancestors.pop();
      const idxInParent = parent.children.indexOf(node);
      parent.children.splice(idxInParent, 1, left, right);
      parent.keys.splice(idxInParent, 0, midKey);
      t.count("write", 2); t.count("link", 2);
      t.step(`split [${left.keys.concat(right.keys).sort((a, b) => a - b).join(",")}] into two nodes; promote ${midKey} into parent → [${parent.keys.join(",")}]`,
        { snapshot: clone(this.root), highlight: { key: [midKey], node: parent.keys.slice() } });

      node = parent;
    }
    t.step(`done — ${key} inserted, all leaves remain at the same depth`, { snapshot: clone(this.root), highlight: { done: [key] } });
    return t.trace();
  }

  /** delete — same borrow/merge algorithm as the 2-3 tree (structures/two-three.js),
      generalized to order M: a non-root node must hold >= ceil(M/2)-1 keys. */
  delete(key) {
    const t = new Tracer();
    const minKeys = Math.ceil(this.M / 2) - 1;
    if (!this.root) { t.step(`delete ${key}: empty tree — nothing to do`, { snapshot: null }); return t.trace(); }

    const ancestors = []; const visited = [];
    let cur = this.root, foundNode = null, foundIdx = -1;
    while (cur) {
      const loc = locate(cur.keys, key, t);
      visited.push(...cur.keys);
      if (loc.matched >= 0) { foundNode = cur; foundIdx = loc.matched; break; }
      if (!cur.children || !cur.children.length) break;
      t.step(`at [${cur.keys.join(",")}]: ${key} → descend into child ${loc.idx}`, { snapshot: clone(this.root), highlight: { node: cur.keys.slice(), path: visited.slice() } });
      ancestors.push({ node: cur, idx: loc.idx });
      cur = cur.children[loc.idx];
    }
    if (!foundNode) { t.step(`${key} not found — nothing to delete`, { snapshot: clone(this.root), highlight: { path: visited.slice() } }); return t.trace(); }

    t.step(`found ${key} in [${foundNode.keys.join(",")}]`, { snapshot: clone(this.root), highlight: { key: [key], node: foundNode.keys.slice() } });

    let leaf = foundNode, leafIdx = foundIdx;
    if (foundNode.children.length) {
      ancestors.push({ node: foundNode, idx: foundIdx });
      let pred = foundNode.children[foundIdx];
      while (pred.children.length) { ancestors.push({ node: pred, idx: pred.children.length - 1 }); pred = pred.children[pred.children.length - 1]; }
      const predKey = pred.keys[pred.keys.length - 1];
      foundNode.keys[foundIdx] = predKey;
      t.count("write");
      t.step(`${key} is internal — swap with in-order predecessor ${predKey} (rightmost leaf of its left subtree)`,
        { snapshot: clone(this.root), highlight: { key: [predKey], danger: [key] } });
      leaf = pred; leafIdx = pred.keys.length - 1;
    }

    leaf.keys.splice(leafIdx, 1);
    t.count("write");
    t.step(`remove ${key} from leaf → [${leaf.keys.join(",") || "empty"}]`, { snapshot: clone(this.root), highlight: { danger: leaf.keys.length ? leaf.keys.slice() : [] } });

    let node = leaf;
    while (node !== this.root && node.keys.length < minKeys) {
      const { node: parent, idx } = ancestors.pop();
      const leftSib = idx > 0 ? parent.children[idx - 1] : null;
      const rightSib = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;

      if (leftSib && leftSib.keys.length > minKeys) {
        node.keys.unshift(parent.keys[idx - 1]);
        if (leftSib.children.length) node.children.unshift(leftSib.children.pop());
        parent.keys[idx - 1] = leftSib.keys.pop();
        t.count("write", 3);
        t.step(`[${node.keys.join(",") || "empty"}] underflowed (min ${minKeys}) — BORROW from left sibling [${leftSib.keys.join(",")}] through the parent → [${parent.keys.join(",")}]`,
          { snapshot: clone(this.root), highlight: { node: node.keys.slice(), key: [parent.keys[idx - 1]] } });
        break;
      }
      if (rightSib && rightSib.keys.length > minKeys) {
        node.keys.push(parent.keys[idx]);
        if (rightSib.children.length) node.children.push(rightSib.children.shift());
        parent.keys[idx] = rightSib.keys.shift();
        t.count("write", 3);
        t.step(`[${node.keys.join(",") || "empty"}] underflowed (min ${minKeys}) — BORROW from right sibling [${rightSib.keys.join(",")}] through the parent → [${parent.keys.join(",")}]`,
          { snapshot: clone(this.root), highlight: { node: node.keys.slice(), key: [parent.keys[idx]] } });
        break;
      }
      if (leftSib) {
        const sepKey = parent.keys[idx - 1];
        leftSib.keys.push(sepKey, ...node.keys);
        leftSib.children.push(...node.children);
        parent.keys.splice(idx - 1, 1);
        parent.children.splice(idx, 1);
        t.count("write", 2); t.count("link");
        t.step(`no sibling can lend — MERGE with left sibling, pulling ${sepKey} down from the parent → [${leftSib.keys.join(",")}]; parent shrinks to [${parent.keys.join(",") || "empty"}]`,
          { snapshot: clone(this.root), highlight: { danger: [sepKey], node: leftSib.keys.slice() } });
      } else {
        const sepKey = parent.keys[idx];
        node.keys.push(sepKey, ...rightSib.keys);
        node.children.push(...rightSib.children);
        parent.keys.splice(idx, 1);
        parent.children.splice(idx + 1, 1);
        t.count("write", 2); t.count("link");
        t.step(`no sibling can lend — MERGE with right sibling, pulling ${sepKey} down from the parent → [${node.keys.join(",")}]; parent shrinks to [${parent.keys.join(",") || "empty"}]`,
          { snapshot: clone(this.root), highlight: { danger: [sepKey], node: node.keys.slice() } });
      }
      node = parent;
    }

    if (!this.root.keys.length) {
      if (this.root.children.length) {
        this.root = this.root.children[0];
        t.step(`root emptied — its one remaining child becomes the new root (tree shrinks by one level)`, { snapshot: clone(this.root) });
      } else {
        this.root = null;
        t.step(`${key} deleted — the tree is now empty`, { snapshot: null });
        return t.trace();
      }
    }
    t.step(`done — ${key} deleted, every remaining leaf is still at the same depth`, { snapshot: clone(this.root), highlight: {} });
    return t.trace();
  }
}
