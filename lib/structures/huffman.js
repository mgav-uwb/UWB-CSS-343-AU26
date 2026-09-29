// CSS 343 unified library — structures/huffman.js
// Huffman coding: build an optimal prefix code by repeatedly merging the two
// least-frequent trees in a forest until one tree remains (a greedy, bottom-up
// construction — CLRS Ch.16). No heap class is used: with demo-sized forests
// (a handful of symbols) a linear min-scan is clearer to trace step-by-step
// than heap-sift internals would be. Renders with the shared TreeRenderer:
// leaves show their character (key) with frequency underneath ("f " label,
// labels:"freq"); internal nodes show their combined frequency as the key.
// Every op returns a Trace the Player scrubs, exactly like bst.js/heap.js.

import { Tracer } from "../core/tracer.js";
import { symbolColor } from "../core/palette.js";

// The classic CLRS (Ch.16) example: a..f with these frequencies out of 100.
// Known-optimal weighted total (Σ freq·codelen) = 224.
const DEFAULT_FREQS = [["a", 5], ["b", 9], ["c", 12], ["d", 13], ["e", 16], ["f", 45]];
// A space is a symbol like any other — usually the most frequent one in real
// text — but it cannot be DRAWN as a blank, so it travels as this glyph.
const SPACE = "\u2423";   // ␣
// The codec view records a frame per step and copies its columns into each
// one, so its cost is quadratic in the text. Rather than truncate what the user
// typed, STEP the opening and finish the rest in one frame: the round trip
// stays exact for the whole input and the frame count stays bounded.
const CODEC_STEP_CHARS = 60;
const CODEC_MAX_CHARS = 400;

// Average English prose, per 10 000 characters: the 26 letters in their
// standard relative frequencies (Norvig's counts over the Google books
// corpus), scaled to 82% to make room for the SPACE — which is ~18% of real
// text and, being the commonest symbol of all, is the one that most changes
// what the tree looks like. Used by the "average English" build preset, and by
// the slides that compare a code built for English against the text it meets.
const ENGLISH_FREQ = [
  [SPACE, 1800], ["e", 1041], ["t", 743], ["a", 670], ["o", 616], ["i", 572],
  ["n", 554], ["s", 519], ["h", 499], ["r", 491], ["d", 349], ["l", 330],
  ["c", 228], ["u", 226], ["m", 198], ["w", 194], ["f", 183], ["g", 166],
  ["y", 162], ["p", 158], ["b", 106], ["v", 80], ["k", 63], ["j", 12],
  ["x", 12], ["q", 8], ["z", 6],
];

const leaf = (ch, f) => ({ key: ch, freq: f, size: f, isLeaf: true, left: null, right: null });
const branch = (lo, hi) => ({ key: lo.freq + hi.freq, freq: lo.freq + hi.freq, size: lo.freq + hi.freq, isLeaf: false, left: lo, right: hi });
// Renderer-facing clone. `key` stays the node's identity (highlights are keyed
// by it), but the CIRCLE shows `label` = the frequency — the quantity the
// algorithm actually compares — and `sub` carries the symbol, which only a leaf
// has. So every node reads as a weight, and the letters appear exactly where
// they mean something.
const cloneNode = (n) => (n ? {
  key: n.key, size: n.size, label: n.freq, sub: n.isLeaf ? String(n.key) : "",
  left: cloneNode(n.left), right: cloneNode(n.right),
} : null);

/** The forest as the ordered symbol:frequency row shown above the tree —
 *  ascending, so the two cells about to merge are always the leftmost two. */
const forestRow = (forest) => {
  const sorted = forest.slice().sort((a, b) => a.freq - b.freq
    || String(a.isLeaf ? a.key : "").localeCompare(String(b.isLeaf ? b.key : "")));
  return { array: sorted.map((t) => t.freq),
           subLabels: sorted.map((t) => (t.isLeaf ? String(t.key) : "•")) };
};

/** One frame's snapshot, readable by BOTH panels without an adapter:
 *  ArrayRenderer takes {array, subLabels}, TreeRenderer takes {tree}. The tree
 *  is the WHOLE FOREST, in merge order — until the last step Huffman's state is
 *  several partial trees, and showing only the newest one hid the n−1 merges
 *  the deck counts. Ordered smallest-root first so it tracks the pool row. */
const frame = (forest) => ({
  tree: forest.slice().sort((a, b) => a.freq - b.freq).map(cloneNode),
  ...forestRow(forest),
});

export { ENGLISH_FREQ };

export class Huffman {
  constructor() { this.root = null; }

