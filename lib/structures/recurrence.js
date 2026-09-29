// CSS 343 unified library — structures/recurrence.js
// The MASTER THEOREM, done the way the theorem is actually proved: by summing
// the recursion tree level by level.
//
//   T(n) = a·T(n/b) + f(n)
//
// Level i holds aⁱ subproblems of size n/bⁱ, so it costs aⁱ·f(n/bⁱ). Those
// level costs form a GEOMETRIC series with ratio a/b^c (writing f(n) = n^c…),
// and the three cases of the theorem are just the three behaviours of such a
// series — shrinking (the root wins), flat (every level ties, hence the log n
// factor), or growing (the leaves win). A student who has watched the bars
// shrink or grow does not need to memorise the case list.
//
// f(n) is parsed, not evaluated symbolically: `1`, `n`, `n^2`, `n log n`, …
// (`{ c, logs }` = n^c·(log n)^logs), which covers every recurrence in the
// course and is enough to decide the case exactly.
//
// Every op returns a Trace the Player scrubs, like the other structures.

import { Tracer } from "../core/tracer.js";

const EPS = 1e-9;

/** Parse an f(n) term into {c, logs}: n^c·(log n)^logs. */
export function parseF(text) {
  const t = String(text ?? "n").toLowerCase().replace(/\s+/g, " ").trim();
  if (!t || t === "1" || t === "o(1)" || t === "θ(1)") return { c: 0, logs: 0 };
  const logs = (t.match(/log/g) || []).length;
  const m = t.match(/n\s*\^?\s*(\d+(?:\.\d+)?)?/);
  let c = 0;
  if (m) c = m[1] ? Number(m[1]) : 1;
  if (!/n/.test(t)) c = 0;
  return { c, logs };
}

export const fmtF = ({ c, logs }) => {
  const base = c === 0 ? "1" : c === 1 ? "n" : `n^${c}`;
  const lg = logs === 0 ? "" : logs === 1 ? " log n" : ` log^${logs} n`;
  return (base === "1" && lg ? lg.trim() : base + lg);
};

/** Parse "T(n) = 2T(n/2) + n log n" (or the bare "2, 2, n log n" triple). */
export function parseRecurrence(raw) {
  const s = String(raw ?? "").trim();
  const eq = s.match(/(\d+(?:\.\d+)?)?\s*t\s*\(\s*n\s*\/\s*(\d+(?:\.\d+)?)\s*\)\s*\+\s*(.+)$/i);
  if (eq) return { a: eq[1] ? Number(eq[1]) : 1, b: Number(eq[2]), f: parseF(eq[3]) };
  const parts = s.split(",").map((x) => x.trim());
  if (parts.length >= 3) return { a: Number(parts[0]) || 1, b: Number(parts[1]) || 2, f: parseF(parts[2]) };
  return { a: 2, b: 2, f: parseF("n") };          // mergesort, the default
}

export class Recurrence {
  constructor() { this.set({ a: 2, b: 2, f: { c: 1, logs: 0 } }); }

  set({ a, b, f }) {
    this.a = Math.max(1, a || 1);
    this.b = Math.max(1.0000001, b || 2);
    this.f = f || { c: 1, logs: 0 };
    this.n = 1;
    for (let k = 0; k < 6; k++) this.n *= this.b;   // 6 levels of subdivision
    this.n = Math.round(this.n);
    return this;
  }

  loadRaw(keys) {                                   // numeric triple from a build box
    if (Array.isArray(keys) && keys.length >= 2) this.set({ a: keys[0], b: keys[1], f: { c: keys[2] ?? 1, logs: 0 } });
    return this;
  }

  /** log_b a — the critical exponent: the leaves' work is n^crit. */
  get crit() { return Math.log(this.a) / Math.log(this.b); }

