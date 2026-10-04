// CSS 343 unified library: demos/graph-algos.js
// Full-demo specs for three graph algorithms from Lectures 10 and 11:
//   dfs-edges     DFS with one clock: pre/post stamps, white/gray/black, and
//                 every examined edge classified (tree, back, forward, cross)
//   scc           Kosaraju in the textbook order: DFS on G for the finish
//                 order, the transpose, DFS on the transpose in reverse
//                 post-order, then the component DAG
//   bellman-ford  relax every edge, round by round; early stop; the extra
//                 pass that detects a negative cycle
// All three draw with the shared GraphRenderer; the second row is an
// ArrayRenderer over snapshot.frontier (the stack, the finish order, or the
// distance row).

import { ArrayRenderer, Graph, GraphRenderer, WeightedGraph } from "../index.js";

const frontierView = (inner) => ({ draw: (snap) => inner.draw(snap?.frontier?.items ?? [], {}) });
const row = (c) => frontierView(new ArrayRenderer(c, { mode: "cells", pointers: false }));

const DFS_WORKED = "0 1, 0 2, 1 2, 2 0, 3 1, 3 4, 4 5, 5 3";
const DFS_TURN = "0 1, 0 4, 1 2, 2 3, 3 1, 4 3, 4 5, 5 0";
const COURSE_DAG = "0 1, 0 3, 1 2, 1 3, 2 3, 0 5, 3 4, 3 7, 4 5, 5 6, 4 7";

