// CSS 343 unified library — demos/two-three.js
// Full-demo spec for the 2-3 search tree: perfect balance via split-and-promote
// (every leaf stays at the same depth — no rotations needed).

import { TwoThree, MultiwayTreeRenderer } from "../index.js";

export const twoThreeDemo = {
  id: "two-three",
  title: "2-3 Search Tree",
  blurb: "Perfect balance via split-and-promote: every node holds 1-2 keys, an overflowing 3-key node splits and promotes its middle key upward — all leaves stay at the same depth.",
  make: () => new TwoThree(),
  initial: "10..100:10",  // ascending — watch split-and-promote grow the tree at the ROOT
  presets: [
    { name: "ascending (10..100 by 10)", initial: "10..100:10" },
    { name: "random (1..40)", initial: "1..40:RAND" },
    { name: "big zigzag (1..80)", initial: "1..80:ZIG" },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "btree",
  renderer: (c) => new MultiwayTreeRenderer(c),
  costs: ["compare", "write", "alloc"],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", run: (s, v) => s.delete(v) },
    { name: "Search", arg: "number", ghost: true, run: (s, v) => s.search(v) },
  ],
};