  /** Which of the three cases, decided exactly from (c, logs) vs log_b a. */
  verdict() {
    const { c, logs } = this.f, crit = this.crit;
    if (c < crit - EPS) return { case: 1, why: `f grows slower than n^${crit.toFixed(3)} — the LEAVES dominate`, cost: `Θ(n^${this.fmtCrit()})` };
    if (c > crit + EPS) return { case: 3, why: `f grows faster than n^${crit.toFixed(3)} — the ROOT dominates`, cost: `Θ(${fmtF(this.f)})` };
    if (logs === 0) return { case: 2, why: "f ties the leaf work — every level costs the same", cost: `Θ(${fmtF({ c, logs: 1 })})` };
    if (logs > 0) return { case: 2, extended: true, why: `f ties n^${this.fmtCrit()} up to log^${logs} n — the levels tie, and the extra log stacks`, cost: `Θ(${fmtF({ c, logs: logs + 1 })})` };
    return { case: 2, why: "", cost: "" };
  }

  fmtCrit() {
    const v = this.crit;
    return Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(3);
  }

  /** Cost of one level: aⁱ · f(n/bⁱ). */
  levelCost(i) {
    const size = this.n / this.b ** i;
    const { c, logs } = this.f;
    const fv = size ** c * (size > 1 ? Math.log2(size) : 1) ** logs;
    return this.a ** i * fv;
  }

  levels() {
    const out = [];
    const depth = Math.round(Math.log(this.n) / Math.log(this.b));
    for (let i = 0; i <= depth; i++) {
      out.push({
        i, count: this.a ** i, size: this.n / this.b ** i,
        cost: this.levelCost(i), leaf: i === depth,
      });
    }
    return out;
  }

  snapshot(upto = Infinity, note = "") {
    const ls = this.levels();
    const shown = ls.filter((l) => l.i <= upto);
    return {
      levels: shown, allLevels: ls.length, n: this.n, a: this.a, b: this.b,
      f: fmtF(this.f), crit: this.fmtCrit(),
      total: shown.reduce((s, l) => s + l.cost, 0),
      note,
    };
  }

  /** sum() — the trace: one frame per LEVEL, then the comparison that decides
   *  the case. The bars are the geometric series; the verdict is what the
   *  master theorem reads off it. */
  sum() {
    const t = new Tracer();
    const ls = this.levels();
    const ratio = this.a / this.b ** this.f.c;
    t.step(`T(n) = ${this.a}T(n/${this.b}) + ${fmtF(this.f)} — sum the tree level by level (n = ${this.n})`,
      { snapshot: this.snapshot(-1), highlight: {} });
    for (const l of ls) {
      t.count("visit");
      t.step(l.leaf
        ? `level ${l.i} (the leaves): ${fmt(l.count)} subproblems of size ${fmt(l.size)} — ${fmt(l.cost)}`
        : `level ${l.i}: ${fmt(l.count)} × f(${fmt(l.size)}) = ${fmt(l.cost)}`,
        { snapshot: this.snapshot(l.i), highlight: { level: l.i } });
    }
    const v = this.verdict();
    t.step(ratio < 1 - EPS
      ? `the terms SHRINK by ${ratio.toFixed(2)}× a level — the root's ${fmt(ls[0].cost)} dominates the sum`
      : ratio > 1 + EPS
        ? `the terms GROW by ${ratio.toFixed(2)}× a level — the leaves' ${fmt(ls[ls.length - 1].cost)} dominates`
        : `every level costs the same ${fmt(ls[0].cost)} — nothing dominates, so the DEPTH decides`,
      { snapshot: this.snapshot(Infinity, "geometric ratio a/b^c = " + ratio.toFixed(3)), highlight: { ratio } });
    t.step(`leaf work n^${this.fmtCrit()} vs f(n) = ${fmtF(this.f)} → CASE ${v.case}${v.extended ? " (extended)" : ""}: ${v.cost}`,
      { snapshot: this.snapshot(Infinity, `${v.why} → ${v.cost}`), highlight: { verdict: v.case } });
    return t.trace();
  }

  inorder() {
    const v = this.verdict();
    return `T(n) = ${this.a}T(n/${this.b}) + ${fmtF(this.f)} · leaf work n^${this.fmtCrit()} · case ${v.case} → ${v.cost}`;
  }
}

const fmt = (x) => (x >= 1000 ? x.toExponential(2).replace("e+", "e") : Number(x.toFixed(x < 10 ? 1 : 0)).toString());
