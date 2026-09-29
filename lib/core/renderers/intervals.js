// CSS 343 unified library — core/renderers/intervals.js
// Renderer for INTERVAL problems (L12 greedy): activity selection and interval
// partitioning. snapshot = {iv:[{name,s,f,room?}], tmin, tmax, counts?, picked?,
// sweep?} — one horizontal BAR per interval on a shared time axis, which is the
// whole point: overlap is a vertical stack you can count by eye, and that count
// IS the room lower bound.
//   room   — integer ≥ 0: the bar is tinted with that room's colour and tagged R1/R2/…
//   picked — set of names chosen by activity selection: those bars go green, the
//            rest fade (so "2 of 5" reads instantly)
//   counts — per-unit overlap tallies drawn as a strip under the axis, with the
//            PEAK column boxed (the lower-bound argument, visible)
//   sweep  — a vertical line at time t (the event currently being placed)
// Highlights: hl.active / hl.done / hl.faded / hl.danger, all by interval NAME.
// Zoomable like the other renderers (viewport.js drives `zoom`).

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e", edge: "#e8590c",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0", faint: "#8a93a6",
};

// one colour per room — enough for any instance a slide will show
const ROOMS = [
  { fill: "#ede9ff", ring: "#7c5cff", text: "#4c31c9" },
  { fill: "#e7f7ee", ring: "#0a7d4d", text: "#0a5c39" },
  { fill: "#fff5e9", ring: "#e8590c", text: "#9a4200" },
  { fill: "#e9f2ff", ring: "#1f6feb", text: "#14487d" },
  { fill: "#fdeaea", ring: "#b3261e", text: "#8a1c15" },
];

const asSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  (Array.isArray(v) ? v : [v]).forEach((x) => s.add(String(x)));
  return s;
};

