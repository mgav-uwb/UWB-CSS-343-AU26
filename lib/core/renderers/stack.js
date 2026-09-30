// CSS 343 unified library: core/renderers/stack.js
// The CALL STACK as a picture. A snapshot carries `stack`, an array of frames
// with the BOTTOM of the stack first:
//
//   { stack: [ { title, lines: [..], state }, … ], legend?, maxDepth? }
//
//   title   what was called, e.g. "factorial(3)" or "countK(1, 2, 3)"
//   lines   the frame's locals and pending expression, top to bottom
//   state   "run"    the frame that is executing (the top of the stack)
//           "wait"   suspended on a call it made
//           "return" about to be popped, carrying its result
//
// Frames grow UPWARD from the bottom edge, the way a stack is drawn on a
// board, so a push adds a box on top and a pop removes it. Reads the same
// frame object the TreeRenderer reads `tree` from: one snapshot, two views.

import { sizeCanvas } from "../render-config.js";

const C = {
  ink: "#1a1c22", dim: "#66708a", faint: "#9aa3b5", line: "#d7dbe6",
  run: "#7c5cff", runFill: "#f3f0ff", runInk: "#3a2f7a",
  ret: "#0a7d4d", retFill: "#e7f7ee", retInk: "#0a5c39",
  waitFill: "#fafbfd",
};

export class StackRenderer {
  /** @param {HTMLCanvasElement} canvas
   *  @param {{minSlots?:number, title?:string}} [opts] minSlots: frames are sized as if
   *  the stack held at least this many, so two frames do not fill the panel */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.baseW = this.W; this.baseH = this.H;
    this.minSlots = opts.minSlots ?? 4;
    this.title = opts.title ?? "call stack";
  }

  draw(snapshot) {
    this._last = [snapshot, {}];
    sizeCanvas(this, this.baseW, this.baseH);          // crisp text at the displayed size
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);
    const stack = (snapshot && snapshot.stack) || [];
    const PAD = 10, TOP = snapshot && snapshot.legend ? 40 : 26, GAP = 5;

    // heading: what this panel is, how deep it is now and how deep it has been
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    ctx.font = "700 12px system-ui, sans-serif"; ctx.fillStyle = C.dim;
    ctx.fillText(this.title.toUpperCase(), PAD, 8);
    const depth = stack.length, max = (snapshot && snapshot.maxDepth) || depth;
    ctx.textAlign = "right"; ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText(`depth ${depth} · max ${max}`, W - PAD, 8);
    if (snapshot && snapshot.legend) {
      ctx.textAlign = "left"; ctx.font = "600 11px ui-monospace, Menlo, monospace";
      ctx.fillStyle = C.faint; ctx.fillText(snapshot.legend, PAD, 24);
    }

    // the floor the stack stands on
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD - 4, H - PAD + 3); ctx.lineTo(W - PAD + 4, H - PAD + 3); ctx.stroke();
    if (!stack.length) {
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "600 12px system-ui, sans-serif"; ctx.fillStyle = C.faint;
      ctx.fillText("empty", W / 2, (TOP + H) / 2);
      return;
    }

    const slots = Math.max(this.minSlots, stack.length);
    const fh = Math.min(66, (H - TOP - PAD - GAP * (slots - 1)) / slots);
    const maxLines = fh >= 50 ? 2 : fh >= 34 ? 1 : 0;   // what fits under the title
    const titlePx = fh >= 30 ? 13 : Math.max(9, Math.floor(fh * 0.5));
    const linePx = 12;

    stack.forEach((f, i) => {
      const y = H - PAD - (i + 1) * fh - i * GAP;
      const isTop = i === stack.length - 1;
      let stroke = C.line, fill = C.waitFill, ink = C.dim, lw = 1.5;
      if (f.state === "run") { stroke = C.run; fill = C.runFill; ink = C.runInk; lw = 2.5; }
      if (f.state === "return") { stroke = C.ret; fill = C.retFill; ink = C.retInk; lw = 2.5; }
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(PAD, y, W - 2 * PAD, fh, 7); else ctx.rect(PAD, y, W - 2 * PAD, fh);
      ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();

      // the newest lines win; slice(-0) would return them ALL, hence the guard
      const lines = maxLines > 0 ? (f.lines || []).slice(-maxLines) : [];
      const block = titlePx + lines.length * (linePx + 3);
      let ty = y + (fh - block) / 2;
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.font = `700 ${titlePx}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = f.state === "wait" ? C.dim : ink;
      ctx.fillText(this._fit(f.title, W - 2 * PAD - 16), PAD + 8, ty);
      ty += titlePx + 3;
      ctx.font = `600 ${linePx}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = f.state === "wait" ? C.faint : ink;
      lines.forEach((ln) => { ctx.fillText(this._fit(ln, W - 2 * PAD - 16), PAD + 8, ty); ty += linePx + 3; });
      if (isTop && f.state !== "return") {
        // a small marker on the frame that is executing
        ctx.fillStyle = C.run; ctx.beginPath();
        ctx.moveTo(W - PAD - 14, y + fh / 2 - 5); ctx.lineTo(W - PAD - 6, y + fh / 2); ctx.lineTo(W - PAD - 14, y + fh / 2 + 5);
        ctx.closePath(); ctx.fill();
      }
    });
  }

  /** shorten a line that would run past the frame, keeping its start */
  _fit(text, maxW) {
    const ctx = this.ctx;
    let s = String(text ?? "");
    if (ctx.measureText(s).width <= maxW) return s;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
  }

  /** Text alternative: the frames from the top of the stack down. */
  describe(snapshot) {
    const stack = (snapshot && snapshot.stack) || [];
    if (!stack.length) return "The call stack is empty.";
    return `Call stack, ${stack.length} deep, top first: `
      + stack.slice().reverse().map((f) => `${f.title} (${f.state === "run" ? "running" : f.state === "return" ? "returning" : "waiting"}${f.lines && f.lines.length ? ": " + f.lines.join(", ") : ""})`).join("; ") + ".";
  }
}
