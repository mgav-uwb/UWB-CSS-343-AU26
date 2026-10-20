// CSS 343 unified library: demos/redblack.js
// The left-leaning red-black BST, five ways, each beside the 2-3 tree it
// encodes (the left panel collapses every red link into its parent):
//   redblack         the sandbox: build, insert, delete, search
//   rb-convert       2-3 trees encoded as red-black BSTs node by node, and back;
//                    left-leaning and right-leaning
//   rb-insert-cases  every way an insert can land: the rule it breaks, then the fix
//   rb-delete        every way a delete can remove a key: no violation, or the
//                    missing black and its 2-3 repair (borrow or merge), and the
//                    repairs that move up the tree
//   rb-moves         rotateLeft, rotateRight and flipColors, one at a time
// The case demos take {"fix": false} (a slide's data-config) to stop at the
// violation, and {"groups": [...]} to show some of their cases.

import { RedBlack, TwoThree, TreeRenderer, MultiwayTreeRenderer, rbNode as N } from "../index.js";
import { fromTwoThree, encodeTrace } from "../structures/redblack.js";

// red means a red link and nothing else, so the highlight that marks the
// link a step is about (and the nodes a move involves) is purple, not orange
export const RB_MARK = "#7c5cff";
const rbRenderer = (c) => new TreeRenderer(c, { labels: "none", mark: RB_MARK });
const ttRenderer = (c) => new MultiwayTreeRenderer(c, { mark: RB_MARK });
// the 2-3 tree on the left, the red-black BST on the right
const PANELS = { renderer: [ttRenderer, rbRenderer], layout: "row", labels: ["2-3 tree", "red-black BST"] };

const COLOR_KEY = "Colors: a red line is a red link (3-node glue); a purple line is the link this step is about; filled purple is where the move applies, a purple ring the other nodes it involves; a dashed empty node is a missing black (the empty 2-3 node a delete leaves). The left panel is the 2-3 tree the red-black BST encodes.";

const READING = `<h3>Reading the picture</h3>
      <p>The right panel is the red-black BST; the left panel is the 2-3 tree it encodes, found by
      collapsing every red link into its parent. A node's color is the color of the link from its
      parent. A <b>red</b> link (thick, red) glues two nodes into one 2-3 node: a red left child and
      its parent are one 3-node. Every other link is black, and the root's link is black by
      definition. The rules: red links lean left, no two red links in a row, and every root-to-null
      path crosses the same number of black links (all 2-3 leaves at one depth).</p>
      <h3>Colors</h3>
      <ul>
        <li><b style="color:#b3261e">red line</b>: a red link, the glue inside a 3-node.</li>
        <li><b style="color:#7c5cff">purple line</b>: the link the current step is about (the one a
        rotation moves, or the red link that breaks a rule).</li>
        <li><b style="color:#7c5cff">filled purple node</b>: where the current move applies;
        <b style="color:#7c5cff">purple ring</b>: the other nodes it involves. In the 2-3 panel, a
        purple compartment is a key that moves between nodes.</li>
        <li><b>dashed empty node</b>: a missing black. Removing a black leaf leaves the paths through
        it one black link short; the empty node stands for that link, and in the 2-3 panel it is
        the empty node a 2-3 delete leaves.</li>
        <li><b style="color:#0a7d4d">green</b>: a key just placed. A pink node with a red outline:
        the key being removed, or a 4-node that must split.</li>
      </ul>`;

// a 2-3 tree, written as nested nodes: T([40], T([20]), T([60, 70]))
const T = (keys, ...children) => ({ keys, children });
const fromTT = (tt) => () => RedBlack.from(fromTwoThree(tt));
const fixOf = (spec) => !spec || spec.fix !== false;