  /**
   * build(freqs) — freqs is [[char, frequency], …]. No args (or an empty
   * array, e.g. from the demo harness's numeric-only "initial" box) falls
   * back to the classic CLRS sample. TRACED: start as a forest of single-node
   * trees, then repeatedly merge the two smallest-frequency roots until one
   * tree remains.
   */
  /** Numbers → symbol pairs: "5, 9, 12" becomes a:5, b:9, c:12 (demo initial box). */
  _pairs(freqs) {
    if (Array.isArray(freqs) && freqs.length && !Array.isArray(freqs[0]))
      // a frequency is a COUNT: 0 and negatives are meaningless and would make
      // the bit totals nonsense, so they are dropped rather than built from
      return freqs.filter((f) => Number.isFinite(f) && f > 0)
        .map((f, i) => [String.fromCharCode(97 + i), f]);
    return Array.isArray(freqs) ? freqs.filter(([, f]) => Number.isFinite(f) && f > 0) : freqs;
  }
  loadRaw(keys) { this.build(this._pairs(keys)); return this; } // silent build (trace discarded)

  /** parseInput(raw, keys) — the four ways to say what to compress.
   *    TEXT(the white fox …)   count the characters of real text (lower-cased;
   *                            a space counts and is shown as ␣ — it is usually
   *                            the most frequent symbol, which is the point)
   *    SYM-FRQ(a:20, b:17, …)  symbol/frequency pairs, written out — the
   *                            same `a:5 b:9` notation the slides use ('-'
   *                            is tolerated too)
   *    SYM-RAND(a..h)          that symbol range, seeded pseudo-random counts
   *    ENGLISH                 average English prose: 26 letters + the space,
   *                            in their standard relative frequencies
   *    5, 9, 12, …             bare numbers = frequencies for a, b, c, … (the
   *                            original form; still works)
   *  Returns {pairs, chars, source} — `chars` is the total symbol count, which
   *  is what the ASCII/fixed/Huffman size comparison is computed against. */
  parseInput(raw, keys) {
    const call = String(raw ?? "").trim().match(/^([A-Za-z][\w-]*)\s*\(([\s\S]*)\)$/);
    const name = call ? call[1].toUpperCase() : null;
    const arg = call ? call[2] : "";

    if (name === "TEXT") {
      const counts = new Map();
      let n = 0;
      for (const raw1 of arg.toLowerCase()) {
        const ch = raw1 === " " ? SPACE : raw1;
        if (raw1 === "\n" || raw1 === "\t") continue;
        counts.set(ch, (counts.get(ch) || 0) + 1); n++;
      }
      const pairs = [...counts.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
      return { pairs, chars: n, source: `text of ${n} characters, ${pairs.length} distinct` };
    }

    if (name === "ENGLISH" || String(raw ?? "").trim().toUpperCase() === "ENGLISH") {
      // ENGLISH            letters + space, average English prose
      // ENGLISH(no-space)  letters only — the same text with the spaces stripped
      const drop = /no.?space/i.test(arg);
      const pairs = ENGLISH_FREQ.filter(([ch]) => !(drop && ch === SPACE)).map((p1) => p1.slice());
      const chars = pairs.reduce((sm, [, f]) => sm + f, 0);
      return { pairs, chars,
               source: `average English${drop ? " (no spaces)" : ""} — ${pairs.length} symbols per ${chars} characters` };
    }

    if (name === "SYM-FRQ") {
      const pairs = [];
      for (const part of arg.split(",")) {
        const m = part.trim().match(/^(\S)\s*[-:]\s*(\d+)$/);
        if (m && +m[2] > 0) pairs.push([m[1], +m[2]]);
      }
      const chars = pairs.reduce((s, [, f]) => s + f, 0);
      return { pairs, chars, source: `${pairs.length} symbols, ${chars} characters` };
    }

    if (name === "SYM-RAND") {
      const m = arg.trim().match(/^(\S)\s*\.\.\s*(\S)$/);
      const pairs = [];
      if (m) {
        const lo = m[1].charCodeAt(0), hi = m[2].charCodeAt(0);
        const syms = [];
        for (let c = lo; c <= hi && syms.length < 26; c++) syms.push(String.fromCharCode(c));
        // SKEWED on purpose: uniform-random counts build a balanced tree and
        // Huffman wins nothing, which would teach the wrong lesson. Real symbol
        // frequencies are Zipf-ish, so hand out ranks 1..n as ~60/rank and
        // SHUFFLE which symbol gets which rank (seeded → reproducible).
        let s = (0x343 + lo * 131 + hi * 17) >>> 0;
        const next = () => (s = (s * 1664525 + 1013904223) >>> 0) >>> 8;
        const order = syms.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = next() % (i + 1);
          [order[i], order[j]] = [order[j], order[i]];
        }
        order.forEach((symIdx, rank) => {
          const jitter = 1 + (next() % 5) / 10;             // ±, keeps ties rare
          pairs.push([syms[symIdx], Math.max(1, Math.round((60 / (rank + 1)) * jitter))]);
        });
        pairs.sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
      }
      const chars = pairs.reduce((sm, [, f]) => sm + f, 0);
      return { pairs, chars, source: `${pairs.length} random symbols, ${chars} characters` };
    }

    if (name && !["TEXT", "SYM-FRQ", "SYM-RAND", "ENGLISH"].includes(name))
      return { pairs: null, chars: 0, bad: name,
               source: `unknown build method ${name}( ) — use TEXT, SYM-FRQ, SYM-RAND or ENGLISH` };

    const pairs = this._pairs(Array.isArray(keys) ? keys : []);
    const chars = (pairs || []).reduce((s, [, f]) => s + f, 0);
    return { pairs: pairs && pairs.length ? pairs : null, chars,
             source: `${(pairs || []).length} symbols, ${chars} characters` };
  }

