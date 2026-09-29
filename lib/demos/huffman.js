// CSS 343 unified library — demos/huffman.js
// Full-demo spec for Huffman coding: repeatedly merge the two smallest-frequency
// trees in a forest until one remains. Node labels: key = character (leaves) or
// combined frequency (internal nodes); the "size" sub-label under every node is
// also the frequency. Ported from the S12 lecture demos: the initial box holds
// EDITABLE input in one of four forms — TEXT(real text), SYM-FRQ(a:20, b:17),
// SYM-RAND(a..h), or a bare number list (frequencies for a, b, c, …) — and an
// Encode op that walks root-to-leaf per character. Every build reports the size
// three ways: ASCII (8 bits/char), a fixed-length code over the same alphabet,
// and Huffman, with the ratio between them.

import { ArrayRenderer, CodecPanels, codecStatsHTML, Huffman, TreeRenderer } from "../index.js";

const CLRS = "5, 9, 12, 13, 16, 45"; // a:5 b:9 c:12 d:13 e:16 f:45 → weighted total 224

export const huffmanDemo = {
  id: "huffman",
  title: "Huffman Coding",
  blurb: "A greedy, bottom-up optimal prefix code: repeatedly merge the two least-frequent trees in a forest until one remains. More frequent symbols end up shallower → shorter codes. Say WHAT to compress in any of four ways: TEXT(the white fox …) counts real characters (lower-cased; a space is a symbol and shows as ␣, usually the most frequent one); SYM-FRQ(a:20, b:17, c:11) spells out symbol/frequency pairs in the same notation the slides use; SYM-RAND(a..h) invents skewed frequencies for a symbol range; or a bare number list is frequencies for a, b, c, … Each build prints the size three ways — ASCII at 8 bits a character, a fixed-length code over the same alphabet, and Huffman — plus the ratio. Try equal frequencies (8,8,8,8) for a balanced tree that saves nothing. To USE the code — encode text, decode it back, count the bits — open the encode/decode demo.",
  make: () => new Huffman(),
  initial: CLRS,
  initialPlaceholder: "TEXT(…) · SYM-FRQ(a:20, b:17) · SYM-RAND(a..h) · 5, 9, 12",
  initialWidth: 260,
  presets: [
    { name: "CLRS classic (5,9,12,13,16,45)", initial: CLRS },
    { name: "real text — spaces and all", initial: "TEXT(the white fox jumped over the white fence by the white house)" },
    { name: "written-out pairs", initial: "SYM-FRQ(a:20, b:17, c:11, d:6, e:3)" },
    { name: "average English (26 letters + space)", initial: "ENGLISH" },
    { name: "random skewed frequencies", initial: "SYM-RAND(a..h)" },
    { name: "equal frequencies (8,8,8,8) — no win", initial: "8, 8, 8, 8" },
    { name: "doubling (1,2,4,8,16,32) — a chain", initial: "1, 2, 4, 8, 16, 32" },
  ],
  about: `<p class="lede">A greedy, bottom-up optimal prefix code: repeatedly merge the two least-frequent
      trees in the forest until one remains. More frequent symbols end up shallower, so their
      codewords are shorter.</p>

      <p>The row above the tree is the <b>pool</b>, smallest first — the next merge is always its
      leftmost two entries. Until the last merge the state is a <i>forest</i>, not a tree, which is
      why all of it is drawn.</p>

      <h3>Saying what to compress</h3>
      <ul>
        <li><code>5, 9, 12, 13, 16, 45</code> — frequencies for a, b, c, … (the CLRS example;
        weighted total 224 bits)</li>
        <li><code>TEXT(the white fox …)</code> — counts real characters</li>
        <li><code>SYM-FRQ(a:20, b:17, c:11)</code> — written-out pairs</li>
        <li><code>SYM-RAND(a..h)</code> — a symbol range with seeded, skewed frequencies</li>
        <li><code>ENGLISH</code> — average English prose (4.135 bits/symbol against a 5-bit fixed
        code; entropy 4.100)</li>
      </ul>

      <h3>Things to try</h3>
      <ul>
        <li><code>8, 8, 8, 8</code> — equal frequencies build the balanced tree and save
        <b>nothing</b>. Skew is not just where the win is bigger; skew is the entire source of it.</li>
        <li><code>1, 2, 4, 8, 16, 32</code> — doubling frequencies build a chain, the maximally
        unbalanced case</li>
      </ul>
      <p>Every build reports the size three ways — ASCII at 8 bits a character, a fixed-length code
      over the same alphabet, and Huffman — plus the ratio. To <i>use</i> the code, open the
      encode/decode demo.</p>`,
  links: [
    { href: "../sessions/S12-greedy-huffman/index.html", label: "Lecture 12 — Part 3 →" },
    { href: "../handouts/ch12-greedy-huffman.html", label: "Chapter 12: Huffman coding →" },
    { href: "../handouts/greedy-algorithms.html", label: "Handout: greedy algorithms →" },
  ],
  // Build = ONE animated merge-by-merge trace. `raw` is the box text verbatim,
  // so TEXT(...)/SYM-FRQ(...)/SYM-RAND(...) survive (parseSequence keeps digits only).
  buildAll: (s, keys, vals, method, raw) => s.buildInput(raw, keys),
  proto: "huffman",
  stateMsg: (h) => h.statsLine() || `${h.inorder()} — type TEXT(…), SYM-FRQ(a:20, b:17), SYM-RAND(a..h), or plain frequencies`,
  // shown BOTH ways at once, like the heap: the ordered symbol:frequency pool
  // on top (smallest first, so the next merge is always the leftmost two) and
  // the tree it is being folded into below
  renderer: [
    (c) => new ArrayRenderer(c, { mode: "cells", pointers: false }),
    (c) => new TreeRenderer(c, { labels: "sym" }),
  ],
  height: [72, 250],
  galleryHeight: [86, 330],
  costs: ["compare", "link", "alloc"],
  // NO ops: this demo BUILDS the tree and stops there. Using the code — encode,
  // decode, what it costs — is the encode/decode demo's whole subject, and
  // having half of it here just split the story across two sandboxes.
  chrome: { showValue: false },
};

