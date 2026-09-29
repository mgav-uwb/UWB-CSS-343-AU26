// CSS 343 unified library — demos/hashing.js
// Full-demo specs for the hash-table family:
//   hash-lp            linear probing, resizes at 0.5, Sedgewick delete
//   hash-quad          quadratic probing (t² jumps), prime-growth resize
//   hash-double        double hashing (key-dependent stride), TOMBSTONE delete
//   hash-chain         separate chaining, FIXED M (the α story)
//   hash-chain-resize  chaining with the fix turned on (doubles at α = 1)
// Open-addressing tables draw with the shared ArrayRenderer — empty slots
// show as "·", tombstones as "†"; chaining draws with ChainRenderer.

import { ArrayRenderer, ChainRenderer, chainingInfo, LinearProbing, OpenAddressing, openAddressingInfo, SeparateChaining } from "../index.js";

export const hashingDemo = {
  id: "hash-lp",
  title: "Hash Table (linear probing)",
  blurb: "Open addressing: collisions probe forward to the next empty slot; the table doubles past load factor 0.5, and delete re-inserts the rest of the cluster (Sedgewick's algorithm, no tombstones). The initial box takes ranges too — try 1..21:2 (all odd keys) and watch the resizes. The hash here is plain h(k) = k mod M — deliberately simple so you can predict every slot by eye; real tables scramble the key first (multiplicative/universal hashing) so patterned keys don't cluster.",
  make: () => new LinearProbing(8),
  remake: (vals) => new LinearProbing(Math.max(4, Math.min(parseInt(vals.m, 10) || 8, 32))),
  inputs: [{ key: "m", label: "start M", value: "8", width: 50 }],
  initial: "23,14,9,6,31,17,8",
  presets: [
    { name: "light load (7 keys, M=8)", initial: "23,14,9,6,31,17,8", values: { m: "8" } },
    { name: "one home slot (8,16,…,48) — clustering", initial: "8..48:8", values: { m: "8" } },
    { name: "force a resize (1..12)", initial: "1..12", values: { m: "8" } },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "hashing",
  scripts: [{ name: "cluster, delete, search", text: "insert 25\ndelete 14\nsearch 25" }],
  defaultOp: "Insert",
  info: openAddressingInfo("doubles at α ≥ 0.5"),
  stateMsg: (s) => `M = ${s.M}, n = ${s.n}, α = ${(s.n / s.M).toFixed(2)} — doubles at α ≥ ${s.resizeAt}; h(k) = k mod ${s.M}`,
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  height: 120,   // one strip — the default canvas height is dead space
  costs: ["compare", "write", "hash"],
  ops: [
    { name: "Insert", arg: "number", desc: "hash to the home slot, probe past collisions, place in the first empty slot; may trigger a resize", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "find the key, empty its slot, then re-insert the rest of the cluster so no probe path breaks (Sedgewick)", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", ghost: true, desc: "probe from the home slot until the key or an empty slot", run: (s, v) => s.search(v) },
  ],
};

// Quadratic probing: same home slots, t² jumps — primary clustering dies,
// secondary clustering (same-home keys share one path) survives.
export const quadDemo = {
  id: "hash-quad",
  title: "Hash Table (quadratic probing)",
  blurb: "Collisions jump by t² instead of +1: the probe path from a busy home slot scatters (3, +1, +4, +9, …) so runs don't pile up — no PRIMARY clustering. But two keys with the SAME home slot still follow the identical path (secondary clustering), and coverage needs a prime M — resizes go to the next prime ≥ 2M. Build the all-collide preset and compare with linear probing's wall.",
  make: () => new OpenAddressing(11, { probe: "quadratic" }),
  remake: (vals) => new OpenAddressing(Math.max(5, Math.min(parseInt(vals.m, 10) || 11, 37)), { probe: "quadratic" }),
  inputs: [{ key: "m", label: "start M", value: "11", width: 50 }],
  initial: "3,14,25,36,47",
  presets: [
    { name: "all collide at 3 (t² scatter)", initial: "3,14,25,36,47", values: { m: "11" } },
    { name: "mixed homes", initial: "2..20:6", values: { m: "11" } },
  ],
  scripts: [{ name: "collide once more, then search it", text: "insert 58\nsearch 58" }],
  info: openAddressingInfo("probe +t² · resizes to the next prime ≥ 2M at α ≥ 0.5"),
  buildStep: (s, k) => s.insert(k),
  proto: "hashing",
  stateMsg: (s) => `M = ${s.M} (prime), probe jumps t² — n = ${s.n}, α = ${(s.n / s.M).toFixed(2)}`,
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  height: 120,
  costs: ["hash", "compare", "write"],
  ops: [
    { name: "Insert", arg: "number", desc: "probe by t² jumps from the home slot; place in the first empty slot", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "find the key and mark its slot with a tombstone †", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", ghost: true, desc: "probe by t² jumps until the key or an empty slot (tombstones don't stop it)", run: (s, v) => s.search(v) },
  ],
};

// Double hashing: the stride is a second hash of the key — colliding keys
// walk away in different step sizes. Delete here is the TOMBSTONE story.
export const doubleDemo = {
  id: "hash-double",
  title: "Hash Table (double hashing)",
  blurb: "The stride is a SECOND hash of the key — h2(k) = q − (k mod q) — so two keys colliding at the same home slot walk away in DIFFERENT step sizes (kills secondary clustering too; two keys probe identically only when both hashes collide, ~1/M² not 1/M). Delete here uses TOMBSTONES: the slot is marked †, searches walk over it, inserts may reuse it. The build is the lecture's worked example: 89, 18, 40, 29 into M = 11 with q = 7.",
  make: () => new OpenAddressing(11, { probe: "double", q: 7, deleteMode: "tombstone" }),
  remake: (vals) => new OpenAddressing(Math.max(5, Math.min(parseInt(vals.m, 10) || 11, 37)), { probe: "double", deleteMode: "tombstone" }),
  inputs: [{ key: "m", label: "start M", value: "11", width: 50 }],
  initial: "89,18,40,29",
  presets: [
    { name: "lecture worked example (89,18,40,29)", initial: "89,18,40,29", values: { m: "11" } },
    { name: "all collide at 3, strides differ", initial: "3,14,25,36,47", values: { m: "11" } },
  ],
  scripts: [{ name: "tombstone lifecycle", text: "delete 18\nsearch 40\ninsert 51" }],
  defaultOp: "Delete",
  info: openAddressingInfo("stride h2(k) = q − (k mod q)"),
  buildStep: (s, k) => s.insert(k),
  proto: "hashing",
  stateMsg: (s) => `M = ${s.M}, h2(k) = ${s._q()} − (k mod ${s._q()}) — n = ${s.n}, tombstones = ${s.tombs}`,
  renderer: (c) => new ArrayRenderer(c, { mode: "cells" }),
  height: 120,
  costs: ["hash", "compare", "write"],
  ops: [
    { name: "Insert", arg: "number", desc: "probe by the key's own stride h2(k); reuses the first tombstone passed", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "find the key and mark its slot with a tombstone † — searches walk over it", run: (s, v) => s.remove(v) },
    { name: "Search", arg: "number", ghost: true, desc: "probe by h2(k) strides until the key or an empty slot", run: (s, v) => s.search(v) },
  ],
};

export const chainingDemo = {
  id: "hash-chain",
  title: "Hash Table (separate chaining)",
  blurb: "The other collision strategy: each bucket holds a linked list, so colliders simply chain — search scans one chain (Θ(α) expected), and delete is a trivial unlink (contrast probing's cluster repair). The odd keys 1..21 into M = 7 pair up into four 2-chains.",
  make: () => new SeparateChaining(7),
  remake: (vals) => new SeparateChaining(Math.max(3, Math.min(parseInt(vals.m, 10) || 7, 16))),
  inputs: [{ key: "m", label: "M", value: "7", width: 45 }],
  initial: "1..21:2",
  presets: [
    { name: "spread (1..21 by 2, M=7)", initial: "1..21:2", values: { m: "7" } },
    { name: "one bucket (multiples of 7)", initial: "7..42:7", values: { m: "7" } },
    { name: "heavy load (1..28, M=7)", initial: "1..28", values: { m: "7" } },
    { name: "FLOOD it (1..70, M=7) — watch α, no resize", initial: "1..70", values: { m: "7" } },
  ],
  scripts: [{ name: "prove the α cost: search deep keys", text: "search 63\nsearch 70" }],
  info: chainingInfo("M is FIXED — no resize"),
  buildStep: (s, k) => s.insert(k),
  proto: "hashing",
  stateMsg: (s) => {
    const longest = Math.max(0, ...s.buckets.map((b) => b.length));
    return `M = ${s.M}, n = ${s.n} — α = ${s.alpha()}, longest chain ${longest}; a search costs 1 + (its chain)`;
  },
  renderer: (c) => new ChainRenderer(c),
  costs: ["hash", "compare", "write"],
  ops: [
    { name: "Insert", arg: "number", desc: "hash to the bucket, scan for a duplicate, link at the chain's end", run: (s, v) => s.insert(v) },
    { name: "Search", arg: "number", ghost: true, desc: "walk ONLY the home bucket's chain — the other buckets are never touched", run: (s, v) => s.search(v) },
    { name: "Delete", arg: "number", desc: "walk the chain, unlink the node — nothing else moves", run: (s, v) => s.remove(v) },
  ],
  width: 940, height: 240,
};

// Chaining WITH the fix turned on: the table doubles at α = 1 and rehashes —
// the resolution of the no-resize demo's flooding story.
export const chainResizeDemo = {
  id: "hash-chain-resize",
  title: "Hash Table (chaining + resize)",
  blurb: "Same chaining table, but now the table KEEPS the O(1) promise: when α reaches 1 it doubles M and rehashes every key — the chains shorten before your eyes. This is the missing move in the no-resize demo: 'keep α = O(1)' is a thing we DO, not something that happens for free.",
  make: () => new SeparateChaining(7, { resizeAt: 1 }),
  remake: (vals) => new SeparateChaining(Math.max(3, Math.min(parseInt(vals.m, 10) || 7, 16)), { resizeAt: 1 }),
  inputs: [{ key: "m", label: "M", value: "7", width: 45 }],
  initial: "1..21:2",
  presets: [
    { name: "spread, then cross α = 1", initial: "1..21:2", values: { m: "7" } },
    { name: "flood (1..70) — resizes keep chains short", initial: "1..70", values: { m: "7" } },
  ],
  info: chainingInfo("doubles at α ≥ 1"),
  buildStep: (s, k) => s.insert(k),
  proto: "hashing",
  stateMsg: (s) => `M = ${s.M}, n = ${s.n}, α = ${s.alpha()} — doubles at α ≥ 1`,
  renderer: (c) => new ChainRenderer(c),
  costs: ["hash", "compare", "write"],
  ops: [
    { name: "Insert", arg: "number", desc: "hash to the bucket, scan for a duplicate, link at the chain's end", run: (s, v) => s.insert(v) },
    { name: "Search", arg: "number", ghost: true, desc: "walk ONLY the home bucket's chain — the other buckets are never touched", run: (s, v) => s.search(v) },
    { name: "Delete", arg: "number", desc: "walk the chain, unlink the node — nothing else moves", run: (s, v) => s.remove(v) },
  ],
  width: 940, height: 240,
};