  /** buildInput(raw, keys) — parse whichever input form was typed, then build. */
  buildInput(raw, keys) {
    const { pairs, chars, source, bad } = this.parseInput(raw, keys);
    this.totalChars = chars || 0;
    this.inputSource = source;
    if (bad) {                       // name a wrong method rather than guessing
      const t = new Tracer();
      t.step(source, { snapshot: this.snapshot(), highlight: {} });
      return t.trace();
    }
    return this.build(pairs && pairs.length ? pairs : undefined);
  }

  /** stats() — what the build actually bought, in bits.
   *  ASCII spends 8 bits per character; a fixed-length code over THIS alphabet
   *  spends ⌈log₂ n⌉; Huffman spends Σ freq × depth. */
  stats() {
    const codes = this.codes();
    const syms = Object.keys(codes);
    if (!syms.length) return null;
    const freq = {};
    (function walk(n) {
      if (!n) return;
      if (n.isLeaf) { freq[n.key] = n.freq; return; }
      walk(n.left); walk(n.right);
    })(this.root);
    const chars = this.totalChars || syms.reduce((s, k) => s + (freq[k] || 0), 0);
    const fixedLen = Math.max(1, Math.ceil(Math.log2(syms.length)));
    const huff = syms.reduce((s, k) => s + (freq[k] || 0) * codes[k].length, 0);
    return {
      chars, alphabet: syms.length, fixedLen,
      ascii: chars * 8, fixed: chars * fixedLen, huffman: huff,
      vsAscii: huff / (chars * 8), vsFixed: huff / (chars * fixedLen),
    };
  }

  /** One line of size accounting, for a trace frame or the demo's state line. */
  statsLine() {
    const s = this.stats();
    if (!s) return "";
    return `${s.chars} chars over ${s.alphabet} symbols — ASCII ${s.ascii} bits · `
      + `fixed ${s.fixedLen}-bit ${s.fixed} · Huffman ${s.huffman} `
      + `(${(s.vsAscii * 100).toFixed(0)}% of ASCII, ${(1 / s.vsAscii).toFixed(2)}× smaller)`;
  }

  build(freqs) {
    const t = new Tracer();
    freqs = this._pairs(freqs);
    const list = Array.isArray(freqs) && freqs.length ? freqs : DEFAULT_FREQS;
    let forest = list.map(([ch, f]) => leaf(ch, f));

    if (forest.length === 0) { this.root = null; t.step("build: no symbols given", { snapshot: null }); return t.trace(); }
    if (forest.length === 1) {
      this.root = forest[0];
      t.step(`start: 1 leaf (${this.root.key}) — trivially the whole tree, code "0"`, { snapshot: frame(forest), highlight: { done: this.root.key } });
      return t.trace();
    }

    t.step(`start: ${forest.length} leaves as a forest — the row above is the pool, smallest first`,
      { snapshot: frame(forest), highlight: {} });

    while (forest.length > 1) {
      // take the two smallest-frequency roots via a linear min-scan (twice)
      let i1 = 0;
      for (let i = 1; i < forest.length; i++) { t.count("compare"); if (forest[i].freq < forest[i1].freq) i1 = i; }
      const a = forest.splice(i1, 1)[0];

      let i2 = 0;
      for (let i = 1; i < forest.length; i++) { t.count("compare"); if (forest[i].freq < forest[i2].freq) i2 = i; }
      const b = forest.splice(i2, 1)[0];

      const lo = a.freq <= b.freq ? a : b, hi = a.freq <= b.freq ? b : a; // left = smaller, right = larger (consistent rule)
      const parent = branch(lo, hi);
      t.count("alloc").count("link", 2);
      forest.push(parent);

      t.step(`merge the two smallest: ${lo.key}(${lo.freq}) + ${hi.key}(${hi.freq}) → (${parent.freq})`,
        { snapshot: frame(forest), highlight: { appear: parent.key } });
    }

    this.root = forest[0];
    const line = this.statsLine();
    t.step(`done — Huffman tree built (root frequency ${this.root.freq})`
      + (line ? `. ${line}` : ""),
      { snapshot: frame(forest), highlight: { done: this.root.key } });
    return t.trace();
  }