export const redblackDemo = {
  id: "redblack",
  title: "Red-Black BST (left-leaning)",
  blurb: "A BST plus one color bit per link: red glues two nodes into a 2-3-tree node, shown beside the 2-3 tree it encodes. An insert colors the new node red and fixes the rule it breaks; a delete repairs a missing black with the 2-3 borrow or merge.",
  about: `<p class="lede">A left-leaning red-black BST is a 2-3 tree stored as a binary tree: one node
      type plus one color bit. Every operation is a plain BST operation followed by repairs, each
      narrated as the rule it restores.</p>
      ${READING}
      <h3>The operations</h3>
      <ul>
        <li><b>Insert</b>: a plain BST insert, the new node colored red (a red link adds no black
        link to any path). The narration names the rule that breaks, if any (a red link leaning right,
        two reds in a row, two red children, a red root), then the fix: <code>rotateLeft</code>,
        <code>rotateRight</code>, <code>flipColors</code> (the 2-3 split), or a recolor.</li>
        <li><b>Delete</b>: a plain BST delete; a key with two children swaps with its in-order
        predecessor first. Removing a red leaf, or a node with one child, breaks no rule. Removing a
        black leaf leaves the paths through it one black link short: a dashed empty node marks the
        missing black, and the 2-3 repair runs, one level at a time: borrow from a sibling that is
        a 3-node, otherwise merge (which moves the empty node up when the parent was a 2-node).</li>
        <li><b>Search</b>: an ordinary BST search; colors play no part.</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li>Build <code>10..90:10</code> (ascending): a plain BST would be a path; this stays
        within 2 log<sub>2</sub> n.</li>
        <li>Click a key, then Run: Delete with every repair narrated.</li>
        <li>The <a href="?ds=rb-insert-cases">insert cases</a> and <a href="?ds=rb-delete">delete
        cases</a> demos show every situation on its own small tree.</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html", label: "Textbook: red-black BSTs →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new RedBlack(),
  initial: "10..90:10",  // ascending: rotations + color flips keep it balanced
  presets: [
    { name: "toy: 10, 20, 30 (rotate, then flip)", initial: "10, 20, 30" },
    { name: "small: 5 keys", initial: "50, 20, 70, 10, 30" },
    { name: "ascending (10..90 by 10)", initial: "10..90:10" },
    { name: "random (1..31)", initial: "1..31:RAND" },
    { name: "big ascending (1..63)", initial: "1..63" },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "redblack",
  ...PANELS, cols: [380, 520],
  costs: ["compare", "rotation", "link"],
  ops: [
    { name: "Insert", arg: "number", desc: "BST insert with a red node, then each broken rule named and fixed on the way up: rotateLeft, rotateRight, flipColors, recolor the root", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "BST delete (two children: swap with the predecessor); removing a black leaf leaves a missing black, repaired by the 2-3 borrow or merge", run: (s, v) => s.delete(v) },
    { name: "Search", arg: "number", ghost: true, desc: "an ordinary BST search", run: (s, v) => s.search(v) },
  ],
};

// ── rb-convert: 2-3 trees to red-black BSTs and back ─────────────────
const CONVERT = {
  twos: T([40], T([20], T([10]), T([30])), T([60], T([50]), T([70]))),
  mixed: T([30, 60], T([10, 20]), T([40]), T([70, 80])),
  deep: T([40], T([20], T([10]), T([30])), T([60, 80], T([50]), T([70]), T([90, 95]))),
};
const encodeCase = (tt, lean) => ({ make: () => new TwoThree(), run: () => encodeTrace(tt, lean) });

export const rbConvertDemo = {
  id: "rb-convert",
  title: "2-3 trees as red-black BSTs, and back",
  blurb: "A 2-3 tree encoded as a red-black BST one node at a time: a 2-node becomes a black node, a 3-node two nodes joined by a red link. Then back again, by collapsing each red link into its parent. Left-leaning, and the right-leaning encoding that works just as well.",
  about: `<p class="lede">A red-black BST is a 2-3 tree written with binary nodes. Each button takes a
      2-3 tree (left), encodes it node by node (right), then rebuilds the 2-3 tree from the red-black
      BST alone.</p>
      ${READING}
      <h3>The encoding</h3>
      <ul>
        <li>A <b>2-node</b> [a] is one black node a, with its two subtrees as its children.</li>
        <li>A <b>3-node</b> [a|b] is two nodes joined by a red link: b black with a as its red left
        child (left-leaning), or a black with b as its red right child (right-leaning). The three
        subtrees hang under a and b by key range, so in-order is unchanged.</li>
        <li>Every 2-3 edge becomes a black link, so every root-to-null path crosses one black link
        per 2-3 level: the black heights are equal because the 2-3 leaves are all at one depth.</li>
      </ul>
      <h3>Left or right</h3>
      <p>Both encodings are valid binary search trees with the same black heights. Choosing one
      side for every 3-node gives each 2-3 tree exactly one encoding, which halves the cases the
      insert and delete repairs must handle; the right-leaning choice would mirror every rule and
      every fix.</p>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html#redblack", label: "Textbook: the encoding →" },
    { href: "../textbook/trees/ds-two-three-trees.html", label: "Textbook: 2-3 trees →" },
  ],
  make: () => new TwoThree(),
  ...PANELS, cols: [420, 480],
  width: 900, height: 230,
  help: "Each button encodes one 2-3 tree as a red-black BST, node by node from the top, then decodes it back. Green: the nodes just created. " + COLOR_KEY,
  cases: [
    { name: "2-nodes only", group: "left-leaning", ...encodeCase(CONVERT.twos, "left") },
    { name: "mixed", ...encodeCase(CONVERT.mixed, "left") },
    { name: "three levels", ...encodeCase(CONVERT.deep, "left") },
    { name: "mixed", group: "right-leaning", ...encodeCase(CONVERT.mixed, "right") },
    { name: "three levels", ...encodeCase(CONVERT.deep, "right") },
  ],
};

