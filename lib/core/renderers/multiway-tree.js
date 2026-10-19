// CSS 343 unified library — core/renderers/multiway-tree.js
// ONE renderer for every multiway-node tree (2-3, 2-3-4, B-tree, …). Draws a
// snapshot = a plain node object { keys:[k,…], children:[c,…] } — a leaf has no
// (or an empty) children array; an internal node has children.length ===
// keys.length + 1, child i holding keys between keys[i-1] and keys[i]. Nodes
// have no id, so highlights are identified BY KEY VALUE (a node "is" the set of
// keys it holds). Mirrors core/renderers/tree.js.
//
// B+ trees (opts.leafLinks): a node may carry `id`, and a leaf `next` (the id
// of the next leaf). Then leaves draw the chain as arrows, each leaf key gets
// a record dot under it, and router nodes are tinted grey (routers carry no
// records). Because a B+ key can sit in a router AND in a leaf, these
// highlights name ONE copy by node id: nodeId / pathId / visitId / dangerId
// (node ids), cell / doneCell / dangerCell ("id:key" compartments), link
// (ids of leaves whose NEXT arrow is being followed). The key-value
// highlights below keep working for 2-3 and B-trees.

import { sizeCanvas } from "../render-config.js";
import { hitKey } from "../key-pick.js";

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
   *  @param {{cellW?:number, h?:number, TOP?:number, vgap?:number, M?:number,
   *          gap?:number, leafLinks?:boolean}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.cellW = opts.cellW ?? 30;
    this.h = opts.h ?? 30;
    this.TOP = opts.TOP ?? 26;
    this.vgap = opts.vgap ?? 56;
    this.M = opts.M ?? 24;
    this.leafLinks = !!opts.leafLinks; // B+ tree: leaf chain, record dots, grey routers
    this.gap = opts.gap ?? (this.leafLinks ? 24 : 10); // horizontal gap between sibling subtrees (room for a chain arrow)
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  _boxWidth(node) { return Math.max(1, (node.keys || []).length) * this.cellW; }

  /** @param {Object} snapshot root node {keys,children}  @param {Object} [hl] highlight sets */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    this._hits = []; // one box per key compartment, for keyAt
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

    const neededH = TOP + maxDepth * vgap + this.h / 2 + (this.leafLinks ? 8 : 0); // + record dots
    const baseAvailH = Math.max(1, this.baseH - this.M);
    const heightScale = neededH > baseAvailH ? baseAvailH / neededH : 1;

    const fit = Math.min(1, Math.min(widthScale, heightScale, 1) * this.zoom);
    sizeCanvas(this, totalWidth * fit + 2 * this.M, neededH * fit + this.M);
    ctx.clearRect(0, 0, this.W, this.H);

    const drawnWidth = totalWidth * fit;
    const offsetX = this.M + (this.W - 2 * this.M - drawnWidth) / 2;
    const fx = (x) => offsetX + x * fit;
    // a shallow tree no longer hugs the top of a tall canvas: center it vertically
    const offsetY = Math.max(0, (this.H - this.M - neededH * fit) / 2);
    const fy = (y) => offsetY + y * fit;

    const posMap = new Map();
    positions.forEach((p) => posMap.set(p.node, { x: fx(p.x), y: fy(p.y), bw: p.bw }));
    this._pos = posMap; // kept in case a future interactive demo wants hit-testing

    // ---- highlight sets, identified by key value ----
    const nodeHL = asSet(hl.node), keyHL = asSet(hl.key), pathHL = asSet(hl.path),
      doneHL = asSet(hl.done), dangerHL = asSet(hl.danger);
    const has = (node, set) => (node.keys || []).some((k) => set.has(k));
    // id-keyed highlights (B+ trees): one copy of a key, named by its node
    const idNode = asSet(hl.nodeId), idPath = asSet(hl.pathId), idVisit = asSet(hl.visitId),
      idDanger = asSet(hl.dangerId), cellHL = asSet(hl.cell), doneCell = asSet(hl.doneCell),
      dangerCell = asSet(hl.dangerCell), linkHL = asSet(hl.link);
    const hasId = (node, set) => node.id != null && set.has(node.id);
    const cellOf = (node, k) => `${node.id}:${k}`;

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
      const isLeafNode = !(node.children && node.children.length);
      let fill = self.leafLinks && !isLeafNode ? "#f1f2f6" : "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 2;
      if ((pathHL.size && has(node, pathHL)) || hasId(node, idPath) || hasId(node, idVisit)) { fill = "#f8f7fd"; ring = COLORS.accent; text = COLORS.ink; rw = 2; }
      if ((nodeHL.size && has(node, nodeHL)) || hasId(node, idNode)) { fill = "#f3f0ff"; ring = COLORS.accent; text = "#3a2f7a"; rw = 3; }
      if (doneHL.size && has(node, doneHL)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if ((dangerHL.size && has(node, dangerHL)) || hasId(node, idDanger)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }

      const cw = cellW * fit;
      keys.forEach((k, i) => self._hits.push({ x: boxX + i * cw, y: boxY, w: cw, h: H, key: k }));
      roundRectPath(ctx, boxX, boxY, bw, H, 8 * fit);
      ctx.fillStyle = fill; ctx.fill();

      // individual key-compartment highlight (drawn on top of the node fill)
      keys.forEach((k, i) => {
        const c = cellOf(node, k);
        const st = dangerCell.has(c) ? ["#fdeaea", COLORS.red] : doneCell.has(c) ? ["#e7f7ee", COLORS.green]
          : keyHL.has(k) || cellHL.has(c) ? ["#fff5e9", COLORS.edge] : null;
        if (!st) return;
        const cx0 = boxX + i * cw;
        ctx.fillStyle = st[0];
        ctx.fillRect(cx0 + 1, boxY + 1, cw - 2, H - 2);
        ctx.lineWidth = 2; ctx.strokeStyle = st[1];
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

      // a B+ leaf key carries its record: a dot under the key (green once emitted or found)
      if (self.leafLinks && isLeafNode) {
        keys.forEach((k, i) => {
          ctx.beginPath();
          ctx.arc(boxX + (i + 0.5) * cw, boxY + H + 5 * Math.max(fit, 0.6), Math.max(1.4, 2.6 * fit), 0, 2 * Math.PI);
          ctx.fillStyle = doneCell.has(cellOf(node, k)) ? COLORS.green : COLORS.faint;
          ctx.fill();
        });
      }

      (node.children || []).forEach(nodes);
    })(snapshot);

    // ---- the B+ leaf chain: an arrow from each leaf to the leaf its `next` names ----
    if (this.leafLinks) {
      const byId = new Map();
      positions.forEach((p) => { if (p.node.id != null) byId.set(p.node.id, posMap.get(p.node)); });
      positions.forEach((p) => {
        const n = p.node;
        if ((n.children && n.children.length) || n.next == null || !byId.has(n.next)) return;
        const a = posMap.get(n), b = byId.get(n.next);
        const x0 = a.x + (a.bw * fit) / 2 + 2, x1 = b.x - (b.bw * fit) / 2 - 2, y = a.y;
        const on = linkHL.has(n.id);
        ctx.strokeStyle = on ? COLORS.accent : COLORS.faint; ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = on ? 2.6 : 1.4;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 4, b.y); ctx.stroke();
        const ah = Math.max(3, 6 * Math.min(1, fit + 0.2));
        ctx.beginPath(); ctx.moveTo(x1, b.y); ctx.lineTo(x1 - ah, b.y - ah * 0.6); ctx.lineTo(x1 - ah, b.y + ah * 0.6); ctx.closePath(); ctx.fill();
      });
    }
  }

  /** Design-space hit test: the key whose compartment holds (px,py), or null
   *  (core/key-pick.js: click a key to fill the Run box). */
  keyAt(px, py) { return hitKey(this._hits, px, py); }

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
    const chain = [];
    if (this.leafLinks) (function leaves(n) { if (n.children && n.children.length) n.children.forEach(leaves); else chain.push(`[${n.keys.join(", ")}]`); })(root);
    return "A multiway tree; children are numbered left to right, so node 2.1 " +
      "is the first child of the root's second child. " + parts.join("; ") +
      ". Nodes with no children listed are leaves." +
      (chain.length > 1 ? ` The leaves are linked left to right: ${chain.join(" then ")}.` : "");
  }
}