  /** Current tree in the {key,left,right,size} shape TreeRenderer expects —
   *  or, once the codec view is live, that view's frame, so a plain "here is
   *  the state" step (mount, Reset) reaches the panels in the shape they read. */
  snapshot() {
    if (this.cx && this.cx.tree) return this._codecFrame({ act: 0 });
    return frame(this.root ? [this.root] : []);
  }

  /** codes() — walk left=0/right=1 from the root; returns {char: "010", …}. */
  codes() {
    const map = {};
    if (!this.root) return map;
    if (this.root.isLeaf) { map[this.root.key] = "0"; return map; } // degenerate 1-symbol tree
    (function walk(node, prefix) {
      if (!node) return;
      if (node.isLeaf) { map[node.key] = prefix; return; }
      walk(node.left, prefix + "0");
      walk(node.right, prefix + "1");
    })(this.root, "");
    return map;
  }

  /** codesWalk(text) — TRACED encode: walk root→leaf for each character,
      accumulating its code, then show the assembled bit string and decode it
      back (decode = the same walks driven by the bits). */
  codesWalk(text = "cab") {
    const t = new Tracer();
    if (!this.root) { t.step("no tree — run build first", { snapshot: null }); return t.trace(); }
    const snap = () => frame(this.root ? [this.root] : []);
    const known = this.codes();
    let bits = "";
    t.step(`encode "${text}": each symbol's code is its root-to-leaf path (left = 0, right = 1)`,
      { snapshot: snap(), highlight: { active: this.root.key } });
    for (const raw of text) {
      const ch = raw === " " ? SPACE : raw;
      if (!(ch in known)) {
        t.step(`'${ch}' is not in this tree — a Huffman code only covers the symbols it was built for. Skipped`,
          { snapshot: snap(), highlight: {} });
        continue;
      }
      let node = this.root, code = "";
      t.step(`'${ch}': start at the root`, { snapshot: snap(), highlight: { active: node.key } });
      while (!node.isLeaf) {
        const goLeft = (function has(n) { return n ? (n.isLeaf ? n.key === ch : has(n.left) || has(n.right)) : false; })(node.left);
        node = goLeft ? node.left : node.right;
        code += goLeft ? "0" : "1";
        t.count("compare");
        t.step(`'${ch}': ${goLeft ? "left → 0" : "right → 1"}   (code so far: ${code})`,
          { snapshot: snap(), highlight: { active: node.key } });
      }
      bits += code;
      t.count("write", code.length);
      t.step(`'${ch}' = ${code}   (bits so far: ${bits})`, { snapshot: snap(), highlight: { done: node.key } });
    }
    this.lastBits = bits;   // so Decode with an empty box replays this encoding
    t.step(`"${text}" → ${bits} (${bits.length} bits). Now run DECODE on those bits — the same walks, driven by the bit string instead of the text`,
      { snapshot: snap(), highlight: { done: this.root.key } });
    return t.trace();
  }

