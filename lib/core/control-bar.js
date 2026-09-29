// CSS 343 unified library — core/control-bar.js
// The SHARED two-row control strip: row 1 BUILDS the demo state (presets ·
// expandable initial box · named inputs · Build · Reset), row 2 RUNS methods
// (script presets · expandable arg box · op dropdown · ops "?" · Run).
// The expandable boxes stay SMALL and strictly one line collapsed (overflow
// fades out at the tail); clicking in floats an OVERLAY editor over the strip
// (scrollbars, Enter applies, Esc closes) with the input-format instructions
// at its bottom — so the boxes need no "?" of their own. The Run row's "?"
// documents the OPERATIONS instead: every action, what it does, what it
// requires, and what input it takes. The bar owns DOM + events only — the
// demo tier (full-demo / dual-demo / interactive-demo) owns structures,
// traces, and the Player. See planning/2026-07-16-demo-improvements-design.md.
//
// The expandable boxes are 1-row <textarea wrap="off"> elements, NOT <input>:
// an input strips newlines, and the Run box must hold multi-line op scripts
// ("insert 33" / "delete 12" / "search 7") between edits.

export const HELP_DEFAULTS = {
  initial: `<b>Build input.</b> A plain list <code>10, 20, 30</code>; a range
    <code>START..STOP[:STEP][:ORDER]</code> with ORDER in ASC / DESC / RAND /
    ZIG / ZAG (<code>1..21:2</code>, <code>1..50:5:RAND</code>); or a graph
    generator <code>PATH:n</code> · <code>RING:n</code> · <code>STAR:n</code> ·
    <code>COMPLETE:n</code> · <code>RAND:n:m</code> (append <code>:W</code>
    for weights). Where a structure can be BUILT more than one way, wrap the
    keys in the method: <code>INSERT(1..100:4:RAND)</code> ·
    <code>HEAPIFY(50, 30, 70)</code>.`,
  arg: `<b>Run input.</b> One value for the selected operation
    (<code>33</code>), or a SCRIPT — one <code>op value</code> per line:
    <code>insert 33</code> / <code>delete 12</code> / <code>search 7</code> —
    Run executes the lines in order as one animation.`,
};

/** Wrap `el` in a position:relative span so absolutely-positioned satellites
 *  (overlay editor, help popover, fade overlay) anchor to it. */
function wrapRelative(el, cls) {
  const w = document.createElement("span");
  w.className = cls;
  el.parentNode.insertBefore(w, el);
  w.appendChild(el);
  return w;
}

/** Collapsed boxes are strictly one line; when the content doesn't fit (or
 *  holds a multi-line script) the tail fades out and a "⋯" badge appears as
 *  the "there is more — click to edit" cue. */
function syncFade(box) {
  const full = box._full ?? box.value;
  const over = full.includes("\n") || box.scrollWidth > box.clientWidth + 1;
  box.classList.toggle("u-fade", over);
  const wrap = box.parentElement;
  if (wrap && wrap.classList.contains("u-ovwrap")) wrap.classList.toggle("u-more", over);
  box.scrollLeft = 0; // always show the HEAD of the content
}

/** Multi-line content never renders in the collapsed box: the box DISPLAYS
 *  line 1 only, the true value rides in box._full (read via the bar's
 *  initialText()/argText()). Single-line content keeps value as the truth. */
function setBoxValue(box, text) {
  text = String(text ?? "");
  box._full = text.includes("\n") ? text : undefined;
  box.value = text.split("\n")[0];
  syncFade(box);
}
const boxText = (box) => (box ? box._full ?? box.value : "");

/** Focus → floating editor over the box (scrollbars, Enter applies,
 *  Shift+Enter newline, Esc closes, click-away applies) with the input's
 *  format instructions pinned to the panel bottom. The strip never reflows. */
