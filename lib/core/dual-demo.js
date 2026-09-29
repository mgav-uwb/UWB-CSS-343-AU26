// CSS 343 unified library — core/dual-demo.js
// The MULTI-PANEL contrast pattern: two or more structures (side by side,
// stacked, or a mixed grid), one operation applied to all, stepped in
// LOCKSTEP — playback runs to the longest trace, so faster versions visibly
// FINISH and freeze while the slowest keeps churning. Each panel's title
// shows a live stat (default: tree height; a custom stat also sees the
// panel's current frame AND the live structure, so it can read cost counters
// or structure fields like a tombstone count). Uses: "plain BST vs AVL"
// (same keys, heights diverge), "naive vs memo vs 2-var fib" (same n, call
// counts diverge), and the delete story (chaining unlink vs probing
// tombstones — driven by a SCRIPT preset that runs op-by-op in lockstep).
// The strip is the shared two-row ControlBar (core/control-bar.js).
//
// spec = {
//   panels: [ { title, make, renderer, op?:(structure,v)=>Trace,
//               ops?: { [opName]: (structure,v)=>Trace },  // per-panel named-op override
//               stat?:(snapshot, frame, structure)=>string,
//               width?, height?,      // per-panel canvas size
//               fullRow? }, … ],      // span the whole grid row
//   op?:(structure, v)=>Trace,        // legacy single op; a panel's own op wins
//   ops?: [ { name, arg?, run:(structure,v,vals)=>Trace } ],  // named ops for the
//                                     // Run dropdown; panels override per name via
//                                     // panel.ops[opName]; `vals` holds the named
//                                     // Build-row inputs (spec.inputs), like FullDemo
//   inputs?: [ {key,label,value?,placeholder?,width?} ],  // named Build-row boxes
//   presets?: [ {name, values?, val?} ],  // Build-row preset dropdown: fills the
//                                     // named inputs and/or the Run value box
//   opArg?: "number"|"numbers"|"string",  // what the value box passes to a legacy op:
//                                     //   the first number (default), the whole
//                                     //   parsed sequence (range syntax works),
//                                     //   or the raw string
//   script?: Array<[opName, value?]>, // preset op SCRIPT for the Run dropdown —
//                                     // executed op-by-op as ONE lockstep trace
//   scriptLabel?: string,             // its dropdown label
//   defaultOp?, help?,                // ControlBar passthroughs
//   opLabel?, valLabel?, placeholder?, initialValue?,   // legacy op-bar chrome
//   stacked?: true,                   // panels one above the other
//   columns?: "3fr 1fr",              // grid-template-columns override
//   speed?: msPerFrame (default 900),
//   speedControl?: true,              // ½×…32× select scaling the lockstep tick
//   finishButton?: true,              // ⏩ 1024× — sweep the remaining frames
//   initial?, sequence?:[keys], width?, height?
// }

import { parseSequence } from "./sequence.js";
import { concatTraces } from "./tracer.js";
import { attachPanZoom } from "./viewport.js";
import { ControlBar } from "./control-bar.js";

const parseNums = (s) => parseSequence(s); // ranges/generators work here too
const treeHeight = (t) => (t ? 1 + Math.max(treeHeight(t.left), treeHeight(t.right)) : -1);
const SPEEDS = [0.5, 1, 2, 4, 8, 16, 32]; // same ladder as the Player's speed select

