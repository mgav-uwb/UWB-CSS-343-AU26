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
// the same ring over an arbitrary id list (opts.trim draws only used vertices)
const circleIds = (aspect, ids) => ids.map((id, i) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
  let rx = 0.45, ry = 0.42;
  if (aspect >= 1) { ry = 0.42; rx = ry / aspect; }
  else if (aspect > 0) { rx = 0.45; ry = rx * aspect; }
  return { id, x: 0.5 + rx * Math.cos(a), y: 0.5 + ry * Math.sin(a) };
});
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [1, 4], [3, 5], [4, 5], [5, 6], [4, 7]];

export class Graph {
  /** @param {{layout?:("hand"|"circle"), aspect?:number}} [opts] — "circle" for
   *  exploratory (gallery) use; aspect (plot width/height) keeps it round on-screen */
  constructor(opts = {}) { this.nodes = []; this.edges = []; this.adj = {}; this.layout = opts.layout ?? "hand"; this.aspect = opts.aspect; this.trim = !!opts.trim; }

  /** keys = consecutive pairs "u v" → directed edges among vertices 0–7.
   *  Out-of-range / self-loop / duplicate / unpaired inputs are DROPPED, but
   *  never silently: rejectedCount + rejectedWhy feed the demo warning band. */
  build(keys) {
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
    // opts.trim: draw only the vertices the edge list mentions (a 6-vertex
    // example shows 6 vertices, not 8 with two strays); default: all eight
    const used = [...new Set(this.edges.flatMap((e) => [e.u, e.v]))].sort((a, b) => a - b);
    const ids = this.trim && used.length ? used : NODES.map((n) => n.id);
    this.nodes = (this.layout === "circle" ? circleIds(this.aspect, ids) : NODES.filter((n) => ids.includes(n.id))).map((n) => ({ ...n }));
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
    t.step(`${this.nodes.length} vertices: now add the edges (pairs "u v")`, { snapshot: this.snapshot() });
    finalEdges.forEach((e) => {
      this.edges.push(e);
      t.step(`add edge ${e.u} → ${e.v}`, { snapshot: this.snapshot(), highlight: { edges: { active: [[e.u, e.v]] } } });
    });
    this._index();
    t.step(`built: ${this.inorder()}`, { snapshot: this.snapshot() });
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
          t.step(`tree edge ${u} → ${v}: recurse into ${v}`, { snapshot: snap(), highlight: HL(v) });
          visit(v);
          t.step(`back at ${u}`, { snapshot: snap(), highlight: HL(u) });
        } else if (onStack.has(v)) {
          cycles++;
          t.step(`BACK EDGE ${u} → ${v}: ${v} is an ancestor still on the stack: a CYCLE`,
            { snapshot: snap(), highlight: { nodes: { active: [u], danger: [v], visited: [...visited].filter((x) => !finished.includes(x)), done: [...finished] }, edges: { tree: tree.slice(), active: [[u, v]] } } });
        } else {
          t.step(`${u} → ${v}: ${v} already visited: skip`, { snapshot: snap(), highlight: HL(u, [u, v]) });
        }
      }
      onStack.delete(u); stack.pop(); finished.push(u);
      t.step(`${u} finished (post-order #${finished.length})`, { snapshot: snap(), highlight: HL(u) });
    })(start);
    const missed = this.nodes.length - finished.length;
    const tail = missed ? ` (${missed} unreachable from ${start})` : "";
    t.step(cycles
      ? `DFS done: visited ${finished.length}${tail}; found ${cycles} back edge${cycles > 1 ? "s" : ""} → the graph has a CYCLE`
      : `DFS done: visited ${finished.length}${tail}; no back edges; reverse post-order is a topological order`,
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
      t.step(`dequeue ${u} (dist ${dist[u]}): scan its neighbors`, { snapshot: snap(), highlight: { nodes: { active: [u], visited: [...visited], done: [...done] }, edges: { tree: tree.slice() }, dist: { ...dist } } });
      for (const v of this._out(u)) {
        t.count("compare");
        if (!visited.has(v)) {
          visited.add(v); dist[v] = dist[u] + 1; tree.push([u, v]); q.push(v);
          t.step(`discover ${v} via ${u} → dist ${dist[v]}, enqueue`, { snapshot: snap(), highlight: { nodes: { active: [v], visited: [...visited], done: [...done] }, edges: { tree: tree.slice(), active: [[u, v]] }, dist: { ...dist } } });
        } else {
          t.step(`${u} → ${v}: already seen; skip`, { snapshot: snap(), highlight: { nodes: { active: [u], visited: [...visited], done: [...done] }, edges: { tree: tree.slice(), faded: [[u, v]] }, dist: { ...dist } } });
        }
      }
    }
    const missed = this.nodes.length - done.length;
    t.step(`BFS done: each label is the shortest number of edges from ${start}${missed ? ` (${missed} unreachable)` : ""}`,
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
    t.step(ok ? `topological order: ${order.join(" → ")}` : `a cycle exists: no topological order (only ${order.length}/${this.nodes.length} output)`,
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
      t.step(`the payoff: line the vertices up in this order; EVERY edge points right (${order.join(" ")})`,
        { snapshot: lineSnap, highlight: { nodes: { done: [...order] } } });
    }
    return t.trace();
  }

  // ---- DFS numbering and edge types (Lecture 10) ---------------------------

  /** Untraced reference: one DFS with a shared clock, restarting at every white
   *  vertex in index order, neighbors in increasing order. Returns
   *  {pre, post, kinds: {tree, back, forward, cross} as [u, v] lists}. */
  dfsEdgesRef() {
    const color = {}, pre = {}, post = {}, kinds = { tree: [], back: [], forward: [], cross: [] };
    let clock = 0;
    this.nodes.forEach((n) => (color[n.id] = "W"));
    const go = (u) => {
      color[u] = "G"; pre[u] = ++clock;
      for (const v of this._out(u)) {
        if (color[v] === "W") { kinds.tree.push([u, v]); go(v); }
        else if (color[v] === "G") kinds.back.push([u, v]);
        else (pre[u] < pre[v] ? kinds.forward : kinds.cross).push([u, v]);
      }
      color[u] = "B"; post[u] = ++clock;
    };
    this.nodes.map((n) => n.id).sort((a, b) => a - b).forEach((s) => { if (color[s] === "W") go(s); });
    return { pre, post, kinds };
  }

  /** Traced DFS with discovery/finish times and edge classification. Each vertex
   *  carries "pre/post" (a pill); colors: white (unvisited), gray (on the stack),
   *  black (finished). Every examined edge is drawn in its type's style. */
  dfsEdges() {
    const t = new Tracer();
    const color = {}, pre = {}, post = {}, kinds = { tree: [], back: [], forward: [], cross: [] };
    let clock = 0;
    const stack = [];
    this.nodes.forEach((n) => (color[n.id] = "W"));
    const stamp = () => {
      const d = {};
      this.nodes.forEach((n) => { if (pre[n.id]) d[n.id] = `${pre[n.id]}/${post[n.id] ?? "·"}`; });
      return d;
    };
    const legend = [
      { label: "tree", color: "#7c5cff" }, { label: "back", color: "#b3261e" },
      { label: "forward", color: "#0a7d4d", dash: [9, 5] }, { label: "cross", color: "#d97706", dash: [3, 4] },
    ];
    const snap = () => ({ ...this.snapshot(), frontier: { label: "recursion stack", items: stack.slice() } });
    const HL = (active, extra = {}) => ({
      nodes: {
        active: active != null ? [active] : [],
        visited: this.nodes.map((n) => n.id).filter((x) => color[x] === "G" && x !== active),
        black: this.nodes.map((n) => n.id).filter((x) => color[x] === "B"),
        ...extra.nodes,
      },
      edges: { kinds: { tree: kinds.tree.slice(), back: kinds.back.slice(), forward: kinds.forward.slice(), cross: kinds.cross.slice() }, ...extra.edges },
      dist: stamp(), legend,
    });
    t.step(`every vertex starts WHITE; one clock, starting at 0`, { snapshot: snap(), highlight: HL(null) });
    const self = this;
    const go = (u) => {
      color[u] = "G"; pre[u] = ++clock; stack.push(u); t.count("visit");
      t.step(`discover ${u}: pre[${u}] = ${pre[u]}; ${u} turns GRAY (on the stack)`, { snapshot: snap(), highlight: HL(u) });
      for (const v of self._out(u)) {
        t.count("compare");
        if (color[v] === "W") {
          kinds.tree.push([u, v]);
          t.step(`${u} → ${v}: ${v} is WHITE, so a TREE edge; recurse into ${v}`, { snapshot: snap(), highlight: HL(u) });
          go(v);
          t.step(`back at ${u}`, { snapshot: snap(), highlight: HL(u) });
        } else if (color[v] === "G") {
          kinds.back.push([u, v]);
          t.step(`${u} → ${v}: ${v} is GRAY (an ancestor on the stack), so a BACK edge: a cycle`, { snapshot: snap(), highlight: HL(u, { nodes: { danger: [v] } }) });
        } else if (pre[u] < pre[v]) {
          kinds.forward.push([u, v]);
          t.step(`${u} → ${v}: ${v} is BLACK and pre[${u}] = ${pre[u]} < pre[${v}] = ${pre[v]}, so a FORWARD edge (to a finished descendant)`, { snapshot: snap(), highlight: HL(u) });
        } else {
          kinds.cross.push([u, v]);
          t.step(`${u} → ${v}: ${v} is BLACK and pre[${v}] = ${pre[v]} < pre[${u}] = ${pre[u]}, so a CROSS edge (finished earlier, elsewhere)`, { snapshot: snap(), highlight: HL(u) });
        }
      }
      color[u] = "B"; post[u] = ++clock; stack.pop();
      t.step(`finish ${u}: post[${u}] = ${post[u]}; ${u} turns BLACK`, { snapshot: snap(), highlight: HL(u) });
    };
    const ids = this.nodes.map((n) => n.id).sort((a, b) => a - b);
    ids.forEach((s) => {
      if (color[s] !== "W") return;
      if (pre[ids[0]] != null) t.step(`nothing left is reachable; restart at the next WHITE vertex, ${s}`, { snapshot: snap(), highlight: HL(null) });
      go(s);
    });
    const n = (k) => kinds[k].length;
    t.step(`done: ${n("tree")} tree, ${n("back")} back, ${n("forward")} forward, ${n("cross")} cross; ${n("back") ? "a back edge means the graph has a CYCLE" : "no back edge, so the graph is a DAG"}`,
      { snapshot: snap(), highlight: HL(null) });
    return t.trace();
  }

  // ---- strongly connected components: Kosaraju, CLRS order (Lecture 10) ----

  /** Untraced reference: pass 1 DFS on G records post-order; pass 2 DFS on the
   *  transpose in reverse post-order; each restart is one component.
   *  Returns {post, order, comps: [[ids in visit order], …]}. */
  sccRef() {
    const ids = this.nodes.map((n) => n.id).sort((a, b) => a - b);
    const seen = new Set(), post = {}, fin = [];
    let clock = 0;
    const pre = {};
    const go1 = (u) => { seen.add(u); pre[u] = ++clock; for (const v of this._out(u)) if (!seen.has(v)) go1(v); post[u] = ++clock; fin.push(u); };
    ids.forEach((s) => { if (!seen.has(s)) go1(s); });
    const radj = {}; ids.forEach((x) => (radj[x] = []));
    this.edges.forEach((e) => radj[e.v].push(e.u));
    Object.values(radj).forEach((a) => a.sort((x, y) => x - y));
    const order = fin.slice().reverse(), comp = {}, comps = [];
    const go2 = (u, c) => { comp[u] = c; comps[c].push(u); for (const v of radj[u]) if (comp[v] == null) go2(v, c); };
    order.forEach((s) => { if (comp[s] == null) { comps.push([]); go2(s, comps.length - 1); } });
    return { post, order, comps };
  }

  /** Traced Kosaraju: pass 1 (finish order grows), the transpose (edges flip one
   *  by one), pass 2 on the transpose in reverse post-order (each component in
   *  its own colour), then the component DAG. */
  scc() {
    const t = new Tracer();
    const ids = this.nodes.map((n) => n.id).sort((a, b) => a - b);
    const seen = new Set(), post = {}, fin = [];
    let clock = 0;
    const pills = () => { const d = {}; ids.forEach((x) => { if (post[x] != null) d[x] = post[x]; }); return d; };
    let edges = this.edges.map((e) => ({ ...e }));
    const snap = (label, items) => ({ nodes: this.nodes.map((n) => ({ ...n })), edges: edges.map((e) => ({ ...e })), frontier: { label, items: items.slice() } });
    // ---- pass 1
    const self = this;
    t.step(`pass 1: DFS on G, restarting at every unvisited vertex; record each vertex when it FINISHES`, { snapshot: snap("finish order (post-order)", fin), highlight: {} });
    const go1 = (u) => {
      seen.add(u); clock++; t.count("visit");
      t.step(`pass 1: discover ${u}`, { snapshot: snap("finish order (post-order)", fin), highlight: { nodes: { active: [u], visited: [...seen].filter((x) => post[x] == null && x !== u), done: fin.slice() }, dist: pills() } });
      for (const v of self._out(u)) { t.count("compare"); if (!seen.has(v)) go1(v); }
      post[u] = ++clock; fin.push(u);
      t.step(`pass 1: ${u} finishes (post ${post[u]}); append it to the finish order`, { snapshot: snap("finish order (post-order)", fin), highlight: { nodes: { active: [u], visited: [...seen].filter((x) => post[x] == null), done: fin.slice() }, dist: pills() } });
    };
    ids.forEach((s) => { if (!seen.has(s)) go1(s); });
    const order = fin.slice().reverse();
    t.step(`pass 1 done. Reverse post-order (latest finish first): ${order.join(" ")}`, { snapshot: snap("reverse post-order", order), highlight: { nodes: { done: fin.slice() }, dist: pills() } });
    // ---- transpose
    const flipped = [];
    this.edges.forEach((e, i) => {
      edges[i] = { ...e, u: e.v, v: e.u };
      flipped.push([e.v, e.u]);
      t.step(`transpose: ${e.u} → ${e.v} becomes ${e.v} → ${e.u}`, { snapshot: snap("reverse post-order", order), highlight: { edges: { active: [[e.v, e.u]], tree: flipped.slice(0, -1) }, dist: pills() } });
    });
    t.step(`the transpose Gᵀ: same vertices, every edge reversed; the components are unchanged`, { snapshot: snap("reverse post-order", order), highlight: { dist: pills() } });
    // ---- pass 2 on the transpose
    const radj = {}; ids.forEach((x) => (radj[x] = []));
    edges.forEach((e) => radj[e.u].push(e.v));
    Object.values(radj).forEach((a) => a.sort((x, y) => x - y));
    const comp = {}, comps = [];
    const groupHL = () => { const g = {}; ids.forEach((x) => { if (comp[x] != null) g[x] = comp[x]; }); return g; };
    const go2 = (u, c) => {
      comp[u] = c; comps[c].push(u); t.count("visit");
      t.step(`pass 2: ${u} joins component ${String.fromCharCode(65 + c)}`, { snapshot: snap("reverse post-order", order), highlight: { nodes: { active: [u], group: groupHL() }, dist: pills() } });
      for (const v of radj[u]) { t.count("compare"); if (comp[v] == null) go2(v, c); }
    };
    order.forEach((s) => {
      if (comp[s] != null) {
        t.step(`pass 2: ${s} is next in reverse post-order, but already in component ${String.fromCharCode(65 + comp[s])}: skip`, { snapshot: snap("reverse post-order", order), highlight: { nodes: { active: [s], group: groupHL() }, dist: pills() } });
        return;
      }
      comps.push([]);
      t.step(`pass 2: start a DFS on Gᵀ at ${s}, the next unmarked vertex in reverse post-order: a new component, ${String.fromCharCode(65 + comps.length - 1)}`, { snapshot: snap("reverse post-order", order), highlight: { nodes: { active: [s], group: groupHL() }, dist: pills() } });
      go2(s, comps.length - 1);
      const c = comps.length - 1;
      t.step(`component ${String.fromCharCode(65 + c)} = {${comps[c].slice().sort((a, b) => a - b).join(", ")}}: the search could not leak out`, { snapshot: snap("reverse post-order", order), highlight: { nodes: { group: groupHL() }, dist: pills() } });
    });
    // ---- the component DAG (in G's direction)
    const L = (i) => String.fromCharCode(65 + i);
    const k = comps.length, cn = comps.map((m, i) => ({ id: L(i), x: k === 1 ? 0.5 : 0.08 + 0.84 * (i / (k - 1)), y: 0.55 }));
    const cseen = new Set(), cedges = [];
    this.edges.forEach((e) => {
      const a = comp[e.u], b = comp[e.v];
      if (a === b) return;
      const key = `${a}>${b}`;
      if (!cseen.has(key)) { cseen.add(key); cedges.push({ u: L(a), v: L(b), directed: true, bend: Math.abs(b - a) > 1 ? -(14 + 10 * Math.abs(b - a)) : 0 }); }
    });
    const g = {}, members = {};
    cn.forEach((n, i) => { g[n.id] = i; members[n.id] = comps[i].slice().sort((a, b) => a - b).join(" "); });
    const names = comps.map((m, i) => `${String.fromCharCode(65 + i)} = {${m.slice().sort((a, b) => a - b).join(", ")}}`).join(", ");
    t.step(`${k} strongly connected component${k === 1 ? "" : "s"}: ${names}. The component graph is a DAG, and pass 2 found the components in its topological order`,
      { snapshot: { nodes: cn, edges: cedges, frontier: { label: "components, in the order found", items: comps.map((m, i) => String.fromCharCode(65 + i)) } }, highlight: { nodes: { group: g }, dist: members } });
    return t.trace();
  }
}
