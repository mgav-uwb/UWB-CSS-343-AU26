// CSS 343 unified library — core/renderers/recurrence.js
// The recursion tree as a LEVEL SUM: one row per level, each showing how many
// subproblems it holds, how big they are, and a bar whose length is that
// level's total cost. Stacked, the bars ARE the geometric series the master
// theorem reads — they shrink (the root wins), stay flat (every level ties,
// so the depth multiplies in the log), or grow (the leaves win). The case is a
// consequence you can see rather than a rule to memorise.
//
// snapshot = {
//   levels: [{i, count, size, cost, leaf}],   // only the levels revealed so far
//   allLevels, n, a, b, f, crit, total, note,
// }
// highlight = { level?, ratio?, verdict? }

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", edge: "#e8590c",
  ink: "#1a1c22", dim: "#9aa3b5", faint: "#8a93a6", line: "#e3e7ee",
};

const fmt = (x) => (x >= 100000 ? x.toExponential(1).replace("e+", "e")
  : Number(x.toFixed(x < 10 ? 1 : 0)).toLocaleString());

export class RecurrenceRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{rowH?:number, pad?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.rowH = opts.rowH ?? 26;
    this.pad = opts.pad ?? 12;
    this.zoom = 1;
    this.baseW = this.W; this.baseH = this.H;
  }

  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl];
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    if (!snapshot || !Array.isArray(snapshot.levels)) return;
    ctx.save(); ctx.scale(z, z);

    const W = this.baseW, pad = this.pad;
    const rows = snapshot.allLevels || snapshot.levels.length || 1;
    const rowH = Math.min(this.rowH, (this.baseH - 54) / Math.max(1, rows));
    const labelW = 156;                       // "level 4 · 4,096×f(4)" — the widest real label
    const barX = pad + labelW;
    const barW = W - barX - pad - 92;         // room for the cost at the right
    const maxCost = Math.max(...snapshot.levels.map((l) => l.cost), 1e-9);

    // header: the recurrence and its critical exponent
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(`T(n) = ${snapshot.a}T(n/${snapshot.b}) + ${snapshot.f}`, pad, pad + 6);
    ctx.font = "600 12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = COLORS.faint;
    ctx.fillText(`leaf work n^${snapshot.crit}   ·   n = ${fmt(snapshot.n)}`, pad + 232, pad + 6);

    const top = pad + 24;
    snapshot.levels.forEach((l) => {
      const y = top + l.i * rowH + rowH / 2;
      const on = hl.level === l.i;
      // the row label
      ctx.font = `${on ? 700 : 600} 11px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = on ? COLORS.accent : l.leaf ? COLORS.green : COLORS.faint;
      ctx.textAlign = "left";
      ctx.fillText(l.leaf ? `leaves · ${fmt(l.count)}×1` : `level ${l.i} · ${fmt(l.count)}×f(${fmt(l.size)})`, pad, y);
      // the bar: this level's total cost
      const w = Math.max(2, (l.cost / maxCost) * barW);
      ctx.fillStyle = on ? COLORS.accent : l.leaf ? "#cfe9dc" : "#ded7ff";
      ctx.beginPath(); ctx.roundRect(barX, y - rowH * 0.32, w, rowH * 0.64, 3); ctx.fill();
      if (on) { ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 1.5; ctx.stroke(); }
      // the cost, right of the bar
      ctx.font = `${on ? 700 : 600} 11px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = on ? COLORS.accent : COLORS.ink;
      ctx.fillText(fmt(l.cost), barX + w + 8, y);
    });

    // footer: running total, and the verdict once it is known
    const fy = top + rows * rowH + 14;
    ctx.font = "700 12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = COLORS.ink; ctx.textAlign = "left";
    ctx.fillText(`Σ levels = ${fmt(snapshot.total)}`, pad, fy);
    if (snapshot.note) {
      ctx.font = "600 12px ui-monospace, Menlo, monospace";
      ctx.fillStyle = hl.verdict ? COLORS.green : COLORS.edge;
      ctx.fillText(snapshot.note, pad + 132, fy);
    }
    ctx.restore();
  }

  /** Text alternative — the level sum in words. */
  describe(snap) {
    if (!snap?.levels) return "A recursion tree level sum.";
    const ls = snap.levels;
    return `Recursion tree for T(n) = ${snap.a}T(n/${snap.b}) + ${snap.f}, n = ${snap.n}. `
      + ls.map((l) => `level ${l.i}: ${fmt(l.count)} subproblems of size ${fmt(l.size)}, cost ${fmt(l.cost)}`).join("; ")
      + `. Total so far ${fmt(snap.total)}.` + (snap.note ? ` ${snap.note}` : "");
  }
}
