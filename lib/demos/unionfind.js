// CSS 343 unified library — demos/unionfind.js
// Full-demo spec for weighted quick-union with path compression: parent[]
// is drawn as a DISPLAY array (cell i shows parent[i]; a root is a cell where
// parent[i] === i). Union links the smaller tree under the larger by size;
// find flattens every element on its path onto the root. Drawn with the
// shared ArrayRenderer.

import { UnionFind, ArrayRenderer, ForestRenderer } from "../index.js";
import { concatTraces } from "../core/tracer.js";

// a scripted union sequence that grows a classic weighted forest, animated
const SAMPLE = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [4, 6], [8, 9], [0, 4]];

export const unionFindDemo = {
  id: "union-find",
  title: "Union-Find (weighted quick-union + path compression)",
  blurb: "Two views of ONE structure: the FOREST (top — every set is a tree; its root is the set's name) and the parent[] array that encodes it (bottom — cell i holds parent[i]; parent[i] = i marks a root). Build n creates n singleton sets, 0..n−1, each its own root. Union takes a PAIR of elements (type 3 7): it finds both roots and links the smaller tree under the larger by size; find(x) walks up to x's root and flattens the path onto it. The size array is load-bearing — weighting caps height at log n, and weighting PLUS compression reaches the near-constant α(n) bound.",
  make: () => new UnionFind(),
  initial: "10",
  presets: [
    { name: "10 elements", initial: "10" },
    { name: "25 elements", initial: "25" },
    { name: "50 elements", initial: "50" },
  ],
  initialWidth: 64,   // just n — no need for the full sequence box
  initialPlaceholder: "n",
  initialTitle: "how many elements — Build creates n singleton sets",
  valPlaceholder: "p q  (e.g. 3 7)", valWidth: 100,
  valInitial: "3 7",
  proto: "union-find",
  stateMsg: (s) => `${s.inorder()} — flat forest: every element is its own root until you Unite (a PAIR, e.g. 3 7)`,
  renderer: [
    (c) => new ForestRenderer(c),
    (c) => new ArrayRenderer(c, { mode: "cells", pointers: false }),
  ],
  labels: ["the forest — each set is a tree, its root is the set's name", "parent[] — cell i holds parent[i]; parent[i] = i marks a root"],
  height: [200, 62],
  costs: ["read", "write", "compare"],
  ops: [
    { name: "Unite", arg: "pair", run: (s, v) => s.unite(v[0], v[1]) },
    { name: "Unite a sample (8 pairs)", ghost: true,
      run: (s) => concatTraces(SAMPLE.filter(([a, b]) => Math.max(a, b) < s.parent.length)
        .map(([a, b]) => s.unite(a, b))) },
    { name: "Find", arg: "number", run: (s, v) => s.find(v) },
    { name: "Connected?", arg: "pair", ghost: true, run: (s, v) => s.connected(v[0], v[1]) },
  ],
};