export class DualDemo {
  constructor(mount, spec) {
    this.spec = spec;
    this.structs = spec.panels.map((pn) => pn.make());
    const keys = parseNums(spec.initial);
    if (keys.length) this.structs.forEach((s) => { if (s.build) s.build(keys); });
    const W = spec.width ?? 420, H = spec.height ?? 280;

    // named ops for the Run dropdown; a legacy single-op spec becomes one entry
    this._legacy = !spec.ops;
    this.ops = spec.ops ?? [{ name: spec.opLabel ?? "Insert into both", arg: spec.opArg ?? "number", run: spec.op }];

    // script presets: an explicit spec.script, plus the legacy whole-sequence replay
    const scripts = [];
    if (spec.script) scripts.push({
      name: spec.scriptLabel ?? "scripted run",
      text: spec.script.map(([o, v]) => `${o}${v != null ? " " + v : ""}`).join("\n"),
    });
    if (spec.sequence) scripts.push({
      name: "whole sequence",
      text: spec.sequence.map((v) => `${this.ops[0].name.split(/\s+/)[0]} ${v}`).join("\n"),
    });

    const root = document.createElement("div"); root.className = "u-dual";
    this.bar = new ControlBar(root, {
      initial: spec.initial ?? "",
      showInitial: spec.initial != null,
      showBuild: spec.initial != null,
      showReset: true,
      inputs: spec.inputs ?? [],
      presets: spec.presets ?? [],
      ops: this.ops.map((o) => ({ name: o.name, arg: o.arg ?? "number", desc: o.desc, requires: o.requires })),
      scripts,
      defaultOp: spec.defaultOp,
      help: spec.help,
      valInitial: spec.initialValue != null ? String(spec.initialValue) : undefined,
      valPlaceholder: spec.placeholder ?? "key",
    }, {
      build: () => this._build(),
      reset: () => this._reset(),
      run: (op, text) => this._runText(op, text),
    });
    const grid = document.createElement("div"); grid.className = "u-dual-grid" + (spec.stacked ? " stacked" : "");
    if (spec.columns) grid.style.gridTemplateColumns = spec.columns;
    this.titles = []; this.renderers = []; this.canvases = [];
    spec.panels.forEach((pn) => {
      const col = document.createElement("div"); col.className = "u-dual-col";
      if (pn.fullRow) col.style.gridColumn = "1 / -1";
      const title = document.createElement("div"); title.className = "u-dual-title"; col.appendChild(title);
      const cv = document.createElement("canvas"); cv.width = pn.width ?? W; cv.height = pn.height ?? H; cv.style.width = "100%"; cv.style.height = "auto"; col.appendChild(cv);
      cv.setAttribute("role", "img"); // aria-label set per frame in _draw
      grid.appendChild(col);
      const rend = pn.renderer(cv, pn.rendererOpts); // extra arg ignored by single-arg factories
      attachPanZoom(cv, rend); // no-op for non-scaling renderers
      this.titles.push(title); this.renderers.push(rend); this.canvases.push(cv);
    });
    root.appendChild(grid);

    const tr = document.createElement("div"); tr.className = "u-transport";
    tr.innerHTML = `<button data-a="back">◀ step</button><button class="u-play" data-a="play">▶</button><button data-a="fwd">step ▶</button>`
      + (spec.finishButton ? `<button data-a="finish">⏩ 1024×</button>` : "")
      + (spec.speedControl ? `<label class="u-speed">speed
          <select>${SPEEDS.map((s) => `<option value="${s}"${s === 1 ? " selected" : ""}>${s}×</option>`).join("")}</select>
        </label>` : "")
      + `<span class="u-frame"></span>`;
    root.appendChild(tr);
    this.$scrub = document.createElement("input"); this.$scrub.type = "range"; this.$scrub.className = "u-scrub"; this.$scrub.min = 0; this.$scrub.max = 0; root.appendChild(this.$scrub);
    this.$status = document.createElement("div"); this.$status.className = "u-status"; root.appendChild(this.$status);
    mount.appendChild(root);

    this.$frame = tr.querySelector(".u-frame"); this.$play = tr.querySelector(".u-play");
    // accessibility: the icon-only play button gets a spoken name, the status
    // line announces each step, and the scrubber is labeled
    this.$play.setAttribute("aria-label", "play / pause");
    this.$status.setAttribute("aria-live", "polite");
    this.$scrub.setAttribute("aria-label", "step scrubber");
    tr.querySelector('[data-a="back"]').onclick = () => { this._pause(); this._seek(this.i - 1); };
    tr.querySelector('[data-a="fwd"]').onclick = () => { this._pause(); this._seek(this.i + 1); };
    const fin = tr.querySelector('[data-a="finish"]'); if (fin) fin.onclick = () => this._finish();
    this.$play.onclick = () => (this.timer ? this._pause() : this._play());
    this.$scrub.oninput = (e) => { this._pause(); this._seek(+e.target.value); };
    this.speedMult = 1;
    const sel = tr.querySelector(".u-speed select");
    if (sel) sel.onchange = () => { this.speedMult = +sel.value; if (this.timer) this._startTimer(); };

    this.traces = spec.panels.map(() => null); this.i = 0; this.len = 1; this.timer = null; this.sweep = 0;
    this._state();
    // onMount: the finished demo handed to the spec — lets a DOM view wire its
    // own controls (an example picker filling the value box, say), mirroring
    // FullDemo's hook of the same name.
    if (spec.onMount) spec.onMount(this);
  }

