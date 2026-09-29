// CSS 343 unified library — demos/bst.js
// Full-demo spec for the BST as an ordered symbol table: every operation in one
// sandbox. Ordered ops (min/max/floor/ceiling/select/rank/range) are the point
// of S03. Node labels show subtree size (what rank/select use).

import { BST, TreeRenderer } from "../index.js";

export const bstDemo = {
  id: "bst",
  title: "Binary Search Tree",
  blurb: "An ordered symbol table: search/insert/delete in Θ(height), plus min/max/floor/ceiling/select/rank/range. No balancing — shape (and cost) depend on insertion order.",
  make: () => new BST(),
  initial: "1..15:ZAG",  // middle-out insertion → a balanced tree; try plain 1..15 for the Θ(n) path
  presets: [
    { name: "balanced (middle-out 1..15)", initial: "1..15:ZAG" },
    { name: "worst case (sorted 1..15)", initial: "1..15" },
    { name: "random (1..31)", initial: "1..31:RAND" },
  ],
  buildStep: (s, k) => s.insert(k),   // Build replays the construction at the selected speed
  proto: "bst",
  renderer: (c) => new TreeRenderer(c, { labels: "size" }),
  costs: ["compare", "link", "visit", "alloc"],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", ghost: true, run: (s, v) => s.search(v) },
    { name: "Min", ghost: true, run: (s) => s.min() },
    { name: "Max", ghost: true, run: (s) => s.max() },
    { name: "Floor", arg: "number", ghost: true, run: (s, v) => s.floor(v) },
    { name: "Ceiling", arg: "number", ghost: true, run: (s, v) => s.ceiling(v) },
    { name: "Select", arg: "number", ghost: true, run: (s, v) => s.select(v) },
    { name: "Rank", arg: "number", ghost: true, run: (s, v) => s.rank(v) },
    { name: "Range", arg: "pair", ghost: true, run: (s, v) => s.range(v[0], v[1]) },
  ],
};
