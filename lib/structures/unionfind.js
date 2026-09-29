// CSS 343 unified library — structures/unionfind.js
// Weighted quick-union with path compression, backed by plain `parent[]` and
// `size[]` arrays over elements 0..n-1. find() walks to the root, then
// flattens every element it passed over onto the root (path compression).
// union() finds both roots and links the SMALLER tree under the LARGER one
// (by size), so trees stay shallow without needing full union-by-rank.
// snapshot() renders `parent` as a DISPLAY array — cell i shows parent[i]; a
// root is a cell where parent[i] === i — so the shared ArrayRenderer draws it
// directly with mode 'cells'.

import { Tracer } from "../core/tracer.js";

export class UnionFind {
  constructor() { this.parent = []; this.size = []; }

  build(keys) {
    const n = (keys && keys[0]) || 10;
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    return this;
  }
  loadRaw(keys) { return this.build(keys); } // FullDemo: Build = "n fresh singletons" (intentionally instant)

  /** Display array: cell i holds parent[i]; roots are cells where parent[i] === i. */
  snapshot() { return this.parent.slice(); }
  inorder() {
    const roots = this.parent.filter((p, i) => p === i).length;
    return `${this.parent.length} elements, ${roots} sets`;
  }

  /** Walk from `a` to its root, tracing each hop plus path compression, onto an existing tracer. Returns the root. */
  _findTraced(a, t) {
    const path = [a];
    t.step(`find(${a}): start at ${a}`, { snapshot: this.snapshot(), highlight: { active: [a] } });
    let r = a;
    while (this.parent[r] !== r) {
      t.count("read");
      const next = this.parent[r];
      t.step(`parent[${r}] = ${next} — walk up`, { snapshot: this.snapshot(), highlight: { active: [next], compare: path.slice() } });
      r = next;
      path.push(r);
    }
    t.step(`root of ${a} is ${r}`, { snapshot: this.snapshot(), highlight: { done: [r], compare: path.slice(0, -1) } });

    const toCompress = path.filter((x) => x !== r && this.parent[x] !== r);
    if (toCompress.length) {
      for (const x of toCompress) { this.parent[x] = r; t.count("write"); }
      t.step(`path compression: repoint ${toCompress.join(", ")} directly to root ${r}`,
        { snapshot: this.snapshot(), highlight: { done: [r], active: toCompress } });
    }
    return r;
  }

  /** find(a) — walk parent[] up to the root, path-compressing every element passed along the way. */
  find(a) {
    const t = new Tracer();
    const r = this._findTraced(a, t);
    t.step(`find(${a}) = ${r}`, { snapshot: this.snapshot(), highlight: { done: [r] } });
    return t.trace();
  }

  /** union body onto an existing tracer — link the smaller tree under the larger. */
  _unionTraced(a, b, t) {
    const ra = this._findTraced(a, t);
    const rb = this._findTraced(b, t);
    t.count("compare");
    if (ra === rb) {
      t.step(`${a} and ${b} already connected (root ${ra}) — no union needed`, { snapshot: this.snapshot(), highlight: { done: [ra] } });
      return ra;
    }
    const [big, small] = this.size[ra] >= this.size[rb] ? [ra, rb] : [rb, ra];
    t.step(`weighted union: size[${ra}]=${this.size[ra]}, size[${rb}]=${this.size[rb]} — attach smaller root ${small} under larger root ${big}`,
      { snapshot: this.snapshot(), highlight: { compare: [ra, rb] } });
    this.parent[small] = big; t.count("write");
    this.size[big] += this.size[small];
    t.step(`union(${a}, ${b}): root ${small} now points to root ${big} (size[${big}] = ${this.size[big]})`,
      { snapshot: this.snapshot(), highlight: { done: [big], active: [small] } });
    return big;
  }

  /** unite(a, b) — find both roots, then link the smaller tree (by size) under the larger one.
   *  Named `unite`, not `union`, to match the C++ the students write: `union` is a
   *  reserved word there, so the whole course (deck, ICA, demos) says unite. */
  unite(a, b) {
    const t = new Tracer();
    this._unionTraced(a, b, t);
    return t.trace();
  }

  /** demo() — a scripted sequence of unions, then a find, in ONE trace: shows weighting
   *  keep the forest shallow, and a final find() path-compressing the tallest path. */
  demo() {
    const t = new Tracer();
    if (this.parent.length === 0) this.build([10]);
    const seq = [[4, 3], [3, 8], [6, 5], [9, 4], [2, 1], [5, 0], [7, 2], [6, 1]];
    for (const [a, b] of seq) this._unionTraced(a, b, t);
    this._findTraced(1, t);                       // walk + flatten the deepest path
    t.step(`done — ${this.parent.filter((p, i) => p === i).length} set(s) remain`,
      { snapshot: this.snapshot(), highlight: {} });
    return t.trace();
  }

  /** connected(a, b) — find both roots (path-compressing) and report whether they match. */
  connected(a, b) {
    const t = new Tracer();
    const ra = this._findTraced(a, t);
    const rb = this._findTraced(b, t);
    t.count("compare");
    const same = ra === rb;
    t.step(`connected(${a}, ${b}): root(${a})=${ra}, root(${b})=${rb} — ${same ? "same set, connected" : "different sets, not connected"}`,
      { snapshot: this.snapshot(), highlight: same ? { done: [ra] } : { danger: [ra, rb] } });
    return t.trace();
  }
}
