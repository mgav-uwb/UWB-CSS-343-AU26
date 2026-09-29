// CSS 343 unified library — core/renderers/chain.js
// Renderer for SEPARATE-CHAINING hash tables: a horizontal row of bucket cells
// (the array, index printed inside) with each bucket's chain drawn as linked
// node boxes hanging BELOW it, connected by arrows — the textbook picture.
// snapshot = an array of arrays: buckets[i] is the list of keys in bucket i
// (empty bucket → []). Highlights use the same language as ArrayRenderer at
// the BUCKET level (compare/active/done/danger by bucket index, hl.pointers),
// plus a NODE level: hl.node = [bucketIndex, chainPosition] colors one chain
// node with hl.nodeState ('compare' | 'active' | 'done' | 'danger').
// Zoomable (like ArrayRenderer): the default view autofits — wide tables get
// small cells, deep chains a tight pitch — and the user's zoom magnifies back
// up (viewport.js drives `zoom`; sizeCanvas grows the bitmap so text stays crisp).

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e", edge: "#e8590c",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0", faint: "#8a93a6",
};

const STATES = {
  none:    { fill: "#fff",    ring: COLORS.dim,    text: COLORS.ink },
  done:    { fill: "#e7f7ee", ring: COLORS.green,  text: "#0a5c39" },
  compare: { fill: "#fff5e9", ring: COLORS.edge,   text: "#9a4200" },
  active:  { fill: COLORS.accent, ring: COLORS.accent, text: "#fff" },
  danger:  { fill: "#fdeaea", ring: COLORS.red,    text: COLORS.red },
};

const asSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  (Array.isArray(v) ? v : [v]).forEach((x) => s.add(x));
  return s;
};

export class ChainRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{cell?:number, gap?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.cell = opts.cell ?? 44;
    this.gap = opts.gap ?? 10;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** @param {Array<Array>} snapshot buckets @param {Object} [hl] */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const buckets = Array.isArray(snapshot) ? snapshot : (snapshot?.buckets ?? []);
    const M = buckets.length;
    if (!M) { this.ctx.clearRect(0, 0, this.W, this.H); return; }

    const compare = asSet(hl.compare), active = asSet(hl.active),
      done = asSet(hl.done), danger = asSet(hl.danger);
    const pointers = hl.pointers || {};
    const [nodeB, nodeP] = hl.node ?? [-1, -1];
    const nodeState = STATES[hl.nodeState] ?? STATES.compare;

    const TOP = 34;                 // headroom for pointer markers
    const SIDE = 16;
    const gap = this.gap;
    // autofit against the BASE size, then let zoom magnify back up (capped at
    // the natural cell size / chain pitch); sizeCanvas grows the bitmap so the
    // panel pans instead of squashing
    const cell0 = Math.max(6, Math.min(this.cell, (this.baseW - 2 * SIDE - (M - 1) * gap) / M));
    const cell = Math.min(this.cell, cell0 * this.zoom);
    const headH = Math.min(cell, 30);          // bucket header row height

    // chain geometry: node boxes below the header, sized to fit the tallest chain
    const maxLen = Math.max(1, ...buckets.map((b) => b.length));
    const availBelow0 = this.baseH - TOP - headH - 8;
    const step0 = Math.max(8, Math.min(34, availBelow0 / maxLen)); // per-node vertical pitch
    const step = Math.min(34, step0 * this.zoom);
    const nodeH = Math.max(6, Math.min(24, step - 4));

    sizeCanvas(this, 2 * SIDE + M * cell + (M - 1) * gap, TOP + headH + maxLen * step + 12);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const totalW = M * cell + (M - 1) * gap;
    const startX = Math.max(SIDE, (this.W - totalW) / 2);
    // below legibility the labels are dropped entirely (the chain shape is the
    // lesson at that scale — zoom in to read the keys)
    const showText = cell >= 12;

    const bucketState = (i) =>
      danger.has(i) ? STATES.danger :
      active.has(i) ? STATES.active :
      compare.has(i) ? STATES.compare :
      done.has(i) ? STATES.done : STATES.none;

    for (let i = 0; i < M; i++) {
      const x = startX + i * (cell + gap);
      const st = bucketState(i);

      // header cell = the array slot; index inside, chain hangs below
      ctx.beginPath(); ctx.rect(x, TOP, cell, headH);
      ctx.fillStyle = st === STATES.none ? "#f2f4f8" : st.fill; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = st.ring; ctx.stroke();
      if (showText) {
        ctx.fillStyle = st === STATES.none ? COLORS.faint : st.text;
        ctx.font = "600 11px ui-monospace, Menlo, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(i), x + cell / 2, TOP + headH / 2 + 0.5);
      }

      // empty bucket: a small ground mark (∅) under the slot
      if (!buckets[i].length) {
        if (showText) {
          ctx.fillStyle = COLORS.dim;
          ctx.font = "500 10px ui-monospace, Menlo, monospace";
          ctx.textBaseline = "top";
          ctx.fillText("·", x + cell / 2, TOP + headH + 6);
        }
        continue;
      }

      // chain nodes
      let yTop = TOP + headH + (step - nodeH);
      for (let p = 0; p < buckets[i].length; p++) {
        const cx = x + cell / 2;
        // link arrow from the box above
        const linkFrom = p === 0 ? TOP + headH : yTop - (step - nodeH);
        const isNode = i === nodeB && p === nodeP;
        ctx.strokeStyle = isNode ? nodeState.ring : COLORS.line; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, linkFrom); ctx.lineTo(cx, yTop); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 3.5, yTop - 5); ctx.lineTo(cx + 3.5, yTop - 5); ctx.lineTo(cx, yTop);
        ctx.closePath(); ctx.fillStyle = isNode ? nodeState.ring : COLORS.line; ctx.fill();

        // node box
        const st2 = isNode ? nodeState : STATES.none;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + 2, yTop, cell - 4, nodeH, 5);
        else ctx.rect(x + 2, yTop, cell - 4, nodeH);
        ctx.fillStyle = st2.fill; ctx.fill();
        ctx.lineWidth = isNode ? 2 : 1.5; ctx.strokeStyle = st2.ring; ctx.stroke();
        if (showText) {
          ctx.fillStyle = st2.text;
          ctx.font = "600 12px system-ui, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(buckets[i][p]), cx, yTop + nodeH / 2 + 0.5);
        }

        yTop += step;
      }
    }

    // pointer markers (same language as ArrayRenderer): label + arrow above a bucket
    const byIndex = {};
    Object.keys(pointers).forEach((k) => {
      const v = pointers[k];
      if (v == null || v < 0 || v >= M) return;
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

  /** Text alternative for a snapshot — every bucket's chain in words, so a
   *  screen-reader user can reconstruct the table. Player.js puts this on
   *  the canvas's aria-label. */
  describe(snapshot) {
    const buckets = snapshot ?? [];
    if (!buckets.length) return "An empty hash table.";
    const parts = buckets
      .map((b, i) => (b && b.length ? `bucket ${i} chains ${b.join(", then ")}` : null))
      .filter(Boolean);
    return `A separate-chaining hash table with ${buckets.length} buckets, indices 0 to ${buckets.length - 1}. ` +
      (parts.length ? `${parts.join("; ")}. All other buckets are empty.` : "All buckets are empty.");
  }
}
