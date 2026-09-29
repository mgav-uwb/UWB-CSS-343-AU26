// CSS 343 unified library — structures/graph.js
// A small directed graph on EIGHT FIXED VERTICES (0–7, hand-placed positions)
// with an EDITABLE edge list, plus traced DFS (with back-edge/cycle detection),
// BFS, and topological sort. build(keys) reads keys as consecutive PAIRS
// "u v, u v, …" → directed edges (empty input → the sample DAG); buildTrace()
// animates the edges appearing one at a time. Rendered with the shared
// GraphRenderer: snapshot() = {nodes:[{id,x,y}], edges:[{u,v,directed}]};
// traversal state is carried in each frame's highlight ({nodes:{active,visited,
// done,danger}, edges:{tree,active,faded}, dist:{id:val}}).

import { Tracer } from "../core/tracer.js";

// a sample DAG: edges flow generally left→right, so a topological order exists.
// HAND layout = a structured ladder tuned for the sample edges (slide demos run
// this fixed instance — every edge long enough that its highlight reads);
// CIRCLE layout (opts.layout: "circle") is input-agnostic for the exploratory
// gallery, where users type arbitrary edge sets / generators.
const NODES = [
  { id: 0, x: 0.05, y: 0.50 }, { id: 1, x: 0.30, y: 0.16 }, { id: 2, x: 0.30, y: 0.84 },
  { id: 3, x: 0.55, y: 0.16 }, { id: 4, x: 0.55, y: 0.84 }, { id: 5, x: 0.80, y: 0.42 },
  { id: 6, x: 0.96, y: 0.42 }, { id: 7, x: 0.82, y: 0.88 },
];
// aspect = the canvas PLOT AREA's width/height. Without it the ring is an
// ellipse in normalized coords, which a wide demo canvas squashes flat; with
// it the radii are corrected so the ring renders ROUND in pixels (vertices
// evenly spaced, 0 at the top, clockwise — the handouts' figure layout).
const circleNodes = (aspect) => NODES.map((n, i) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / NODES.length;
  let rx = 0.45, ry = 0.42;                       // legacy ellipse (no aspect given)
  if (aspect >= 1) { ry = 0.42; rx = ry / aspect; }
  else if (aspect > 0) { rx = 0.45; ry = rx * aspect; }
  return { id: n.id, x: 0.5 + rx * Math.cos(a), y: 0.5 + ry * Math.sin(a) };
});
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [1, 4], [3, 5], [4, 5], [5, 6], [4, 7]];

export class Graph {
  /** @param {{layout?:("hand"|"circle"), aspect?:number}} [opts] — "circle" for
   *  exploratory (gallery) use; aspect (plot width/height) keeps it round on-screen */
  constructor(opts = {}) { this.nodes = []; this.edges = []; this.adj = {}; this.layout = opts.layout ?? "hand"; this.aspect = opts.aspect; }

  /** keys = consecutive pairs "u v" → directed edges among vertices 0–7.
   *  Out-of-range / self-loop / duplicate / unpaired inputs are DROPPED, but
   *  never silently: rejectedCount + rejectedWhy feed the demo warning band. */
  build(keys) {
    this.nodes = (this.layout === "circle" ? circleNodes(this.aspect) : NODES).map((n) => ({ ...n }));
    const ks = (keys || []).filter(Number.isFinite);
    const pairs = [];
    for (let i = 0; i + 1 < ks.length; i += 2) pairs.push([ks[i], ks[i + 1]]);
    const ok = ([u, v]) => u >= 0 && u < NODES.length && v >= 0 && v < NODES.length && u !== v;
    const kept = pairs.filter(ok);
    const list = pairs.length ? kept : EDGES;
    const seen = new Set();
    this.edges = [];
    list.forEach(([u, v]) => {
      const k = `${u}>${v}`;
      if (!seen.has(k)) { seen.add(k); this.edges.push({ u, v, directed: true }); }
    });
    this.rejectedCount = (ks.length % 2)                          // a trailing unpaired number
      + (pairs.length ? pairs.length - kept.length : 0)           // out of range / self-loops
      + (pairs.length ? list.length - this.edges.length : 0);     // duplicates
    this._index();
    return this;
  }
  get rejectedWhy() { return `edges are "u v" pairs of two DIFFERENT vertices 0–${NODES.length - 1}; out-of-range, self-loop, duplicate, and unpaired inputs are ignored`; }
  loadRaw(keys) { return this.build(keys); } // silent build (FullDemo initial display)
  _index() {
    this.adj = {}; this.nodes.forEach((n) => (this.adj[n.id] = []));
    this.edges.forEach((e) => this.adj[e.u].push(e.v));
    Object.values(this.adj).forEach((a) => a.sort((x, y) => x - y)); // deterministic order
  }

