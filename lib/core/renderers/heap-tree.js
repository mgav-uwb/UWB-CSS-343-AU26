// CSS 343 unified library — core/renderers/heap-tree.js
// ONE renderer for an array-backed COMPLETE binary tree (heaps stored 1-indexed,
// a[0] unused, parent k>>1, children 2k/2k+1 — see structures/heap.js; this
// matches the L06 lecture convention). Slot 0 of the snapshot is skipped — only
// ArrayRenderer shows it (as "·"). Draws the SAME flat-array snapshot as
// ArrayRenderer, and reads the SAME index-keyed highlight sets
// (active/compare/pointers/done/danger) — heaps allow duplicate values, so
// highlighting by array index (not by key, unlike TreeRenderer) is the only safe
// identity. Position is computed directly from the index: the root gets the full
// width, then each child recursively bisects its parent's horizontal span and
// drops one row — no linked node structure needed.

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e", edge: "#e8590c",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0", faint: "#8a93a6",
};

const asSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  (Array.isArray(v) ? v : [v]).forEach((x) => s.add(x));
  return s;
};

import { sizeCanvas } from "../render-config.js";

const parentOf = (k) => k >> 1;
const leftOf = (k) => 2 * k;
const rightOf = (k) => 2 * k + 1;

export class HeapTreeRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{R?:number,M?:number,TOP?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.R = opts.R ?? 16; this.M = opts.M ?? 16; this.TOP = opts.TOP ?? 26;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** Canvas-space hit test: the array index at (px,py), or null. */
  nodeAt(px, py) {
    const R = this._R ?? this.R;
    const rr = (R + 4) * (R + 4);
    for (const idx in (this._pos || {})) {
      const p = this._pos[idx];
      if ((p.x - px) * (p.x - px) + (p.y - py) * (p.y - py) <= rr) return +idx;
    }
    return null;
  }

  /** @param {Array|{array:Array}} snapshot @param {Object} [hl] highlight sets by index, plus hl.pointers */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const a = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    const m = a.length - 1; // last valid index; keys live in a[1..m], a[0] unused
    if (m < 1) return;

    const depth = Math.floor(Math.log2(m)); // deepest row index (node k sits at row ⌊log₂k⌋)
    // autofit spacing on the BASE canvas (whole heap always visible),
    // magnified by the user's zoom — capped at the spacing that reaches
    // full-size nodes. Zoomed in, the canvas grows and the panel pans.
    const span0 = (this.baseW - 2 * this.M) / Math.pow(2, depth);
    const dy0 = Math.min(64, (this.baseH - this.TOP - 20) / Math.max(1, depth));
    const fullSpan = 2 * (this.R + 3);
    const span = Math.min(span0 * this.zoom, Math.max(span0, fullSpan));
    const dy = Math.min(dy0 * this.zoom, Math.max(dy0, 64));
    sizeCanvas(this, 2 * this.M + span * Math.pow(2, depth), this.TOP + 20 + dy * Math.max(1, depth));
    ctx.clearRect(0, 0, this.W, this.H);

    // position every index by recursively bisecting the horizontal span — a
    // node's slot is fixed by its index alone, so an incomplete last row
    // (fewer than 2^depth leaves) needs no special-casing
    const pos = {};
    (function place(i, xMin, xMax, d) {
      if (i > m) return;
      pos[i] = { x: (xMin + xMax) / 2, y: this.TOP + d * dy };
      place.call(this, leftOf(i), xMin, (xMin + xMax) / 2, d + 1);
      place.call(this, rightOf(i), (xMin + xMax) / 2, xMax, d + 1);
    }).call(this, 1, this.M, this.W - this.M, 0);
    this._pos = pos;

    // shrink the node radius as the deepest row gets crowded
    const leafSpan = (this.W - 2 * this.M) / Math.pow(2, depth);
    const R = this._R = Math.max(2, Math.min(this.R, leafSpan / 2 - 3, dy / 2 - 3));

    const compare = asSet(hl.compare), active = asSet(hl.active),
      done = asSet(hl.done), danger = asSet(hl.danger);
    const pointers = hl.pointers || {};

    // edges
    for (let i = 2; i <= m; i++) {
      const p = pos[parentOf(i)], q = pos[i];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.lineWidth = 1.7; ctx.strokeStyle = COLORS.line; ctx.stroke();
    }

    // nodes — below legibility the value text is dropped entirely (the heap
    // SHAPE is the lesson at that scale — zoom in to read values)
    const showText = R >= 5;
    const fontPx = Math.round(14 * (R / this.R));
    for (let i = 1; i <= m; i++) {
      const p = pos[i];
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 2;
      if (done.has(i)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (compare.has(i)) { fill = "#fff5e9"; ring = COLORS.edge; text = "#9a4200"; rw = 2.5; }
      if (danger.has(i)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }
      if (active.has(i)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; rw = 3; }
      ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
      if (showText) {
        ctx.fillStyle = text; ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(a[i]), p.x, p.y + 0.5);
      }
    }

    // pointer labels — a small tag above the node (mirrors ArrayRenderer's
    // arrow-above-cell, adapted to a node instead of a column)
    const byIndex = {};
    Object.keys(pointers).forEach((k) => {
      const v = pointers[k];
      if (v == null || v < 1 || v > m) return;
      (byIndex[v] ||= []).push(k);
    });
    Object.entries(byIndex).forEach(([idxStr, labels]) => {
      const p = pos[+idxStr];
      ctx.fillStyle = COLORS.accent; ctx.font = "700 11px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(labels.join(","), p.x, p.y - R - 3);
    });
  }

  /** Text alternative for a snapshot — the 1-indexed heap array in level
   *  order, which fully determines the complete tree. Player.js puts this
   *  on the canvas's aria-label. */
  describe(snapshot) {
    const a = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    const vals = a.slice(1);
    if (!vals.length) return "An empty heap.";
    return `A complete binary tree drawn from the 1-indexed heap array a[1..${vals.length}], ` +
      `level by level, left to right: ${vals.join(", ")}. ` +
      "The parent of a[k] is a[k divided by 2]; its children are a[2k] and a[2k+1].";
  }
}