/** The same code, USED. Layout, top to bottom: the frequency box + Build; the
 *  TREE (a short strip you can pan, zoom, and expand to full height); the three
 *  panels — text · encoded bits · decoded text — where the middle panel is the
 *  handoff, so Decode consumes what Encode produced instead of the student
 *  retyping a bit string; the transport; the sizes. The text panel IS the
 *  editable input box, so the text is typed where it is read, and every symbol
 *  carries a COLOUR its bits and its decoded copy share.
 *
 *  A function, not a constant: each mount needs its own handle on its panels
 *  (the ops read the typed text back out of them). */
export function codecSpec() {
  const view = {};   // filled by the renderer factory below, read by the ops
  return {
    make: () => new Huffman(),
    initial: CLRS,
    initialPlaceholder: "TEXT(…) · SYM-FRQ(a:20, b:17) · SYM-RAND(a..h) · 5, 9, 12",
    initialTitle: "the FREQUENCIES the code is built from — the text to encode goes in the panel below",
    initialWidth: 240,
    buildAll: (s, keys, vals, method, raw) => s.buildCodec(raw, keys),
    initialBuilt: true,   // open on a finished code — Encode is usable immediately
    renderer: [
      (c) => { const r = new TreeRenderer(c, { labels: "sym", R: 14, TOP: 22 }); r.expandable = true; return r; },
      (c) => (view.panels = new CodecPanels(c, { initialText: "face" })),
    ],
    height: [156, 150],
    galleryHeight: [280, 196],
    costs: ["compare", "write"],
    // no Run row at all: the ops have their own buttons, sitting on the panel
    // boundaries they move text across (see onMount)
    chrome: { showValue: false, showOps: false, costsInline: true },
    onMount: (demo) => view.panels?.setActions([
      { label: "Encode ▸", gap: 0, title: "the text panel, walked root-to-leaf, into the bits panel",
        run: () => demo.runOp("Encode") },
      { label: "Decode ▸", gap: 1, title: "the bits panel, walked from the root, into the decoded panel",
        run: () => demo.runOp("Decode") },
    ]),
    info: { place: "below", html: true, render: (snap) => codecStatsHTML(snap?.stats) },
    // the FREQUENCY table's totals belong to the build, not to the text in the
    // panels — quoting them here read as if "face" cost 224 bits. The sizes for
    // the typed text live in the strip under the transport.
    stateMsg: (h) => `code over ${h.inorder()} — type in the text panel, then Encode`,
    ops: [
      { name: "Encode", desc: "text → bits: the left panel's text, walked root-to-leaf, into the middle",
        run: (s) => s.encodeCodec(view.panels?.text() || "face") },
      { name: "Decode", desc: "bits → text: the middle panel, walked from the root, into the right",
        run: (s) => s.decodeCodec("") },
    ],
  };
}