export const dfsEdgesDemo = {
  id: "dfs-edges",
  title: "DFS: discovery and finish times, edge types",
  blurb: "One DFS with one clock. A vertex is stamped pre when its call starts and post when it returns (the pill shows pre/post); it is WHITE before, GRAY while on the recursion stack, BLACK after. Every edge DFS examines gets a type from the color of its far end: white means TREE, gray means BACK (a cycle), black with pre[u] < pre[v] means FORWARD, black otherwise means CROSS. Neighbors in increasing order; DFS restarts at every white vertex in index order.",
  about: `
    <p><b>What it shows.</b> The clock, the three colors and the four edge types of Lecture 10,
      on one run. The pill on each vertex reads <code>pre/post</code> (a dot until the vertex
      finishes). The bottom row is the recursion stack.</p>
    <p><b>How to read an edge.</b> When DFS at <i>u</i> examines <i>u</i> → <i>v</i>, the color of
      <i>v</i> decides: white, a <b>tree</b> edge (solid purple, DFS recurses); gray, a <b>back</b>
      edge (solid red: <i>v</i> is an ancestor still on the stack, so there is a cycle); black and
      discovered after <i>u</i>, a <b>forward</b> edge (green dashes, to a finished descendant);
      black and discovered before <i>u</i>, a <b>cross</b> edge (orange dots).</p>
    <p><b>Things to try.</b> The lecture example finds all four types. The your-turn graph has
      no forward edge; check <code>4 → 3</code> is a cross edge. The course DAG has no back edge,
      which is how DFS proves a graph is acyclic.</p>
    <p><b>Input.</b> Directed edge pairs <code>u v</code> on vertices 0 to 7; only the vertices you
      mention are drawn.</p>`,
  make: () => new Graph({ layout: "circle", trim: true }),
  initial: DFS_WORKED,
  presets: [
    { name: "toy: a 3-cycle (0 → 1 → 2 → 0)", initial: "0 1, 1 2, 2 0" },
    { name: "the lecture example (all four types)", initial: DFS_WORKED },
    { name: "the your-turn graph", initial: DFS_TURN },
    { name: "the course DAG (no back edge)", initial: COURSE_DAG },
    { name: "8 vertices, 14 edges", initial: "0 1, 0 4, 1 2, 1 5, 2 0, 2 3, 3 7, 4 5, 5 2, 5 6, 6 3, 6 7, 7 4, 4 1" },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "graph",
  labels: ["", "the recursion stack (gray vertices)"],
  initialPlaceholder: "u v, u v, …",
  initialTitle: "directed edge pairs on vertices 0 to 7",
  stateMsg: (g) => `directed graph: ${g.inorder()}. Run DFS: neighbors in increasing order, restarts in index order`,
  renderer: [(c) => new GraphRenderer(c, { directed: true }), row],
  costs: ["visit", "compare"],
  ops: [{ name: "DFS with edge types", desc: "one clock; stamp pre and post; classify every examined edge by the color of its far end", run: (s) => s.dfsEdges() }],
  width: 820, height: [320, 52],
};

const SCC_WORKED = "0 1, 0 2, 1 6, 2 4, 3 6, 3 7, 4 2, 5 3, 6 0, 7 1, 7 5";
const SCC_TURN = "0 1, 1 0, 1 2, 2 3, 3 4, 4 2, 4 5";

export const sccDemo = {
  id: "scc",
  title: "Strongly connected components (Kosaraju)",
  blurb: "Kosaraju's two passes in the textbook order. Pass 1: DFS on G, restarting at every unvisited vertex; the finish order grows in the bottom row. Then the transpose: every edge flips. Pass 2: DFS on the transpose, taking start vertices in REVERSE post-order; each restart marks exactly one component, in its own color. The last frame is the component graph, which is always a DAG.",
  about: `
    <p><b>What it shows.</b> Why the order matters. The vertex that finishes last in G lies in a
      source component of G, which is a sink of the transpose, so a search started there cannot
      leak into another component. Each pass-2 search marks one component and stops.</p>
    <p><b>Reading it.</b> Pass 1 pills show post numbers; the bottom row is the finish order,
      then the reverse post-order. During the transpose each edge turns purple as it flips.
      In pass 2 each component gets a color and a letter (A, B, C, …).</p>
    <p><b>Things to try.</b> The lecture example ends with A = {3, 5, 7}, B = {0, 1, 6},
      C = {2, 4}. The your-turn graph has three components in a path. A ring is one component;
      the course DAG is eight, one per vertex.</p>
    <p><b>Input.</b> Directed edge pairs <code>u v</code> on vertices 0 to 7; neighbors in
      increasing order.</p>`,
  make: () => new Graph({ layout: "circle", trim: true }),
  initial: SCC_WORKED,
  presets: [
    { name: "toy: two 2-cycles joined (0 ⇄ 1 → 2 ⇄ 3)", initial: "0 1, 1 0, 1 2, 2 3, 3 2" },
    { name: "the lecture example (3 components)", initial: SCC_WORKED },
    { name: "the your-turn graph", initial: SCC_TURN },
    { name: "a ring: one component", initial: "RING:8" },
    { name: "the course DAG: eight components", initial: COURSE_DAG },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "graph",
  labels: ["", "pass 1: the finish order · pass 2: the reverse post-order"],
  initialPlaceholder: "u v, u v, …",
  initialTitle: "directed edge pairs on vertices 0 to 7",
  stateMsg: (g) => `directed graph: ${g.inorder()}. Run Kosaraju: two DFS passes and a transpose`,
  renderer: [(c) => new GraphRenderer(c, { directed: true }), row],
  costs: ["visit", "compare"],
  ops: [{ name: "Kosaraju", desc: "pass 1 on G records the finish order; transpose; pass 2 on the transpose in reverse post-order, one component per restart", run: (s) => s.scc() }],
  width: 820, height: [320, 52],
};

const WDAG = "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7";
const NEG_EDGE = "0 1 1, 0 2 2, 2 1 -4";
const NEG_CYCLE = "0 1 1, 1 2 -3, 2 1 1, 2 3 2";

export const bellmanFordDemo = {
  id: "bellman-ford",
  title: "Bellman-Ford (negative weights)",
  blurb: "Relax every edge, in edge-list order, once per round. After round r every shortest path of at most r edges is final, so V−1 rounds suffice; a round that changes nothing ends the run early. One more pass then looks for an edge that still relaxes: if one does, a negative cycle is reachable and no shortest path exists.",
  about: `
    <p><b>What it shows.</b> The algorithm Lecture 11 reaches for when Dijkstra's greedy choice is
      not safe. The pills are dist[]; the bottom row is the same distances, round by round.</p>
    <p><b>Things to try.</b> On the negative-edge example (s = 0, a = 1, b = 2: s→a 1, s→b 2,
      b→a −4) Bellman-Ford ends with dist[a] = −2, where Dijkstra settles a at 1 and never
      revisits it (open the Dijkstra demo on the same edges to compare). The negative-cycle preset
      ends with the extra pass flagging an edge in red. On the course graph the edge order happens
      to need only a couple of rounds; try reordering the triples to change the round count, not
      the answer.</p>
    <p><b>Input.</b> Weighted triples <code>u v w</code> on vertices 0 to 7; weights may be
      negative. Edges are relaxed in the order you type them.</p>`,
  make: () => new WeightedGraph({ layout: "circle" }),
  initial: NEG_EDGE,
  presets: [
    { name: "toy: one negative edge (Dijkstra says 1, the answer is −2)", initial: NEG_EDGE },
    { name: "the course graph (nonnegative)", initial: WDAG },
    { name: "a negative cycle (1 → 2 → 1, weight −2)", initial: NEG_CYCLE },
    { name: "a path typed backwards: V−1 rounds needed", initial: "4 5 1, 3 4 1, 2 3 1, 1 2 1, 0 1 1" },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "dijkstra",
  labels: ["", "dist[] (vertex:distance)"],
  initialPlaceholder: "u v w, …",
  initialTitle: "weighted directed triples; negative weights allowed",
  stateMsg: (g) => `weighted digraph: ${g.inorder()}. Run Bellman-Ford from a vertex`,
  renderer: [(c) => new GraphRenderer(c, { directed: true }), row],
  costs: ["compare", "write"],
  valPlaceholder: "source", valWidth: 70, valInitial: "0",
  ops: [{ name: "Bellman-Ford from", arg: "number", desc: "relax all edges once per round, up to V−1 rounds (early stop), then check for a negative cycle", run: (s, v) => s.bellmanFord(v) }],
  width: 820, height: [320, 52],
};
