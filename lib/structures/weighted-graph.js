// CSS 343 unified library — structures/weighted-graph.js
// A weighted directed graph on up to EIGHT VERTICES (ids 0–7) with an EDITABLE
// edge list: build(keys) reads keys as consecutive TRIPLES "u v w, u v w, …"
// (empty input → the sample digraph) and shows exactly the vertices the triples
// mention — a 3-vertex edge list draws 3 vertices, not 8 with strays;
// buildTrace() animates the edges landing one at a time. Traced Dijkstra ("settle the nearest unsettled vertex, then relax its
// edges") from any start; after the run it RE-CHECKS every edge — an edge that
// still relaxes means a negative weight broke the greedy guarantee (flagged in
// red). Rendered with GraphRenderer: weights on edges, tentative/final
// distances as node labels (dist), so relaxation is visible.

import { Tracer } from "../core/tracer.js";

// HAND layout = a structured ladder tuned for the sample edge set (slide
// demos run this fixed instance; every edge is long enough that a highlight
// reads). CIRCLE layout (opts.layout: "circle") is input-agnostic for the
// exploratory gallery.
const NODES = [
  { id: 0, x: 0.05, y: 0.50 }, { id: 1, x: 0.30, y: 0.16 }, { id: 2, x: 0.30, y: 0.84 },
  { id: 3, x: 0.55, y: 0.16 }, { id: 4, x: 0.55, y: 0.84 }, { id: 5, x: 0.80, y: 0.16 },
  { id: 6, x: 0.96, y: 0.32 }, { id: 7, x: 0.80, y: 0.84 },
];
// weights chosen so several relaxations IMPROVE a tentative distance (2→1, 1→3, 3→4, 4→5)
const EDGES = [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 6], [4, 5, 3], [5, 6, 1], [4, 7, 7]];

const show = (d) => (d === Infinity ? "∞" : d);

// aspect = the canvas PLOT AREA's width/height. Without it the ring is an
// ellipse in normalized coords, which a wide demo canvas squashes flat; with
// it the radii are corrected so the ring renders ROUND in pixels (vertices
// evenly spaced, 0 at the top, clockwise — the handouts' figure layout).
const circleNodes = (aspect, ids) => ids.map((id, i) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
  let rx = 0.45, ry = 0.42;                       // legacy ellipse (no aspect given)
  if (aspect >= 1) { ry = 0.42; rx = ry / aspect; }
  else if (aspect > 0) { rx = 0.45; ry = rx * aspect; }
  return { id, x: 0.5 + rx * Math.cos(a), y: 0.5 + ry * Math.sin(a) };
});

export class WeightedGraph {
  /** opts.directed=false → edges drawn without arrows and adjacency built BOTH
   *  ways (so dijkstra works on undirected graphs too). Default: directed.
   *  opts.aspect (plot width/height) keeps the circle layout round on-screen. */
  constructor(opts = {}) { this.nodes = []; this.edges = []; this.adj = {}; this.directed = opts.directed ?? true; this.layout = opts.layout ?? "hand"; this.aspect = opts.aspect; }

