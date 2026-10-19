// CSS 343 unified library: demos/redblack.js
// The left-leaning red-black BST, three ways:
//   redblack   the sandbox: build, insert, delete, search
//   rb-moves   a case demo of the moves themselves: rotateLeft, rotateRight
//              and flipColors one at a time, then the three ways a key can
//              land on a 3-node, then fix-ups that cascade up the tree
//   rb-delete  a case demo of delete on one shared tree: moveRedLeft and
//              moveRedRight as the 2-3 merge and borrow, and the successor
// Red links render red via the shared TreeRenderer (a red root, which delete
// sets for its descent, shows a red stub above it).

import { RedBlack, TreeRenderer, rbNode as N } from "../index.js";

const READING = `<h3>Reading the picture</h3>
      <p>A node's color is the color of the link from its parent. A <b>red</b> link (thick, red) glues
      two nodes into one 2-3 node: a red left child and its parent are one 3-node. Every other link is
      black, and the root's link is black by definition. The invariants: red links lean left, no node
      has two red links in a row, and every root-to-null path crosses the same number of black links
      (all 2-3 leaves at one depth).</p>`;

export const redblackDemo = {
  id: "redblack",
  title: "Red-Black BST (left-leaning)",
  blurb: "A BST plus one color bit per link: red glues two nodes into a 2-3-tree node. Rotations and color flips keep it perfectly black-balanced, guaranteeing Θ(log n) height.",
  about: `<p class="lede">A left-leaning red-black BST is a 2-3 tree stored as a binary tree: one node
      type plus one color bit. Insert and delete keep three invariants with three constant-time moves:
      <code>rotateLeft</code>, <code>rotateRight</code> and <code>flipColors</code>.</p>
      ${READING}
      <h3>The operations</h3>
      <ul>
        <li><b>Insert</b>: a plain BST insert whose new link is red, then on the way back up, at every
        node, in this order: a red right link with a black left one, <code>rotateLeft</code>; two red
        links in a row on the left, <code>rotateRight</code>; two red children,
        <code>flipColors</code> (the 2-3 split: the middle key moves up).</li>
        <li><b>Delete</b>: a key is never removed from a 2-node, so the descent keeps the current node
        or its left child red. Before stepping into a 2-node, <code>moveRedLeft</code> or
        <code>moveRedRight</code> flips colors (the 2-3 merge) and, if the sibling is a 3-node,
        rotates (the 2-3 borrow). A key with two children is replaced by its successor. On the way
        back up the insert fix-ups run again.</li>
        <li><b>Search</b>: an ordinary BST search; colors play no part.</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li>Build <code>10..90:10</code> (ascending): a plain BST would be a path; this stays
        within 2 log<sub>2</sub> n.</li>
        <li>Click a key, then Run: Delete with every move narrated.</li>
        <li>The <a href="?ds=rb-moves">moves</a> and <a href="?ds=rb-delete">delete cases</a> demos
        show each move on its own.</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html", label: "Textbook: red-black BSTs →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new RedBlack(),
  initial: "10..90:10",  // ascending — rotations + color flips keep it balanced
  presets: [
    { name: "toy: 10, 20, 30 (rotate, then flip)", initial: "10, 20, 30" },
    { name: "small: 5 keys", initial: "50, 20, 70, 10, 30" },
    { name: "ascending (10..90 by 10)", initial: "10..90:10" },
    { name: "random (1..31)", initial: "1..31:RAND" },
    { name: "big ascending (1..63)", initial: "1..63" },
  ],
  buildStep: (s, k) => s.insert(k),
  proto: "redblack",
  renderer: (c) => new TreeRenderer(c, { labels: "none" }),
  costs: ["compare", "rotation", "link"],
  ops: [
    { name: "Insert", arg: "number", desc: "BST insert with a red link, then rotateLeft / rotateRight / flipColors on the way up", run: (s, v) => s.insert(v) },
    { name: "Delete", arg: "number", desc: "top-down: moveRedLeft / moveRedRight before entering a 2-node (2-3 merge or borrow), then the insert fix-ups on the way up", run: (s, v) => s.delete(v) },
    { name: "Search", arg: "number", ghost: true, desc: "an ordinary BST search", run: (s, v) => s.search(v) },
  ],
};

// ── rb-moves: each move on its own, then in combination ──────────────
export const rbMovesDemo = {
  id: "rb-moves",
  title: "Red-black moves: rotations and color flips",
  blurb: "The three moves of a left-leaning red-black BST, one at a time and then in combination: rotateLeft leans a red link left, rotateRight straightens two reds in a row, flipColors splits a temporary 4-node (the middle key moves up). Then the three ways a new key lands on the 3-node [30|50], and fix-ups that cascade up the tree.",
  about: `<p class="lede">Every red-black insert is a BST insert plus some of three constant-time moves.
      Each button rebuilds a small tree and runs one scenario; step through it frame by frame.</p>
      ${READING}
      <h3>One move</h3>
      <ul>
        <li><b>rotateLeft(h)</b>: h's right child x rises and takes h's link color; h hangs from x by a
        red left link; x's left subtree moves across to be h's right child. Fixes a red link that
        leans right.</li>
        <li><b>rotateRight(h)</b>: the mirror. Fixes two red links in a row on the left, by
        balancing them around the middle key.</li>
        <li><b>flipColors(h)</b>: h has two red children, a temporary 4-node; the children turn black
        and h turns red, joining its parent's node. That is the 2-3 split.</li>
      </ul>
      <h3>Insert into the 3-node [30|50]</h3>
      <p>50 is black with a red left child 30. A key larger than both (70) needs one flip; a key
      smaller than both (10) a rotateRight and a flip; a key between them (40) a rotateLeft, a
      rotateRight and a flip. All three end in the shape a 2-3 split produces: the middle key on top
      with two black children.</p>
      <h3>Cascades</h3>
      <p>A flip turns its node red, which can create a violation one level up: inserting 50 into
      10..40 flips at 40 and then rotates at 20; inserting 55 into 10..60 flips twice, the second
      flip at the root, so the tree grows one level.</p>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html#moves", label: "Textbook: the three moves →" },
    { href: "../sessions/S06-balanced-trees/index.html", label: "Lecture 6 →" },
  ],
  make: () => new RedBlack(),
  renderer: (c) => new TreeRenderer(c, { labels: "none" }),
  costs: ["compare", "rotation"],
  width: 900, height: 230,
  help: "Each button rebuilds a small tree and runs one scenario. One move: a single rotateLeft, rotateRight or flipColors, before and after. Insert into [30|50]: the three places a key can land on a 3-node. Cascade: fix-ups that climb the tree.",
  cases: [
    { name: "rotateLeft", group: "one move",
      make: () => RedBlack.from(N(20, false, N(10), N(40, true, N(30), N(50)))), run: (s) => s.move("rotateLeft", 20) },
    { name: "rotateRight",
      make: () => RedBlack.from(N(40, false, N(20, true, N(10), N(30)), N(50))), run: (s) => s.move("rotateRight", 40) },
    { name: "flipColors",
      make: () => RedBlack.from(N(50, false, N(20, false, N(10, true), N(30, true)), N(70))), run: (s) => s.move("flipColors", 20) },
    { name: "70 (larger)", group: "insert into [30|50]", build: [50, 30], run: (s) => s.insert(70) },
    { name: "10 (smaller)", build: [50, 30], run: (s) => s.insert(10) },
    { name: "40 (between)", build: [50, 30], run: (s) => s.insert(40) },
    { name: "50 into 10..40", group: "cascade", build: [10, 20, 30, 40], run: (s) => s.insert(50) },
    { name: "55 into 10..60", build: [10, 20, 30, 40, 50, 60], run: (s) => s.insert(55) },
  ],
};

