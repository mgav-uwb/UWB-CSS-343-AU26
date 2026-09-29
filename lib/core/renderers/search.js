// CSS 343 unified library — core/renderers/search.js
// The substring-search view, in the codec-panel style (see renderers/codec.js):
// a TEXT box of per-character spans — optionally contenteditable, so long text
// is typed exactly where it is read — with the PATTERN and (optionally) its
// failure function drawn as aligned rows underneath. Both indices are shown by
// colour and weight rather than by arrows: the character being compared is
// bold on a filled chip (accent = match, red = mismatch) at text[i] and P[j],
// and the current PARTIAL MATCH — the j characters that already agree — is a
// tinted bold run in BOTH the text (shift..shift+j-1) and the pattern (0..j-1),
// so "the prefix survives" is literally the same colour in both places.
// Completed occurrences stay green, and the head shows i / j / match count.
//
// snapshot = { kind:"search", text, pattern, fail:int[]|null,
//              shift:int|null,  // current alignment (brute's shift; i-j for KMP)
//              j:int|null,      // pattern index in play
//              cmp:int|null,    // text index compared THIS frame
//              ok:bool|null,    // that comparison's outcome
//              fb:int|null,     // fail[] cell consulted this frame (fall-back)
//              found:int[] }    // match start indices so far
// Anything else (a plain state frame) draws the stored text/pattern uncolored.

export class SearchPanels {
  /** @param {HTMLCanvasElement} canvas the slot the harness made for this view
   *  @param {{label?:string, editable?:boolean, initialText?:string,
   *           showFail?:boolean, height?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.opts = opts;
    canvas.style.display = "none"; // DOM view; the canvas stays as the aria anchor
    this.canvas = canvas;
    const wrap = canvas.parentElement || canvas;
    this.el = document.createElement("div");
    this.el.className = "u-srch";
    wrap.appendChild(this.el);

    this.head = document.createElement("div");
    this.head.className = "u-srch-head";
    this.$name = document.createElement("span");
    this.$name.className = "u-srch-name";
    this.$name.textContent = opts.label ?? "text";
    this.$stat = document.createElement("span");
    this.$stat.className = "u-srch-stat";
    this.head.appendChild(this.$name);
    if (opts.editable) {
      const hint = document.createElement("span");
      hint.className = "u-srch-hint";
      hint.textContent = "editable";
      this.head.appendChild(hint);
    }
    this.head.appendChild(this.$stat);
    this.el.appendChild(this.head);

    this.body = document.createElement("div");
    this.body.className = "u-srch-text";
    const h = opts.height ?? 64;
    this.body.style.minHeight = h + "px";
    this.body.style.maxHeight = Math.max(h, 96) + "px";
    this._pendingText = opts.initialText ?? "";
    // `_dirty` = the box holds text the user (or an example) put there that no
    // run has consumed yet. While dirty, draw() must NOT repaint the box from
    // a trace frame — a still-playing old trace would silently clobber the
    // edit. text() clears it: the next run's text is whatever was read.
    this._dirty = false;
    if (opts.editable) {
      this.body.contentEditable = "plaintext-only";
      if (!this.body.isContentEditable) this.body.contentEditable = "true";
      this.body.spellcheck = false;
      this.body.classList.add("is-edit");
      this.body.setAttribute("aria-label", "the text to search — type here, long input welcome");
      this.body.addEventListener("input", () => { this._pendingText = this.body.textContent; this._dirty = true; });
      if (this._pendingText) this.body.textContent = this._pendingText;
    }
    this.el.appendChild(this.body);

    this.rows = document.createElement("div");
    this.rows.className = "u-srch-rows";
    this.el.appendChild(this.rows);
  }

  /** The text as typed (the op reads this instead of a value box). Reading it
   *  marks the box consumed: subsequent frames may repaint it as chips. */
  text() {
    const t = (this.opts.editable ? this.body.textContent : this._pendingText).replace(/\s+$/, "");
    this._dirty = false;
    return t;
  }
  setText(t) {
    this._pendingText = t;
    this._dirty = true;
    if (this.opts.editable) this.body.textContent = t;
  }

  /** An "examples…" picker in the head — each entry {name, text, pattern};
   *  `apply` is called with the chosen entry (the spec sets text + pattern). */
  setExamples(list = [], apply) {
    this.head.querySelector(".u-srch-ex")?.remove();
    if (!list.length) return;
    const sel = document.createElement("select");
    sel.className = "u-srch-ex";
    sel.title = "example text/pattern pairs";
    sel.innerHTML = `<option value="">examples…</option>`
      + list.map((e, i) => `<option value="${i}">${e.name}</option>`).join("");
    sel.onchange = () => {
      const ex = list[+sel.value];
      if (ex && apply) apply(ex);
      sel.value = "";
    };
    this.head.insertBefore(sel, this.$stat);
  }

