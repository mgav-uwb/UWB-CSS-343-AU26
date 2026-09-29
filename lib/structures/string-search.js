// CSS 343 unified library — structures/string-search.js
// Substring search over a text: brute force (try every shift, compare
// left-to-right, slide by ONE on a mismatch — worst case Θ(nm)), Knuth-
// Morris-Pratt (precompute a failure table for the pattern, then scan the
// text with i that NEVER backs up — worst case Θ(n+m)), and Boyer–Moore's
// bad-character rule (compare each window RIGHT-TO-LEFT; on a mismatch shift
// by j − right[c], leaping past a character the pattern doesn't contain —
// often sublinear, the variant L16 and Chapter 16 §7 trace). All three find
// EVERY occurrence and report the count; KMP continues after a hit with
// j = fail[m-1], which is what finds OVERLAPPING occurrences.
//
// Both are traced onto SearchPanels (core/renderers/search.js): each frame's
// snapshot carries the text, the pattern, the failure table (KMP), the two
// indices, the comparison just made, and every match found so far — the view
// shows the indices by colour and bold, the current partial match as a tinted
// run in BOTH the text and the pattern, and completed occurrences in green.

import { Tracer } from "../core/tracer.js";

const DEFAULT_TEXT = "ABABABCABABABCAB";
const DEFAULT_PATTERN = "ABABC";
export const TEXT_MAX = 1200;  // the editable text box allows long (prose) input
export const PATTERN_MAX = 40;

// Comparisons are CASE-INSENSITIVE ("Underground" matches "underground") but
// the stored strings keep the case they were typed with — the view shows the
// text as written.
const eq = (a, b) => a === b || a.toLowerCase() === b.toLowerCase();

export class StringSearch {
  constructor() { this.text = DEFAULT_TEXT; this.pattern = DEFAULT_PATTERN; }

  /** build([text, pattern]) — both missing/empty falls back to the default sample pair. */
  build(args) {
    const a = Array.isArray(args) ? args : [];
    this.text = ((a[0] != null && a[0] !== "") ? String(a[0]) : DEFAULT_TEXT).slice(0, TEXT_MAX);
    this.pattern = ((a[1] != null && a[1] !== "") ? String(a[1]) : DEFAULT_PATTERN).slice(0, PATTERN_MAX);
    return this;
  }

  /** State frame for SearchPanels: text + pattern, nothing in flight yet. */
  snapshot() {
    return { kind: "search", text: this.text, pattern: this.pattern, fail: null,
      shift: null, j: null, cmp: null, ok: null, fb: null, found: [] };
  }
  inorder() { return `text (n=${this.text.length}), pattern "${this.pattern}" (m=${this.pattern.length})`; }

  _snap(fail, over = {}) {
    return Object.assign({ kind: "search", text: this.text, pattern: this.pattern,
      fail, shift: null, j: null, cmp: null, ok: null, fb: null, found: [] }, over);
  }
  _done(t, fail, found, extra = {}) {
    const c = t.counters.compare ?? 0;
    t.step(`done — ${found.length} occurrence${found.length === 1 ? "" : "s"}${found.length ? ` at [${found.join(", ")}]` : ""} (${c} comparison${c === 1 ? "" : "s"})`,
      { snapshot: this._snap(fail, Object.assign({ found: found.slice(), done: true }, extra)) });
    const trace = t.trace(); trace.result = { matches: found.slice(), count: found.length };
    return trace;
  }

  /** bruteForce() — try every shift 0..n-m, compare left-to-right, slide by
   *  ONE on a mismatch; never stops early, so it finds every occurrence. */
  bruteForce() {
    const t = new Tracer();
    const text = this.text, pattern = this.pattern;
    const n = text.length, m = pattern.length;
    const found = [];
    t.step(`brute force: try every shift of "${pattern}" (m=${m}) against the text (n=${n})`,
      { snapshot: this._snap(null, { shift: 0, j: 0 }) });
    for (let s = 0; s + m <= n; s++) {
      let j = 0;
      for (; j < m; j++) {
        const idx = s + j;
        t.count("compare");
        const ok = eq(text[idx], pattern[j]);
        t.step(`shift ${s}: text[${idx}]='${text[idx]}' vs P[${j}]='${pattern[j]}' — ${ok ? "match" : `mismatch, slide by ONE to shift ${s + 1}`}`,
          { snapshot: this._snap(null, { shift: s, j, cmp: idx, ok, found: found.slice() }),
            pace: !ok && j === 0 ? "fast" : null }); // first-letter misses are routine — hurry
        if (!ok) break;
      }
      if (j === m) {
        found.push(s);
        t.step(`occurrence #${found.length} at index ${s} — keep going at shift ${s + 1}`,
          { snapshot: this._snap(null, { found: found.slice() }) });
      }
    }
    return this._done(t, null, found);
  }