  /** Panel k's implementation of a named op: panel.ops[name] wins, then the
   *  legacy panel.op (single-op specs), then the shared entry. */
  _panelRun(k, op) {
    const pn = this.spec.panels[k];
    if (pn.ops && pn.ops[op.name]) return pn.ops[op.name];
    if (this._legacy && pn.op) return pn.op;
    return op.run;
  }

  _stat(idx, snap, frame) {
    const pn = this.spec.panels[idx];
    if (pn.stat) return pn.stat(snap, frame, this.structs[idx]);
    const h = treeHeight(snap);
    return h < 0 ? "empty" : `height ${h}`;   // an empty tree reads "empty", not "height -1"
  }
  _draw(i) {
    const frames = this.traces.map((t, k) =>
      t ? t.at(i) : { snapshot: this.structs[k].snapshot(), highlight: {}, msg: "", counters: {} });
    frames.forEach((f, k) => {
      this.renderers[k].draw(f.snapshot, f.highlight);
      this.titles[k].innerHTML = `<b>${this.spec.panels[k].title}</b> — ${this._stat(k, f.snapshot, f)}`;
      // descriptive alt text per frame: panel title + step message + a full
      // structural description from the renderer (recreatable content)
      const r = this.renderers[k];
      const parts = [this.spec.panels[k].title, f.msg,
        typeof r.describe === "function" ? r.describe(f.snapshot) : null];
      this.canvases[k].setAttribute("aria-label",
        parts.filter(Boolean).join(". ") || "algorithm visualization");
    });
    this.$frame.textContent = `${i + 1} / ${this.len}`;
    this.$scrub.value = i;
    // narrate the first panel whose trace is still advancing — a finished
    // panel's frozen last message must not mask an ongoing story
    const live = this.traces.findIndex((t, k) => t && i < t.length && frames[k].msg);
    this.$status.textContent = live >= 0 ? frames[live].msg : (frames.find((f) => f.msg)?.msg || "");
  }
  _state() { this.traces = this.spec.panels.map(() => null); this.i = 0; this.len = 1; this.$scrub.max = 0; this._draw(0); }
  _load(perPanelTraces) {
    this.traces = perPanelTraces;
    this.len = Math.max(...this.traces.map((t) => t.length)); this.i = 0; this.$scrub.max = this.len - 1;
    this._draw(0); this._play();
  }

  /** Rebuild every panel from the (editable) initial box. */
  _build() {
    this.sweep++; this._pause();
    this.bar.clearWarn();
    this.structs = this.spec.panels.map((pn) => pn.make());
    const keys = parseNums(this.bar.initialText());
    if (keys.length) this.structs.forEach((s) => { if (s.build) s.build(keys); });
    this._state();
  }

