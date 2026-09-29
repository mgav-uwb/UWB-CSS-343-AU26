// CSS 343 unified library — core/renderers/graph.js
// ONE renderer for every graph-shaped structure (BFS/DFS, Dijkstra, Prim/Kruskal,
// topological sort). It draws a snapshot = {nodes:[{id,x,y,label?}], edges:[{u,v,w?,directed?}]}
// with x,y NORMALIZED to [0,1] — the algorithm/layout controls node placement,
// just like tree.js controls its own layout. Highlights are sets of node ids and
// edge pairs (matched unordered unless the edge/graph is directed), so any
// algorithm can drive it.
// Zoomable: the whole frame scales uniformly (bitmap grows, ctx.scale redraws
// at base coordinates — crisp text, no blur); viewport.js drives `zoom`.

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

const unorderedKey = (a, b) => (String(a) <= String(b) ? `${a}|${b}` : `${b}|${a}`);

const buildEdgeSets = (pairs) => {
  const ordered = new Set(), unordered = new Set();
  (pairs || []).forEach(([a, b]) => { ordered.add(`${a}>${b}`); unordered.add(unorderedKey(a, b)); });
  return { ordered, unordered };
};

const edgeMatches = (sets, u, v, directed) =>
  directed ? sets.ordered.has(`${u}>${v}`) : sets.unordered.has(unorderedKey(u, v));

export class GraphRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{R?:number, directed?:boolean, pad?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.R = opts.R ?? 18;
    this.directed = opts.directed ?? false;
    this.pad = opts.pad ?? 30;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** @param {{nodes:Array, edges:Array}} snapshot @param {Object} [hl] highlight sets: nodes{active,visited,done,danger}, edges{tree,active,faded}, dist{id:value} */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const nodes = snapshot?.nodes ?? [];
    const edges = snapshot?.edges ?? [];
    if (!nodes.length) return;
    ctx.save(); ctx.scale(z, z);
    const W = this.baseW, H = this.baseH; // draw in base coordinates — scale does the rest

    const pad = this.pad, R = this.R;
    const pos = {};
    nodes.forEach((n) => { pos[n.id] = { x: pad + n.x * (W - 2 * pad), y: pad + n.y * (H - 2 * pad) }; });

    const active = asSet(hl.nodes?.active), visited = asSet(hl.nodes?.visited),
      done = asSet(hl.nodes?.done), danger = asSet(hl.nodes?.danger);
    const treeE = buildEdgeSets(hl.edges?.tree), activeE = buildEdgeSets(hl.edges?.active),
      fadedE = buildEdgeSets(hl.edges?.faded);
    const dist = hl.dist || {};

    // PARALLEL edges (two+ edges on the same node pair, e.g. an NFA's ε-edge
    // and char-edge between the same states, or a digraph's u→v plus v→u)
    // bow apart on opposite sides instead of drawing on top of each other.
    // Slots are assigned per unordered pair; a lone edge stays a straight line.
    const pairSlots = new Map();
    edges.forEach((e) => {
      const k = unorderedKey(e.u, e.v);
      if (!pairSlots.has(k)) pairSlots.set(k, []);
      pairSlots.get(k).push(e);
    });
    const bendOf = (e) => {
      // an edge may pin its own curve: e.bend (px, sign = which side) — used
      // by the topo-sort finale to arc line-layout edges over the vertices
      if (e.bend != null) return e.bend;
      const group = pairSlots.get(unorderedKey(e.u, e.v));
      if (group.length < 2) return 0;
      const i = group.indexOf(e);
      const bend = (i - (group.length - 1) / 2) * 26;
      // measure the perpendicular in the pair's CANONICAL direction so edges
      // of the group land on distinct sides regardless of their own direction
      return String(e.u) <= String(e.v) ? bend : -bend;
    };
    // quadratic-bezier midpoint (t = 0.5) sits half-way to the control offset,
    // so the control point doubles the bend to make the curve peak = bend.
    // The label's HOME spot is t = 0.38 — toward the edge's FIRST vertex —
    // but placement below is collision-aware and may slide along the curve.
    const LABEL_T = 0.38;
    const curveOf = (e) => {
      const p = pos[e.u], q = pos[e.v];
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len; // perpendicular unit vector
      const bend = bendOf(e);
      const cx = (p.x + q.x) / 2 + px * 2 * bend, cy = (p.y + q.y) / 2 + py * 2 * bend;
      const at = (t) => {
        const u = 1 - t; // bezier point (exact lerp when bend = 0)
        return { x: u * u * p.x + 2 * u * t * cx + t * t * q.x,
                 y: u * u * p.y + 2 * u * t * cy + t * t * q.y };
      };
      const m = at(LABEL_T);
      return { p, q, cx, cy, at, mx: m.x, my: m.y };
    };