  /** Precompute the KMP failure/lps table: lps[k] = length of the longest proper prefix
   *  of pattern[0..k] that is also a suffix of it. Silent — a standard Θ(m) preprocessing pass. */
  _lps(pattern) {
    const m = pattern.length, lps = new Array(m).fill(0);
    let len = 0, i = 1;
    while (i < m) {
      if (eq(pattern[i], pattern[len])) { lps[i] = ++len; i++; }
      else if (len > 0) { len = lps[len - 1]; }
      else { lps[i] = 0; i++; }
    }
    return lps;
  }

  /** failTable() — build the failure function, TRACED. This is the piece the
      search demo takes for granted and the exam asks for: the pattern matched
      against ITSELF, with the same never-back-up trick the search uses. Two
      rows — the pattern, and fail[] filling in — so the picture is exactly the
      table the slides draw. `k` is the length of the current prefix-suffix
      overlap; a mismatch falls back through the part of the table already
      built, which is the self-reference that makes it Theta(m). */
  failTable() {
    const p = this.pattern, m = p.length;
    const t = new Tracer();
    const cells = [p.split(""), new Array(m).fill("")];
    const rowLabels = ["P", "fail", "j / k"];
    const colLabels = Array.from({ length: m }, (_, i) => String(i));
    // A third row carries the two POINTERS, because the whole build is the
    // interplay of exactly two numbers and narrating them is not the same as
    // showing them: j is the position being filled, k the length of the
    // prefix-suffix overlap so far — and k doubles as an index, since P[k] is
    // the character j is being compared against. When they coincide the cell
    // shows both.
    const ptrRow = (j, k) => {
      const row = new Array(m).fill("");
      if (k != null && k >= 0 && k < m) row[k] = "k";
      if (j != null && j >= 0 && j < m) row[j] = row[j] === "k" ? "j k" : "j";
      return row;
    };
    const snap = (j, k) => ({ rows: 3, cols: m,
      cells: [cells[0].slice(), cells[1].slice(), ptrRow(j, k)], rowLabels, colLabels });
    const done = (upto) => { const out = []; for (let c = 0; c <= upto; c++) out.push([0, c], [1, c]); return out; };

    t.step(`build fail[] for "${p}" by matching the pattern against ITSELF — fail[j] is the longest proper prefix of P[0..j] that is also a suffix of it. Two pointers do all the work: j walks the pattern, k is the overlap length (and P[k] is the character j gets compared to)`,
      { snapshot: snap(), highlight: {} });
    cells[1][0] = 0; t.count("write");
    t.step(`fail[0] = 0 always: a single character has no PROPER prefix. Start with j = 1, k = 0`,
      { snapshot: snap(1, 0), highlight: { active: [[1, 0]] } });

    let k = 0, j = 1;
    while (j < m) {
      t.count("compare");
      if (p[j] === p[k]) {
        k++; cells[1][j] = k; t.count("write");
        t.step(`j=${j}, k=${k - 1}: P[${j}]='${p[j]}' == P[${k - 1}]='${p[k - 1]}' → the overlap grows to k=${k}, so fail[${j}] = ${k}. Both pointers advance`,
          { snapshot: snap(j, k - 1), highlight: { active: [[1, j]], from: [[0, j], [0, k - 1]], done: done(j - 1) } });
        j++;
      } else if (k > 0) {
        const was = k; k = cells[1][k - 1];
        t.count("read");
        t.step(`j=${j}, k=${was}: P[${j}]='${p[j]}' != P[${was}]='${p[was]}' → j stays put and only k falls back, through the table we already built: k = fail[${was - 1}] = ${k}. The SEARCH does this same move on the pattern pointer`,
          { snapshot: snap(j, k), highlight: { active: [[0, j]], from: [[1, was - 1], [0, was]], done: done(j - 1) } });
      } else {
        cells[1][j] = 0; t.count("write");
        t.step(`j=${j}, k=0: P[${j}]='${p[j]}' matches no prefix at all and k has bottomed out → fail[${j}] = 0, and j moves on`,
          { snapshot: snap(j, 0), highlight: { active: [[1, j]], done: done(j - 1) } });
        j++;
      }
    }
    this.summary = `fail("${p}") = [${cells[1].join(", ")}]`;
    t.step(`done — fail = [${cells[1].join(", ")}]. j reached the end of the pattern, and every fall-back only ever moved k, never j — which is why the build is Θ(m). On a mismatch after matching j characters, the SEARCH resets j = fail[j−1] and never moves the text pointer i`,
      { snapshot: snap(), highlight: { done: done(m - 1) } });
    return t.trace();
  }