// ── rb-delete: one tree, each way a delete restructures ──────────────
// keys 10..150 by 10, inserted in the RAND order of "10..150:10:RAND"; each
// case below was checked to exercise its move (tests/redblack.test.mjs)
export const RB_DELETE_KEYS = [30, 110, 10, 150, 50, 120, 130, 90, 20, 40, 140, 70, 60, 100, 80];

export const rbDeleteDemo = {
  id: "rb-delete",
  title: "Red-black delete: merge, borrow, successor",
  blurb: "Left-leaning red-black delete on one 15-key tree. A key is never removed from a 2-node, so on the way down moveRedLeft and moveRedRight make the next node red first: a color flip is the 2-3 merge, and when the sibling is a 3-node, rotations turn it into the 2-3 borrow. A key with two children is replaced by its successor. On the way back up the insert fix-ups restore the invariants.",
  about: `<p class="lede">Red-black delete is the 2-3 delete in color: merge or borrow on the way down,
      then the insert fix-ups on the way up. Every case starts from the same tree.</p>
      ${READING}
      <h3>Why the descent restructures</h3>
      <p>Removing a key from a 2-node would leave an empty node, a black link missing from every path
      through it. So the descent keeps the current node or its left child red (the root is colored red
      first when both its children are black), and the key it finally removes sits in a 3-node or
      4-node at the bottom, where removing it costs no black link.</p>
      <h3>The cases</h3>
      <ul>
        <li><b>moveRedLeft, merge</b> (delete 60): about to step into a 2-node with a 2-node sibling.
        <code>flipColors</code> brings the parent's key down: the two siblings and the parent's key
        form one temporary 4-node.</li>
        <li><b>moveRedLeft, borrow</b> (delete 10): the right sibling is a 3-node, so after the flip
        <code>rotateRight</code> on the sibling, <code>rotateLeft</code> on the parent and a second
        flip move one key up from the sibling and the parent's key down to the left.</li>
        <li><b>moveRedRight</b> (delete 80, delete 140): the mirror image when the descent goes right;
        the borrow needs one rotation, because red links lean left.</li>
        <li><b>two children</b> (delete 50): delete the successor (the minimum of the right subtree)
        with the same top-down rules, then write it in the deleted key's place.</li>
      </ul>`,
  links: [
    { href: "../textbook/trees/ds-red-black-trees.html", label: "Textbook: red-black BSTs →" },
    { href: "../textbook/trees/ds-two-three-trees.html", label: "Textbook: 2-3 delete →" },
  ],
  make: () => new RedBlack(),
  renderer: (c) => new TreeRenderer(c, { labels: "none" }),
  costs: ["compare", "rotation"],
  width: 900, height: 240,
  help: "Each button rebuilds the same 15-key tree (10..150) and deletes one key. moveRedLeft and moveRedRight are the 2-3 merge (a color flip) and borrow (flip plus rotations); the successor case deletes the minimum of the right subtree and moves it up.",
  cases: [
    { name: "merge (delete 60)", group: "moveRedLeft", build: RB_DELETE_KEYS, run: (s) => s.delete(60) },
    { name: "borrow (delete 10)", build: RB_DELETE_KEYS, run: (s) => s.delete(10) },
    { name: "merge (delete 80)", group: "moveRedRight", build: RB_DELETE_KEYS, run: (s) => s.delete(80) },
    { name: "borrow (delete 140)", build: RB_DELETE_KEYS, run: (s) => s.delete(140) },
    { name: "successor (delete 50)", group: "two children", build: RB_DELETE_KEYS, run: (s) => s.delete(50) },
  ],
};
