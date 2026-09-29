// CSS 343 unified library — core/renderers/multiway-tree.js
// ONE renderer for every multiway-node tree (2-3, 2-3-4, B-tree, …). Draws a
// snapshot = a plain node object { keys:[k,…], children:[c,…] } — a leaf has no
// (or an empty) children array; an internal node has children.length ===
// keys.length + 1, child i holding keys between keys[i-1] and keys[i]. Nodes
// have no id, so highlights are identified BY KEY VALUE (a node "is" the set of
// keys it holds). Mirrors core/renderers/tree.js.

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

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export class MultiwayTreeRenderer {
  /** @param {HTMLCanvasElement} canvas
   *  @param {{cellW?:number, h?:number, TOP?:number, vgap?:number, M?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.cellW = opts.cellW ?? 30;
    this.h = opts.h ?? 30;
    this.TOP = opts.TOP ?? 26;
    this.vgap = opts.vgap ?? 56;
    this.M = opts.M ?? 24;
    this.gap = opts.gap ?? 10; // horizontal gap between sibling subtrees
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  _boxWidth(node) { return Math.max(1, (node.keys || []).length) * this.cellW; }

  /** @param {Object} snapshot root node {keys,children}  @param {Object} [hl] highlight sets */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    if (!snapshot) return;

    const cellW = this.cellW, gap = this.gap, TOP = this.TOP, vgap = this.vgap;
    const self = this;
    let maxDepth = 0;

    // ---- pass 1: subtree pixel widths, bottom-up ----
    const widthOf = new Map();
    (function computeWidth(node) {
      const bw = self._boxWidth(node);
      const children = node.children || [];
      let w;
      if (!children.length) w = bw;
      else {
        const childWidths = children.map(computeWidth);
        const sum = childWidths.reduce((a, b) => a + b, 0) + gap * (children.length - 1);
        w = Math.max(bw, sum);
      }
      widthOf.set(node, w);
      return w;
    })(snapshot);

    // ---- pass 2: assign x (centered over children span) / y (= TOP + depth*vgap) ----
    const positions = []; // { node, x, y, bw }
    (function assign(node, leftEdge, depth) {
      maxDepth = Math.max(maxDepth, depth);
      const sw = widthOf.get(node);
      const bw = self._boxWidth(node);
      const children = node.children || [];
      const y = TOP + depth * vgap;
      let x;
      if (!children.length) {
        x = leftEdge + sw / 2;
      } else {
        const childWidths = children.map((c) => widthOf.get(c));
        const sum = childWidths.reduce((a, b) => a + b, 0) + gap * (children.length - 1);
        let cx = leftEdge + (sw - sum) / 2;
        const childXs = [];
        children.forEach((c, idx) => {
          childXs.push(assign(c, cx, depth + 1));
          cx += childWidths[idx] + gap;
        });
        x = (childXs[0] + childXs[childXs.length - 1]) / 2;
      }
      positions.push({ node, x, y, bw });
      return x;
    })(snapshot, 0, 0);

    // ---- pass 3: autofit to the BASE canvas — uniformly shrink (x AND y,
    // plus box size and font) by whichever of width/height is tighter, so the
    // WHOLE tree always stays visible and its shape reads during a run. The
    // user's zoom multiplies the autofit scale (capped at natural size, fit
    // 1 = 14px font); zoomed in, the canvas grows and the panel pans. ----
    const totalWidth = widthOf.get(snapshot);
    const baseAvailW = Math.max(1, this.baseW - 2 * this.M);
    const widthScale = totalWidth > baseAvailW ? baseAvailW / totalWidth : 1;

    const neededH = TOP + maxDepth * vgap + this.h / 2;
    const baseAvailH = Math.max(1, this.baseH - this.M);
    const heightScale = neededH > baseAvailH ? baseAvailH / neededH : 1;

    const fit = Math.min(1, Math.min(widthScale, heightScale, 1) * this.zoom);
    sizeCanvas(this, totalWidth * fit + 2 * this.M, neededH * fit + this.M);
    ctx.clearRect(0, 0, this.W, this.H);

    const drawnWidth = totalWidth * fit;
    const offsetX = this.M + (this.W - 2 * this.M - drawnWidth) / 2;
    const fx = (x) => offsetX + x * fit;
    const fy = (y) => y * fit;

    const posMap = new Map();
    positions.forEach((p) => posMap.set(p.node, { x: fx(p.x), y: fy(p.y), bw: p.bw }));
    this._pos = posMap; // kept in case a future interactive demo wants hit-testing

    // ---- highlight sets, identified by key value ----
    const nodeHL = asSet(hl.node), keyHL = asSet(hl.key), pathHL = asSet(hl.path),
      doneHL = asSet(hl.done), dangerHL = asSet(hl.danger);
    const has = (node, set) => (node.keys || []).some((k) => set.has(k));

    const H = Math.max(4, this.h * fit);
    const fontPx = Math.round(14 * fit);
    const showText = cellW * fit >= 9 && fontPx >= 6; // too small to read → shape only

    // ---- edges (drawn first, under the nodes) ----
    (function edges(node) {
      const children = node.children || [];
      if (!children.length) return;
      const p = posMap.get(node);
      const bw = p.bw * fit;
      children.forEach((c, i) => {
        const q = posMap.get(c);
        const startX = p.x - bw / 2 + i * cellW * fit;
        ctx.beginPath();
        ctx.moveTo(startX, p.y + H / 2);
        ctx.lineTo(q.x, q.y - H / 2);
        ctx.lineWidth = 1.7; ctx.strokeStyle = COLORS.line;
        ctx.stroke();
        edges(c);
      });
    })(snapshot);

    // ---- nodes ----
    (function nodes(node) {
      const p = posMap.get(node);
      const keys = node.keys || [];
      const bw = p.bw * fit;
      const boxX = p.x - bw / 2, boxY = p.y - H / 2;

      // node-level style, precedence base -> path -> node -> done -> danger
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 2;
      if (pathHL.size && has(node, pathHL)) { fill = "#f8f7fd"; ring = COLORS.accent; text = COLORS.ink; rw = 2; }
      if (nodeHL.size && has(node, nodeHL)) { fill = "#f3f0ff"; ring = COLORS.accent; text = "#3a2f7a"; rw = 3; }
      if (doneHL.size && has(node, doneHL)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (dangerHL.size && has(node, dangerHL)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }

      const cw = cellW * fit;
      roundRectPath(ctx, boxX, boxY, bw, H, 8 * fit);
      ctx.fillStyle = fill; ctx.fill();

      // individual key-compartment highlight (drawn on top of the node fill)
      keys.forEach((k, i) => {
        if (!keyHL.has(k)) return;
        const cx0 = boxX + i * cw;
        ctx.fillStyle = "#fff5e9";
        ctx.fillRect(cx0 + 1, boxY + 1, cw - 2, H - 2);
        ctx.lineWidth = 2; ctx.strokeStyle = COLORS.edge;
        ctx.strokeRect(cx0 + 1.5, boxY + 1.5, cw - 3, H - 3);
      });

      // compartment dividers
      ctx.lineWidth = 1.3; ctx.strokeStyle = COLORS.line;
      for (let i = 1; i < keys.length; i++) {
        const dx = boxX + i * cw;
        ctx.beginPath(); ctx.moveTo(dx, boxY); ctx.lineTo(dx, boxY + H); ctx.stroke();
      }

      // outer ring, on top so it stays crisp over compartment fills
      roundRectPath(ctx, boxX, boxY, bw, H, 8 * fit);
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();

      // key labels — font shrinks with the node so keys stay inside their
      // compartment; below legibility the text is dropped entirely (the tree
      // SHAPE is the lesson at that scale — zoom in to read values)
      if (showText) {
        ctx.fillStyle = text; ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        keys.forEach((k, i) => {
          const kx = boxX + (i + 0.5) * cw;
          ctx.fillText(String(k), kx, p.y + 0.5);
        });
      }

      (node.children || []).forEach(nodes);
    })(snapshot);
  }

  /** Text alternative for a snapshot — every node's keys with a dotted path
   *  name (node 2.1 = first child of the root's second child), so a screen-
   *  reader user can reconstruct the tree. Player.js puts this on the
   *  canvas's aria-label. */
  describe(root) {
    if (!root) return "An empty multiway tree.";
    const parts = [];
    (function walk(n, path) {
      const kids = n.children || [];
      const nm = path ? `node ${path}` : "the root";
      parts.push(`${nm} holds ${n.keys.join(", ")}` +
        (kids.length ? ` and has ${kids.length} children` : ""));
      kids.forEach((c, i) => walk(c, path ? `${path}.${i + 1}` : String(i + 1)));
    })(root, "");
    return "A multiway tree; children are numbered left to right, so node 2.1 " +
      "is the first child of the root's second child. " + parts.join("; ") +
      ". Nodes with no children listed are leaves.";
  }
}