    // a SELF-LOOP (u === v) has no direction to draw along — it was a
    // zero-length line, i.e. invisible, which silently lost transitions on any
    // automaton that stays put on a character. Drawn as a small circle sitting
    // on top of its node, with the arrowhead where it re-enters.
    const selfLoops = [];
    const drawSelfLoop = (e, color, width) => {
      const p = pos[e.u];
      const r = R * 0.78, cyc = p.y - R - r * 0.72;
      ctx.lineWidth = width; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.arc(p.x, cyc, r, 0.72 * Math.PI, 0.28 * Math.PI); ctx.stroke();
      // arrowhead at the right-hand end, pointing back down into the node
      const ax = p.x + r * Math.cos(0.28 * Math.PI), ay = cyc + r * Math.sin(0.28 * Math.PI);
      const ah = 8, aw = 4;
      const ux = 0.45, uy = 0.9;                       // roughly tangent, downward
      const bx = ax - ux * ah, by = ay - uy * ah;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.lineTo(bx - uy * aw, by + ux * aw);
      ctx.lineTo(bx + uy * aw, by - ux * aw);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      return { x: p.x, y: cyc - r };                   // where its label goes
    };

    // edges (drawn first so nodes sit on top)
    edges.forEach((e) => {
      const p = pos[e.u], q = pos[e.v];
      if (!p || !q) return;
      const directed = e.directed ?? this.directed;
      let color = COLORS.line, width = 1.7;
      if (edgeMatches(fadedE, e.u, e.v, directed)) { color = "#d8dce3"; width = 1.7; }
      if (edgeMatches(treeE, e.u, e.v, directed)) { color = COLORS.accent; width = 4; }
      if (edgeMatches(activeE, e.u, e.v, directed)) { color = COLORS.edge; width = 4; }

      if (e.u === e.v) { const at = drawSelfLoop(e, color, width); if (e.w != null) selfLoops.push({ e, at }); return; }

      const { cx, cy } = curveOf(e);
      // tangent at the endpoint (toward the control point) orients the
      // arrowhead and the pull-back to the node radius
      const tdx = q.x - cx, tdy = q.y - cy, tlen = Math.hypot(tdx, tdy) || 1;
      const ux = tdx / tlen, uy = tdy / tlen;
      const endX = directed ? q.x - ux * R : q.x;
      const endY = directed ? q.y - uy * R : q.y;

      ctx.lineWidth = width; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(cx, cy, endX, endY); ctx.stroke();

      if (directed) {
        const ah = 9, aw = 4.5; // arrowhead length / half-width
        const bx = endX - ux * ah, by = endY - uy * ah; // back of the arrowhead
        const px = -uy, py = ux; // perpendicular unit vector
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(bx + px * aw, by + py * aw);
        ctx.lineTo(bx - px * aw, by - py * aw);
        ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
      }
    });

    // self-loop labels first — they own their spot above the node
    selfLoops.forEach(({ e, at }) => {
      const txt = String(e.w);
      ctx.font = "600 12px ui-monospace, Menlo, monospace";
      const w = ctx.measureText(txt).width;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(at.x - w / 2 - 5, at.y - 9, w + 10, 18, 9);
      else ctx.arc(at.x, at.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = COLORS.line; ctx.stroke();
      ctx.fillStyle = COLORS.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, at.x, at.y + 0.5);
    });