export function attachOverlayEditor(box, helpHtml, onApply) {
  const wrap = wrapRelative(box, "u-ovwrap");
  let open = false;
  box.addEventListener("focus", () => {
    if (open || box.disabled) return;
    open = true;
    const ov = document.createElement("span");
    ov.className = "u-overlay";
    const ta = document.createElement("textarea");
    ta.value = boxText(box);
    ta.setAttribute("wrap", "off");
    ta.spellcheck = false;
    const hint = document.createElement("span");
    hint.className = "u-ovhint";
    hint.textContent = "Enter to apply · Shift+Enter for a new line · Esc to close";
    ov.appendChild(ta);
    ov.appendChild(hint);
    if (helpHtml) {
      const help = document.createElement("span");
      help.className = "u-ovhelp";
      help.innerHTML = helpHtml;
      ov.appendChild(help);
    }
    wrap.appendChild(ov);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);

    const close = (apply) => {
      if (!open) return;
      open = false;
      if (apply) {
        setBoxValue(box, ta.value.replace(/\n+$/, ""));
        if (onApply) onApply();
      }
      document.removeEventListener("mousedown", away, true);
      ov.remove();
      syncFade(box);
    };
    const away = (e) => { if (!ov.contains(e.target)) close(true); };
    document.addEventListener("mousedown", away, true);
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); close(true); }
      else if (e.key === "Escape") { e.preventDefault(); close(false); }
    });
  });
  // the collapsed 1-row box itself never takes a raw newline; DIRECT edits
  // make the displayed line the truth again (any backing script is stale)
  box.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
  box.addEventListener("input", () => {
    if (box.value.includes("\n")) setBoxValue(box, box.value); // pasted newlines
    else box._full = undefined;
    syncFade(box);
  });
}

/** Append a "?" ghost button after `anchorEl`; click toggles a floating help
 *  card. Used for the OPS summary and by CaseDemo's case bar. */
export function attachHelpPopover(anchorEl, html) {
  if (!anchorEl || !html) return null;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "u-qbtn ghost";
  btn.title = "what do these do?";
  btn.textContent = "?";
  anchorEl.insertAdjacentElement("afterend", btn);
  const wrap = wrapRelative(btn, "u-qwrap");
  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; document.removeEventListener("mousedown", away, true); } };
  const away = (e) => { if (pop && !pop.contains(e.target) && e.target !== btn) close(); };
  btn.onclick = () => {
    if (pop) { close(); return; }
    pop = document.createElement("span");
    pop.className = "u-helppop";
    pop.innerHTML = html;
    wrap.appendChild(pop);
    document.addEventListener("mousedown", away, true);
  };
  return btn;
}

const ARG_WORD = { number: "one number", pair: "two numbers", string: "text" };

/** The Run row's "?" content: every operation — what it does, what it
 *  requires, what input it takes — plus the script grammar. Descriptions come
 *  from op.desc / op.requires (plain text); ops without them still list their
 *  name and input shape. */
function opsHelpHTML(ops, hasScripts) {
  const rows = ops.map((o) => {
    const bits = [];
    bits.push(`input: ${o.arg ? ARG_WORD[o.arg] ?? o.arg : "none"}`);
    if (o.requires) bits.push(`requires: ${o.requires}`);
    return `<div class="u-oprow"><b>${o.name}</b>${o.desc ? ` — ${o.desc}` : ""} <span class="u-opmeta">(${bits.join(" · ")})</span></div>`;
  }).join("");
  const script = `<div class="u-oprow u-opscript">Or type a SCRIPT in the box — one
    <code>op value</code> per line (<code>insert 33</code>) — and Run plays the
    lines in order as one animation${hasScripts ? "; the dropdown holds ready-made scripts" : ""}.</div>`;
  return rows + script;
}