  _chip(t, cls) {
    const sp = document.createElement("span");
    sp.className = "u-srch-ch" + (cls ? " " + cls : "");
    sp.textContent = t;
    return sp;
  }

  draw(snapshot) {
    this._last = [snapshot];
    const s = snapshot && snapshot.kind === "search" ? snapshot : null;

    // ---- the text box ----
    const holdBox = this.opts.editable && (this._dirty || document.activeElement === this.body);
    if (!s) {
      // a bare/reset frame: the typed text is the user's — leave it alone
      if (!this.opts.editable) this.body.replaceChildren();
      else if (!holdBox) this.body.textContent = this._pendingText;
      this.$stat.textContent = "";
      this.rows.replaceChildren();
      this.canvas.setAttribute("aria-label", this.describe(snapshot));
      return;
    }
    const inFound = new Uint8Array(s.text.length);
    const m = s.pattern.length;
    for (const at of s.found ?? []) for (let k = at; k < at + m && k < s.text.length; k++) inFound[k] = 1;
    // the current partial match: a PREFIX of the window (left-to-right
    // scanners) or, for Boyer–Moore's right-to-left compare (s.rl), the
    // window's already-matched SUFFIX
    let preLo = -1, preHi = -1;
    if (s.shift != null && s.j != null) {
      if (s.rl) { preLo = s.shift + s.j + 1; preHi = s.shift + m; }
      else { preLo = s.shift; preHi = s.shift + s.j; }
    }

    // the ALIGNMENT WINDOW: the m text cells the pattern currently covers,
    // outlined with a thin frame (end caps close its left/right edges)
    const winLo = s.shift ?? -1;
    const winHi = s.shift != null ? s.shift + m : -1;

    if (!holdBox) {
      const frag = document.createDocumentFragment();
      for (let k = 0; k < s.text.length; k++) {
        let cls = "";
        if (inFound[k]) cls = "is-found";
        if (k >= preLo && k < preHi) cls = "is-pre";
        if (k === s.cmp) cls = s.ok ? "is-cur" : "is-cur is-bad";
        if (k >= winLo && k < winHi) {
          cls += " is-win";
          if (k === winLo) cls += " is-win-a";
          if (k === winHi - 1) cls += " is-win-z";
        }
        frag.appendChild(this._chip(s.text[k], cls.trim()));
      }
      this.body.replaceChildren(frag);
      // keep the compared character in view when the text runs long
      const cur = this.body.querySelector(".is-cur");
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
    }

    // ---- pattern (+ failure function) rows ----
    const rows = [];
    const pat = document.createElement("div");
    pat.className = "u-srch-row";
    pat.appendChild(this._chip("P", "is-lab"));
    for (let k = 0; k < m; k++) {
      let cls = "";
      if (s.j != null && (s.rl ? k > s.j : k < s.j)) cls = "is-pre";
      if (s.j != null && k === s.j && s.cmp != null) cls = s.ok ? "is-cur" : "is-cur is-bad";
      pat.appendChild(this._chip(s.pattern[k], cls));
    }
    rows.push(pat);
    if (s.fail) {
      const fr = document.createElement("div");
      fr.className = "u-srch-row is-fail";
      fr.appendChild(this._chip("fail", "is-lab"));
      for (let k = 0; k < m; k++) fr.appendChild(this._chip(String(s.fail[k]), k === s.fb ? "is-fb" : ""));
      rows.push(fr);
    }
    if (s.bc) {
      // Boyer–Moore's bad-character table: right[c] = the rightmost index of
      // c in the pattern; the consulted entry lights amber on a shift
      const br = document.createElement("div");
      br.className = "u-srch-row is-fail";
      br.appendChild(this._chip("right", "is-lab"));
      for (const [ch, idx] of s.bc)
        br.appendChild(this._chip(`${ch}:${idx}`, "is-bc" + (s.bcCur === ch ? " is-fb" : "")));
      rows.push(br);
    }
    this.rows.replaceChildren(...rows);

    // ---- head readout: where the indices are, and the score ----
    const bits = [];
    if (s.cmp != null) bits.push(`i = ${s.cmp}`);
    if (s.j != null) bits.push(`j = ${s.j}`);
    const c = (s.found ?? []).length;
    bits.push(`matches: ${c}`);
    this.$stat.textContent = bits.join(" · ");
    this.canvas.setAttribute("aria-label", this.describe(snapshot));
  }

  describe(snap) {
    if (!snap || snap.kind !== "search") return "Substring search panel.";
    const c = (snap.found ?? []).length;
    return `Text "${snap.text}". Pattern "${snap.pattern}". `
      + (snap.fail ? `Failure table [${snap.fail.join(", ")}]. ` : "")
      + (c ? `${c} match${c > 1 ? "es" : ""} at ${snap.found.join(", ")}.` : "No matches yet.");
  }
}
