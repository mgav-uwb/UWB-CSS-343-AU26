// CSS 343 unified library — demos/avl.js
// The full-demo SPEC for the AVL tree: all operations in one sandbox. The same
// AVL structure powers the focused per-slide lecture views (S04) — this is just
// the "explore everything" tier.

import { AVL, TreeRenderer } from "../index.js";

export const avlDemo = {
  id: "avl",
  title: "AVL Tree",
  blurb: "A self-balancing BST — every node's subtree heights differ by ≤ 1 (bf ∈ {−1,0,+1}), kept true by rotations.",
  make: () => new AVL(),
  initial: "1..16",  // ascending — the worst case a plain BST degenerates on; AVL rotates and stays log
  presets: [
    { name: "sorted 1..16 (a BST's nightmare)", initial: "1..16" },
    { name: "descending (16..1)", initial: "1..16:DESC" },
    { name: "big random (1..63)", initial: "1..63:RAND" },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "avl",
  renderer: (c) => new TreeRenderer(c, { labels: "bf" }),
  costs: ["compare", "rotation", "link", "visit", "alloc"],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", ghost: true, run: (s, v) => s.search(v) },
  ],
};