  /** Animated Build: the vertices appear, then the edges land one at a time. */
  buildTrace(keys) {
    const t = new Tracer();
    this.build(keys);
    const finalEdges = this.edges;
    this.edges = [];
    t.step(`${NODES.length} fixed vertices — now add the edges (pairs "u v")`, { snapshot: this.snapshot() });
    finalEdges.forEach((e) => {
      this.edges.push(e);
      t.step(`add edge ${e.u} → ${e.v}`, { snapshot: this.snapshot(), highlight: { edges: { active: [[e.u, e.v]] } } });
    });
    this._index();
    t.step(`built — ${this.inorder()}`, { snapshot: this.snapshot() });
    return t.trace();
  }

  snapshot() { return { nodes: this.nodes.map((n) => ({ ...n })), edges: this.edges.map((e) => ({ ...e })) }; }
  inorder() { return `${this.nodes.length} vertices · ${this.edges.length} directed edges`; }
  _out(u) { return this.adj[u] || []; }
  _start(s) { return this.adj[s] ? s : 0; } // fall back to 0 on an invalid start vertex

  /** Depth-first search from `start`: tree edges vs already-visited (faded); a
   *  neighbor still ON THE RECURSION STACK is a back edge = a cycle (danger). */
  dfs(start = 0) {
    start = this._start(start);
    const t = new Tracer();
    const visited = new Set(), onStack = new Set(), finished = [], tree = [];
    const stack = []; // mirrors the recursion stack, for the frontier view
    let cycles = 0;
    const snap = () => ({ ...this.snapshot(), frontier: { label: "stack", items: stack.slice() } });
    const HL = (active, faded) => ({
      nodes: { active: active != null ? [active] : [], visited: [...visited].filter((x) => !finished.includes(x)), done: [...finished] },
      edges: { tree: tree.slice(), faded: faded ? [faded] : [] },
    });
    const self = this;
    (function visit(u) {
      visited.add(u); onStack.add(u); stack.push(u); t.count("visit");
      t.step(`visit ${u}`, { snapshot: snap(), highlight: HL(u) });
      for (const v of self._out(u)) {
        t.count("compare");
        if (!visited.has(v)) {
          tree.push([u, v]);
          t.step(`tree edge ${u} → ${v} — recurse into ${v}`, { snapshot: snap(), highlight: HL(v) });
          visit(v);
          t.step(`back at ${u}`, { snapshot: snap(), highlight: HL(u) });
        } else if (onStack.has(v)) {
          cycles++;
          t.step(`BACK EDGE ${u} → ${v}: ${v} is an ancestor still on the stack — a CYCLE`,
            { snapshot: snap(), highlight: { nodes: { active: [u], danger: [v], visited: [...visited].filter((x) => !finished.includes(x)), done: [...finished] }, edges: { tree: tree.slice(), active: [[u, v]] } } });
        } else {
          t.step(`${u} → ${v}: ${v} already visited — skip`, { snapshot: snap(), highlight: HL(u, [u, v]) });
        }
      }
      onStack.delete(u); stack.pop(); finished.push(u);
      t.step(`${u} finished (post-order #${finished.length})`, { snapshot: snap(), highlight: HL(u) });
    })(start);
    const missed = this.nodes.length - finished.length;
    const tail = missed ? ` (${missed} unreachable from ${start})` : "";
    t.step(cycles
      ? `DFS done — visited ${finished.length}${tail}; found ${cycles} back edge${cycles > 1 ? "s" : ""} → the graph has a CYCLE`
      : `DFS done — visited ${finished.length}${tail}; no back edges; reverse post-order is a topological order`,
      { snapshot: snap(), highlight: { nodes: { done: [...finished] }, edges: { tree: tree.slice() } } });
    return t.trace();
  }

