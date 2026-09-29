// CSS 343 unified library — demos/dijkstra.js
// Full-demo spec for Dijkstra shortest paths: fixed vertices 0–7 with an
// EDITABLE weighted edge list (triples "u v w"). After every run the trace
// re-checks all edges — append a negative edge (e.g. "7 1 -20") and watch the
// greedy guarantee break in red.

import { WeightedGraph, GraphRenderer } from "../index.js";

export const dijkstraDemo = {
  id: "dijkstra",
  title: "Dijkstra (shortest paths)",
  blurb: "Weighted digraph on vertices 0–7 with an editable edge list (triples \"u v w\"). Repeatedly settle the nearest unsettled vertex and relax its outgoing edges — labels become shortest-path distances and the accent edges form the shortest-paths tree. Watch the direct 0→5 edge (weight 20) LOSE to the relaxed path through 3 and 4 (distance 11) — relaxation in one picture. (This is the array-scan variant: its entire state IS the labels; the O(E log V) version keeps the same tentative distances in a priority queue.) Append \"7 1 -20\" to see a negative weight break the greedy guarantee (flagged in red by the final edge re-check).",
  make: () => new WeightedGraph({ layout: "circle" }),   // exploratory tier
  initial: "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7",
  presets: [
    { name: "sample (11 weighted edges)", initial: "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7" },
    { name: "weighted ring", initial: "RING:8:W" },
    { name: "random weighted (12 edges)", initial: "RAND:8:12:W" },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  proto: "dijkstra",
  initialPlaceholder: "u v w, … or RAND:8:12:W",
  initialTitle: "weighted edge triples, or a generator with the W flag: PATH:n:W / RING:n:W / STAR:n:W / COMPLETE:n:W / RAND:n:m:W (n ≤ 8)",
  stateMsg: (g) => `weighted digraph — ${g.inorder()}. Edit the "u v w" triples (or a generator like RAND:8:12:W), Build, then run.`,
  renderer: (c) => new GraphRenderer(c, { directed: true }),
  costs: ["visit", "compare"],
  valPlaceholder: "start vertex", valWidth: 85,
  ops: [{ name: "Dijkstra from", arg: "number", run: (s, v) => s.dijkstra(v) }],
  width: 820, height: 340,
};
