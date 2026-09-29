// CSS 343 unified library — demos/btree.js
// Full-demo spec for the B-tree (order 5): wide split-and-promote — a node
// splits when it fills at M keys, and the high fan-out keeps the tree shallow.

import { BTree, MultiwayTreeRenderer } from "../index.js";

const clampM = (v) => Math.max(3, Math.min(parseInt(v, 10) || 5, 8));

export const btreeDemo = {
  id: "btree",
  title: "B-tree",
  blurb: "Wide split-and-promote: a node splits when it fills at M keys, promoting its middle key upward — high fan-out keeps the tree shallow even as it grows. Set the ORDER M (3–8) and press Build to watch the same keys land in a fatter or slimmer tree (M = 3 is the 2-3 tree's shape).",
  make: () => new BTree(5),
  remake: (vals) => new BTree(clampM(vals.m)),   // Build picks up the M box
  inputs: [{ key: "m", label: "order M (3–8)", value: "5", width: 55 }],
  initial: "5..75:5",
  presets: [
    { name: "gentle (15 keys, M=5)", initial: "5..75:5", values: { m: "5" } },
    { name: "wide (115 keys, M=8)", initial: "5..575:5", values: { m: "8" } },
    { name: "slim (115 keys, M=3)", initial: "5..575:5", values: { m: "3" } },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "btree",
  stateMsg: (s) => `order M = ${s.M} (a node holds up to ${s.M - 1} keys) — ${s.inorder().length} keys, change M and press Build`,
  renderer: (c, o) => new MultiwayTreeRenderer(c, o), // (c,o): rendererOpts-aware
  costs: ["compare", "write", "alloc"],
  ops: [
    { name: "Insert", arg: "number", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", run: (s, v) => s.delete(v) },
    { name: "Search", arg: "number", ghost: true, run: (s, v) => s.search(v) },
  ],
};
