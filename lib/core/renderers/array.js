// CSS 343 unified library — core/renderers/array.js
// ONE renderer for every array-shaped structure (sorting, heaps-as-array, hash
// tables, DP tables). It draws a snapshot = a plain array of values (or
// {array:[...]}) and applies a highlight set by INDEX. Two layouts share the
// same highlight language: 'cells' (a row of boxes, value in the box, index
// printed below) and 'bars' (a bar chart, value + index printed below).
// Pointers (i, j, lo, hi, ...) are drawn as small labeled markers with a
// downward arrow above the cell they reference — several pointers on the same
// index stack their labels.

import { sizeCanvas } from "../render-config.js";

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

export class ArrayRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{cell?:number, mode?:('cells'|'bars'), gap?:number, pointers?:boolean}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.cell = opts.cell ?? 40;
    this.mode = opts.mode ?? "cells";
    this.gap = opts.gap ?? 6;
    this.pointers = opts.pointers ?? true; // false → no pointer headroom (tighter rows)
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** @param {Array|{array:Array, subLabels?:Array}} snapshot @param {Object} [hl] highlight sets by index, plus hl.pointers
   *  `subLabels` replaces the index printed under each cell — for rows whose
   *  position is not the point (Huffman's symbol:frequency list, where the
   *  cell holds the frequency and the label under it is the symbol). */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const a = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    const subs = Array.isArray(snapshot) ? null : (snapshot?.subLabels ?? null);
    const subOf = (i) => String(subs ? (subs[i] ?? "") : i);
    const n = a.length;
    if (!n) {
      // never leave a bare white box — say the row is empty
      ctx.fillStyle = "#9aa3b5"; ctx.font = "500 12px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("(empty)", this.W / 2, this.H / 2);
      return;
    }

    const compare = asSet(hl.compare), active = asSet(hl.active),
      done = asSet(hl.done), danger = asSet(hl.danger);
    const pointers = hl.pointers || {};

    const bars = this.mode === "bars";
    const TOP = this.pointers ? 34 : 10; // headroom for pointer markers (opt-out for pointer-free rows)
    const BOTTOM = bars ? 34 : 18; // room for value+index labels (bars) or just index (cells)
    const M = 16;              // side margin
    const gap = this.gap;

    // autofit: shrink cells so the WHOLE row always fits the base canvas —
    // the user's zoom magnifies back up (capped at natural cell size);
    // zoomed in, the canvas grows and the panel pans
    const cell0 = Math.max(2, Math.min(this.cell, (this.baseW - 2 * M - (n - 1) * gap) / n));
    const cell = Math.min(this.cell, cell0 * this.zoom);
    sizeCanvas(this, 2 * M + n * cell + (n - 1) * gap, this.baseH);
    ctx.clearRect(0, 0, this.W, this.H);
    // fonts track the cell; below legibility the labels are dropped entirely
    // (the row's color pattern is the lesson at that scale — zoom in to read)
    const showText = cell >= 9;
    const valueFontPx = Math.min(bars ? 11 : 14, Math.round(cell * 0.45));
    const indexFontPx = Math.min(10, Math.round(cell * 0.32));
    // an explicit subLabel is meaningful (Huffman's symbol); an index is not
    const subFontPx = Math.min(14, Math.round(cell * 0.42));
    const totalW = n * cell + (n - 1) * gap;
    const startX = (this.W - totalW) / 2;
    const availH = Math.max(4, this.H - TOP - BOTTOM);

    const stateColors = (i) => {
      let fill = bars ? "#e4e7ee" : "#fff", ring = COLORS.dim, text = COLORS.ink;
      if (done.has(i)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; }
      if (compare.has(i)) { fill = "#fff5e9"; ring = COLORS.edge; text = "#9a4200"; }
      if (active.has(i)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; }
      if (danger.has(i)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; }
      return { fill, ring, text };
    };

    if (bars) {
      const nums = a.map(Number);
      const maxVal = Math.max(1, ...nums.map((v) => Math.abs(v) || 0));
      const baseline = TOP + availH;
      for (let i = 0; i < n; i++) {
        const x = startX + i * (cell + gap);
        const { fill, ring, text } = stateColors(i);
        const h = Math.max(2, (Math.abs(nums[i]) / maxVal) * availH);
        const y = baseline - h;
        ctx.beginPath(); ctx.rect(x, y, cell, h);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke();

        if (showText) {
          ctx.fillStyle = text; ctx.font = `600 ${valueFontPx}px ui-monospace, Menlo, monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(String(a[i]), x + cell / 2, baseline + 4);

          ctx.fillStyle = subs ? COLORS.ink : COLORS.faint;
          ctx.font = `${subs ? 700 : 500} ${subs ? subFontPx : indexFontPx}px ui-monospace, Menlo, monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(subOf(i), x + cell / 2, baseline + 18);
        }
      }
    } else {
      const side = Math.min(cell, availH);
      const rectY = TOP + (availH - side) / 2;
      for (let i = 0; i < n; i++) {
        const colX = startX + i * (cell + gap);
        const rectX = colX + (cell - side) / 2;
        const { fill, ring, text } = stateColors(i);
        ctx.beginPath(); ctx.rect(rectX, rectY, side, side);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke();

        if (showText) {
          ctx.fillStyle = text; ctx.font = `600 ${valueFontPx}px system-ui, sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(a[i]), rectX + side / 2, rectY + side / 2 + 0.5);

          ctx.fillStyle = subs ? COLORS.ink : COLORS.faint;
          ctx.font = `${subs ? 700 : 500} ${subs ? subFontPx : indexFontPx}px ui-monospace, Menlo, monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(subOf(i), colX + cell / 2, rectY + side + 4);
        }
      }
    }

    // pointer markers: label(s) + downward arrow, stacked above the cell
    const byIndex = {};
    Object.keys(pointers).forEach((k) => {
      const v = pointers[k];
      if (v == null || v < 0 || v >= n) return;
      (byIndex[v] ||= []).push(k);
    });
    const lineH = 12;
    Object.entries(byIndex).forEach(([idxStr, labels]) => {
      const idx = Number(idxStr);
      const x = startX + idx * (cell + gap) + cell / 2;
      labels.forEach((lab, k) => {
        ctx.fillStyle = COLORS.accent;
        ctx.font = "700 11px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(lab, x, 2 + k * lineH);
      });
      const arrowTop = 2 + labels.length * lineH;
      const arrowBottom = TOP - 2;
      ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, arrowTop); ctx.lineTo(x, arrowBottom); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 4, arrowBottom - 5);
      ctx.lineTo(x + 4, arrowBottom - 5);
      ctx.lineTo(x, arrowBottom);
      ctx.closePath();
      ctx.fillStyle = COLORS.accent; ctx.fill();
    });
  }

  /** Text alternative for a snapshot — the full value list, so a screen-reader
   *  user can reconstruct the row. Player.js puts this on the aria-label. */
  describe(snapshot) {
    const a = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    if (!a.length) return "An empty array.";
    const vals = a.map((v) => (v == null || v === "" ? "blank" : String(v)));
    return `An array of ${a.length} values, indices 0 to ${a.length - 1}: ${vals.join(", ")}.`;
  }
}
