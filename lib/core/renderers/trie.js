// CSS 343 unified library — core/renderers/trie.js
// Renderer for the TRIE's n-ary shape. structures/trie.js snapshots the trie
// in left-child/right-sibling (LCRS) binary form so the generic TreeRenderer
// can draw it — but that view draws sibling links as if they were child edges
// and doesn't read as a prefix tree. This renderer DECODES the LCRS form back
// into the real n-ary tree: root at top center, one drawn edge per character,
// children ordered alphabetically, subtree-leaf-proportional layout (like
// ForestRenderer). Node labels show the node's OWN character (the last char of
// its prefix; root shows ∅) plus the trailing • word marker, so "each edge is
// one character" is literally what you see.
//
// Highlights use the same keys the traces emit (the full prefix + optional •):
// cur / path / appear / done / danger — identical semantics to TreeRenderer.
// Zoomable: the whole frame scales uniformly (bitmap grows, ctx.scale redraws
// at base coordinates — crisp text, no blur); viewport.js drives `zoom`.

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0",
};

const asSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  (Array.isArray(v) ? v : [v]).forEach((x) => s.add(x));
  return s;
};

export class TrieRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{R?:number, rowH?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.R = opts.R ?? 15;
    this.rowH = opts.rowH ?? 56;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    if (!snapshot) return;
    ctx.save(); ctx.scale(z, z);
    const W = this.baseW, H = this.baseH; // draw in base coordinates — scale does the rest

    // decode LCRS: a node's children = its `left`, then that child's `right` chain
    const kids = (n) => { const out = []; let c = n.left; while (c) { out.push(c); c = c.right; } return out; };
    const leaves = (n) => { const k = kids(n); return k.length ? k.reduce((s, c) => s + leaves(c), 0) : 1; };

    const pos = new Map();   // node → {x: 0..1, depth}
    let maxDepth = 0;
    const place = (n, lo, hi, depth) => {
      pos.set(n, { x: (lo + hi) / 2, depth });
      maxDepth = Math.max(maxDepth, depth);
      const k = kids(n);
      const total = leaves(n);
      let at = lo;
      for (const c of k) {
        const w = (leaves(c) / total) * (hi - lo);
        place(c, at, at + w, depth + 1);
        at += w;
      }
    };
    place(snapshot, 0, 1, 0);

    const padX = 28, padY = 26;
    const px = (p) => padX + p.x * (W - 2 * padX);
    const py = (p) => padY + p.depth * Math.min(this.rowH, (H - 2 * padY) / Math.max(maxDepth, 1));

    const cur = asSet(hl.cur), path = asSet(hl.path), appear = asSet(hl.appear),
      done = asSet(hl.done), danger = asSet(hl.danger);

    // the node's display label: its own character (last char of the prefix) + • marker
    const label = (n) => {
      const raw = String(n.key).replace(/•$/, "");
      const ch = raw === "∅" || raw === "" ? "∅" : raw[raw.length - 1];
      return ch + (n.word ? "•" : "");
    };

    // edges (parent → child), drawn first
    ctx.lineWidth = 1.7; ctx.strokeStyle = COLORS.line;
    const walkEdges = (n) => {
      const p = pos.get(n);
      for (const c of kids(n)) {
        const q = pos.get(c);
        ctx.beginPath(); ctx.moveTo(px(p), py(p)); ctx.lineTo(px(q), py(q)); ctx.stroke();
        walkEdges(c);
      }
    };
    walkEdges(snapshot);

    // nodes
    const walkNodes = (n) => {
      const p = pos.get(n);
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = n.word ? 3 : 2;
      if (path.has(n.key)) { fill = "#f3f0ff"; ring = COLORS.accent; text = "#3a2f7a"; }
      if (appear.has(n.key) || done.has(n.key)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (danger.has(n.key)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }
      if (cur.has(n.key)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; rw = 3; }
      ctx.beginPath(); ctx.arc(px(p), py(p), this.R, 0, 2 * Math.PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
      ctx.fillStyle = text; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label(n), px(p), py(p));
      kids(n).forEach(walkNodes);
    };
    walkNodes(snapshot);
    ctx.restore();
  }

  /** Text alternative for a snapshot — the stored words (nodes whose key ends
   *  with the • marker), which fully determine the trie. Player.js puts this
   *  on the canvas's aria-label. */
  describe(snapshot) {
    if (!snapshot) return "An empty trie.";
    const words = [];
    (function walk(n) {
      const k = String(n.key);
      if (k.endsWith("•")) words.push(k.slice(0, -1));
      let c = n.left;
      while (c) { walk(c); c = c.right; }
    })(snapshot);
    return words.length
      ? `A trie storing ${words.length} ${words.length > 1 ? "words" : "word"}: ${words.join(", ")}. ` +
        "One character per edge; shared prefixes share a path from the root."
      : "A trie with no complete words stored yet.";
  }
}
