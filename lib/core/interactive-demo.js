// CSS 343 unified library — core/interactive-demo.js
// The CLICK-A-NODE interaction pattern: a LIVE structure you manipulate by
// clicking a node to select it, then running an operation that acts on the
// selection (op dropdown + Run in the shared ControlBar; the arg box stays
// disabled — the SELECTION is the argument). Each op returns a Trace (or
// {trace, sel} to move the selection). For the "rotate any subtree" demo.
// Requires the renderer to expose nodeAt().
//
// spec = {
//   make, initial, renderer,          // renderer must implement nodeAt(px,py)
//   ops: [ { name, ghost?, needsSel?, autoplay?, run:(structure, selKey)=>Trace|{trace,sel} } ],
//   selectMsg?:(key)=>string, hint?, autoSelect?, defaultOp?, help?,
//   costs?, chrome?, width?, height?
// }

import { Player } from "./player.js";
import { Tracer } from "./tracer.js";
import { ControlBar } from "./control-bar.js";

const parse = (s) => (String(s ?? "").match(/-?\d+/g) || []).map(Number);

export class InteractiveDemo {
  constructor(mount, spec) {
    this.spec = spec;
    this.s = spec.make();
    if (spec.initial && this.s.build) this.s.build(parse(spec.initial));
    this.sel = spec.autoSelect ?? null;

    const root = document.createElement("div"); root.className = "u-interactive";
    this.bar = new ControlBar(root, {
      ops: spec.ops || [],
      defaultOp: spec.defaultOp,
      help: spec.help,
      showInitial: false, showBuild: false, showReset: true,
      argDisabled: true,
      valPlaceholder: "click a node",
    }, {
      reset: () => this._reset(),
      run: (op) => { if (op) this._run(op); },
    });
    const pm = document.createElement("div"); root.appendChild(pm);
    mount.appendChild(root);

    const chrome = Object.assign({ mini: true, showScrub: false, showCosts: !!spec.costs }, spec.chrome || {});
    this.player = new Player(pm, (c) => { this._renderer = spec.renderer(c); this._canvas = c; return this._renderer; },
      { width: spec.width, height: spec.height, costs: spec.costs, showScrub: chrome.showScrub, showCosts: chrome.showCosts, mini: chrome.mini });
    this._canvas.style.cursor = "pointer";
    this._canvas.addEventListener("click", (e) => this._click(e));
    this._show(this.sel != null ? this._selMsg(this.sel) : (spec.hint || "click a node to select it"));
  }

  _selMsg(k) { return this.spec.selectMsg ? this.spec.selectMsg(k) : `selected ${k} — pick an operation`; }
  _show(msg) { const t = new Tracer(); t.step(msg, { snapshot: this.s.snapshot(), highlight: this.sel != null ? { cur: this.sel } : {} }); this.player.load(t.trace()); }

  _click(e) {
    const c = this._canvas, r = c.getBoundingClientRect();
    // the bitmap is now displayed-size x DPR, so convert to the renderer's
    // DESIGN units (what nodeAt's positions are in), not to bitmap pixels
    const S = this._renderer.scale || (c.width / r.width);
    const px = (e.clientX - r.left) * (c.width / r.width) / S,
      py = (e.clientY - r.top) * (c.height / r.height) / S;
    const k = this._renderer.nodeAt ? this._renderer.nodeAt(px, py) : null;
    if (k != null) { this.sel = k; this._show(this._selMsg(k)); }
  }

  _run(op) {
    if (op.needsSel !== false && this.sel == null) { this._show("select a node first (click one)"); return; }
    const res = op.run(this.s, this.sel);
    if (!res) { this._show("(operation not applicable)"); return; }
    const trace = res.frames ? res : res.trace;
    if (res && !res.frames && res.sel !== undefined) this.sel = res.sel; // {trace, sel}
    this.player.load(trace);
    if (op.autoplay !== false) this.player.play();
  }

  _reset() {
    this.s = this.spec.make();
    if (this.spec.initial && this.s.build) this.s.build(parse(this.spec.initial));
    this.sel = this.spec.autoSelect ?? null;
    this._show(this.sel != null ? this._selMsg(this.sel) : (this.spec.hint || "click a node to select it"));
  }
}
