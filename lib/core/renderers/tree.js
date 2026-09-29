// CSS 343 unified library — core/renderers/tree.js
// ONE renderer for every tree-shaped structure (BST, AVL, 2-3, red-black, trie,
// Huffman, expression, memoization trees). It draws a snapshot = a plain node
// object {key,left,right, height?, bf?, color?} and applies a highlight set by
// key. Layout: x = in-order rank (stable — rotations only move nodes vertically),
// y = depth. Highlights are just sets of keys, so any algorithm can drive it.

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

// A node is BINARY ({left,right}) or N-ARY ({kids:[…]}) — the latter for
// recursion trees, where a node's fan-out is the number of choices at that
// step. Everything below walks children through this one accessor, so the two
// shapes share the whole renderer.
const kidsOf = (t) => (t.kids ? t.kids.filter(Boolean) : [t.left, t.right].filter(Boolean));
const isNary = (t) => !!(t && t.kids);

export class TreeRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{labels?:('bf'|'height'|'none'), R?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.M = opts.M ?? 44; this.R = opts.R ?? 16; this.TOP = opts.TOP ?? 30;
    this.labels = opts.labels ?? "bf";
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** In-order rank per NODE. Keyed by node identity, not by `key`: a Huffman
   *  tree labels internal nodes with their FREQUENCY, and two different
   *  subtrees can weigh the same — keying by value collapsed them onto one
   *  point and their edges fanned out of a single circle. */
  _ranks(roots) {
    const rank = new Map(); let i = 0;
    // ranks run CONSECUTIVELY across the roots, so a forest lays its trees out
    // left to right without overlap (a single root is just the n = 1 case).
    // A root may carry `row`: ranks restart on each row, so a forest that would
    // otherwise shrink to illegibility wraps instead.
    const rows = [...new Set(roots.map((r) => r.row ?? 0))].sort((a, b) => a - b);
    let widest = 0;
    for (const rw of rows) {
      i = 0;
      for (const r of roots.filter((x) => (x.row ?? 0) === rw)) this._rankOne(r, rank, () => i++);
      widest = Math.max(widest, i);
    }
    if (rows.length > 1) return { rank, n: widest };
    rank.clear(); i = 0;
    for (const r of roots) {
      if (isNary(r)) {
        (function walk(t) {
          const ks = kidsOf(t);
          if (!ks.length) { rank.set(t, i++); return; }   // leaves take the slots
          ks.forEach(walk);
          const a = rank.get(ks[0]), b = rank.get(ks[ks.length - 1]);
          rank.set(t, (a + b) / 2);                        // parent centres over them
        })(r);
      } else {
        (function walk(t) { if (!t) return; walk(t.left); rank.set(t, i++); walk(t.right); })(r);
      }
    }
    return { rank, n: i };
  }
  /** rank one root, N-ary or binary, pulling slots from `next` */
  _rankOne(r, rank, next) {
    if (isNary(r)) {
      (function walk(t) {
        const ks = kidsOf(t);
        if (!ks.length) { rank.set(t, next()); return; }
        ks.forEach(walk);
        rank.set(t, (rank.get(ks[0]) + rank.get(ks[ks.length - 1])) / 2);
      })(r);
    } else {
      (function walk(t) { if (!t) return; walk(t.left); rank.set(t, next()); walk(t.right); })(r);
    }
  }
  _depth1(root) {
    if (!root) return -1;
    const ks = kidsOf(root);
    return 1 + (ks.length ? Math.max(...ks.map((c) => this._depth1(c))) : -1);
  }
  _depth(roots) { return roots.reduce((m, r) => Math.max(m, this._depth1(r)), -1); }

  /** Canvas-space hit test: the node key at (px,py), or null. Used by InteractiveDemo. */
  nodeAt(px, py) {
    const R = this._R ?? this.R;
    const rr = (R + 4) * (R + 4);
    for (const k in (this._pos || {})) { const p = this._pos[k]; if ((p.x - px) * (p.x - px) + (p.y - py) * (p.y - py) <= rr) return isNaN(+k) ? k : +k; }
    return null;
  }