  /** decodeWalk(bits) — TRACED decode, the mirror of codesWalk: start at the
   *  root, take one bit at a time (0 = left, 1 = right), emit the symbol the
   *  instant a LEAF is reached and jump back to the root. That restart is the
   *  whole prefix-free property in action — nothing tells the decoder where a
   *  codeword ends except arriving at a leaf. Empty input replays the last
   *  Encode. Leftover bits are reported, not swallowed. */
  decodeWalk(bits = "") {
    const t = new Tracer();
    if (!this.root) { t.step("no tree — run Build first", { snapshot: null }); return t.trace(); }
    const snap = () => frame(this.root ? [this.root] : []);
    const typed = String(bits ?? "").trim();
    let src = typed.replace(/[^01]/g, "");
    if (typed && !src) {          // typed something, but none of it was a bit
      t.step(`"${typed}" is not a bit string — Decode takes 0s and 1s (Encode takes text)`,
        { snapshot: snap(), highlight: {} });
      return t.trace();
    }
    if (!src) src = this.lastBits || "";
    if (!src) {
      t.step("type a bit string (0s and 1s) — or run Encode first and Decode replays its bits",
        { snapshot: snap(), highlight: {} });
      return t.trace();
    }
    if (this.root.isLeaf) {          // degenerate 1-symbol tree: every bit is that symbol
      t.step(`one symbol only — every bit decodes to '${this.root.key}': "${src.split("").map(() => this.root.key).join("")}"`,
        { snapshot: snap(), highlight: { done: this.root.key } });
      return t.trace();
    }
    t.step(`decode ${src} (${src.length} bits): start at the root, 0 = left, 1 = right`,
      { snapshot: snap(), highlight: { active: this.root.key } });
    let node = this.root, out = "", consumed = 0, sinceLeaf = "";
    for (const b of src) {
      node = b === "0" ? node.left : node.right;
      consumed++; sinceLeaf += b;
      t.count("compare");
      if (!node) {                    // cannot happen on a full Huffman tree, but be honest
        t.step(`bit ${b}: no child that way — these bits do not belong to this tree`,
          { snapshot: snap(), highlight: {} });
        return t.trace();
      }
      if (node.isLeaf) {
        out += node.key;
        t.count("write");
        t.step(`${sinceLeaf} → leaf '${node.key}' — emit it and jump back to the root   (so far: "${out}")`,
          { snapshot: snap(), highlight: { done: node.key } });
        node = this.root; sinceLeaf = "";
      } else {
        t.step(`bit ${b}: go ${b === "0" ? "left" : "right"} — still inside a codeword (${sinceLeaf})`,
          { snapshot: snap(), highlight: { active: node.key } });
      }
    }
    const dangling = sinceLeaf.length;
    t.step(dangling
      ? `done — "${out}", but ${dangling} trailing bit(s) (${sinceLeaf}) never reached a leaf: the stream is truncated`
      : `done — ${src.length} bits decoded to "${out}", no separators needed`,
      { snapshot: snap(), highlight: dangling ? {} : { done: this.root.key } });
    return t.trace();
  }

  /** encode(text) — concatenate each character's code. */
  encode(text) {
    const map = this.codes();
    let out = "";
    for (const ch of text) {
      if (!(ch in map)) throw new Error(`encode: symbol '${ch}' is not in the Huffman tree`);
      out += map[ch];
    }
    return out;
  }

  // ---- the codec view ------------------------------------------------------
  // The tree gets its own panel (a plain TreeRenderer, fed this frame's
  // `highlight`), and BELOW it three columns — text | bits | decoded text — so
  // ENCODE fills the first two and DECODE consumes the middle one and fills the
  // third. That is the round trip made literal: decode's input IS encode's
  // output, on screen, rather than a bit string the student has to retype.
  //
  // Every item carries a symbol COLOUR INDEX. The character, the bits its walk
  // emitted, the leaf that owns it and the decoded character all share it, so a
  // run of one colour in the middle column is exactly one codeword — the
  // symbol → codeword mapping, visible without reading a table.

  _codecInit() {
    this.cx = this.cx || { text: [], bits: [], out: [], ci: new Map(), idOf: new Map(), tree: null };
    return this.cx;
  }

  /** Colour indices (commonest symbol first) and the DISPLAY tree, whose keys
   *  are unique ids — highlights are keyed by `key`, and Huffman labels nodes
   *  with frequencies, which repeat. The circle shows `label` (the frequency),
   *  `sub` the symbol, `tint` its colour. */
  _codecSetup() {
    const c = this._codecInit();
    c.ci = new Map(); c.idOf = new Map(); c.tree = null; c.treeRoot = this.root;
    if (!this.root) return c;
    const leaves = [];
    (function walk(n) { if (!n) return; if (n.isLeaf) leaves.push(n); else { walk(n.left); walk(n.right); } })(this.root);
    leaves.slice()
      .sort((a, b) => b.freq - a.freq || (String(a.key) < String(b.key) ? -1 : 1))
      .forEach((n, i) => c.ci.set(String(n.key), i));
    let id = 0;
    const clone = (n) => {
      if (!n) return null;
      const d = { key: ++id, label: n.freq, size: n.size, sub: n.isLeaf ? String(n.key) : "" };
      if (n.isLeaf) d.tint = symbolColor(c.ci.get(String(n.key)));
      c.idOf.set(n, d.key);
      d.left = clone(n.left); d.right = clone(n.right);
      return d;
    };
    c.tree = clone(this.root);
    return c;
  }

