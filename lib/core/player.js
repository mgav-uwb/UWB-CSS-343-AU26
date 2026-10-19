// CSS 343 unified library — core/player.js
// The shared transport. Given a Trace it renders any frame and lets you move
// forward, BACKWARD, jump, scrub, and play at a chosen speed. Because the whole
// run is recorded up front, stepping back is O(1) (just render an earlier frame)
// — no algorithm needs to implement an "undo". A cost panel shows the primitive-
// operation counters at the current step (the S01/S02 cost model, live).
//
// makeRenderer may be a single factory, or an ARRAY of factories for a
// multi-view Player (e.g. array + mirror tree) — one canvas per factory,
// stacked vertically, all fed the SAME frame from the one shared Trace.
// opts.layout = "row" puts them SIDE BY SIDE instead (a tree with its call
// stack beside it): opts.cols gives each canvas its design width, and they
// share one height, so both are displayed at the same scale.
//
// The transport row is the SAME on every demo, deck slide or gallery, and
// matches DualDemo's: ⏮ restart · ◀ step · ▶ · step ▶ · ⏩ 1024× · speed.
// ⏩ sweeps the rest of the trace at 1024× the current speed (see finish()).

import { costLabel } from "./tracer.js";
import { attachPanZoom } from "./viewport.js";

const SPEEDS = [0.5, 1, 2, 4, 8, 16, 32];

export class Player {
  /**
   * @param {HTMLElement} mount
   * @param {((canvas:HTMLCanvasElement)=>{draw:(snap:any,hl:any)=>void}) |
   *          Array<(canvas:HTMLCanvasElement)=>{draw:(snap:any,hl:any)=>void}>} makeRenderer
   * @param {{width?:number,height?:number|number[],labels?:string[],costs?:string[],
   *          showScrub?:boolean,showCosts?:boolean,costsInline?:boolean,mini?:boolean}} [opts]
   *   showScrub/showCosts (default true) select the FULL sandbox chrome vs. a
   *   SIMPLIFIED per-slide lecture view. `mini` is accepted and ignored: it
   *   used to hide ⏮/⏭ on slides, but restart and finish are standard on
   *   every demo now. height may be
   *   a single number (applied to every canvas) or an array parallel to
   *   makeRenderer (e.g. a short array strip + a taller tree below).
   */
  constructor(mount, makeRenderer, opts = {}) {
    const factories = Array.isArray(makeRenderer) ? makeRenderer : [makeRenderer];
    this.W = opts.width ?? 880;
    const heights = Array.isArray(opts.height) ? opts.height : factories.map(() => opts.height ?? 320);
    const row = opts.layout === "row" && factories.length > 1;
    const cols = row
      ? (Array.isArray(opts.cols) && opts.cols.length === factories.length
        ? opts.cols : factories.map(() => Math.round(this.W / factories.length)))
      : factories.map(() => this.W);
    this.costs = opts.costs ?? null; // which counters to show; null = all present
    this.trace = null; this.i = 0; this.timer = null; this.speed = 1;
    this._sweepId = 0; this._sweeping = false; // the ⏩ finish sweep (see finish())

    const labels = opts.labels || [];
    const canvasHTML = factories.map((_, idx) => `
      <div class="u-canvas-wrap"${row ? ` style="flex:${cols[idx]} 1 0"` : ""}>
        ${labels[idx] ? `<div class="u-canvas-label">${labels[idx]}</div>` : ""}
        <canvas width="${cols[idx]}" height="${heights[idx]}"></canvas>
      </div>`).join("");

    const root = document.createElement("div"); root.className = "u-player";
    root.innerHTML = `
      ${row ? `<div class="u-row">${canvasHTML}</div>` : canvasHTML}
      <div class="u-status"></div>
      <div class="u-transport">
        <button data-a="first" title="restart: back to the first frame">⏮</button>
        <button data-a="back" title="step back">◀ step</button>
        <button data-a="play" class="u-play" title="play / pause">▶</button>
        <button data-a="fwd" title="step forward">step ▶</button>
        <button data-a="finish" title="finish: sweep to the last frame at 1024× (press again to jump to the end)">⏩ 1024×</button>
        <label class="u-speed">speed
          <select>${SPEEDS.map((s) => `<option value="${s}"${s === 1 ? " selected" : ""}>${s}×</option>`).join("")}</select>
        </label>
        <span class="u-frame"></span>
      </div>
      <input class="u-scrub" type="range" min="0" max="0" value="0" step="1">
      <div class="u-costs"></div>`;
    mount.appendChild(root);
    this.el = root;
    this.canvases = Array.from(root.querySelectorAll("canvas"));
    this.viewLabels = labels;
    // accessibility: canvases are images (aria-label set per frame in
    // _render), the status line announces each step, and the icon-only
    // transport buttons get spoken names from their tooltips
    this.canvases.forEach((cv) => cv.setAttribute("role", "img"));
    root.querySelector(".u-status").setAttribute("aria-live", "polite");
    root.querySelectorAll("button[title]").forEach((b) => b.setAttribute("aria-label", b.title));
    root.querySelector(".u-scrub").setAttribute("aria-label", "step scrubber");
    this.renderers = factories.map((make, idx) => make(this.canvases[idx]));
    this.renderers.forEach((r, idx) => attachPanZoom(this.canvases[idx], r)); // no-op for non-scaling renderers
    this.canvas = this.canvases[0]; this.renderer = this.renderers[0]; // back-compat single-view alias
    this.$status = root.querySelector(".u-status");
    this.$frame = root.querySelector(".u-frame");
    this.$scrub = root.querySelector(".u-scrub");
    this.$costs = root.querySelector(".u-costs");
    this.$play = root.querySelector(".u-play");

    // ⏮ keeps a running playback running, from frame 0 (the timer reads this.i)
    root.querySelector('[data-a="first"]').onclick = () => { this._stopSweep(); this.seek(0); };
    root.querySelector('[data-a="back"]').onclick = () => { this._stopSweep(); this.pause(); this.step(-1); };
    root.querySelector('[data-a="fwd"]').onclick = () => { this._stopSweep(); this.pause(); this.step(1); };
    root.querySelector('[data-a="finish"]').onclick = () => this.finish();
    this.$play.onclick = () => this.toggle();
    root.querySelector(".u-speed select").onchange = (e) => { this.speed = +e.target.value; if (this.timer) { this.pause(); this.play(); } };
    this.$scrub.oninput = (e) => { this._stopSweep(); this.pause(); this.seek(+e.target.value); };

    // two-tier chrome: hide pieces for a simplified per-slide lecture view.
    // finer-grained show* flags (spec.chrome via FullDemo, or direct Player
    // opts) individually hide the play button, the speed picker, or the
    // whole transport row — each defaults to visible
    if (opts.showScrub === false) this.$scrub.style.display = "none";
    if (opts.showCosts === false) this.$costs.style.display = "none";
    if (opts.showPlay === false) this.$play.style.display = "none";
    if (opts.showSpeed === false) root.querySelector(".u-speed").style.display = "none";
    if (opts.showTransport === false) root.querySelector(".u-transport").style.display = "none";
    // costsInline: the counters move INTO the transport row, in the gap after
    // the speed picker and before the frame counter (which keeps its
    // margin-left:auto). A row of chips under the scrubber is a whole line of
    // vertical space spent on two numbers; the transport row already has the
    // width to spare. Off by default — the standing layout is unchanged.
    if (opts.costsInline) {
      const t = root.querySelector(".u-transport");
      t.insertBefore(this.$costs, root.querySelector(".u-frame"));
      this.$costs.classList.add("u-costs-inline");
    }
  }