  /** keys = consecutive triples "u v w" → directed weighted edges among vertices
   *  0–7 (weights may be negative — Dijkstra's post-check will call it out).
   *  Bad / self-loop / duplicate-pair triples are dropped; no triples → sample.
   *  The vertex set is exactly the vertices the edge list mentions (the sample
   *  → all 8), so a small edge list — e.g. the MST-vs-SPT triangle — renders
   *  without stray isolated vertices. */
  build(keys) {
    const ks = (keys || []).filter(Number.isFinite);
    const triples = [];
    for (let i = 0; i + 2 < ks.length; i += 3) triples.push([ks[i], ks[i + 1], ks[i + 2]]);
    const ok = ([u, v]) => u >= 0 && u < NODES.length && v >= 0 && v < NODES.length && u !== v;
    const list = triples.length ? triples.filter(ok) : EDGES;
    const used = new Set(list.flatMap(([u, v]) => [u, v]));
    const ids = used.size ? [...used].sort((a, b) => a - b) : NODES.map((n) => n.id);
    this.nodes = (this.layout === "circle"
      ? circleNodes(this.aspect, ids)
      : NODES.filter((n) => ids.includes(n.id))).map((n) => ({ ...n }));
    const seen = new Set();
    this.edges = [];
    list.forEach(([u, v, w]) => {
      const k = this.directed ? `${u}>${v}` : [u, v].sort().join("|");
      if (!seen.has(k)) { seen.add(k); this.edges.push({ u, v, w, directed: this.directed }); }
    });
    this._index();
    return this;
  }
  loadRaw(keys) { return this.build(keys); } // silent build (FullDemo initial display)
  _index() {
    this.adj = {}; this.nodes.forEach((n) => (this.adj[n.id] = []));
    this.edges.forEach((e) => {
      this.adj[e.u].push({ v: e.v, w: e.w });
      if (!this.directed) this.adj[e.v].push({ v: e.u, w: e.w });
    });
    Object.values(this.adj).forEach((a) => a.sort((x, y) => x.v - y.v));
  }

  /** Animated Build: the vertices appear, then the weighted edges land one at a time. */
  buildTrace(keys) {
    const t = new Tracer();
    this.build(keys);
    const finalEdges = this.edges;
    this.edges = [];
    t.step(`${this.nodes.length} vertices: now add the edges (triples "u v w")`, { snapshot: this.snapshot() });
    finalEdges.forEach((e) => {
      this.edges.push(e);
      t.step(`add edge ${e.u} → ${e.v}, weight ${e.w}`, { snapshot: this.snapshot(), highlight: { edges: { active: [[e.u, e.v]] } } });
    });
    this._index();
    t.step(`built: ${this.inorder()}`, { snapshot: this.snapshot() });
    return t.trace();
  }

  snapshot() { return { nodes: this.nodes.map((n) => ({ ...n })), edges: this.edges.map((e) => ({ ...e })) }; }
  inorder() { return `${this.nodes.length} vertices · ${this.edges.length} weighted edges`; }
  _out(u) { return this.adj[u] || []; }
  _start(s) { return this.adj[s] ? s : this.nodes[0]?.id ?? 0; } // fall back to the first vertex on an invalid start