    // edge weight labels — a bubble ON its own edge (the white disc sits on
    // its own line, which reads as "this number belongs to this edge").
    // Placement is COLLISION-AWARE: the bubble slides along its curve
    // (candidate t spots, nearest the 0.38 home first) to the first spot
    // clear of already-placed bubbles, node discs, and OTHER edges — so
    // crossing chords never stack their weights on the intersection point
    // and a bubble never gets covered by a node (nodes draw on top).
    const curves = edges.map((e) => (pos[e.u] && pos[e.v] ? curveOf(e) : null));
    const samples = curves.map((c, i) => {
      if (!c) return [];
      const e = edges[i];
      const n = Math.max(16, Math.ceil(Math.hypot(pos[e.v].x - pos[e.u].x, pos[e.v].y - pos[e.u].y) / 10));
      return Array.from({ length: n + 1 }, (_, k) => c.at(k / n));
    });
    const bubbles = [];
    this.weightBubbles = bubbles; // exposed so callers can audit for overlaps
    edges.forEach((e, ei) => {
      if (e.w == null || !curves[ei]) return;
      const r = String(e.w).length > 2 ? 12 : 10;
      const cands = [0.38, 0.3, 0.46, 0.22, 0.54, 0.62, 0.14, 0.7, 0.78];
      let best = null, bestPen = Infinity;
      for (const t of cands) {
        const c = curves[ei].at(t);
        let pen = 0;
        bubbles.forEach((b) => {
          const need = r + b.r + 3, d = Math.hypot(c.x - b.x, c.y - b.y);
          if (d < need) pen += (need - d) * 3;
        });
        nodes.forEach((n) => {
          const need = R + r + 3, d = Math.hypot(c.x - pos[n.id].x, c.y - pos[n.id].y);
          if (d < need) pen += (need - d) * 3;
        });
        samples.forEach((ss, si) => {
          if (si === ei || !ss.length) return;
          const need = r + 2;
          let d = Infinity;
          ss.forEach((s) => { d = Math.min(d, Math.hypot(c.x - s.x, c.y - s.y)); });
          if (d < need) pen += need - d; // lighter: grazing a line beats hiding a bubble
        });
        if (pen < bestPen - 0.5) { bestPen = pen; best = c; } // ties → closest to home
        if (bestPen === 0) break;
      }
      bubbles.push({ x: best.x, y: best.y, r, u: e.u, v: e.v, w: e.w });
      ctx.beginPath(); ctx.arc(best.x, best.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = COLORS.line; ctx.stroke();
      ctx.fillStyle = COLORS.ink; ctx.font = "700 12px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(e.w), best.x, best.y + 0.5);
    });

    // nodes
    nodes.forEach((n) => {
      const p = pos[n.id];
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 2;
      if (visited.has(n.id)) { fill = "#eef0f3"; ring = COLORS.faint; text = COLORS.faint; }
      if (done.has(n.id)) { fill = "#e7f7ee"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      if (active.has(n.id)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; rw = 3; }
      if (danger.has(n.id)) { fill = "#fdeaea"; ring = COLORS.red; text = COLORS.red; rw = 3; }
      ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();
      ctx.fillStyle = text; ctx.font = "600 14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(n.label ?? n.id), p.x, p.y);
      // when labels hide the numeric ids (the NFA's states show their RE
      // character), a small id under the node keeps status messages like
      // "accept state 11" discoverable
      if (n.label != null && String(n.label) !== String(n.id)) {
        ctx.fillStyle = COLORS.faint; ctx.font = "500 9px system-ui, sans-serif";
        ctx.fillText(String(n.id), p.x, p.y + R + 8);
      }
    });

    // dist labels — a readable white pill per node. Placement is COLLISION-
    // AWARE: try 8 spots around the node and keep the one farthest from every
    // edge segment, other node, and already-placed pill, so a pill never sits
    // on an edge (which read as "belonging to the edge").
    const segs = edges.map((e) => [pos[e.u], pos[e.v]]).filter(([a, b]) => a && b);
    const distToSeg = (c, a, b) => {
      const abx = b.x - a.x, aby = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * abx + (c.y - a.y) * aby) / (abx * abx + aby * aby || 1)));
      return Math.hypot(c.x - (a.x + t * abx), c.y - (a.y + t * aby));
    };
    const placedPills = [];
    Object.keys(dist).forEach((id) => {
      const p = pos[id];
      if (!p) return;
      const v = dist[id];
      const inf = v === Infinity;
      const txt = inf ? "∞" : String(v);
      ctx.font = inf ? "800 22px system-ui, sans-serif" : "700 15px ui-monospace, Menlo, monospace";
      const tw = ctx.measureText(txt).width;
      const pw = tw + 13, ph = 22;
      let best = null, bestScore = -Infinity;
      for (let k = 0; k < 8; k++) {
        const ang = -Math.PI / 2 + (k * Math.PI) / 4; // start at "above", clockwise
        const cand = { x: p.x + Math.cos(ang) * (R + 17), y: p.y + Math.sin(ang) * (R + 17) };
        cand.x = Math.min(Math.max(cand.x, pw / 2 + 2), W - pw / 2 - 2);
        cand.y = Math.min(Math.max(cand.y, ph / 2 + 2), H - ph / 2 - 2);
        let score = Math.min(60, ...segs.map(([a, b]) => distToSeg(cand, a, b)));
        nodes.forEach((n) => {
          if (String(n.id) === String(id)) return;
          const d = Math.hypot(cand.x - pos[n.id].x, cand.y - pos[n.id].y);
          if (d < R + 18) score -= (R + 18 - d) * 2;
        });
        placedPills.forEach((q) => {
          const d = Math.hypot(cand.x - q.x, cand.y - q.y);
          if (d < 32) score -= (32 - d) * 2;
        });
        if (score > bestScore + 0.5) { bestScore = score; best = cand; } // ties → earlier (top-first)
      }
      placedPills.push(best);
      const cx = best.x, cy = best.y;
      const rr = ph / 2, x0 = cx - pw / 2, y0 = cy - ph / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + rr, y0);
      ctx.lineTo(x0 + pw - rr, y0); ctx.arc(x0 + pw - rr, cy, rr, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x0 + rr, y0 + ph); ctx.arc(x0 + rr, cy, rr, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = inf ? "#c6ccd8" : "#c9bfff"; ctx.stroke();
      ctx.fillStyle = inf ? "#5c6270" : COLORS.accent;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, cx, cy + (inf ? 1 : 0.5));
    });
    ctx.restore();
  }

  /** Text alternative for a snapshot — every vertex and edge in words, so a
   *  screen-reader user can reconstruct the drawing. Player.js puts this on
   *  the canvas's aria-label. */
  describe(snapshot) {
    const nodes = snapshot?.nodes ?? [], edges = snapshot?.edges ?? [];
    if (!nodes.length) return "An empty graph.";
    const weighted = edges.some((e) => e.w != null);
    const dir = edges.length > 0 && edges.every((e) => e.directed ?? this.directed);
    const name = (v) => {
      const n = nodes.find((x) => String(x.id) === String(v));
      return n && n.label != null && String(n.label) !== String(n.id)
        ? `${n.label} (id ${n.id})` : String(v);
    };
    const es = edges.map((e) =>
      ((e.directed ?? this.directed) ? `from ${name(e.u)} to ${name(e.v)}` : `between ${name(e.u)} and ${name(e.v)}`) +
      (e.w != null ? ` with weight ${e.w}` : ""));
    const kind = (dir ? "directed" : "undirected") + (weighted ? " weighted" : "");
    const art = dir ? "A" : "An";
    const vs = nodes.map((n) => name(n.id)).join(", ");
    return `${art} ${kind} graph with ${nodes.length} vertices: ${vs}.` +
      (es.length ? ` Its ${es.length} edges are: ${es.join("; ")}.` : " It has no edges.");
  }
}