  /** The setup, refreshed if the tree changed underneath it. */
  _codecCx() {
    const c = this._codecInit();
    return c.tree && c.treeRoot === this.root ? c : this._codecSetup();
  }

  _ci(ch) { return this._codecInit().ci.get(String(ch)) ?? -1; }

  /** One frame's snapshot: the three columns plus the tree the other panel
   *  draws. Items are COPIED — a frame is a still and the player scrubs
   *  backwards, so handing out the live arrays would make every earlier frame
   *  show the final state. */
  _codecFrame({ act = null, roles = ["in", "out", "out"], cur = [null, null, null],
                done = [null, null, null], partial = false } = {}) {
    const c = this._codecInit();
    const copy = (a) => a.map((o) => ({ t: o.t, ci: o.ci }));
    const col = (label, kind, items, i) => ({
      label, kind, role: roles[i], items: copy(items),
      cur: cur[i], done: done[i] ?? items.length, active: act === i,
    });
    return {
      cols: [
        col("text", "chars", c.text, 0),
        col("encoded bits", "bits", c.bits, 1),
        col("decoded text", "chars", c.out, 2),
      ],
      tree: c.tree,
      stats: this.codecStats(partial),
    };
  }

  /** The walk, as a TreeRenderer highlight: the path so far, the node we are
   *  on, the leaf that just emitted, and each traversed edge labelled with the
   *  bit it stands for. */
  _codecWalkHL(path, node, leaf, edges) {
    return {
      // a leaf that has just emitted goes GREEN (done) rather than accent
      // (cur) — the walk is over, and the colour says so
      path: path.slice(), cur: leaf ? null : (node ?? null), done: leaf ? [leaf] : [],
      edges: edges.map((e) => e.slice()),
    };
  }

  /** Sizes for THIS text, not the frequency table — what the columns show. */
  codecStats(partial = false) {
    const c = this._codecInit();
    // count only the characters this code actually covers: a symbol the tree
    // was not built for is skipped, and charging ASCII for it while Huffman
    // spends nothing would flatter the comparison
    const n = c.text.length ? c.text.filter((o) => o.ci >= 0).length : c.out.length;
    if (!n || !this.root) return null;
    const syms = Object.keys(this.codes()).length || 1;
    const fixedLen = Math.max(1, Math.ceil(Math.log2(syms)));
    return { chars: n, alphabet: syms, fixedLen, partial,
             ascii: n * 8, fixed: n * fixedLen, huffman: c.bits.length };
  }