  /** Breadth-first search from `start`: dist = fewest edges (BFS layers, shown as node labels). */
  bfs(start = 0) {
    start = this._start(start);
    const t = new Tracer();
    const dist = {}, visited = new Set([start]), done = [], tree = [];
    dist[start] = 0; const q = [start];
    const snap = () => ({ ...this.snapshot(), frontier: { label: "queue", items: q.slice() } });
    t.step(`start BFS at ${start} (dist 0), enqueue it`, { snapshot: snap(), highlight: { nodes: { active: [start], visited: [start] }, dist: { ...dist } } });
    while (q.length) {
      const u = q.shift(); done.push(u); t.count("visit");
      t.step(`dequeue ${u} (dist ${dist[u]}) — scan its neighbors`, { snapshot: snap(), highlight: { nodes: { active: [u], visited: [...visited], done: [...done] }, edges: { tree: tree.slice() }, dist: { ...dist } } });
      for (const v of this._out(u)) {
        t.count("compare");
        if (!visited.has(v)) {
          visited.add(v); dist[v] = dist[u] + 1; tree.push([u, v]); q.push(v);
          t.step(`discover ${v} via ${u} → dist ${dist[v]}, enqueue`, { snapshot: snap(), highlight: { nodes: { active: [v], visited: [...visited], done: [...done] }, edges: { tree: tree.slice(), active: [[u, v]] }, dist: { ...dist } } });
        } else {
          t.step(`${u} → ${v}: already seen — skip`, { snapshot: snap(), highlight: { nodes: { active: [u], visited: [...visited], done: [...done] }, edges: { tree: tree.slice(), faded: [[u, v]] }, dist: { ...dist } } });
        }
      }
    }
    const missed = this.nodes.length - done.length;
    t.step(`BFS done — each label is the shortest number of edges from ${start}${missed ? ` (${missed} unreachable)` : ""}`,
      { snapshot: snap(), highlight: { nodes: { done: [...done] }, edges: { tree: tree.slice() }, dist: { ...dist } } });
    return t.trace();
  }

  /** Topological sort (Kahn's algorithm): repeatedly output an in-degree-0 vertex. */
  topo() {
    const t = new Tracer();
    const indeg = {}; this.nodes.forEach((n) => (indeg[n.id] = 0));
    this.edges.forEach((e) => indeg[e.v]++);
    const order = [], removed = new Set();
    let ready = [];
    const snap = () => ({ ...this.snapshot(), frontier: { label: "ready (in-degree 0)", items: ready.slice() } });
    t.step(`compute in-degrees (shown on each vertex)`, { snapshot: snap(), highlight: { dist: { ...indeg } } });
    ready = this.nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
    while (ready.length) {
      ready.sort((a, b) => a - b);
      const u = ready.shift(); removed.add(u); order.push(u); t.count("visit");
      t.step(`${u} has in-degree 0 → output it (position ${order.length}). order: ${order.join(" ")}`, { snapshot: snap(), highlight: { nodes: { active: [u], done: [...order] }, dist: { ...indeg } } });
      for (const v of this._out(u)) {
        indeg[v]--; t.count("compare");
        t.step(`drop edge ${u} → ${v}: in-degree(${v}) = ${indeg[v]}`, { snapshot: snap(), highlight: { nodes: { active: [v], done: [...order] }, edges: { faded: [[u, v]] }, dist: { ...indeg } } });
        if (indeg[v] === 0 && !removed.has(v)) ready.push(v);
      }
    }
    const ok = order.length === this.nodes.length;
    t.step(ok ? `topological order: ${order.join(" → ")}` : `a cycle exists — no topological order (only ${order.length}/${this.nodes.length} output)`,
      { snapshot: snap(), highlight: { nodes: ok ? { done: [...order] } : { danger: this.nodes.map((n) => n.id).filter((x) => !removed.has(x)) } } });
    if (ok) {
      // Sedgewick's payoff picture (Algorithms fig. "edges all point right"):
      // redraw the SAME graph with the vertices on a line in the output order —
      // every edge becomes a right-pointing arc. Built as a pure snapshot (the
      // structure itself is untouched, so the next op runs on the real layout).
      const at = {}; order.forEach((id, i) => { at[id] = i; });
      const lineSnap = {
        nodes: this.nodes.map((n) => ({ ...n, x: 0.05 + 0.9 * (at[n.id] / Math.max(order.length - 1, 1)), y: 0.72 })),
        edges: this.edges.map((e) => {
          const span = at[e.v] - at[e.u];      // > 0 by construction — that IS the theorem
          // EVERY edge arcs forward above the line (even adjacent hops get a
          // gentle bow), so the straight line of vertices stays unobstructed
          // and each arrow visibly curves rightward; longer hops arc higher
          return { ...e, bend: -(8 + 7 * span) };
        }),
        frontier: { label: "ready (in-degree 0)", items: [] },
      };
      t.step(`the payoff: line the vertices up in this order — EVERY edge points right (${order.join(" ")})`,
        { snapshot: lineSnap, highlight: { nodes: { done: [...order] } } });
    }
    return t.trace();
  }
}
