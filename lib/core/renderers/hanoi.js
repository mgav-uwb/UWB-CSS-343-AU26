// CSS 343 unified library: core/renderers/hanoi.js
// THREE PEGS AND A PILE OF DISKS. Snapshot contract:
//
//   { pegs: [[disk, …], [..], [..]], n, moves, optimal, mode, sel?, last?, hint? }
//
//   pegs     bottom first; disk 1 is the smallest, disk n the largest
//   sel      a peg index whose top disk is "picked up" (game mode): drawn lifted
//   last     {disk, from, to}: the move just made, drawn with an arc from → to
//   hint     {disk, from, to}: a suggested move, drawn as a dashed arc
//   mode     "auto" | "done" | "play" | "won" | "idle", for the corner readout
//
// pegAt(x) maps a click (in design units) to a peg index, for the game.

import { sizeCanvas } from "../render-config.js";
import { symbolColor } from "../palette.js";

const C = { ink: "#1a1c22", dim: "#66708a", faint: "#9aa3b5", base: "#c9cfdb", peg: "#b3bac9",
  sel: "#7c5cff", last: "#0a7d4d", hint: "#d08a00", won: "#0a7d4d" };
const NAMES = ["A", "B", "C"];

export class HanoiRenderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height; this.baseW = this.W; this.baseH = this.H;
    this.opts = opts;
  }

  _geom(n) {
    // bands, top to bottom: readout, move arrows, a lifted disk, the pegs
    const W = this.W, H = this.H, PAD = 14, ARC = 66, FLOOR = H - 30;
    const colW = (W - 2 * PAD) / 3;
    const maxW = colW - 14, minW = Math.min(30, maxW * 0.3);
    const dh = Math.min(24, (FLOOR - ARC - 14) / (Math.max(n, 3) + 1.4));
    const LIFT = ARC + 8, TOP = LIFT + dh + 6;
    const wOf = (d) => n <= 1 ? maxW * 0.5 : minW + (maxW - minW) * (d - 1) / (n - 1);
    const cx = (p) => PAD + colW * (p + 0.5);
    return { PAD, ARC, LIFT, TOP, FLOOR, colW, dh, wOf, cx };
  }

  pegAt(x) {
    const { PAD, colW } = this._geom(3);
    const p = Math.floor((x - PAD) / colW);
    return p >= 0 && p <= 2 ? p : null;
  }

  draw(s) {
    this._last = s;
    sizeCanvas(this, this.baseW, this.baseH);
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);
    if (!s || !s.pegs) return;
    const n = s.n || 1, g = this._geom(n);

    // readout: moves against the minimum
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.font = "700 12px system-ui, sans-serif"; ctx.fillStyle = C.dim;
    const what = s.mode === "play" || s.mode === "won" ? "GAME" : "RECURSIVE SOLUTION";
    ctx.fillText(`${what} · ${n} ${n === 1 ? "DISK" : "DISKS"}`, g.PAD, 8);
    ctx.textAlign = "right"; ctx.font = "700 14px system-ui, sans-serif";
    ctx.fillStyle = s.mode === "won" ? C.won : C.ink;
    ctx.fillText(`moves ${s.moves}  ·  minimum ${s.optimal}`, W - g.PAD, 6);
    if (s.mode === "won") {
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.fillText(s.moves === s.optimal ? "solved in the minimum" : `solved, ${s.moves - s.optimal} over the minimum`, W - g.PAD, 24);
    }

    // floor, pegs, labels
    ctx.fillStyle = C.base;
    ctx.fillRect(g.PAD, g.FLOOR, W - 2 * g.PAD, 6);
    for (let p = 0; p < 3; p++) {
      const x = g.cx(p), sel = s.sel === p;
      ctx.fillStyle = sel ? C.sel : C.peg;
      ctx.fillRect(x - 3, g.TOP, 6, g.FLOOR - g.TOP);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.font = "700 14px system-ui, sans-serif"; ctx.fillStyle = sel ? C.sel : C.dim;
      ctx.fillText(NAMES[p], x, g.FLOOR + 10);
    }

    // disks; the selected peg's top disk is lifted above its peg
    const pos = {};
    s.pegs.forEach((stack, p) => stack.forEach((d, i) => {
      let y = g.FLOOR - (i + 1) * g.dh;
      const lifted = s.sel === p && i === stack.length - 1;
      if (lifted) y = g.LIFT;
      pos[d] = { x: g.cx(p), y, lifted };
      this._disk(d, g.cx(p), y, g.wOf(d), g.dh - 2, n, {
        lifted, last: s.last && s.last.disk === d, hint: s.hint && s.hint.disk === d,
      });
    }));

    if (s.last && pos[s.last.disk]) this._arc(g, s.last.from, s.last.to, C.last, false);
    if (s.hint) this._arc(g, s.hint.from, s.hint.to, C.hint, true);
  }

  _disk(d, x, y, w, h, n, f) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y, w, h, Math.min(8, h / 2)); else ctx.rect(x - w / 2, y, w, h);
    ctx.fillStyle = symbolColor(d - 1); ctx.fill();
    ctx.lineWidth = f.lifted || f.hint || f.last ? 3 : 1;
    ctx.strokeStyle = f.lifted ? C.sel : f.hint ? C.hint : f.last ? C.last : "rgba(0,0,0,0.25)";
    ctx.stroke();
    if (h >= 12) {
      ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.min(13, h - 3)}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(d), x, y + h / 2 + 0.5);
    }
  }

  /** an arrow over the pegs from one to another */
  _arc(g, a, b, color, dashed) {
    const ctx = this.ctx, x1 = g.cx(a), x2 = g.cx(b), y = g.ARC;
    const mid = (x1 + x2) / 2, lift = 14 + Math.abs(b - a) * 5;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2; if (dashed) ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo(mid, y - lift, x2, y); ctx.stroke();
    ctx.setLineDash([]);
    const dir = Math.sign(x2 - x1) || 1;              // arrowhead at the target, pointing down
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2, y + 2); ctx.lineTo(x2 - 7 * dir, y - 8); ctx.lineTo(x2 + 2 * dir, y - 9); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  describe(s) {
    if (!s || !s.pegs) return "";
    const pegs = s.pegs.map((st, p) => `peg ${NAMES[p]}: ${st.length ? st.join(", ") : "empty"}`).join("; ");
    return `Towers of Hanoi, ${s.n} disks, bottom first. ${pegs}. ${s.moves} moves of a minimum ${s.optimal}.`;
  }
}