export class ControlBar {
  /**
   * @param {HTMLElement} mount
   * @param {Object} cfg {
   *   presets:[{name, initial?, values?, val?}], initial, initialPlaceholder?, initialTitle?,
   *   inputs:[{key,label,value?,placeholder?,width?}],
   *   ops:[{name, arg?, ghost?, desc?, requires?, enabledWhen?}], scripts:[{name, text}], defaultOp?,
   *   help?:{initial?, arg?},           // overlay-bottom instructions per box
   *   showInitial?, showBuild?, showReset?, showRun?, argDisabled?, hideArg?,
   *   valInitial?, valPlaceholder? }
   * @param {{build?:Function, reset?:Function, run?:(op:Object|null, argText:string)=>void}} on
   */
  constructor(mount, cfg, on = {}) {
    this.cfg = cfg;
    this.on = on;
    const presets = cfg.presets || [];
    const inputs = cfg.inputs || [];
    const ops = cfg.ops || [];
    const scripts = cfg.scripts || [];
    const showInitial = cfg.showInitial ?? true;
    const showBuild = cfg.showBuild ?? true;
    const showReset = cfg.showReset ?? true;
    const showRun = (cfg.showRun ?? true) && (ops.length > 0 || scripts.length > 0);
    // A build row whose ONLY occupant would be Reset is a wasted strip: fold
    // the Reset button into the end of the Run row instead (noBuild demos).
    const resetInRun = showReset && showRun
      && !showInitial && !showBuild && !presets.length && !inputs.length;
    const hasBuildRow = showInitial || showBuild || (showReset && !resetInRun)
      || presets.length > 0 || inputs.length > 0;
    // script detection knows ops by full name AND first word ("dfs 0" → "DFS from")
    this._opNames = new Set();
    ops.forEach((o) => {
      this._opNames.add(o.name.toLowerCase());
      this._opNames.add(o.name.split(/\s+/)[0].toLowerCase());
    });

    const bar = document.createElement("div");
    bar.className = "u-opbar u-opbar2";
    const row = (label) => {
      const r = document.createElement("div"); r.className = "u-row";
      const l = document.createElement("span"); l.className = "u-rowlabel"; l.textContent = label;
      r.appendChild(l); bar.appendChild(r);
      return r;
    };
    const boxEl = (cls, value, placeholder, title) => {
      const b = document.createElement("textarea");
      b.className = cls; b.rows = 1; b.spellcheck = false;
      b.setAttribute("wrap", "off"); // strictly one visual line collapsed
      b.value = value ?? ""; b.placeholder = placeholder ?? "";
      if (title) b.title = title;
      return b;
    };

    // ── Build row ────────────────────────────────────────────────────
    this.$preset = null; this.$seq = null; this.$named = [];
    if (hasBuildRow) {
      const r = row("Build");
      if (presets.length) {
        this.$preset = document.createElement("select");
        this.$preset.className = "u-preset";
        this.$preset.title = "preset input sets — pick one, then Build";
        this.$preset.innerHTML = presets.map((p, i) =>
          `<option value="${i}"${p.initial != null && p.initial === cfg.initial ? " selected" : ""}>${p.name}</option>`).join("")
          + `<option value="__custom">custom…</option>`;
        this.$preset.onchange = () => this._applyPreset();
        r.appendChild(this.$preset);
      }
      if (showInitial) {
        const lab = document.createElement("label"); lab.textContent = "initial"; r.appendChild(lab);
        this.$seq = boxEl("u-seq", cfg.initial, cfg.initialPlaceholder ?? "10,20,30 or 1..80",
          cfg.initialTitle ?? "click for a larger editor with the format guide");
        r.appendChild(this.$seq);
        attachOverlayEditor(this.$seq, (cfg.help && cfg.help.initial) ?? HELP_DEFAULTS.initial,
          () => { if (this.$preset) this.$preset.value = "__custom"; });
        queueMicrotask(() => syncFade(this.$seq)); // initial value may already overflow
      }
      inputs.forEach((inp) => {
        // label + control travel as ONE flex item, so a wrapping Build row never
        // strands a label at the end of a line away from its box
        const grp = document.createElement("span"); grp.className = "u-namedwrap";
        const lab = document.createElement("label"); lab.textContent = inp.label; grp.appendChild(lab);
        const el = document.createElement("input");
        el.className = "u-named"; el.dataset.key = inp.key;
        el.value = inp.value ?? ""; el.placeholder = inp.placeholder ?? "";
        if (inp.width) el.style.width = inp.width + "px";
        grp.appendChild(el);
        r.appendChild(grp);
        this.$named.push(el);
      });
      if (showBuild) {
        const b = document.createElement("button"); b.className = "u-build"; b.textContent = "Build";
        b.onclick = () => { if (this.on.build) this.on.build(); };
        r.appendChild(b);
      }
      if (showReset) {
        const b = document.createElement("button"); b.className = "u-reset ghost"; b.textContent = "Reset";
        b.onclick = () => { if (this.on.reset) this.on.reset(); };
        r.appendChild(b);
      }
    }

    // ── Run row ──────────────────────────────────────────────────────
    this.$script = null; this.$val = null; this.$op = null;
    if (showRun) {
      const r = row("Run");
      if (scripts.length) {
        this.$script = document.createElement("select");
        this.$script.className = "u-script";
        this.$script.title = "preset op scripts — pick one, then Run";
        this.$script.innerHTML = `<option value="__none">scripts…</option>`
          + scripts.map((s, i) => `<option value="${i}">${s.name}</option>`).join("");
        this.$script.onchange = () => {
          const s = scripts[+this.$script.value];
          if (s && this.$val) {
            setBoxValue(this.$val, s.text);
            this._syncArgDisable();
          }
        };
        r.appendChild(this.$script);
      }
      // hideArg: the demo takes its argument somewhere else entirely (the codec
      // demo types into its own input PANEL), so no value box is built at all —
      // argDisabled greys one out, which still reads as "type here, but not now"
      if (!cfg.hideArg) this.$val = boxEl("u-val", cfg.valInitial, cfg.valPlaceholder ?? "key");
      if (this.$val) r.appendChild(this.$val);
      if (cfg.hideArg) { /* no box */ }
      else if (!cfg.argDisabled) {
        attachOverlayEditor(this.$val, (cfg.help && cfg.help.arg) ?? HELP_DEFAULTS.arg,
          () => { if (this.$script) this.$script.value = "__none"; this._syncArgDisable(); });
        queueMicrotask(() => syncFade(this.$val));
      } else {
        this.$val.disabled = true;
        this.$val.classList.add("u-disabled");
      }
      if (ops.length) {
        this.$op = document.createElement("select");
        this.$op.className = "u-op";
        this.$op.title = "operation";
        this.$op.innerHTML = ops.map((o, i) => `<option value="${i}">${o.name}</option>`).join("");
        const di = cfg.defaultOp ? ops.findIndex((o) => o.name === cfg.defaultOp) : -1;
        if (di >= 0) this.$op.value = String(di);
        this.$op.onchange = () => this._syncArgDisable();
        r.appendChild(this.$op);
        attachHelpPopover(this.$op, opsHelpHTML(ops, scripts.length > 0));
      }
      const b = document.createElement("button"); b.className = "u-run"; b.textContent = "Run";
      b.onclick = () => { if (this.on.run) this.on.run(this.selectedOp(), this.argText()); };
      r.appendChild(b);
      if (resetInRun) {
        const rb = document.createElement("button"); rb.className = "u-reset ghost"; rb.textContent = "Reset";
        rb.onclick = () => { if (this.on.reset) this.on.reset(); };
        r.appendChild(rb);
      }
    }

    // ── warning band ─────────────────────────────────────────────────
    this.$warn = document.createElement("div");
    this.$warn.className = "u-warnband";
    bar.appendChild(this.$warn);

    // a demo can switch every row off (adaptive Huffman builds nothing, takes
    // its text in a panel, and drives its ops from buttons) — then the strip is
    // an empty bordered box, so don't draw one
    if (!bar.querySelector(".u-row")) bar.style.display = "none";
    mount.appendChild(bar);
    this.root = bar;

    // hand-editing any Build box flips the preset dropdown back to "custom…";
    // hand-editing the Run box flips the script dropdown back to "scripts…"
    if (this.$preset) {
      [this.$seq, ...this.$named].forEach((el) => {
        if (el) el.addEventListener("input", () => { this.$preset.value = "__custom"; });
      });
    }
    if (this.$val) this.$val.addEventListener("input", () => {
      if (this.$script) this.$script.value = "__none";
      this._syncArgDisable();
    });
    this._syncArgDisable();
  }

