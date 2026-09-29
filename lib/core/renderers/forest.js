// CSS 343 unified library — core/renderers/forest.js
// Renderer for a PARENT-POINTER FOREST (union-find): the snapshot is the same
// flat parent[] array ArrayRenderer draws (cell i = parent[i]; parent[i] === i
// marks a root) — this view draws what that array ENCODES: one tree per set,
// roots along the top, children hanging below their parent, each edge a
// child→parent link. Highlights are the same index-keyed sets ArrayRenderer
// reads (active/compare/done/danger), so one trace drives both views.
// Zoomable: the whole frame scales uniformly (bitmap grows, ctx.scale redraws
// at base coordinates — crisp text, no blur); viewport.js drives `zoom`.

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0", faint: "#8a93a6",
};

const asSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  (Array.isArray(v) ? v : [v]).forEach((x) => s.add(x));
  return s;
};

export class ForestRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{R?:number, rowH?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.R = opts.R ?? 16;
    this.rowH = opts.rowH ?? 56;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const parent = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    const n = parent.length;
    if (!n) return;
    ctx.save(); ctx.scale(z, z);
    const W = this.baseW, H = this.baseH; // draw in base coordinates — scale does the rest

    // children lists + roots (in index order, so trees don't jump around)
    const children = Array.from({ length: n }, () => []);
    const roots = [];
    for (let i = 0; i < n; i++) {
      if (parent[i] === i) roots.push(i);
      else children[parent[i]].push(i);
    }

    // layout: each subtree gets a horizontal span proportional to its leaf count
    const leaves = (v) => children[v].length ? children[v].reduce((s, c) => s + leaves(c), 0) : 1;
    const pos = {};
    let cursor = 0;
    const total = roots.reduce((s, r) => s + leaves(r), 0) || 1;
    const place = (v, lo, hi, depth) => {
      pos[v] = { x: (lo + hi) / 2, y: depth };
      let at = lo;
      for (const c of children[v]) {
        const w = (leaves(c) / leaves(v)) * (hi - lo);
        place(c, at, at + w, depth + 1);
        at += w;
      }
    };
    for (const r of roots) {
      const w = leaves(r) / total;
      place(r, cursor, cursor + w, 0);
      cursor += w;
    }

    const maxDepth = Math.max(...Object.values(pos).map((p) => p.y), 1);
    const padX = 26, padY = 26;
    const px = (p) => padX + p.x * (W - 2 * padX);
    const py = (p) => padY + (p.y / Math.max(maxDepth, 1)) * Math.min(H - 2 * padY, maxDepth * this.rowH);

    const active = asSet(hl.active), compare = asSet(hl.compare),
      done = asSet(hl.done), danger = asSet(hl.danger);

    // edges: child → parent
    ctx.lineWidth = 1.7; ctx.strokeStyle = COLORS.line;
    for (let i = 0; i < n; i++) {
      if (parent[i] === i) continue;
      const c = pos[i], p = pos[parent[i]];
      ctx.beginPath(); ctx.moveTo(px(c), py(c)); ctx.lineTo(px(p), py(p)); ctx.stroke();
    }

    // nodes (roots get a heavier ring — they ARE the set identity)
    for (let i = 0; i < n; i++) {
      const p = pos[i];
      const isRoot = parent[i] === i;
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = isRoot ? 3 : 2;
      if (compare.has(i)) { fill = "#fff4e6"; ring = "#e8590c"; text = "#a8480a"; }
      if (done.has(i)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; }
      if (active.has(i)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; }
      if (danger.has(i)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; }
      ctx.beginPath(); ctx.arc(px(p), py(p), this.R, 0, 2 * Math.PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
      ctx.fillStyle = text; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i), px(p), py(p));
    }
    ctx.restore();
  }

  /** Text alternative for a snapshot — roots and every parent link, so a
   *  screen-reader user can reconstruct the forest. Player.js puts this on
   *  the canvas's aria-label. */
  describe(snapshot) {
    const p = Array.isArray(snapshot) ? snapshot : (snapshot?.array ?? []);
    if (!p.length) return "An empty union-find forest.";
    const roots = p.map((v, i) => (v === i ? i : null)).filter((v) => v !== null);
    const links = p.map((v, i) => (v === i ? null : `${i} points to ${v}`)).filter(Boolean);
    return `A union-find forest over ${p.length} elements, 0 to ${p.length - 1}. ` +
      `Roots: ${roots.join(", ")}.` +
      (links.length ? ` Parent links: ${links.join("; ")}.` : " Every element is its own singleton root.");
  }
}
