// CSS 343 unified library: demos/bplus.js
// Full-demo spec for the B+ tree (structures/bplus.js): every key lives in a
// linked leaf, internal nodes hold routers only. The lesson: a point op
// descends the routers to exactly ONE leaf, and a range query descends ONCE
// and then walks the leaf chain.

import { BPlusTree } from "../structures/bplus.js";
import { MultiwayTreeRenderer } from "../core/renderers/multiway-tree.js";

const clampM = (v) => Math.max(3, Math.min(parseInt(v, 10) || 4, 8));

/** The info strip: every router, and which of them are no longer a key in a
 *  leaf (a delete leaves routers in place). Read off the frame's snapshot. */
function routerInfo(snap) {
  if (!snap || !snap.children.length) return "routers: none yet (the root is a leaf)";
  const routers = [], leafKeys = new Set();
  (function walk(n) {
    if (!n.children.length) { n.keys.forEach((k) => leafKeys.add(k)); return; }
    routers.push(...n.keys); n.children.forEach(walk);
  })(snap);
  routers.sort((a, b) => a - b);
  const stale = routers.filter((k) => !leafKeys.has(k));
  return `routers (copies of leaf keys): ${routers.join(" ")} · ${stale.length
    ? `no longer in a leaf: ${stale.join(" ")} (still valid separators)`
    : "each is also a key in a leaf"}`;
}