  /** @param {Object} root snapshot  @param {Object} [hl] highlight sets */
  draw(snapshot, hl = {}) {
    // a snapshot may wrap the root: {tree, …} lets a structure ship side data
    // (Huffman's forest list) in the same frame without a per-spec adapter
    const raw = snapshot && snapshot.tree !== undefined ? snapshot.tree : snapshot;
    // ONE root, or a FOREST of them: Huffman is a forest until its final merge,
    // and drawing only the newest subtree would misstate where the build is
    const roots = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    if (!roots.length) return;
    const { rank, n } = this._ranks(roots);
    const rowsAll = [...new Set(roots.map((r) => r.row ?? 0))];
    const dep = Math.max(1, rowsAll.length > 1
      ? rowsAll.reduce((a, rw) => a + Math.max(...roots.filter((x) => (x.row ?? 0) === rw).map((x) => this._depth1(x))) + 1, 0) - 1
      : this._depth(roots));
    // autofit spacing on the BASE canvas (whole tree always visible),
    // magnified by the user's zoom — capped at the spacing that reaches
    // full-size nodes (more spread past that adds nothing). Zoomed in, the
    // canvas grows and the panel pans.
    const dx0 = (this.baseW - 2 * this.M) / Math.max(1, n - 1);
    // room under the last row: a bf/height sub-label is small and grey, but a
    // "sym" one is near-node-size ink (a Huffman leaf's letter, or NYT), and at
    // 24px it was being clipped by the panel edge
    const BOT = this.labels === "sym" ? 34 : 24;
    const dy0 = Math.min(64, (this.baseH - this.TOP - BOT) / dep);
    const anyDual = (function has(rs) { return rs.some((r) => (function w(t) { return t.value != null || kidsOf(t).some(w); })(r)); })(roots);
    const fullSpan = anyDual ? 5.2 * this.R : 2 * (this.R + 3);
    const dx = Math.min(dx0 * this.zoom, Math.max(dx0, fullSpan));
    const dy = Math.min(dy0 * this.zoom, Math.max(dy0, 64));
    sizeCanvas(this, 2 * this.M + dx * Math.max(1, n - 1), this.TOP + BOT + dy * dep);
    ctx.clearRect(0, 0, this.W, this.H);
    // shrink the node radius (and, below, the font) whenever spacing gets
    // tight — otherwise many nodes just overlap instead of staying legible
    const R = Math.max(2, Math.min(this.R, dx / 2 - 3, dy / 2 - 3));
    const pos = new Map();      // node  -> {x,y}   (drawing: identity)
    const posByKey = {};        // key   -> {x,y}   (hit-testing + edge labels)
    const place = function (t, d) {
      if (!t) return;
      const at = { x: this.M + rank.get(t) * dx, y: this.TOP + d * dy };
      pos.set(t, at);
      if (!(t.key in posByKey)) posByKey[t.key] = at;   // first wins on duplicate keys
      kidsOf(t).forEach((c) => place.call(this, c, d + 1));
    };
    const rowsUsed = [...new Set(roots.map((r) => r.row ?? 0))].sort((a, b) => a - b);
    const rowDepth = new Map();   // row -> deepest tree on it
    rowsUsed.forEach((rw) => rowDepth.set(rw, Math.max(...roots.filter((x) => (x.row ?? 0) === rw).map((x) => this._depth1(x)))));
    const rowTop = new Map(); let acc = 0;
    rowsUsed.forEach((rw) => { rowTop.set(rw, acc); acc += rowDepth.get(rw) + 1; });
    roots.forEach((r) => place.call(this, r, rowTop.get(r.row ?? 0) ?? 0));
    this._pos = posByKey; this._R = R; // kept for hit-testing (InteractiveDemo: click a node)

    const cur = asSet(hl.cur), path = asSet(hl.path), cmp = asSet(hl.compare),
      appear = asSet(hl.appear), danger = asSet(hl.danger), done = asSet(hl.done),
      faded = asSet(hl.faded), best = asSet(hl.best);
    const edgeHL = new Map(); // "a>b" -> label
    (hl.edges || []).forEach(([a, b, lab]) => edgeHL.set(a + ">" + b, lab ?? ""));

    // edges
    const fadedSet = faded, bestSet = best;
    const edgeBadges = [];   // {x, y, lab} — drawn after the edges, over them
    const edges = function (t) {
      if (!t) return;
      kidsOf(t).forEach((c) => {
        if (c.ghost || t.ghost) { edges(c); return; }
        const p = pos.get(t), q = pos.get(c);
        const on = edgeHL.has(t.key + ">" + c.key);
        // red-black links: a truthy `red` on the CHILD colors the edge from its parent.
        // Purely additive — nodes without `red` render exactly as before.
        const onBest = bestSet.has(t.key) && bestSet.has(c.key);
        if (c.edge != null) {
          // toward the CHILD, because the midpoint collides with the parent's
          // label — and pushed SIDEWAYS on a near-vertical edge (an LCS match
          // has a single child straight below, so the badge sat on the node)
          const vertical = Math.abs(q.x - p.x) < 14;
          const f = vertical ? 0.5 : 0.62;
          // `edgePrice` makes the recurrence readable off the picture: a
          // parent's value is this badge plus the child's value
          const lab = c.edgePrice != null ? `${c.edge}\u2192${c.edgePrice}` : String(c.edge);
          edgeBadges.push({ x: p.x + (q.x - p.x) * f + (vertical ? R + 12 : 0), y: p.y + (q.y - p.y) * f, lab, dim: fadedSet.has(c.key), best: onBest });
        }
        if (onBest) { ctx.lineWidth = 4.5; ctx.strokeStyle = COLORS.green; }
        else if (c.red) { ctx.lineWidth = 4; ctx.strokeStyle = COLORS.red; }
        else { ctx.lineWidth = on ? 4 : 1.7; ctx.strokeStyle = on ? COLORS.edge : COLORS.line; }
        const dim = fadedSet.has(c.key);
        if (dim) ctx.globalAlpha = 0.22;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        if (dim) ctx.globalAlpha = 1;
        edges(c);
      });
    };
    roots.forEach(edges);

    // per-node incoming-edge badges (the choice that produced this child)
    edgeBadges.forEach(({ x, y, lab, dim, best: onB }) => {
      if (dim) ctx.globalAlpha = 0.22;
      ctx.font = "700 11px ui-monospace, Menlo, monospace";
      const w = Math.max(18, ctx.measureText(String(lab)).width + 10);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 9, w, 18, 9);
      else ctx.arc(x, y, 9, 0, 2 * Math.PI);
      ctx.fillStyle = onB ? COLORS.green : COLORS.edge; ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(lab), x, y + 0.5);
      if (dim) ctx.globalAlpha = 1;
    });

    // edge labels (L/R badges etc.)
    edgeHL.forEach((lab, key) => {
      if (!lab) return;
      const [a, b] = key.split(">").map(Number);
      if (!posByKey[a] || !posByKey[b]) return;
      const mx = (posByKey[a].x + posByKey[b].x) / 2, my = (posByKey[a].y + posByKey[b].y) / 2;
      ctx.beginPath(); ctx.arc(mx, my, 9, 0, 2 * Math.PI); ctx.fillStyle = COLORS.edge; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 11px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(lab), mx, my + 0.5);
    });

    // nodes — font shrinks along with R so keys stay inside their circle;
    // below legibility the text is dropped entirely (the tree SHAPE is the
    // lesson at that scale — zoom in to read values)
    const showText = R >= 5;
    const showSub = R >= 8;
    const fontPx = Math.round(14 * (R / this.R));
    const subFontPx = Math.round(10 * (R / this.R));
    // a "sym" sub-label is the leaf's IDENTITY, not positional bookkeeping like
    // bf/height — so it gets near-node size and full-ink contrast
    const symFontPx = Math.max(9, Math.round(13 * (R / this.R)));
    const nodes = function (t) {
      if (!t) return;
      const p = pos.get(t);
      if (t.ghost) { kidsOf(t).forEach((c) => nodes.call(this, c)); return; }
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 2;
      const dim = faded.has(t.key);
      if (dim) ctx.globalAlpha = 0.22;
      // a node may carry its OWN colour (`tint`) — the Huffman codec gives each
      // symbol one and reuses it for that symbol's bits, so the leaf and the
      // bits it emits match. Highlights below still override it.
      if (t.tint) { ring = t.tint; text = t.tint; }
      if (path.has(t.key)) { fill = "#f3f0ff"; ring = COLORS.accent; text = "#3a2f7a"; }
      if (cmp.has(t.key)) { fill = "#fff5e9"; ring = COLORS.edge; text = "#9a4200"; rw = 2.5; }
      if (appear.has(t.key)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (done.has(t.key)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (best.has(t.key)) { fill = "#d6f5e3"; ring = COLORS.green; text = "#0a5c39"; rw = 3.5; }
      if (danger.has(t.key)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }
      if (cur.has(t.key)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; rw = 3; }
      if (t.value != null) {
        // two compartments: the SUBPROBLEM on the left, its ANSWER on the right.
        // One shape, so nothing hangs below the node onto an edge.
        ctx.font = `700 ${fontPx}px ui-monospace, Menlo, monospace`;
        const kTxt = String(t.label ?? t.key), vTxt = String(t.value);
        const kW = ctx.measureText(kTxt).width, vW = ctx.measureText(vTxt).width;
        const pad = Math.max(5, R * 0.42), h = Math.max(18, R * 1.7);
        const w1 = kW + 2 * pad, w2 = vW + 2 * pad, w = w1 + w2;
        const x0 = p.x - w / 2, y0 = p.y - h / 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x0, y0, w, h, 5); else ctx.rect(x0, y0, w, h);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
        // the divider, and a faint wash behind the value so the two read apart
        ctx.beginPath(); ctx.moveTo(x0 + w1, y0); ctx.lineTo(x0 + w1, y0 + h);
        ctx.lineWidth = 1.2; ctx.strokeStyle = ring; ctx.stroke();
        if (showText) {
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = text; ctx.fillText(kTxt, x0 + w1 / 2, p.y + 0.5);
          ctx.fillStyle = ring === COLORS.dim ? COLORS.green : text;
          ctx.fillText(vTxt, x0 + w1 + w2 / 2, p.y + 0.5);
        }
      } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
      if (showText) {
        ctx.fillStyle = text; ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(t.label ?? t.key), p.x, p.y);
      }
      }
      // optional bf/height label under the node
      const self = this;
      if (showSub && self.labels !== "none") {
        const val = self.labels === "bf" ? (t.bf ?? (h(t.left) - h(t.right)))
          : self.labels === "sym" ? (t.sub ?? "")
          : self.labels === "freq" ? (t.freq ?? t.size ?? 1)
          : self.labels === "size" ? (t.size ?? 1)
            : (t.height ?? h(t));
        const big = self.labels === "bf" && Math.abs(val) >= 2;
        const pre = self.labels === "bf" ? "bf " : self.labels === "freq" ? "f " : self.labels === "size" ? "n " : self.labels === "sym" ? "" : "h ";
        if (self.labels === "sym" && !val) { if (dim) ctx.globalAlpha = 1; kidsOf(t).forEach((c) => nodes.call(self, c)); return; }
        const isSym = self.labels === "sym";
        ctx.fillStyle = big ? COLORS.red : isSym ? (t.tint || COLORS.ink) : COLORS.faint;
        ctx.font = (big || isSym ? "700 " : "600 ")
          + `${isSym ? symFontPx : subFontPx}px ui-monospace, Menlo, monospace`;
        ctx.textBaseline = "top";
        ctx.fillText(pre + (val > 0 && self.labels === "bf" ? "+" + val : val), p.x, p.y + R + (isSym ? 3 : 2));
      }
      if (dim) ctx.globalAlpha = 1;
      kidsOf(t).forEach((c) => nodes.call(self, c));
    };
    roots.forEach((r) => nodes.call(this, r));
  }

  /** Text alternative for a snapshot — names every node's children (and red
   *  links, when present) so a screen-reader user can reconstruct the tree.
   *  Player.js puts this on the canvas's aria-label. */
  describe(snapshot) {
    const raw = snapshot && snapshot.tree !== undefined ? snapshot.tree : snapshot;
    const rs = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
    if (!rs.length) return "An empty binary tree.";
    if (rs.length > 1)
      return `A forest of ${rs.length} trees, with root weights `
        + rs.map((r) => String(r.label ?? r.key)).join(", ") + ".";
    const root = rs[0];
    const nm = (t) => `${t.key}${t.red ? " (linked by a red link)" : ""}`;
    const parts = [];
    (function walk(t) {
      if (!t || !kidsOf(t).length) return;
      if (isNary(t)) {
        parts.push(`${nm(t)} has ${kidsOf(t).length} children: ${kidsOf(t).map(nm).join(", ")}`);
        kidsOf(t).forEach(walk);
        return;
      }
      const lt = t.left ? `left child ${nm(t.left)}` : "no left child";
      const rt = t.right ? `right child ${nm(t.right)}` : "no right child";
      parts.push(`${t.key} has ${lt} and ${rt}`);
      walk(t.left); walk(t.right);
    })(root);
    return `A ${isNary(root) ? "tree" : "binary tree"} with root ${root.label ?? root.key}. ` +
      (parts.length ? `${parts.join("; ")}. All other nodes are leaves.` : "It is the only node.");
  }
}

function h(t) { return t ? (t.height ?? 0) : -1; }