// ── rb-insert-cases: where a new key lands, the rule it breaks, the fix ──
export const RB_INSERT_CASES = [
  { name: "smaller", group: "into a 2-node", tt: T([50]), key: 30 },
  { name: "larger", tt: T([50]), key: 70 },
  { name: "larger", group: "into a 3-node", tt: T([60], T([20, 40]), T([80])), key: 50 },
  { name: "smaller", tt: T([60], T([20, 40]), T([80])), key: 10 },
  { name: "between", tt: T([60], T([20, 40]), T([80])), key: 30 },
  { name: "split, red leans right", group: "the split moves up", tt: T([40], T([20]), T([60, 80])), key: 90 },
  { name: "split into a 3-node", tt: T([40, 60], T([10, 20]), T([50]), T([70])), key: 30 },
  { name: "split at the root", tt: T([30, 50]), key: 70 },
];

export const rbInsertCasesDemo = {
  id: "rb-insert-cases",
  title: "Red-black insert: every violation and its fix",
  blurb: "Every way a red-black insert can land. The new node is red, so no path gains a black link; what can break is a red-link rule: a red link leaning right, two red children, two reds in a row, or a red root. Each case names the violation, then fixes it, beside the 2-3 tree the red-black BST encodes.",
  about: `<p class="lede">An insert is a BST insert with the new node colored red. A red link adds no
      black link to any path, so black heights never break; what can break is one of the red-link
      rules, and the 2-3 tree says which.</p>
      ${READING}
      <h3>The violations</h3>
      <ul>
        <li><b>Into a 2-node, smaller</b>: a red left link. The 2-node became a 3-node: no
        violation.</li>
        <li><b>Into a 2-node, larger</b>: a red link that leans right. A legal 3-node drawn the
        wrong way: <code>rotateLeft</code>.</li>
        <li><b>Into a 3-node</b>: three keys, a 4-node. Larger than both: two red children,
        <code>flipColors</code>. Smaller than both: two reds in a row on the left,
        <code>rotateRight</code> then <code>flipColors</code>. Between them: a red right link under a
        red link, <code>rotateLeft</code>, <code>rotateRight</code>, <code>flipColors</code>.</li>
        <li><b>The split moves up</b>: <code>flipColors</code> turns the middle key's link red, which
        is a new red link one level up, checked by the same rules: it can lean right, make a
        4-node of the parent, or reach the root, which is recolored black (the tree grows).</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html#insert", label: "Textbook: insertion →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new RedBlack(),
  ...PANELS, cols: [360, 540],
  costs: ["compare", "rotation"],
  width: 900, height: 220,
  help: "Each button builds a small tree and inserts one key: the violation it causes is named first, then fixed. " + COLOR_KEY,
  cases: RB_INSERT_CASES.map((c) => ({ name: c.name, group: c.group, make: fromTT(c.tt), run: (s, spec) => s.insert(c.key, { fix: fixOf(spec) }) })),
};

// ── rb-delete: every way a delete can remove a key ───────────────────
export const RB_DELETE_CASES = [
  { name: "red leaf", group: "no violation", tt: T([40], T([10, 20]), T([60])), key: 10 },
  { name: "one child", tt: T([40], T([10, 20]), T([60])), key: 20 },
  { name: "two children", tt: T([40], T([10, 20]), T([60])), key: 40 },
  { name: "left, borrow", group: "under a 2-node", tt: T([40], T([20]), T([60, 70])), key: 20 },
  { name: "left, merge", tt: T([40], T([20]), T([60])), key: 20 },
  { name: "right, borrow", tt: T([40], T([10, 20]), T([60])), key: 60 },
  { name: "right, merge", tt: T([40], T([20]), T([60])), key: 60 },
  { name: "left, borrow", group: "under a 3-node", tt: T([30, 60], T([10]), T([40, 50]), T([70])), key: 10 },
  { name: "left, merge", tt: T([30, 60], T([10]), T([40]), T([70])), key: 10 },
  { name: "middle, borrow left", tt: T([30, 60], T([10, 20]), T([40]), T([70])), key: 40 },
  { name: "middle, borrow right", tt: T([30, 60], T([10]), T([40]), T([70, 80])), key: 40 },
  { name: "middle, merge", tt: T([30, 60], T([10]), T([40]), T([70])), key: 40 },
  { name: "right, borrow", tt: T([30, 60], T([10]), T([40, 50]), T([70])), key: 70 },
  { name: "right, merge", tt: T([30, 60], T([10]), T([40]), T([70])), key: 70 },
  { name: "merge, then borrow", group: "moving up",
    tt: T([40], T([20], T([10]), T([30])), T([60, 80], T([50]), T([70]), T([90]))), key: 10 },
  { name: "merge into a 3-node",
    tt: T([40, 80], T([20], T([10]), T([30])), T([60], T([50]), T([70])), T([100], T([90]), T([110]))), key: 10 },
  { name: "merge to the root", tt: T([40], T([20], T([10]), T([30])), T([60], T([50]), T([70]))), key: 10 },
];

export const rbDeleteDemo = {
  id: "rb-delete",
  title: "Red-black delete: every case and its repair",
  blurb: "Every way a red-black delete can remove a key, each on its own small tree beside the 2-3 tree it encodes. A red leaf or a node with one child goes with no violation; a black leaf leaves a missing black (a dashed empty node), repaired by the 2-3 borrow or merge, expressed as rotations and recolorings.",
  about: `<p class="lede">A delete is a BST delete (a key with two children swaps with its in-order
      predecessor first), so the key removed sits at the bottom with at most one child. Whether a
      rule breaks depends only on that node; how to repair it depends on its 2-3 parent and
      sibling.</p>
      ${READING}
      <h3>No violation</h3>
      <ul>
        <li><b>Red leaf</b>: the smaller key of a 3-node at the bottom. Only a red link goes.</li>
        <li><b>One child</b>: the larger key of a 3-node at the bottom; its red child takes its place
        and turns black.</li>
        <li><b>Two children</b>: swap with the predecessor (the successor works the same way,
        mirrored), then remove it from the bottom.</li>
      </ul>
      <h3>A missing black</h3>
      <p>Removing a black leaf, a 2-node at the bottom, leaves the paths through it one black link
      short. The repair is the 2-3 delete's:</p>
      <ul>
        <li><b>Borrow</b> when a sibling is a 3-node: the parent's key comes down into the empty
        node and the sibling's nearest key goes up. Done.</li>
        <li><b>Merge</b> when the sibling is a 2-node: the parent's key comes down and joins it. Under
        a 3-node parent that is the end; under a 2-node parent the parent is empty now, so the
        missing black moves up a level and the repair repeats. At the root the empty node is
        dropped and the tree is one level shorter.</li>
      </ul>
      <p>The cases are named by where the empty node sits under its parent (left, middle, right)
      and what the parent is (a 2-node or a 3-node). Each borrow is one to three rotations and a
      recolor; each merge is a recolor, plus a <code>rotateLeft</code> when the merged 3-node would
      lean right.</p>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html#deletion", label: "Textbook: deletion →" },
    { href: "../textbook/trees/ds-two-three-trees.html#delete", label: "Textbook: 2-3 delete →" },
  ],
  make: () => new RedBlack(),
  ...PANELS, cols: [380, 520],
  costs: ["compare", "rotation"],
  width: 900, height: 220,
  help: "Each button builds a small tree and deletes one key. No violation: the key goes with no repair. Under a 2-node / 3-node: where the empty node sits under its parent, and the repair (borrow or merge). Moving up: merges that move the empty node up. " + COLOR_KEY,
  cases: RB_DELETE_CASES.map((c) => ({ name: c.name, group: c.group, make: fromTT(c.tt), run: (s, spec) => s.delete(c.key, { fix: fixOf(spec) }) })),
};

