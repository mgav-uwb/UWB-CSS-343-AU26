// CSS 343 unified library — demos/mst.js
// Full-demo specs for Kruskal and Prim minimum spanning tree: fixed vertices
// 0–7 with an EDITABLE undirected weighted edge list (triples "u v w").

import { WeightedGraph, ForestRenderer, GraphRenderer } from "../index.js";

// second-canvas adapter: Kruskal's cycle detector — the union-find parent[]
// carried in each frame's snapshot.uf, drawn as the forest it encodes
const ufView = (inner) => ({
  draw: (snap) => inner.draw(snap?.uf ?? [], {}),
});

// circle-friendly default: perimeter edges + spread chords (all weights
// distinct → a unique MST and deterministic accept order)
const INITIAL = "0 1 4, 0 3 6, 1 2 1, 1 3 5, 2 3 8, 0 5 20, 3 4 2, 3 7 11, 4 5 3, 5 6 9, 4 7 7";
const base = {
  make: () => new WeightedGraph({ directed: false, layout: "circle" }),   // exploratory tier
  initial: INITIAL,
  presets: [
    { name: "sample (11 weighted edges)", initial: INITIAL },
    { name: "weighted ring", initial: "RING:8:W" },
    { name: "complete K6, weighted", initial: "COMPLETE:6:W" },
  ],
  buildAll: (s, keys) => s.buildTrace(keys),
  initialPlaceholder: "u v w, … or COMPLETE:6:W",
  initialTitle: "weighted edge triples, or a generator with the W flag: PATH:n:W / RING:n:W / STAR:n:W / COMPLETE:n:W / RAND:n:m:W (n ≤ 8)",
  stateMsg: (g) => `weighted graph (undirected) — ${g.inorder()}. Edit the "u v w" triples (or a generator like COMPLETE:6:W), Build, then run.`,
  renderer: (c) => new GraphRenderer(c, { directed: false }),
  width: 820, height: 340,
};

export const kruskalDemo = {
  ...base,
  id: "kruskal",
  proto: "mst",
  renderer: [
    (c) => new GraphRenderer(c, { directed: false }),
    (c) => ufView(new ForestRenderer(c, { R: 13, rowH: 44 })),
  ],
  labels: ["the graph — accent edges = the MST so far", "Kruskal's hidden helper: the union-find forest (same root ⇒ the edge would close a cycle ⇒ skip)"],
  height: [300, 145],
  title: "Kruskal (minimum spanning tree)",
  blurb: "Weighted undirected graph on vertices 0–7 with an editable edge list (triples \"u v w\"). Sort all edges by weight, then add each one unless its endpoints already share a union-find root — the second row shows that forest; same root means the edge would close a cycle, so it's skipped — stopping after V-1 accepted edges. On the default graph the early stop fires BEFORE the two heaviest edges (3-7 and the 20-weight 0-5 chord) are ever examined — the min-heap variant would never even pop them.",
  costs: ["compare"],
  ops: [{ name: "Kruskal", run: (s) => s.kruskal() }],
};

export const primDemo = {
  ...base,
  id: "prim",
  proto: "mst",
  title: "Prim (minimum spanning tree)",
  blurb: "Weighted undirected graph on vertices 0–7 with an editable edge list (triples \"u v w\"). Grow a tree from any start: repeatedly add the minimum-weight edge crossing from the tree to an outside vertex, until every vertex is in the tree.",
  costs: ["compare", "visit"],
  valPlaceholder: "start vertex", valWidth: 85,
  ops: [{ name: "Prim from", arg: "number", run: (s, v) => s.prim(v) }],
};