  /** kmp() — build the failure table, then scan with i that never moves
   *  backward; on a mismatch j falls back through fail[] (each stop is the
   *  matched prefix's next border — the next viable alignment); after a full
   *  match, j = fail[m-1] keeps scanning, which finds OVERLAPPING matches. */
  kmp() {
    const t = new Tracer();
    const text = this.text, pattern = this.pattern;
    const n = text.length, m = pattern.length;
    const fail = this._lps(pattern);
    const found = [];
    t.step(`KMP phase 1 — fail("${pattern}") = [${fail.join(", ")}] (the Θ(m) build is its own demo)`,
      { snapshot: this._snap(fail) });
    t.step(`KMP phase 2 — scan the text (n=${n}); i never backs up, j falls back through fail[] on a mismatch`,
      { snapshot: this._snap(fail, { shift: 0, j: 0 }) });
    let i = 0, j = 0;
    while (i < n) {
      t.count("compare");
      const ok = eq(text[i], pattern[j]);
      t.step(`text[${i}]='${text[i]}' vs P[${j}]='${pattern[j]}' — ${ok ? "match" : "mismatch"}`,
        { snapshot: this._snap(fail, { shift: i - j, j, cmp: i, ok, found: found.slice() }),
          pace: !ok && j === 0 ? "fast" : null }); // first-letter misses are routine — hurry
      if (ok) {
        i++; j++;
        if (j === m) {
          found.push(i - m);
          const nj = fail[m - 1];
          t.count("read"); // the fall-back is real work too: a table read + jump
          t.step(`occurrence #${found.length} at index ${i - m} — continue with j = fail[${m - 1}] = ${nj}, so overlapping matches aren't missed; i stays at ${i}`,
            { snapshot: this._snap(fail, { shift: i - nj, j: nj, fb: m - 1, found: found.slice() }) });
          j = nj;
        }
      } else if (j > 0) {
        const nj = fail[j - 1];
        t.count("read"); // ditto — count it, or KMP's bookkeeping looks free
        t.step(`mismatch at P[${j}] — the next viable alignment is the matched prefix's next border: j = fail[${j - 1}] = ${nj}, alignment ${i - nj}; i STAYS at ${i}`,
          { snapshot: this._snap(fail, { shift: i - nj, j: nj, fb: j - 1, found: found.slice() }) });
        j = nj;
      } else {
        i++;
      }
    }
    return this._done(t, fail, found);
  }

  /** Bad-character table: for each character of the pattern (case-folded),
   *  the index of its RIGHTMOST occurrence. Consulted on every mismatch. */
  _bcTable(pattern) {
    const right = new Map();
    for (let k = 0; k < pattern.length; k++) right.set(pattern[k].toLowerCase(), k);
    return right;
  }

  /** boyerMoore() — the bad-character rule (the variant L16 and Ch16 §7
   *  trace; as a lone heuristic this is Boyer–Moore–Horspool territory):
   *  compare each window RIGHT-TO-LEFT; on a mismatch against text character
   *  c at pattern position j, shift by max(1, j − right[c]) — the whole
   *  pattern leaps past a character it doesn't contain. Often sublinear;
   *  plain worst case still Θ(nm). Finds every occurrence (a full match
   *  slides by one). */
  boyerMoore() {
    const t = new Tracer();
    const text = this.text, pattern = this.pattern;
    const n = text.length, m = pattern.length;
    const right = this._bcTable(pattern);
    const bc = [...right.entries()]; // [[char, rightmost index], …] for the view
    const found = [];
    const snap = (over) => this._snap(null, Object.assign({ rl: true, bc }, over));
    t.step(`Boyer–Moore, bad-character rule: compare each window RIGHT-TO-LEFT; right[c] = the rightmost index of c in "${pattern}" (Θ(m+R) to build)`,
      { snapshot: snap({ shift: 0 }) });
    let s = 0;
    while (s + m <= n) {
      let j = m - 1, ok = true;
      for (; j >= 0; j--) {
        t.count("compare");
        ok = eq(text[s + j], pattern[j]);
        t.step(`align ${s}: text[${s + j}]='${text[s + j]}' vs P[${j}]='${pattern[j]}' — ${ok ? "match" : "mismatch"}`,
          { snapshot: snap({ shift: s, j, cmp: s + j, ok, found: found.slice() }),
            pace: !ok && j === m - 1 ? "fast" : null }); // a first-look miss is routine
        if (!ok) break;
      }
      if (ok) {
        found.push(s);
        t.step(`occurrence #${found.length} at index ${s} — slide by one and keep scanning`,
          { snapshot: snap({ found: found.slice() }) });
        s += 1;
      } else {
        const c = text[s + j], key = c.toLowerCase();
        const r = right.has(key) ? right.get(key) : -1;
        const jump = Math.max(1, j - r);
        t.count("read"); // the table consultation is work, same as KMP's fail[]
        const why = r < 0
          ? `occurs nowhere in the pattern — leap PAST it, ${jump} positions for one look`
          : r >= j
            ? `its rightmost occurrence (${r}) is not left of ${j}, and sliding backward is not allowed — shift by 1`
            : `its rightmost occurrence is index ${r} — line them up: shift by ${j} − ${r} = ${jump}`;
        t.step(`bad character '${c}': ${why} → alignment ${s + jump}`,
          { snapshot: snap({ shift: s + jump <= n - m ? s + jump : null, bcCur: key, found: found.slice() }),
            pace: j === m - 1 ? "fast" : null });
        s += jump;
      }
    }
    return this._done(t, null, found, { rl: true, bc });
  }
}
