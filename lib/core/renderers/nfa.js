// CSS 343 unified library — core/renderers/nfa.js
// Sedgewick-style renderer for the regex NFA: states on ONE line (state i at
// position i, its regex character beneath it, the accept state double-ringed),
// char-match transitions as straight arrows along the line, ε-transitions as
// RED curved arcs — forward arcs above the row, backward (star-repeat) arcs
// below — mirroring the print book's §5.4 figures. Transition labels keep the
// GraphRenderer bubble style (a white pill riding on the edge). When the
// snapshot carries `input`/`pos`, an input strip is drawn across the top with
// the consumed prefix tinted and the last consumed character filled.
//
// snapshot = { nodes:[{id,label,kind}], edges:[{u,v,w,directed}],
//              input?:string, pos?:int }    (x/y from the old zigzag ignored)
// highlight = { nodes:{active?,fresh?,done?,danger?},
//               edges:{usedEps?,active?  → light ε arcs,
//                      used?,tree?       → light match edges} }
// (two hot sets, because a starred letter's ε and match edges share a pair)

import { sizeCanvas } from "../render-config.js";

const C = {
  ink: "#1a1c22", dim: "#9aa3b5", line: "#5c6270",
  eps: "#c8402f",                 // Sedgewick red for the free moves
  accent: "#7c5cff", accentBg: "#f3f0ff",
  green: "#0a7d4d", greenBg: "#e7f7ee",
  red: "#b3261e", redBg: "#fdeaea",
  chip: "#eef0f5",
};

const pairSet = (arr) => new Set((arr ?? []).map(([u, v]) => `${u}>${v}`));
const idSet = (arr) => new Set(arr ?? []);