  /** Dijkstra from `src`: settle the nearest unsettled vertex, relax its edges.
   *  Afterwards, re-check every edge — one that still relaxes means a negative
   *  weight broke the greedy guarantee (flagged in red). */
  dijkstra(src = 0) {
    src = this._start(src);
    const t = new Tracer();
    const dist = {}, prev = {}, settled = new Set();
    let tree = [];
    this.nodes.forEach((n) => (dist[n.id] = Infinity));
    dist[src] = 0;
    const snap = () => this.snapshot();
    const HL = (active, edge) => ({ nodes: { active: active != null ? [active] : [], done: [...settled] }, edges: { tree: tree.slice(), active: edge ? [edge] : [] }, dist: { ...dist } });

    t.step(`init: dist[${src}] = 0, every other vertex = ∞`, { snapshot: snap(), highlight: { dist: { ...dist } } });
    while (settled.size < this.nodes.length) {
      let u = null, best = Infinity;
      for (const n of this.nodes) if (!settled.has(n.id) && dist[n.id] < best) { best = dist[n.id]; u = n.id; }
      if (u === null) break; // remaining vertices are unreachable
      settled.add(u); t.count("visit");
      t.step(`settle ${u}: smallest tentative distance (${dist[u]}) among unsettled: its label is now final`, { snapshot: snap(), highlight: HL(u) });
      for (const { v, w } of this._out(u)) {
        t.count("compare");
        if (settled.has(v)) { t.step(`edge ${u}→${v}: ${v} already settled: skip`, { snapshot: snap(), highlight: HL(u, [u, v]) }); continue; }
        const nd = dist[u] + w, old = dist[v];
        if (nd < old) {
          if (prev[v] != null) tree = tree.filter((e) => e[1] !== v); // replace v's tree edge
          dist[v] = nd; prev[v] = u; tree.push([u, v]);
          t.step(`relax ${u}→${v} (w ${w}): ${dist[u]}+${w}=${nd} < ${show(old)} → dist[${v}] = ${nd}`, { snapshot: snap(), highlight: HL(u, [u, v]) });
        } else {
          t.step(`relax ${u}→${v} (w ${w}): ${dist[u]}+${w}=${nd} ≥ ${show(old)}: no improvement`, { snapshot: snap(), highlight: HL(u, [u, v]) });
        }
      }
    }
    // post-check: with nonnegative weights NO edge can still relax. If one does,
    // a negative weight invalidated "settled = final" and the labels are wrong.
    const broken = this.edges.filter((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
    if (broken.length) {
      broken.forEach((e) => {
        const sum = e.w < 0 ? `${dist[e.u]} − ${-e.w}` : `${dist[e.u]} + ${e.w}`;
        t.step(`CHECK: edge ${e.u} → ${e.v} (w ${e.w}) STILL relaxes: ${sum} = ${dist[e.u] + e.w} < ${show(dist[e.v])}. dist[${e.v}] is WRONG: the negative weight broke the greedy guarantee`,
          { snapshot: snap(), highlight: { nodes: { danger: [e.v], done: [...settled].filter((x) => x !== e.v) }, edges: { active: [[e.u, e.v]], tree: tree.slice() }, dist: { ...dist } } });
      });
    } else {
      const missed = this.nodes.length - settled.size;
      t.step(`Dijkstra done: labels are shortest-path distances from ${src}${missed ? ` (${missed} unreachable)` : ""}; the accent edges are the shortest-paths tree`, { snapshot: snap(), highlight: { nodes: { done: [...settled] }, edges: { tree: tree.slice() }, dist: { ...dist } } });
    }
    return t.trace();
  }

  /** Kruskal's MST: sort edges by weight, add each if its endpoints are in different
   * union-find components (skip — cycle — otherwise), stopping after V-1 tree edges.
   * The edge set is treated as UNDIRECTED regardless of each edge's `directed` flag. */
  kruskal() {
    const t = new Tracer();
    const parent = {};
    this.nodes.forEach((n) => (parent[n.id] = n.id));
    const find = (x) => { while (parent[x] !== x) x = parent[x]; return x; };
    const union = (a, b) => { parent[find(a)] = find(b); };

    const sorted = this.edges.map((e) => ({ ...e })).sort((a, b) => a.w - b.w);
    const need = this.nodes.length - 1;
    let tree = [], total = 0;
    // expose the cycle-detector: parent[] over vertices 0..n-1 (the demo
    // draws it as a forest next to the graph)
    const ufArr = () => this.nodes.map((n) => parent[n.id]);
    const snap = () => ({ ...this.snapshot(), uf: ufArr() });
    const HL = (edge, faded) => ({ edges: { tree: tree.map((e) => [e.u, e.v]), active: !faded && edge ? [[edge.u, edge.v]] : [], faded: faded && edge ? [[edge.u, edge.v]] : [] } });

    t.step(`sort ${sorted.length} edges by weight ascending: process them cheapest-first`, { snapshot: snap(), highlight: { edges: { tree: [] } } });
    for (const e of sorted) {
      if (tree.length === need) break; // MST complete — no need to examine the rest
      t.count("compare");
      const ru = find(e.u), rv = find(e.v);
      if (ru !== rv) {
        union(e.u, e.v);
        tree.push(e); total += e.w;
        t.step(`add edge ${e.u}–${e.v} (${e.w}): total ${total}`, { snapshot: snap(), highlight: HL(e, false) });
      } else {
        t.step(`skip ${e.u}–${e.v} (${e.w}): would form a cycle`, { snapshot: snap(), highlight: HL(e, true) });
      }
    }
    t.step(tree.length === need
      ? `done: MST weight ${total}`
      : `edges exhausted with ${tree.length} tree edges (need ${need}): the graph is DISCONNECTED: a minimum spanning FOREST of weight ${total}`,
      { snapshot: snap(), highlight: { edges: { tree: tree.map((e) => [e.u, e.v]) } } });
    return t.trace();
  }

  /** Prim's MST from `src`: repeatedly scan every edge for the minimum-weight edge
   * crossing from inTree to a not-yet-in-tree vertex, add it, and repeat. The edge
   * set is treated as UNDIRECTED regardless of each edge's `directed` flag. */
  prim(src = 0) {
    src = this._start(src);
    const t = new Tracer();
    const inTree = new Set([src]);
    let tree = [], total = 0;
    const snap = () => this.snapshot();
    const HL = (justAdded) => ({ nodes: { done: [...inTree], active: justAdded != null ? [justAdded] : [] }, edges: { tree: tree.map((e) => [e.u, e.v]) } });

    t.step(`start Prim from vertex ${src}`, { snapshot: snap(), highlight: HL(src) });
    while (inTree.size < this.nodes.length) {
      let best = null;
      for (const e of this.edges) {
        t.count("compare");
        const uIn = inTree.has(e.u), vIn = inTree.has(e.v);
        if (uIn === vIn) continue; // both endpoints in, or both out — not a crossing edge
        const newVertex = uIn ? e.v : e.u, treeVertex = uIn ? e.u : e.v;
        if (!best || e.w < best.w) best = { u: treeVertex, v: newVertex, w: e.w };
      }
      if (!best) break; // remaining vertices are unreachable
      inTree.add(best.v); t.count("visit");
      tree.push(best); total += best.w;
      t.step(`add edge ${best.u}–${best.v} (${best.w}): vertex ${best.v} joins, total ${total}`, { snapshot: snap(), highlight: HL(best.v) });
    }
    const missed = this.nodes.length - inTree.size;
    t.step(missed
      ? `no crossing edge left: spanning tree of ${src}'s component, weight ${total} (${missed} vertices unreachable)`
      : `done: MST weight ${total}`,
      { snapshot: snap(), highlight: { nodes: { done: [...inTree] }, edges: { tree: tree.map((e) => [e.u, e.v]) } } });
    return t.trace();
  }

  // ---- Bellman-Ford (Lecture 11) --------------------------------------------

  /** Untraced reference: relax every edge (in edge-list order) up to V−1 rounds,
   *  stopping early after a round that changes nothing; then one more pass: an
   *  edge that still relaxes means a negative cycle is reachable from src.
   *  Returns {dist, rounds, negCycle}. Directed edges only. */
  bellmanFordRef(src = 0) {
    src = this._start(src);
    const dist = {}; this.nodes.forEach((n) => (dist[n.id] = Infinity)); dist[src] = 0;
    let rounds = 0;
    for (let r = 1; r < this.nodes.length; r++) {
      rounds = r; let changed = false;
      for (const e of this.edges) if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) { dist[e.v] = dist[e.u] + e.w; changed = true; }
      if (!changed) break;
    }
    const negCycle = this.edges.some((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
    return { dist, rounds, negCycle };
  }

  /** Traced Bellman-Ford from src: round r relaxes EVERY edge in edge-list
   *  order (one frame per edge); a round with no change ends the run early;
   *  after V−1 rounds a final pass checks for an edge that still relaxes,
   *  which proves a negative cycle. Negative weights are allowed. */
  bellmanFord(src = 0) {
    src = this._start(src);
    const t = new Tracer();
    const V = this.nodes.length;
    const dist = {}, prev = {};
    this.nodes.forEach((n) => (dist[n.id] = Infinity)); dist[src] = 0;
    const tree = () => Object.entries(prev).map(([v, u]) => [u, Number(v)]);
    const snap = (r) => ({ ...this.snapshot(), frontier: { label: `round ${r} of at most ${V - 1}`, items: this.nodes.map((n) => `${n.id}:${show(dist[n.id])}`) } });
    const HL = (edge, extra = {}) => ({ nodes: { active: edge ? [edge[0]] : [], ...extra.nodes }, edges: { tree: tree(), active: edge ? [edge] : [], ...extra.edges }, dist: { ...dist } });
    t.step(`init: dist[${src}] = 0, every other vertex = ∞; ${V} vertices, so at most ${V - 1} rounds`, { snapshot: snap(0), highlight: HL(null) });
    let r = 0;
    for (r = 1; r < V; r++) {
      let changed = 0;
      t.step(`round ${r}: relax all ${this.edges.length} edges, in edge-list order`, { snapshot: snap(r), highlight: HL(null) });
      for (const e of this.edges) {
        t.count("compare");
        if (dist[e.u] === Infinity) {
          t.step(`round ${r}: ${e.u}→${e.v} (w ${e.w}): dist[${e.u}] = ∞, nothing to offer`, { snapshot: snap(r), highlight: HL([e.u, e.v]) });
          continue;
        }
        const nd = dist[e.u] + e.w;
        if (nd < dist[e.v]) {
          const old = dist[e.v]; dist[e.v] = nd; prev[e.v] = e.u; changed++; t.count("write");
          t.step(`round ${r}: relax ${e.u}→${e.v} (w ${e.w}): ${show(dist[e.u])} + ${e.w} = ${nd} < ${show(old)} → dist[${e.v}] = ${nd}`, { snapshot: snap(r), highlight: HL([e.u, e.v]) });
        } else {
          t.step(`round ${r}: ${e.u}→${e.v} (w ${e.w}): ${dist[e.u]} + ${e.w} = ${nd} ≥ ${show(dist[e.v])}, no change`, { snapshot: snap(r), highlight: HL([e.u, e.v]) });
        }
      }
      if (!changed) {
        t.step(`round ${r} changed nothing: every distance is final, stop early (no negative cycle is possible)`, { snapshot: snap(r), highlight: { nodes: { done: this.nodes.map((n) => n.id) }, edges: { tree: tree() }, dist: { ...dist } } });
        return t.trace();
      }
      t.step(`end of round ${r}: ${changed} distance${changed === 1 ? "" : "s"} improved; every shortest path of at most ${r} edge${r === 1 ? "" : "s"} is now final`, { snapshot: snap(r), highlight: HL(null) });
    }
    // after V−1 rounds: one more pass looks for an edge that still relaxes
    const broken = this.edges.filter((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
    t.step(`${V - 1} rounds done. One more pass over the edges: if any edge still relaxes, a negative cycle is reachable`, { snapshot: snap(V - 1), highlight: HL(null) });
    if (broken.length) {
      broken.forEach((e) => {
        t.step(`CHECK: ${e.u}→${e.v} (w ${e.w}) still relaxes: ${dist[e.u]} + ${e.w} = ${dist[e.u] + e.w} < ${dist[e.v]}. A NEGATIVE CYCLE: no shortest path exists`,
          { snapshot: snap(V - 1), highlight: { nodes: { danger: [e.v] }, edges: { active: [[e.u, e.v]], tree: tree() }, dist: { ...dist } } });
      });
    } else {
      t.step(`no edge relaxes: the labels are shortest-path distances from ${src}; the accent edges are the shortest-paths tree`, { snapshot: snap(V - 1), highlight: { nodes: { done: this.nodes.map((n) => n.id) }, edges: { tree: tree() }, dist: { ...dist } } });
    }
    return t.trace();
  }
}
