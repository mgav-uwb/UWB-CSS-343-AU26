// CSS 343 unified library — demos/adaptive-huffman.js
// Adaptive Huffman (FGK), in the codec layout: the tree on top — which here is
// the whole show, because it CHANGES with every symbol — then text · bits ·
// decoded text, then the sizes. There is no build row: nothing is built ahead
// of time, which is the entire point of the algorithm.

import { AdaptiveHuffman, CodecPanels, codecStatsHTML, TreeRenderer } from "../index.js";

/** A function, not a constant: each mount needs its own handle on its panels. */
export function adaptiveCodecSpec() {
  const view = {};
  return {
    make: () => new AdaptiveHuffman(),
    noBuild: true,                     // there is nothing to build — that IS the algorithm
    renderer: [
      (c) => { const r = new TreeRenderer(c, { labels: "sym", R: 14, TOP: 22 }); r.expandable = true; return r; },
      (c) => (view.panels = new CodecPanels(c, { initialText: "abracadabra" })),
    ],
    height: [172, 150],
    galleryHeight: [300, 196],
    costs: ["read", "compare", "write", "link"],
    // no build row at all: nothing to build, and every Encode starts from an
    // empty tree anyway, so a Reset button would promise a state change that
    // has already happened
    chrome: { showValue: false, showOps: false, showClear: false, costsInline: true },
    info: { place: "below", html: true, render: (snap) => codecStatsHTML(snap?.stats) },
    stateMsg: (s) => `${s.inorder()} — type text and press Encode; the tree grows as it reads`,
    onMount: (demo) => view.panels?.setActions([
      { label: "Encode ▸", gap: 0, title: "text → bits, updating the tree after every symbol",
        run: () => demo.runOp("Encode") },
      { label: "Decode ▸", gap: 1, title: "bits → text, from an empty tree, running the same updates",
        run: () => demo.runOp("Decode") },
    ]),
    ops: [
      { name: "Encode", desc: "text → bits: send the path if the symbol is known, else NYT + 8 ASCII bits, then update",
        run: (s) => s.encodeCodec(view.panels?.text() || "abracadabra") },
      { name: "Decode", desc: "bits → text: the same walk and the same updates, from an empty tree",
        run: (s) => s.decodeCodec("") },
    ],
  };
}

export const adaptiveHuffmanDemo = {
  id: "adaptive-huffman",
  title: "Adaptive Huffman (FGK)",
  blurb: "Static Huffman needs two passes and a table: count the whole text, build the tree, then ship the tree along with the message. Adaptive Huffman needs neither. Encoder and decoder start from the SAME empty tree — one leaf, NYT (\"not yet transmitted\") — and after every symbol they run the SAME update, so the decoder always already knows the code the encoder just used. The encoder keeps a symbol → leaf table beside the tree — that one lookup is how it knows whether a symbol has a leaf yet, and the decoder needs no such table because where its walk ENDS is the answer. A symbol already in the tree costs its path; a brand-new one costs the path to NYT plus 8 plain ASCII bits, and NYT splits to make room for it. The update walks from the leaf to the root incrementing weights, swapping any node that a same-weight, higher-numbered node outranks — that swap is the whole algorithm, and it is what keeps the tree a Huffman tree for the counts seen SO FAR (Gallager's sibling property). Watch the tree reshape as the text arrives: try abracadabra, mississippi, or a long run like aaaaaaaaaabbbbbccc, then a pangram to see it lose — 27 first-appearances cost 8 bits each and nothing repeats.",
  about: `<p class="lede">Static Huffman needs two passes and a table: count the whole text, build the
      tree, then ship the tree along with the message. <b>Adaptive Huffman needs neither.</b></p>

      <p>Encoder and decoder start from the <b>same empty tree</b> — one leaf, <code>NYT</code>
      ("not yet transmitted") — and after every symbol they run the <b>same update</b>. The encoder
      codes symbol <i>s</i> with the tree built from symbols 1…<i>s</i>−1; the decoder, having just
      decoded those, holds that same tree. So no table is transmitted, because none needs to be: it
      is derived, in lockstep, at both ends.</p>

      <h3>The two asymmetric halves of one test</h3>
      <p>The encoder keeps a <b>symbol → leaf table</b> beside the tree (in practice 256 leaf
      pointers indexed by the byte). One lookup answers both "does this symbol have a leaf yet" and
      "where is it" — it never searches the tree. The decoder <i>cannot</i> run that test: the symbol
      is exactly what it does not have. It reaches the same fork structurally, by walking bits to a
      leaf and asking whether that leaf is NYT.</p>

      <h3>What a symbol costs</h3>
      <ul>
        <li><b>already in the tree</b> — its root-to-leaf path, a variable-length codeword</li>
        <li><b>brand new</b> — the path to NYT, then 8 plain ASCII bits; NYT then <b>splits</b> into
        a fresh NYT and a leaf for the new symbol</li>
      </ul>
      <p>That is why the bits are coloured the way they are: the route to NYT is <b>grey</b>, because
      it names no symbol — it only says "a literal follows". Colour is reserved for the bits that
      <i>identify</i> a symbol: the 8-bit literal, or a codeword. Watch the grey shrink out of the
      stream as symbols start repeating.</p>

      <h3>The update, and why one swap is enough</h3>
      <p>Walk from the leaf to the root incrementing weights, and at each level swap the node with
      the highest-numbered node of the <i>same weight</i> if one outranks it. Gallager's <b>sibling
      property</b> says a binary tree is a Huffman tree for its leaf weights exactly when the nodes
      can be numbered so weight never decreases as the number grows — so repairing that ordering is
      the same thing as staying optimal, at O(depth) per symbol instead of a Θ(n log n) rebuild. The
      two nodes' numbers appear under them for exactly the frame that compares them.</p>

      <h3>Things to try</h3>
      <ul>
        <li><code>abracadabra</code> — 60 bits against ASCII's 88, and no table</li>
        <li><code>mississippi</code> — only four symbols, so the routes stay short and codewords take
        over quickly</li>
        <li><code>aaaaaaaaaabbbbbccc</code> — a long run; watch <code>a</code> get promoted to depth 1</li>
        <li>a pangram — 27 first appearances at 8 bits each and nothing repeats, so it <b>loses</b>
        to plain ASCII. Compression is a bet on repetition; no coder manufactures redundancy that
        is not there.</li>
      </ul>
      <p>Press <b>⇕</b> on the tree panel to expand it over the panels below when the tree gets deep.</p>

      <h3>What the input accepts</h3>
      <p>The escape sends a symbol as <b>8 plain ASCII bits</b>, so the text has to be ASCII —
      anything above 127 (a typographic dash, an ellipsis) is dropped, and the first frame says how
      many. Every edge is its own frame, so the first 60 characters are stepped and the rest finish
      in a single frame; the round trip is exact for the whole text either way.</p>`,
  links: [
    { href: "../sessions/S12-greedy-huffman/index.html", label: "Lecture 12 — Part 5 →" },
    { href: "../handouts/ch12-greedy-huffman.html", label: "Chapter 12 §4: adaptive Huffman →" },
  ],
  ...adaptiveCodecSpec(),
};