export class IntervalRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{rowH?:number, pad?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.rowH = opts.rowH ?? 26;
    this.pad = opts.pad ?? 16;
    this.labelW = opts.labelW ?? 26;   // room in the gutter for the interval name
    this.zoom = 1;
    this.baseW = this.W; this.baseH = this.H;
  }

  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl];
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    const iv = snapshot?.iv ?? [];
    if (!iv.length) return;
    ctx.save(); ctx.scale(z, z);
    const W = this.baseW, H = this.baseH, pad = this.pad;

    const tmin = snapshot.tmin ?? Math.min(...iv.map((v) => v.s));
    const tmax = snapshot.tmax ?? Math.max(...iv.map((v) => v.f));
    const counts = snapshot.counts ?? null;
    const picked = snapshot.picked ? asSet(snapshot.picked) : null;
    const active = asSet(hl.active), done = asSet(hl.done),
      faded = asSet(hl.faded), danger = asSet(hl.danger);

    // the count strip needs a wider gutter than a one-letter interval name
    const left = pad + (counts ? Math.max(this.labelW, 54) : this.labelW);
    const right = W - pad;
    const span = Math.max(1, tmax - tmin);
    const x = (t) => left + ((t - tmin) / span) * (right - left);

    // vertical budget: bars, then the axis, then (optionally) the count strip
    const stripH = counts ? 22 : 0;
    const axisY = H - pad - stripH - 14;
    const barsTop = pad + 12;
    const rowH = Math.min(this.rowH, Math.max(14, (axisY - barsTop - 6) / iv.length));

    // ---- time axis + gridlines ------------------------------------------------
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(left, axisY); ctx.lineTo(right, axisY); ctx.stroke();
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let t = tmin; t <= tmax; t++) {
      const px = x(t);
      ctx.strokeStyle = "#eef0f4";
      ctx.beginPath(); ctx.moveTo(px, barsTop - 6); ctx.lineTo(px, axisY); ctx.stroke();
      ctx.strokeStyle = COLORS.line;
      ctx.beginPath(); ctx.moveTo(px, axisY); ctx.lineTo(px, axisY + 4); ctx.stroke();
      ctx.fillStyle = COLORS.faint;
      ctx.fillText(String(t), px, axisY + 6);
    }

    // ---- the sweep line (the event being placed) ------------------------------
    if (snapshot.sweep != null) {
      ctx.save();
      ctx.strokeStyle = COLORS.edge; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x(snapshot.sweep), barsTop - 8);
      ctx.lineTo(x(snapshot.sweep), axisY); ctx.stroke();
      ctx.restore();
    }

    // ---- one bar per interval -------------------------------------------------
    iv.forEach((v, i) => {
      const y = barsTop + i * rowH;
      const h = Math.max(10, rowH - 6);
      const x0 = x(v.s), x1 = x(v.f);
      const name = String(v.name);

      let sty = { fill: "#f6f8fb", ring: COLORS.dim, text: COLORS.ink };
      if (v.room != null) sty = ROOMS[v.room % ROOMS.length];
      if (picked) sty = picked.has(name)
        ? { fill: "#e7f7ee", ring: COLORS.green, text: "#0a5c39" }
        : { fill: "#fafbfc", ring: "#dfe3ea", text: "#b6bcc7" };
      if (done.has(name)) sty = { fill: "#e7f7ee", ring: COLORS.green, text: "#0a5c39" };
      if (faded.has(name)) sty = { fill: "#fafbfc", ring: "#dfe3ea", text: "#b6bcc7" };
      if (danger.has(name)) sty = { fill: "#fdeaea", ring: COLORS.red, text: COLORS.red };
      const isActive = active.has(name);

      // the bar
      const r = Math.min(6, h / 2);
      ctx.beginPath();
      ctx.moveTo(x0 + r, y); ctx.lineTo(x1 - r, y);
      ctx.quadraticCurveTo(x1, y, x1, y + r);
      ctx.lineTo(x1, y + h - r); ctx.quadraticCurveTo(x1, y + h, x1 - r, y + h);
      ctx.lineTo(x0 + r, y + h); ctx.quadraticCurveTo(x0, y + h, x0, y + h - r);
      ctx.lineTo(x0, y + r); ctx.quadraticCurveTo(x0, y, x0 + r, y);
      ctx.closePath();
      ctx.fillStyle = isActive ? sty.ring : sty.fill; ctx.fill();
      ctx.lineWidth = isActive ? 3 : 1.6; ctx.strokeStyle = sty.ring; ctx.stroke();

      // name in the left gutter
      ctx.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = isActive ? sty.ring : sty.text;
      ctx.fillText(name, left - 6, y + h / 2);

      // room tag inside the bar (only when assigned and there is space)
      if (v.room != null && x1 - x0 > 34) {
        ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = isActive ? "#fff" : sty.text;
        ctx.fillText(`R${v.room + 1}`, x0 + 6, y + h / 2);
      }
    });

    // ---- overlap strip: the lower bound, countable -----------------------------
    if (counts) {
      const y = axisY + 20;
      const peak = Math.max(...counts.map((c) => c.n));
      ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textBaseline = "middle";
      counts.forEach((c) => {
        const x0 = x(c.t), x1 = x(c.t + 1);
        const isPeak = c.n === peak && peak > 0;
        if (isPeak) {
          ctx.fillStyle = "#fff5e9"; ctx.fillRect(x0 + 1, y - 9, x1 - x0 - 2, 18);
          ctx.strokeStyle = COLORS.edge; ctx.lineWidth = 1.5;
          ctx.strokeRect(x0 + 1, y - 9, x1 - x0 - 2, 18);
        }
        ctx.textAlign = "center";
        ctx.fillStyle = isPeak ? "#9a4200" : COLORS.faint;
        ctx.fillText(String(c.n), (x0 + x1) / 2, y);
      });
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "right"; ctx.fillStyle = COLORS.faint;
      ctx.fillText("overlap", left - 6, y);
    }

    ctx.restore();
  }
}
