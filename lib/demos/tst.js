// CSS 343 unified library — demos/tst.js
// Full-demo spec for the TERNARY SEARCH TRIE, the companion to `trie`: same
// keys, same operations, a different node. Drawn with the shared TreeRenderer
// in `labels: "sym"` mode so every node can print its character POSITION
// underneath — which is what makes "the nodes sharing a number are one BST"
// readable off the picture, and makes an `=` edge visibly the thing that
// increments it.

import { TST, TreeRenderer } from "../index.js";

const SAMPLE = ["she", "sells", "sea", "shells", "by", "the", "shore"];
const words = (text) => String(text ?? "").toLowerCase().split(/[^a-z]+/).filter(Boolean).slice(0, 10);

export const tstDemo = {
  id: "tst",
  title: "Ternary Search Trie (TST)",
  blurb: "The R-way trie's child array, replaced by a little binary search tree over just the characters actually used at that position. Each node holds one character and three links: left and right search among the characters at THIS position, mid drops to the root of the NEXT position's tree. The number under each node is its position, so an '=' edge is exactly what increments it.",
  about: `
      <p class="lede">One R-way node held an array of \\(R\\) child pointers, nearly all null. A TST
      replaces that array with a <b>small binary search tree over only the characters actually
      used</b> at that position — three pointers per node instead of \\(R\\), with no null-slot
      waste at all.</p>
      <h3>Is it a BST or a ternary tree?</h3>
      <p>Both, at different levels, and this demo exists to make that concrete. <b>Structurally it
      is one ternary tree</b>: every link points to another node of the same kind, which is exactly
      what &ldquo;ternary&rdquo; names. What differs is what each link <em>means</em>:</p>
      <ul>
        <li><b>left / right</b> — stay at the <em>same</em> character position, searching among the
        characters used there. That little BST is what replaces the array.</li>
        <li><b>mid</b> — <em>advances</em> one position, landing on the <b>root of the next
        position's BST</b>. So the following characters do hang under <code>mid</code>.</li>
      </ul>
      <p>So the R-way trie's <code>next[c]</code> becomes two steps: BST-search on left/right for
      <code>c</code>, then follow that node's <code>mid</code>. Only <code>mid</code> consumes a
      character, which is why a key of length \\(L\\) costs \\(L\\) mid-steps with an \\(O(\\log R)\\)
      sibling search before each — \\(\\Theta(L\\log R)\\) worst case, close to \\(\\Theta(L)\\) in
      practice because most positions have very few characters.</p>
      <h3>How to read the picture</h3>
      <p>The number under a node is its <b>character position</b>. Every node sharing a number is
      part of one BST; crossing an <code>=</code> edge is the only thing that changes it. Edge
      badges say which link you took, and <b>•</b> marks a node a key ends on (which, as in any
      trie, need not be a leaf).</p>
      <h3>What to run</h3>
      <ul>
        <li><b>What follows?</b> with <code>sh</code> — it walks to <code>sh</code>, takes one mid
        link, and highlights the BST it lands on: <code>{e, o}</code>, exactly the characters that
        can follow <code>sh</code> in <code>she / shells / shore</code>. Position 0 needs no query:
        it is the root's own BST, the three nodes marked <code>0</code> across the top
        (<code>{b, s, t}</code> — every character any key starts with).</li>
        <li><b>Search</b> <code>shore</code> — watch the message alternate between "still position
        \\(d\\)" for left/right and "follow MID → position \\(d+1\\)" for a match.</li>
        <li><b>Search</b> <code>shel</code> — the path exists but the node carries no <b>•</b>, so
        it is not a stored key. Same subtlety as the R-way trie.</li>
        <li><b>Search</b> <code>sz</code> — a miss can stop long before the key runs out.</li>
        <li>Compare with <a href="./demo.html?ds=trie">the R-way trie</a> on the same keys: same
        answers, same \\(\\Theta(L)\\)-ish cost, one array of \\(R\\) versus three pointers.</li>
      </ul>`,
  links: [
    { href: "../handouts/ch16-strings-tries.html#space", label: "Chapter 16 §3: compressed tries and TSTs →" },
    { href: "../sessions/S16-strings-tries/index.html", label: "Lecture 16 — Part 1 →" },
    { href: "./demo.html?ds=trie", label: "The R-way trie, same keys →" },
  ],
  make: () => new TST(),
  initial: "she, sells, sea, shells, by, the, shore",
  presets: [
    { name: "she sells sea shells by the shore", initial: "she, sells, sea, shells, by, the, shore" },
    { name: "shared prefixes (to/tea/ted/ten/in/inn)", initial: "to, tea, ted, ten, in, inn" },
    { name: "no sharing (cat, dog, fox)", initial: "cat, dog, fox" },
    { name: "one deep key (abcdef)", initial: "abcdef" },
  ],
  initialPlaceholder: "word, word, …",
  initialTitle: "comma/space-separated words (up to 10) — Build inserts them one at a time",
  buildRaw: (s, text) => {
    const ws = words(text);
    return s.buildAll(ws.length ? ws : SAMPLE);
  },
  proto: "trie",
  valPlaceholder: "word",
  valInitial: "sh",
  stateMsg: (s) => `${s.inorder()} — Search / Insert a word, or ask What follows? for a prefix`,
  renderer: (c) => new TreeRenderer(c, { labels: "sym", R: 15 }),
  costs: ["compare", "visit", "alloc"],
  chrome: { showCosts: true },
  height: 300,
  ops: [
    { name: "Search", arg: "string", ghost: true, desc: "walk left/right within a position, mid to advance one", run: (s, v) => s.search(v) },
    { name: "Insert", arg: "string", desc: "the same walk, creating only what is missing", run: (s, v) => s.insert(v) },
    { name: "What follows?", arg: "string", ghost: true, desc: "follow a prefix, then one mid link — highlights the next position's BST", run: (s, v) => s.position(v) },
  ],
};