  /** Load a Trace and reset to frame 0. */
  load(trace) {
    this._stopSweep(); this.pause(); this.trace = trace; this.i = 0;
    this.$scrub.max = String(Math.max(0, trace.length - 1));
    this._render();
    return this;
  }

  _render() {
    if (!this.trace || !this.trace.length) return;
    const f = this.trace.at(this.i);
    this.renderers.forEach((r, idx) => {
      r.draw(f.snapshot, f.highlight);
      // descriptive alt text per frame: view label + step message + a full
      // structural description from the renderer (recreatable content)
      const parts = [this.viewLabels?.[idx], f.msg,
        typeof r.describe === "function" ? r.describe(f.snapshot) : null];
      this.canvases[idx].setAttribute("aria-label",
        parts.filter(Boolean).join(". ") || "algorithm visualization");
    });
    this.$status.textContent = f.msg || "";
    this.$frame.textContent = `${this.i + 1} / ${this.trace.length}`;
    this.$scrub.value = String(this.i);
    const ks = this.costs || Object.keys(f.counters);
    this.$costs.innerHTML = ks.length
      ? ks.map((k) => `<span class="u-chip"><b>${f.counters[k] || 0}</b> ${costLabel(k, f.counters[k] || 0)}</span>`).join("")
      : '<span class="u-chip u-chip-dim">no operations counted yet</span>';
  }

  seek(i) { if (!this.trace) return; this.i = Math.max(0, Math.min(this.trace.length - 1, i)); this._render(); }
  step(d) { this.seek(this.i + d); }

  play() {
    if (!this.trace) return;
    this._stopSweep();
    if (this.i >= this.trace.length - 1) this.seek(0); // at the end → restart
    this.$play.textContent = "⏸"; this.$play.classList.add("on");
    this.timer = setInterval(() => {
      if (this.i >= this.trace.length - 1) { this.pause(); return; }
      this.step(1);
      if (this.trace.at(this.i).pause) this.pause(); // predict-and-continue: halt on a pause frame
    }, 900 / this.speed);
  }
  pause() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.$play.textContent = "▶"; this.$play.classList.remove("on"); }
  toggle() { this.timer ? this.pause() : this.play(); }

  /** ⏩ 1024×: sweep the rest of the trace at 1024× the current speed, pause
   *  frames included, floored at 1.5 s so the counters visibly spin (the same
   *  button and timing as DualDemo's). A second press mid-sweep jumps to the
   *  end; any other transport action cancels the sweep. */
  finish() {
    if (!this.trace) return;
    const last = this.trace.length - 1;
    if (this._sweeping) { this._stopSweep(); this.seek(last); return; }
    this.pause();
    if (this.i >= last) return;
    const id = ++this._sweepId; this._sweeping = true;
    const start = this.i, span = last - start;
    const DUR = Math.max(1500, span * (900 / this.speed) / 1024);
    let t0 = null;
    const tick = (ts) => {
      if (id !== this._sweepId) return;
      if (t0 == null) t0 = ts;
      const p = Math.min(1, (ts - t0) / DUR);
      this.seek(start + Math.round(span * p));
      if (p < 1) requestAnimationFrame(tick); else this._sweeping = false;
    };
    requestAnimationFrame(tick);
  }
  _stopSweep() { this._sweepId++; this._sweeping = false; }
}
