// CSS 343 unified library — demos/graph.js
// Full-demo spec for the directed graph on fixed vertices 0–7 with an EDITABLE
// edge list ("u v, u v, …" pairs). DFS (with back-edge/cycle detection), BFS
// (distance labels), and topological sort, step by step. GraphRenderer.

import { ArrayRenderer, Graph, graphInfo, GraphRenderer } from "../index.js";

// second-canvas adapter: the traversal's CONTAINER (BFS queue / DFS recursion
// stack / Kahn ready set), carried in each frame's snapshot.frontier
const frontierView = (inner) => ({
  draw: (snap) => inner.draw(snap?.frontier?.items ?? [], {}),
});
// third-canvas adapter: the OUTPUT built so far — each frame's highlight.done
// list IS the algorithm's product (BFS: visit order · DFS: finish order,
// whose reverse is a topological order · Kahn: the topological order)
const outputView = (inner) => ({
  draw: (snap, hl) => inner.draw(hl?.nodes?.done ?? [], {}),
});

export const graphDemo = {
  id: "graph",
  title: "Graph (DFS / BFS / topo-sort)",
  blurb: "Vertices 0–7 with an editable edge list (pairs \"u v\") — or a generator: PATH:8, RING:8 (a cycle — topo sort reports it), STAR:8, COMPLETE:5, RAND:8:12. DFS dives (tree edges; a back edge = a cycle); BFS explores in layers (each label = fewest edges from the start); topological sort peels in-degree-0 vertices. The second row shows each search's hidden container — the QUEUE that makes BFS breadth-first, the recursion STACK that makes DFS depth-first, and Kahn's ready set.",
  make: () => new Graph({ layout: "circle" }),   // exploratory tier — input-agnostic layout
  initial: "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7",  // circle-friendly DAG: perimeter edges + spread chords
  presets: [
    { name: "sample DAG (8 vertices)", initial: "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7" },
    { name: "with a cycle (6→2 added)", initial: "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7, 6 2" },
    { name: "ring (a cycle — topo reports it)", initial: "RING:8" },
    { name: "random (8 vertices, 12 edges)", initial: "RAND:8:12" },
  ],
  scripts: [
    { name: "DFS vs BFS from 0 — compare the orders", text: "dfs 0\nbfs 0" },
    { name: "Kahn, then DFS double-checks", text: "topo\ndfs 0" },
  ],
  info: graphInfo,
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "graph",
  labels: [
    "the graph",
    "the frontier — BFS: the queue · DFS: the recursion stack · topo: the in-degree-0 ready set",
    "the OUTPUT so far — BFS: visit order · DFS: finish order (reverse it → topo) · Kahn: the topological order",
  ],
  initialPlaceholder: "u v, u v, … or RING:8",
  initialTitle: "edge pairs, or a generator: PATH:n / RING:n / STAR:n / COMPLETE:n / RAND:n:m (n ≤ 8)",
  stateMsg: (g) => `directed graph — ${g.inorder()}. Edit the edge pairs (or type a generator like RING:8), Build, then run.`,
  renderer: [
    (c) => new GraphRenderer(c, { directed: true }),
    (c) => frontierView(new ArrayRenderer(c, { mode: "cells", pointers: false })),
    (c) => outputView(new ArrayRenderer(c, { mode: "cells", pointers: false })),
  ],
  costs: ["visit", "compare"],
  valPlaceholder: "start vertex", valWidth: 85,
  ops: [
    { name: "DFS from", arg: "number", desc: "dive along unvisited edges, backtrack at dead ends; a back edge to a stack ancestor = a CYCLE", run: (s, v) => s.dfs(v) },
    { name: "BFS from", arg: "number", desc: "explore in layers via the queue; each label = fewest edges from the start", run: (s, v) => s.bfs(v) },
    { name: "Topo sort", desc: "Kahn: repeatedly output an in-degree-0 vertex; the finale lines the vertices up — every edge points right", run: (s) => s.topo() },
  ],
  width: 820, height: [300, 52, 52],
};
