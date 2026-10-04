// CSS 343 unified library — demos/dijkstra.js
// Full-demo spec for Dijkstra shortest paths: fixed vertices 0 to 19 with an
// EDITABLE weighted edge list (triples "u v w"). After every run the trace
// re-checks all edges — append a negative edge (e.g. "7 1 -20") and watch the
// greedy guarantee break in red.

import { WeightedGraph, GraphRenderer } from "../index.js";

export const dijkstraDemo = {
  id: "dijkstra",
  title: "Dijkstra (shortest paths)",
  blurb: "Weighted digraph on vertices 0 to 19 with an editable edge list (triples \"u v w\"). Repeatedly settle the nearest unsettled vertex and relax its outgoing edges: labels become shortest-path distances and the accent edges form the shortest-paths tree. Watch the direct 0→5 edge (weight 20) LOSE to the relaxed path through 3 and 4 (distance 11): relaxation in one picture. (This is the array-scan variant: its entire state IS the labels; the O(E log V) version keeps the same tentative distances in a priority queue.) Append \"7 1 -20\" to see a negative weight break the greedy guarantee (flagged in red by the final edge re-check).",
  make: () => new WeightedGraph({ layout: "circle" }),   // exploratory tier
  initial: "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7",
  presets: [
    { name: "sample (11 weighted edges)", initial: "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7" },
    { name: "unit weights: settles in BFS order", initial: "0 1 1, 0 3 1, 1 2 1, 1 3 1, 2 3 1, 0 5 1, 3 4 1, 3 7 1, 4 5 1, 5 6 1, 4 7 1" },
    { name: "negative edge 7→1 (−20): a settled label goes wrong", initial: "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7, 7 1 -20" },
    { name: "weighted ring", initial: "RING:8:W" },
    { name: "4x4 weighted grid, 16 vertices (edges go right and down)", initial: "0 1 4, 0 4 4, 1 2 5, 1 5 5, 2 3 6, 2 6 6, 3 7 7, 4 5 8, 4 8 8, 5 6 9, 5 9 9, 6 7 1, 6 10 1, 7 11 2, 8 9 3, 8 12 3, 9 10 4, 9 13 4, 10 11 5, 10 14 5, 11 15 6, 12 13 7, 13 14 8, 14 15 9" },
    { name: "random weighted (12 edges)", initial: "RAND:8:12:W" },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "dijkstra",
  initialPlaceholder: "u v w, … or RAND:8:12:W",
  initialTitle: "weighted edge triples, or a generator with the W flag: PATH:n:W / RING:n:W / STAR:n:W / COMPLETE:n:W / RAND:n:m:W (n ≤ 20)",
  stateMsg: (g) => `weighted digraph: ${g.inorder()}. Edit the "u v w" triples (or a generator like RAND:8:12:W), Build, then run.`,
  renderer: (c) => new GraphRenderer(c, { directed: true }),
  costs: ["visit", "compare"],
  valPlaceholder: "start vertex", valWidth: 85,
  ops: [{ name: "Dijkstra from", arg: "number", run: (s, v) => s.dijkstra(v) }],
  width: 820, height: 340,
};