export const huffmanCodecDemo = {
  id: "huffman-codec",
  title: "Huffman: encode / decode",
  blurb: "The round trip in one picture. The code's tree sits on top (pan, zoom, or ⇕ to expand it to full height); under it three panels — the text being encoded, its bits, and the text decoded back out. ENCODE reads the left panel and fills the middle; DECODE reads the middle and fills the right, so the bits Decode consumes are exactly the bits Encode produced. The left panel is an editable box: type there, then press Encode. Every symbol has a colour, shared by its leaf, the bits its walk emits, and the character decoded back — so a run of one colour in the middle panel IS one codeword. Sizes run under the controls: characters, ASCII at 8 bits each, a fixed-length code over the same alphabet, and Huffman. The frequency box at the top takes the same TEXT(…)/SYM-FRQ(…)/SYM-RAND(…)/frequency-list forms as the build demo.",
  presets: [
    { name: "CLRS classic — encode \"face\"", initial: CLRS },
    { name: "from real text", initial: "TEXT(the white fox jumped over the white fence by the white house)" },
    { name: "average English (26 letters + space)", initial: "ENGLISH" },
    { name: "written-out pairs", initial: "SYM-FRQ(a:20, b:17, c:11, d:6, e:3)" },
  ],
  about: `<p class="lede">The round trip in one picture: the text on the left, its bits in the middle,
      and the text decoded back out on the right.</p>

      <p><b>Encode</b> reads the left panel and fills the middle; <b>Decode</b> reads the middle and
      fills the right — so the bits Decode consumes are exactly the bits Encode produced, on screen,
      rather than a bit string anyone retyped. The left panel is an editable box: type in it, then
      press Encode.</p>

      <h3>Reading the colours</h3>
      <p>Every symbol owns a colour, shared by its leaf in the tree, the bits its walk emits, and the
      character decoded back. A run of one colour in the middle panel <i>is</i> one codeword — the
      symbol→codeword map, visible without a table.</p>

      <h3>Building the code</h3>
      <p>The frequency box at the top takes four forms:</p>
      <ul>
        <li><code>5, 9, 12, 13, 16, 45</code> — frequencies for a, b, c, …</li>
        <li><code>TEXT(the white fox …)</code> — counts real characters (lower-cased; a space is a
        symbol, drawn <code>␣</code>, and is usually the commonest)</li>
        <li><code>SYM-FRQ(a:20, b:17)</code> — symbol/frequency pairs</li>
        <li><code>ENGLISH</code> — average English prose, 26 letters plus the space</li>
      </ul>

      <h3>What the input accepts</h3>
      <p>A symbol the code was not built for is skipped, and the demo says so as it reaches it —
      encode <code>face.</code> under the CLRS code and watch the <code>.</code> go by. Every step is
      its own frame, so the first 60 characters are stepped and the rest finish in a single frame;
      what is encoded and decoded is the whole text either way.</p>

      <h3>When a code loses</h3>
      <p>Huffman cannot lose to a fixed-length code <i>on the frequencies it was built from</i> — a
      fixed-length code is itself a prefix code, and Huffman is optimal over all of them. It can lose
      to the <b>wrong text</b>: build with <code>ENGLISH</code>, then encode
      <code>jazzy vixen quips</code> and watch the size strip go red. And it can lose to the cost of
      <b>shipping the table</b>, which this demo does not charge you for — the adaptive demo is the
      answer to both.</p>`,
  links: [
    { href: "../sessions/S12-greedy-huffman/index.html", label: "Lecture 12 — Part 4 →" },
    { href: "../handouts/ch12-greedy-huffman.html", label: "Chapter 12: Huffman coding →" },
  ],
  ...codecSpec(),
};