  /** encodeCodec(text) — left column to middle. One frame per TURN of the walk,
   *  and each turn appends the bit it just decided: the tree panel shows where
   *  the walk is, the middle column shows the codeword growing under it. */
  encodeCodec(text = "cab") {
    const t = new Tracer();
    if (!this.root) { t.step("no tree — press Build first", { snapshot: null }); return t.trace(); }
    const c = this._codecCx();
    const ROLES = ["in", "out", "out"];
    // every edge is a frame and every frame copies all three columns, so the
    // cost is quadratic in the text; past this the browser stops being
    // interactive, which reads as the demo breaking rather than as a limit
    const all = [...String(text)];
    const capped = all.length > CODEC_MAX_CHARS;
    c.text = all.slice(0, CODEC_MAX_CHARS).map((ch) => (ch === " " ? SPACE : ch)).map((ch) => ({ t: ch, ci: this._ci(ch) }));
    const stepped = Math.min(c.text.length, CODEC_STEP_CHARS);
    c.bits = []; c.out = [];
    const known = this.codes();
    const rootId = c.idOf.get(this.root);
    t.step(`encode ${c.text.length} character${c.text.length === 1 ? "" : "s"} — one symbol at a time, left column to middle`
      + (capped ? ` [capped at ${CODEC_MAX_CHARS}]` : "")
      + (c.text.length > stepped ? ` [stepping the first ${stepped}, then finishing in one frame]` : ""),
      { snapshot: this._codecFrame({ act: 0, roles: ROLES, done: [0, 0, 0] }),
        highlight: {} });

    for (let i = 0; i < c.text.length; i++) {
      const ch = c.text[i].t, ci = c.text[i].ci;
      const stepping = i < stepped;   // the work continues past this; the frames stop
      const say = (msg, opts) => { if (stepping) t.step(msg, opts); };
      if (!(ch in known)) {
        say(`'${ch}' is not in this tree — a code only covers the symbols it was built for. Skipped`,
          { snapshot: this._codecFrame({ act: 0, roles: ROLES, cur: [i, null, null], done: [i, null, null], partial: true }),
            highlight: {} });
        continue;
      }
      let node = this.root, path = [rootId], code = "", edges = [];
      say(`'${ch}': is it in the tree? yes — walk from the root to its leaf, sending each turn`,
        { snapshot: this._codecFrame({ act: 0, roles: ROLES, cur: [i, null, null], done: [i, null, null], partial: true }),
          highlight: this._codecWalkHL(path, rootId, null, edges) });

      while (!node.isLeaf) {
        const parentId = c.idOf.get(node);
        const goLeft = (function has(n) { return n ? (n.isLeaf ? n.key === ch : has(n.left) || has(n.right)) : false; })(node.left);
        node = goLeft ? node.left : node.right;
        const bit = goLeft ? "0" : "1";
        code += bit;
        const nodeId = c.idOf.get(node);
        path.push(nodeId); edges.push([parentId, nodeId, bit]);
        c.bits.push({ t: bit, ci });          // the bit is appended as it is decided
        t.count("compare").count("write");
        const last = node.isLeaf;
        say(last
          ? `${goLeft ? "left" : "right"} → send ${bit} — leaf '${ch}', the walk ends: ${code} (${c.bits.length} bits so far)`
          : `${goLeft ? "left" : "right"} → send ${bit} — not a leaf yet, keep walking (${code} so far)`,
          { snapshot: this._codecFrame({ act: 1, roles: ROLES, cur: [i, c.bits.length - 1, null],
                                         done: [last ? i + 1 : i, null, null], partial: !(last && i === c.text.length - 1) }),
            highlight: this._codecWalkHL(path, nodeId, last ? nodeId : null, edges) });
      }
    }
    if (c.text.length > stepped) {
      t.step(`the remaining ${c.text.length - stepped} characters encoded the same way, without a frame each`,
        { snapshot: this._codecFrame({ act: 1, roles: ROLES }), highlight: {} });
    }
    t.step(`done — ${c.text.length} characters in ${c.bits.length} bits. Now press Decode: it reads the middle column`,
      { snapshot: this._codecFrame({ act: 1, roles: ROLES }), highlight: {} });
    return t.trace();
  }