export const bplusDemo = {
  id: "bplus",
  title: "B+ tree",
  blurb: "Every key lives in a leaf, and the leaves are linked into a sorted chain; the grey nodes above hold only routers, copies of keys that direct a descent (equal goes right). Search, Insert and Delete descend to exactly one leaf; Range descends once for the low end and then walks the chain. A full leaf splits and COPIES its new right half's first key up; a full router node splits and MOVES its middle router up.",
  about: `<p class="lede">A B+ tree keeps <b>every key, with its record, in a leaf</b>, and links the
      leaves left to right into a sorted chain. The grey nodes above are <b>routers</b>: copies of
      keys whose only job is to direct a descent. That is the index inside essentially every
      relational database and most filesystems.</p>

      <h3>Reading the picture</h3>
      <ul>
        <li><b>grey nodes</b>: routers, no records. At routers <i>s</i><sub>1</sub> &lt;
        <i>s</i><sub>2</sub> &lt; &hellip;, a key <i>k</i> follows child <i>i</i>, where <i>i</i> is
        the number of routers &le; <i>k</i>: <b>a key equal to a router goes right</b>.</li>
        <li><b>white nodes</b>: leaves. The dot under each key is its record.</li>
        <li><b>arrows</b>: the leaf chain (each leaf's NEXT link).</li>
        <li>A key can appear twice, as a router and in its leaf. A router whose key was deleted
        stays: it still separates its two sides correctly.</li>
      </ul>

      <h3>The routing rule: less goes left, equal or more goes right</h3>
      <p>At a router node <code>[30 | 60]</code> a key <i>k</i> follows child 0 if <i>k</i> &lt; 30,
      child 1 if 30 &le; <i>k</i> &lt; 60, and child 2 if <i>k</i> &ge; 60. Every key in a subtree is
      at least the router to its left and less than the router to its right. So a search for 30
      goes right at the router 30 and ends in the leaf that starts with 30: routers never end a
      search, because records live only in leaves.</p>

      <h3>Why a key appears twice</h3>
      <ul>
        <li><b>A leaf split copies.</b> The new right leaf's first key is copied up as a router and
        also stays in the leaf, where its record is. (A borrow between two leaves likewise rewrites
        the router between them to a copy of the right leaf's new first key.)</li>
        <li><b>A router split moves.</b> The middle router goes up and is gone from the node below;
        a router needs no copy, so this makes no new duplicate.</li>
        <li><b>A delete leaves routers alone</b> unless leaves borrow or merge. A router whose key was
        deleted stays (it still separates its two sides), so a router need not be a key in the tree.
        The strip under the tree lists every router and any that no longer match a leaf key.</li>
      </ul>
      <p>Example: in the textbook index (order 3) insert 50. The leaf [30|45] becomes [30|45|50] and
      splits into [30|45] and [50]; 50 is copied up, making the router node [30|50|60], which splits
      in turn and moves 50 up into a new root. Result: 50 is in the root and in its leaf; 30 and 60
      are routers and leaf keys. Delete 30 afterwards and router 30 stays.</p>

      <h3>The operations</h3>
      <ul>
        <li><b>Search k</b>: descend the routers to the one leaf that can hold <i>k</i>. Reaching a
        router equal to <i>k</i> does not end the search; the record is in the leaf.</li>
        <li><b>Insert k</b>: add it to its leaf. A leaf that reaches M keys splits: the left half keeps
        &lceil;M/2&rceil;, the new right leaf joins the chain, and its first key is <b>copied</b> up as a
        router. A router node that reaches M routers splits B-tree style: its middle router
        <b>moves</b> up. A root split adds a level at the top.</li>
        <li><b>Delete k</b>: remove it from its leaf. A non-root leaf needs at least &lfloor;M/2&rfloor;
        keys: if it falls short it <b>borrows</b> from a sibling (the router between them becomes the new
        boundary) or <b>merges</b> with one (the right leaf leaves the chain and its router is
        <b>dropped</b>: it was only a copy). A router node short of &lceil;M/2&rceil;&minus;1 routers
        borrows through its parent or merges, pulling the separator <b>down</b>, as in a B-tree;
        a root left with no routers is replaced by its only child.</li>
        <li><b>Range lo hi</b>: one descent for <i>lo</i>, then the leaf chain until a key passes
        <i>hi</i>. No router is read twice: <code>BETWEEN</code>, <code>ORDER BY</code> and paging
        are sequential leaf reads.</li>
      </ul>

      <h3>Input</h3>
      <p>The Build box takes keys (<code>5..100:5:RAND</code>, or a list); <b>order M</b> (3 to 8)
      takes effect on Build. The Run box takes one key, or <code>lo hi</code> for Range. Click a key in
      the picture to put it in the box with Delete selected. The counters: <b>reads</b> are node reads,
      one disk block each, the cost that matters on disk.</p>

      <h3>Things to try</h3>
      <ul>
        <li>The <i>textbook index</i> preset, then <code>range 20 40</code>: 20, 30 in 3 node reads,
        as in the chapter's worked example.</li>
        <li>On the default tree: <code>insert 57</code> (a leaf split copies 60 up, then a router split
        moves 70 up); <code>delete 75</code> (a leaf borrows); <code>delete 5</code> (a leaf merge drops
        router 15, and the emptied router node borrows through the root); the script <i>delete 25,
        then 5</i> (the same merge, but now the router nodes must merge, pulling 25 down).</li>
        <li>Search for a key that is also a router (55): the descent goes right and keeps going.</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-b-trees.html#bplus", label: "Textbook: B+ trees →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new BPlusTree(4),
  remake: (vals) => new BPlusTree(clampM(vals.m)),   // Build picks up the M box
  inputs: [{ key: "m", label: "order M (3–8)", value: "4", width: 55 }],
  initial: "5..100:5:RAND",
  presets: [
    { name: "20 keys, shuffled (M = 4)", initial: "5..100:5:RAND", values: { m: "4" }, val: "20 60" },
    { name: "the textbook index (M = 3)", initial: "(10,20,30,45,60,90)", values: { m: "3" }, val: "20 40" },
    { name: "wide (60 keys, M = 6)", initial: "5..300:5:RAND", values: { m: "6" }, val: "100 160" },
    { name: "slim (30 keys, M = 3)", initial: "5..150:5:RAND", values: { m: "3" }, val: "40 70" },
  ],
  buildStep: (s, k) => s.insert(k),
  stateMsg: (s) => `order M = ${s.M}: ${s.keys().length} keys in ${s.leafCount()} linked leaves (at most ${s.M - 1} keys each), height ${s.height()}; change M and press Build`,
  resetMsg: (s) => `reset: empty B+ tree of order ${s.M}, inputs restored`,
  renderer: (c, o) => new MultiwayTreeRenderer(c, { leafLinks: true, ...o }),
  info: { render: routerInfo, place: "below" },
  costs: ["read", "compare", "write"],
  defaultOp: "Range",
  valInitial: "20 60",
  valPlaceholder: "key, or lo hi",
  scripts: [
    { name: "BETWEEN 20 AND 60: one descent, then the chain", text: "range 20 60" },
    { name: "insert 57: leaf split copies up, router split moves up", text: "insert 57" },
    { name: "delete 75: a leaf borrows from its sibling", text: "delete 75" },
    { name: "delete 25, then 5: leaf merges, then router nodes merge", text: "delete 25\ndelete 5" },
  ],
  ops: [
    { name: "Range", arg: "pair", desc: "lo hi: one descent for lo, then walk the leaf chain, emitting keys until one passes hi", run: (s, v) => s.range(v[0], v[1]) },
    { name: "Search", arg: "number", desc: "descend the routers (equal goes right) to the one leaf that can hold the key; the record lives only there", run: (s, v) => s.search(v) },
    { name: "Insert", arg: "number", desc: "add to its leaf; a full leaf splits and COPIES its right half's first key up, a full router node splits and MOVES its middle router up", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "remove from its leaf; a short leaf borrows from a sibling or merges (its router is dropped); router nodes then borrow or merge as in a B-tree", run: (s, v) => s.delete(v) },
  ],
  width: 900, height: 240,
};