  _applyPreset() {
    const p = (this.cfg.presets || [])[+this.$preset.value];
    if (!p) return; // "custom…" selected — leave the boxes as typed
    if (p.initial != null && this.$seq) setBoxValue(this.$seq, p.initial);
    if (p.values) this.$named.forEach((el) => { if (p.values[el.dataset.key] != null) el.value = p.values[el.dataset.key]; });
    if (p.val != null && this.$val) setBoxValue(this.$val, p.val);
  }

  /** A script is >1 non-empty line, or one line whose FIRST TOKEN names an op
   *  and has an argument after it. A bare value ("33", "cat,dog") never is. */
  looksLikeScript(text) {
    const lines = String(text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) return true;
    if (!lines.length) return false;
    const tok0 = lines[0].split(/\s+/)[0].toLowerCase();
    return this._opNames.has(tok0) && /\s\S/.test(lines[0]);
  }

  /** The Run box only takes input when the selected op wants one (or a script is typed). */
  _syncArgDisable() {
    if (!this.$val || this.cfg.argDisabled) return;
    const op = this.selectedOp();
    const off = !!op && !op.arg && !this.looksLikeScript(boxText(this.$val));
    this.$val.disabled = off;
    this.$val.classList.toggle("u-disabled", off);
  }

  /** Disable one op-dropdown entry (spec `enabledWhen`); hops the selection
   *  to the first enabled option when the current one goes dark. */
  setOpDisabled(name, disabled) {
    if (!this.$op) return;
    const ops = this.cfg.ops || [];
    const i = ops.findIndex((o) => o.name === name);
    if (i < 0) return;
    this.$op.options[i].disabled = disabled;
    const sel = this.$op.selectedOptions[0];
    if (sel && sel.disabled) {
      const ok = Array.from(this.$op.options).findIndex((o) => !o.disabled);
      if (ok >= 0) this.$op.value = String(ok);
    }
    this._syncArgDisable();
  }