export class NfaRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.opts = opts;
    this.zoom = 1;
    this.baseW = this.W; this.baseH = this.H;
  }

  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl];
    const z = this.zoom ?? 1;
    sizeCanvas(this, this.baseW * z, this.baseH * z);
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    if (!snapshot || !snapshot.nodes) return;
    ctx.save(); ctx.scale(z, z);
    const W = this.baseW, H = this.baseH;

    const nodes = snapshot.nodes, m = nodes.length - 1;
    const hasStrip = snapshot.input != null;
    const stripH = hasStrip ? 40 : 0;

    // the row of states sits low enough that forward arcs clear the strip
    const midY = stripH + (H - stripH) * 0.56;
    const pad = 34;
    const dx = (W - 2 * pad) / Math.max(m, 1);
    const r = Math.max(9, Math.min(16, dx * 0.34));
    const X = (i) => pad + i * dx, Y = midY;

    const nAct = idSet(hl.nodes?.active), nFresh = idSet(hl.nodes?.fresh),
      nDone = idSet(hl.nodes?.done), nDanger = idSet(hl.nodes?.danger);
    // ε and match edges can share a state pair (a starred letter), so each
    // kind has its own hot set: `active`/`usedEps` light ε arcs, `tree`/`used`
    // light match edges
    const epsHot = pairSet([...(hl.edges?.usedEps ?? []), ...(hl.edges?.active ?? [])]);
    const matchHot = pairSet([...(hl.edges?.used ?? []), ...(hl.edges?.tree ?? [])]);

    // ---- input strip ----
    if (hasStrip) {
      const text = snapshot.input, pos = snapshot.pos ?? 0;
      const cw = Math.min(26, Math.max(16, (W - 120) / Math.max(text.length, 1)));
      const x0 = (W - cw * text.length) / 2;
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillStyle = C.dim; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText("input", x0 - 10, 20);
      ctx.font = `700 ${Math.min(15, cw - 5)}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center";
      for (let k = 0; k < text.length; k++) {
        const cx = x0 + k * cw;
        const consumed = k < pos, last = k === pos - 1;
        ctx.fillStyle = last ? C.accent : consumed ? C.accentBg : C.chip;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx + 1, 7, cw - 2, 26, 6); else ctx.rect(cx + 1, 7, cw - 2, 26);
        ctx.fill();
        ctx.fillStyle = last ? "#fff" : consumed ? "#4b3ccc" : C.ink;
        ctx.fillText(text[k], cx + cw / 2, 21);
      }
    }

    const arrow = (x, y, ang, color) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -3.4); ctx.lineTo(-7, 3.4); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
    };
    const bubble = (x, y, txt, color, hot) => {
      ctx.font = `700 ${hot ? 12.5 : 11}px ui-monospace, Menlo, monospace`;
      const w = ctx.measureText(txt).width;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2 - 5, y - 9, w + 10, 18, 9); else ctx.rect(x - w / 2 - 5, y - 9, w + 10, 18);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = hot ? 1.8 : 1.1; ctx.strokeStyle = color; ctx.stroke();
      ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, x, y + 0.5);
    };

    // ---- ε arcs (drawn first, under the nodes) ----
    const eps = snapshot.edges.filter((e) => e.w === "ε");
    const matches = snapshot.edges.filter((e) => e.w !== "ε");
    for (const e of eps) {
      const hot = epsHot.has(`${e.u}>${e.v}`);
      const fwd = e.v > e.u, span = Math.abs(e.v - e.u);
      const x1 = X(e.u), x2 = X(e.v);
      // forward arcs rise above the row, backward (repeat) arcs dip below;
      // height grows with span so long arcs clear short ones. Clamped so the
      // curve's peak (halfway between endpoint and control point) stays
      // inside the canvas and clear of the input strip.
      const liftRaw = (r + 10) + span * Math.min(28, dx * 0.48);
      const maxLift = fwd ? Math.max(24, 2 * (Y - stripH - 14) - r)
        : Math.max(24, 2 * (H - 14 - Y) - r);
      const lift = Math.min(liftRaw, maxLift);
      const cy = fwd ? Y - lift : Y + lift;
      const y1 = fwd ? Y - r : Y + r, y2 = y1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, cy, x2, y2);
      ctx.lineWidth = hot ? 3 : 1.6;
      ctx.strokeStyle = hot ? C.eps : "#d98277";
      ctx.stroke();
      // arrowhead: tangent at the end of the quadratic
      const ang = Math.atan2(y2 - cy, x2 - (x1 + x2) / 2);
      arrow(x2, y2, ang, hot ? C.eps : "#d98277");
      bubble((x1 + x2) / 2, (y1 + cy) / 2, "ε", hot ? C.eps : "#d98277", hot);
    }

    // ---- char-match edges: straight along the line ----
    for (const e of matches) {
      const hot = matchHot.has(`${e.u}>${e.v}`);
      const x1 = X(e.u) + r, x2 = X(e.v) - r;
      ctx.beginPath(); ctx.moveTo(x1, Y); ctx.lineTo(x2, Y);
      ctx.lineWidth = hot ? 3 : 1.8;
      ctx.strokeStyle = hot ? C.green : C.line;
      ctx.stroke();
      arrow(x2, Y, 0, hot ? C.green : C.line);
      bubble((x1 + x2) / 2, Y, String(e.w), hot ? C.green : C.line, hot);
    }

    // ---- states ----
    ctx.textAlign = "center";
    for (const n of nodes) {
      const i = n.id, x = X(i);
      let fill = "#fff", ring = C.ink, txtC = C.ink, lw = 1.6;
      if (nAct.has(i)) { fill = C.accent; ring = C.accent; txtC = "#fff"; lw = 2; }
      if (nFresh.has(i)) { fill = C.accent; ring = C.green; txtC = "#fff"; lw = 3; }
      if (nDone.has(i)) { fill = C.green; ring = C.green; txtC = "#fff"; lw = 2.4; }
      if (nDanger.has(i)) { fill = C.red; ring = C.red; txtC = "#fff"; lw = 2; }
      ctx.beginPath(); ctx.arc(x, Y, r, 0, 2 * Math.PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = lw; ctx.strokeStyle = ring; ctx.stroke();
      if (i === m) { ctx.beginPath(); ctx.arc(x, Y, r - 3.5, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.fillStyle = txtC; ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.min(12.5, r)}px system-ui, sans-serif`;
      ctx.fillText(String(i), x, Y);
      // the state's regex character, beneath — the encoding made visible
      ctx.fillStyle = nAct.has(i) || nFresh.has(i) ? C.accent : C.dim;
      ctx.font = `700 ${Math.min(14, r + 1)}px ui-monospace, Menlo, monospace`;
      ctx.fillText(i === m ? "acc" : String(n.label ?? ""), x, Y + r + 13);
    }
    ctx.restore();
  }

  /** Text alternative: the machine plus the current input position. */
  describe(snap) {
    if (!snap || !snap.nodes) return "An NFA.";
    const m = snap.nodes.length - 1;
    const eps = snap.edges.filter((e) => e.w === "ε").length;
    let s = `An NFA with ${m + 1} states in a row (state ${m} accepts), ${eps} epsilon transitions drawn as red arcs, and ${snap.edges.length - eps} character transitions along the line.`;
    if (snap.input != null) s += ` Input "${snap.input}", ${snap.pos ?? 0} of ${snap.input.length} characters consumed.`;
    return s;
  }
}