  /** decodeCodec(bits) — middle column to right. Empty input uses the bits
   *  already on screen, which is the point: decode consumes encode. Each bit
   *  takes one step down the tree; at a leaf the character is emitted AND the
   *  run of bits that produced it takes that symbol's colour, so the codeword
   *  boundaries appear as the decode discovers them. */
  decodeCodec(bits = "") {
    const t = new Tracer();
    if (!this.root) { t.step("no tree — press Build first", { snapshot: null }); return t.trace(); }
    const c = this._codecCx();
    const ROLES = ["in", "in", "out"];
    const typed = String(bits ?? "").trim();
    const clean = typed.replace(/[^01]/g, "");
    // Decode's job is to consume what Encode produced. Only an explicit bit
    // string overrides the middle column; leftover TEXT in the box (the word
    // just encoded) is ignored rather than treated as an error.
    let note = "";
    if (clean) c.bits = clean.split("").map((b) => ({ t: b, ci: -1 }));
    else if (typed && c.bits.length) note = ` (ignoring "${typed}" — that is text; decoding the middle column)`;
    if (!c.bits.length) {
      t.step(typed
        ? `"${typed}" is not a bit string and there is nothing encoded yet — run Encode first`
        : "nothing to decode — run Encode first, or type a bit string",
        { snapshot: this._codecFrame({ act: 1, roles: ROLES }), highlight: {} });
      return t.trace();
    }
    c.out = [];
    const rootId = c.idOf.get(this.root);
    t.step(`decode ${c.bits.length} bits — middle column to right, 0 = left, 1 = right${note}`,
      { snapshot: this._codecFrame({ act: 1, roles: ROLES, done: [null, 0, 0] }), highlight: {} });

    if (this.root.isLeaf) {
      const ci = this._ci(this.root.key);
      c.out = c.bits.map(() => ({ t: String(this.root.key), ci }));
      t.step(`one symbol only — every bit is '${this.root.key}'`,
        { snapshot: this._codecFrame({ act: 2, roles: ROLES }), highlight: {} });
      return t.trace();
    }

    let node = this.root, path = [rootId], run = "", runStart = 0, edges = [];
    for (let i = 0; i < c.bits.length; i++) {
      const b = c.bits[i].t;
      const stepping = c.out.length < CODEC_STEP_CHARS;   // frames stop; decoding does not
      const say = (msg, opts) => { if (stepping) t.step(msg, opts); };
      const parentId = c.idOf.get(node);
      node = b === "0" ? node.left : node.right;
      run += b;
      t.count("compare");
      if (!node) {
        t.step(`bit ${b}: no child that way — these bits do not belong to this tree`,
          { snapshot: this._codecFrame({ act: 1, roles: ROLES, cur: [null, i, null], done: [null, i, null] }),
            highlight: this._codecWalkHL(path, parentId, null, edges) });
        return t.trace();
      }
      const nodeId = c.idOf.get(node);
      path.push(nodeId); edges.push([parentId, nodeId, b]);
      if (!node.isLeaf) {
        say(`bit ${b} → go ${b === "0" ? "left" : "right"} — not a leaf, read another bit (${run} so far)`,
          { snapshot: this._codecFrame({ act: 1, roles: ROLES, cur: [null, i, null], done: [null, i, null] }),
            highlight: this._codecWalkHL(path, nodeId, null, edges) });
        continue;
      }
      // leaf: emit the character, and colour the run of bits that produced it
      const sym = String(node.key), ci = this._ci(sym);
      for (let k = runStart; k <= i; k++) c.bits[k].ci = ci;
      c.out.push({ t: sym, ci });
      t.count("write");
      say(`bit ${b} → go ${b === "0" ? "left" : "right"} — a leaf, so the codeword ends: ${run} = '${sym}', emitted, back to the root`,
        { snapshot: this._codecFrame({ act: 2, roles: ROLES, cur: [null, i, c.out.length - 1], done: [null, i + 1, null] }),
          highlight: this._codecWalkHL(path, nodeId, nodeId, edges) });
      node = this.root; path = [rootId]; run = ""; edges = []; runStart = i + 1;
    }
    if (c.out.length > CODEC_STEP_CHARS) {
      t.step(`the remaining ${c.out.length - CODEC_STEP_CHARS} characters decoded the same way, without a frame each`,
        { snapshot: this._codecFrame({ act: 2, roles: ROLES }), highlight: {} });
    }
    const dangling = run.length;
    t.step(dangling
      ? `done — "${c.out.map((o) => o.t).join("")}", but ${dangling} trailing bit(s) never reached a leaf: truncated`
      : `done — ${c.bits.length} bits back to "${c.out.map((o) => o.t).join("")}", no separators needed`,
      { snapshot: this._codecFrame({ act: 2, roles: ROLES }), highlight: {} });
    return t.trace();
  }

  /** Build for the codec demo: make the tree, leave the columns empty — the
   *  text to encode lives in the (editable) input panel, so Build must not
   *  touch it. */
  buildCodec(raw, keys) {
    this.buildInput(raw, keys);            // trace discarded — this demo is about USING the code
    this.cx = { text: [], bits: [], out: [], ci: new Map(), idOf: new Map(), tree: null };
    this._codecSetup();
    const t = new Tracer();
    t.step(`code built over ${Object.keys(this.codes()).length} symbols — type in the text panel, then Encode`,
      { snapshot: this._codecFrame({ act: 0 }), highlight: {} });
    return t.trace();
  }

  /** decode(bits) — walk the tree per bit, emitting a character at each leaf. */
  decode(bits) {
    if (!this.root) return "";
    if (this.root.isLeaf) return bits.split("").map(() => this.root.key).join(""); // degenerate 1-symbol tree
    let out = "", node = this.root;
    for (const b of bits) {
      node = b === "0" ? node.left : node.right;
      if (!node) throw new Error("decode: invalid bit string for this tree");
      if (node.isLeaf) { out += node.key; node = this.root; }
    }
    return out;
  }

  /** A short summary: symbol count + frequency-weighted average code length. */
  inorder() {
    if (!this.root) return "0 symbols";
    const codeMap = this.codes();
    const freqOf = {};
    (function walk(n) { if (!n) return; if (n.isLeaf) freqOf[n.key] = n.freq; else { walk(n.left); walk(n.right); } })(this.root);
    const syms = Object.keys(codeMap);
    let totalFreq = 0, totalBits = 0;
    for (const s of syms) { const f = freqOf[s] || 0; totalFreq += f; totalBits += f * codeMap[s].length; }
    const avg = totalFreq ? totalBits / totalFreq : 0;
    return `${syms.length} symbols · avg ${avg.toFixed(2)} bits/symbol`;
  }
}