  _runText(op, text) {
    this.bar.clearWarn();
    const lines = String(text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
    const names = new Map();
    this.ops.forEach((o) => {
      names.set(o.name.toLowerCase(), o);
      const tok = o.name.split(/\s+/)[0].toLowerCase();
      if (!names.has(tok)) names.set(tok, o);      // "insert" reaches "Insert into both"
    });
    const tok0 = (lines[0] || "").split(/\s+/)[0].toLowerCase();
    if (lines.length > 1 || (names.has(tok0) && /\s\S/.test(lines[0] || ""))) return this._script(lines, names);
    this._op(op, text);
  }

  /** One op on every panel, in lockstep (the classic race). */
  _op(op, text) {
    if (!op) return;
    const impl = this.ops.find((o) => o.name === op.name) ?? this.ops[0];
    const mode = impl.arg ?? "number";
    let v;
    if (mode === "string") { v = String(text).trim(); if (!v) { this.bar.$val && this.bar.$val.focus(); return; } }
    else if (mode === "numbers") { v = parseNums(text); if (!v.length) { this.bar.$val && this.bar.$val.focus(); return; } }
    else { v = parseNums(text)[0]; if (v == null) { this.bar.$val && this.bar.$val.focus(); return; } }
    const vals = this.bar.values();
    this._load(this.spec.panels.map((pn, k) => this._panelRun(k, impl)(this.structs[k], v, vals)));
  }

  /** A script — one `op value` per line — runs op-by-op on every panel,
   *  concatenated into ONE lockstep trace per panel. */
  _script(lines, names) {
    const per = this.spec.panels.map(() => []);
    for (const line of lines) {
      const m = line.match(/^(\S+)\s*(.*)$/);
      const o = m && names.get(m[1].toLowerCase());
      if (!o) { this.bar.warn(`script: unknown op "${m ? m[1] : line}" — ops here: ${this.ops.map((x) => x.name).join(", ")}`); return; }
      const mode = o.arg ?? "number";
      const v = mode === "string" ? m[2].trim() : mode === "numbers" ? parseNums(m[2]) : parseNums(m[2])[0];
      const vals = this.bar.values();
      this.structs.forEach((s, k) => per[k].push(this._panelRun(k, o)(s, v, vals)));
    }
    this._load(per.map((ts) => concatTraces(ts)));
  }

  _seek(i) { this.i = Math.max(0, Math.min(this.len - 1, i)); this._draw(this.i); }
  _interval() { return (this.spec.speed ?? 900) / (this.speedMult || 1); }
  /** ADAPTIVE PACING: a frame every live trace marks `pace:"fast"` (a routine
   *  step — e.g. a first-letter miss in the substring search) plays at a
   *  fraction of the tick, so playback hurries across boring stretches and
   *  slows down where something is happening. Frames without pace marks (all
   *  other demos) keep the plain tick. */
  _delayTo(i) {
    let sawLive = false, allFast = true;
    for (const t of this.traces) {
      if (!t || i >= t.length) continue;
      sawLive = true;
      if (t.at(i).pace !== "fast") { allFast = false; break; }
    }
    return this._interval() * (sawLive && allFast ? 0.12 : 1);
  }
  _startTimer() {
    if (this.timer) clearTimeout(this.timer);
    const tick = () => {
      if (this.i >= this.len - 1) { this._pause(); return; }
      this.timer = setTimeout(() => { this._seek(this.i + 1); tick(); }, this._delayTo(this.i + 1));
    };
    tick();
  }
  _play() { this.sweep++; if (this.i >= this.len - 1) this.i = 0; this.$play.textContent = "⏸"; this.$play.classList.add("on"); this._startTimer(); }
  _pause() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } this.$play.textContent = "▶"; this.$play.classList.remove("on"); }
  /** ⏩ 1024× — fast-forward the rest of the trace at 1024× the current
      lockstep tick (floored at ~1.5 s so the counters visibly spin) — the
      "put the naive recursion out of its misery" button. */
  _finish() {
    this._pause();
    if (this.i >= this.len - 1) return;
    const id = ++this.sweep; // any later play/finish/reset invalidates this sweep
    const start = this.i, span = this.len - 1 - start;
    const DUR = Math.max(1500, span * this._interval() / 1024);
    let t0 = null;
    const tick = (ts) => {
      if (id !== this.sweep) return;
      if (t0 == null) t0 = ts;
      const p = Math.min(1, (ts - t0) / DUR);
      this._seek(start + Math.round(span * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  _reset() {
    this.sweep++;
    this.bar.restoreDefaults();
    this.bar.clearWarn();
    this.structs = this.spec.panels.map((pn) => pn.make());
    const k = parseNums(this.spec.initial);
    if (k.length) this.structs.forEach((s) => { if (s.build) s.build(k); });
    this._pause(); this._state();
  }
}
