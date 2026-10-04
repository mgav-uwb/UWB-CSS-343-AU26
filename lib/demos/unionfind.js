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
  blurb: "Two views of ONE structure: the FOREST (top; every set is a tree; its root is the set's name) and the parent[] array that encodes it (bottom; cell i holds parent[i]; parent[i] = i marks a root). Build n creates n singleton sets, 0..n−1, each its own root. Union takes a PAIR of elements (type 3 7): it finds both roots and links the smaller tree under the larger by size; find(x) walks up to x's root and flattens the path onto it. The size array is load-bearing: weighting caps height at log n, and weighting PLUS compression reaches the near-constant α(n) bound.",
  make: () => new UnionFind(),
  initial: "10",
  presets: [
    { name: "10 elements", initial: "10" },
    { name: "25 elements", initial: "25" },
    { name: "50 elements", initial: "50" },
  ],
  scripts: [
    { name: "plain quick-union: 9 links grow a path of height 9", text: "link 0 1\nlink 1 2\nlink 2 3\nlink 3 4\nlink 4 5\nlink 5 6\nlink 6 7\nlink 7 8\nlink 8 9" },
    { name: "the same 9 unions, weighted: height stays 1", text: "unite 0 1\nunite 1 2\nunite 2 3\nunite 3 4\nunite 4 5\nunite 5 6\nunite 6 7\nunite 7 8\nunite 8 9" },
    { name: "path compression: a tall path, then find(0) flattens it", text: "link 0 1\nlink 1 2\nlink 2 3\nlink 3 4\nlink 4 5\nfind 0\nfind 1" },
    { name: "weighting by size: two trees of 4 and 2 merge (2 goes under 4)", text: "unite 0 1\nunite 2 3\nunite 0 2\nunite 4 5\nunite 5 0" },
  ],
  initialWidth: 64,   // just n — no need for the full sequence box
  initialPlaceholder: "n",
  initialTitle: "how many elements: Build creates n singleton sets",
  valPlaceholder: "p q  (e.g. 3 7)", valWidth: 100,
  valInitial: "3 7",
  proto: "union-find",
  stateMsg: (s) => `${s.inorder()}: flat forest: every element is its own root until you Unite (a PAIR, e.g. 3 7)`,
  renderer: [
    (c) => new ForestRenderer(c),
    (c) => new ArrayRenderer(c, { mode: "cells", pointers: false }),
  ],
  labels: ["the forest: each set is a tree, its root is the set's name", "parent[]: cell i holds parent[i]; parent[i] = i marks a root"],
  height: [200, 62],
  galleryHeight: [330, 62],   // room for the tall path the plain quick-union script grows
  costs: ["read", "write", "compare"],
  ops: [
    { name: "Unite", arg: "pair", run: (s, v) => s.unite(v[0], v[1]) },
    { name: "Unite a sample (8 pairs)", ghost: true,
      run: (s) => concatTraces(SAMPLE.filter(([a, b]) => Math.max(a, b) < s.parent.length)
        .map(([a, b]) => s.unite(a, b))) },
    { name: "Link", arg: "pair", desc: "plain quick-union: a's root goes under b's root, sizes ignored, no compression (for contrast)", run: (s, v) => s.link(v[0], v[1]) },
    { name: "Find", arg: "number", run: (s, v) => s.find(v) },
    { name: "Connected?", arg: "pair", ghost: true, run: (s, v) => s.connected(v[0], v[1]) },
  ],
};