// ── rb-moves: each move on its own ───────────────────────────────────
export const rbMovesDemo = {
  id: "rb-moves",
  title: "Red-black moves: rotations and color flips",
  blurb: "The three moves of a left-leaning red-black BST, one at a time, beside the 2-3 tree: rotateLeft and rotateRight turn a red link the other way (the 2-3 tree is unchanged), flipColors splits a temporary 4-node (the middle key moves up).",
  about: `<p class="lede">Every red-black repair is made of three constant-time moves. Each button
      builds a small tree and applies one move; the left panel shows what it does to the 2-3
      tree.</p>
      ${READING}
      <h3>The moves</h3>
      <ul>
        <li><b>rotateLeft(h)</b>: h's right child x rises and takes h's link color; h hangs from x by a
        red left link; x's left subtree moves across to be h's right child. Turned on a red link it
        changes only how the 3-node is drawn: the 2-3 tree is the same.</li>
        <li><b>rotateRight(h)</b>: the mirror image.</li>
        <li><b>flipColors(h)</b>: h has two red children, a temporary 4-node; the children turn black
        and h turns red, joining its parent's node. That is the 2-3 split.</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html#moves", label: "Textbook: the fixes →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new RedBlack(),
  ...PANELS, cols: [360, 540],
  costs: ["compare", "rotation"],
  width: 900, height: 220,
  help: "Each button builds a small tree and applies one move, before and after. " + COLOR_KEY,
  cases: [
    { name: "rotateLeft", make: () => RedBlack.from(N(20, false, N(10), N(40, true, N(30), N(50)))), run: (s) => s.move("rotateLeft", 20) },
    { name: "rotateRight", make: () => RedBlack.from(N(40, false, N(20, true, N(10), N(30)), N(50))), run: (s) => s.move("rotateRight", 40) },
    { name: "flipColors", make: () => RedBlack.from(N(50, false, N(20, false, N(10, true), N(30, true)), N(70))), run: (s) => s.move("flipColors", 20) },
  ],
};