  values() {
    const vals = {};
    this.$named.forEach((el) => { vals[el.dataset.key] = el.value.trim(); });
    return vals;
  }
  initialText() { return this.$seq ? boxText(this.$seq) : (this.cfg.initial ?? ""); }
  argText() { return this.$val ? boxText(this.$val) : ""; }
  /** Programmatically fill the value box (e.g. an example picker setting the pattern). */
  setVal(text) { if (this.$val) setBoxValue(this.$val, String(text ?? "")); }
  selectedOp() { return this.$op ? (this.cfg.ops || [])[+this.$op.value] ?? null : null; }
  setPresetCustom() { if (this.$preset) this.$preset.value = "__custom"; }

  /** Boxes back to the spec's defaults (Reset semantics). */
  restoreDefaults() {
    if (this.$seq) setBoxValue(this.$seq, this.cfg.initial ?? "");
    this.$named.forEach((el) => {
      const inp = (this.cfg.inputs || []).find((i) => i.key === el.dataset.key);
      el.value = (inp && inp.value) ?? "";
    });
    if (this.$val) setBoxValue(this.$val, this.cfg.valInitial ?? "");
    if (this.$preset) {
      const presets = this.cfg.presets || [];
      const i = presets.findIndex((p) => p.initial != null && p.initial === this.cfg.initial);
      this.$preset.value = i >= 0 ? String(i) : "0";
    }
    if (this.$script) this.$script.value = "__none";
    this._syncArgDisable();
  }

  warn(msg) { this.$warn.textContent = `⚠ ${msg}`; this.$warn.classList.add("on"); }
  clearWarn() { this.$warn.textContent = ""; this.$warn.classList.remove("on"); }
}
