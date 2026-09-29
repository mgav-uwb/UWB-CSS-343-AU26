// CSS 343 unified library — structures/dfa.js
// DETERMINISTIC finite automata, for L17 Part 2 — the rung below the NFA.
// Exactly one transition per (state, character), so running one is a pointer
// walk: no set, no ε-closure, no choices. That is the whole contrast the NFA
// slides rest on, and it is easier to feel than to be told: watch a single
// highlighted state move, then watch nfa-sim highlight a whole set.
//
// A machine is {name, states:[{label, accept?}], delta:{state: {char: state}}}.
// Drawn on the shared GraphRenderer, so the snapshot is the ordinary
// {nodes, edges} contract and the highlight is one node id plus one edge.

import { Tracer } from "../core/tracer.js";

/** The machines the lecture actually uses, plus two classics. Each is tiny on
 *  purpose: a DFA's states ARE its memory, and these have one or two bits of
 *  it, which is the point the AⁿBⁿ slide makes from the other side. */
export const MACHINES = {
  "ends-in-0": {
    name: "(0|1)*0 — binary strings ending in 0",
    alphabet: ["0", "1"],
    states: [{ label: "A", accept: false }, { label: "B", accept: true }],
    delta: [{ "0": 1, "1": 0 }, { "0": 1, "1": 0 }],
    mean: ["A = the string so far does NOT end in 0", "B = it does"],
  },
  "ends-in-B": {
    name: "(A|B)*B — strings over {A,B} ending in B",
    alphabet: ["A", "B"],
    states: [{ label: "0", accept: false }, { label: "1", accept: true }],
    delta: [{ A: 0, B: 1 }, { A: 0, B: 1 }],
    mean: ["0 = does not end in B", "1 = ends in B"],
  },
  "even-As": {
    name: "an EVEN number of A's",
    alphabet: ["A", "B"],
    states: [{ label: "even", accept: true }, { label: "odd", accept: false }],
    delta: [{ A: 1, B: 0 }, { A: 0, B: 1 }],
    mean: ["the state IS the parity of the A count — one bit of memory"],
  },
  "contains-AB": {
    name: "contains AB somewhere",
    alphabet: ["A", "B"],
    states: [{ label: "-", accept: false }, { label: "A", accept: false }, { label: "AB", accept: true }],
    delta: [{ A: 1, B: 0 }, { A: 1, B: 2 }, { A: 2, B: 2 }],
    mean: ["- = nothing yet", "A = just saw an A", "AB = found it (and never leaves)"],
  },
};

export class DFA {
  constructor() { this.key = "ends-in-0"; this.m = MACHINES[this.key]; this.cur = 0; this.summary = "no run yet"; }

  /** build(key) — pick one of the named machines. */
  build(key) {
    const k = typeof key === "string" && MACHINES[key] ? key : "ends-in-0";
    this.key = k; this.m = MACHINES[k]; this.cur = 0;
    return this;
  }

  _nodes(cur) {
    const n = this.m.states.length;
    return this.m.states.map((s, i) => ({
      id: i,
      // a ring, so self-loops and back-edges have room; two states sit opposite
      x: n <= 2 ? (i === 0 ? 0.3 : 0.7) : 0.5 + 0.32 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
      y: n <= 2 ? 0.5 : 0.5 + 0.32 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
      label: s.label + (s.accept ? " ✓" : ""),
      kind: i === cur ? "start" : s.accept ? "accept" : "char",
    }));
  }

  _edges() {
    // one edge per (state, char); parallel transitions merge their labels so
    // "A ─0,1─► A" reads as one arrow, which is what a DFA diagram looks like
    const byPair = new Map();
    this.m.states.forEach((_, i) => {
      for (const c of this.m.alphabet) {
        const j = this.m.delta[i][c];
        if (j == null) continue;
        const k = `${i}>${j}`;
        byPair.set(k, (byPair.get(k) ? byPair.get(k) + "," : "") + c);
      }
    });
    return [...byPair.entries()].map(([k, w]) => {
      const [u, v] = k.split(">").map(Number);
      return { u, v, w, directed: true };
    });
  }

  snapshot() { return { nodes: this._nodes(this.cur), edges: this._edges() }; }
  inorder() { return `${this.m.name} — ${this.m.states.length} states`; }

  /** run(text) — the pointer walk. One frame per character; the highlighted
   *  node is the ENTIRE machine state, which is the contrast with nfa-sim. */
  run(text = "110") {
    const s = String(text ?? "").toUpperCase().replace(/\s+/g, "");
    const t = new Tracer();
    const snap = (cur) => ({ nodes: this._nodes(cur), edges: this._edges() });
    let cur = 0;
    this.cur = 0;

    t.step(`${this.m.name}. Start in ${this.m.states[0].label}${s ? `, then read "${s}" one character at a time` : ""}. ${this.m.mean.join(" · ")}`,
      { snapshot: snap(0), highlight: { cur: [0] } });

    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const next = this.m.delta[cur][c];
      t.count("compare");
      if (next == null) {
        this.cur = cur;
        this.summary = `"${s}" — no transition on '${c}' (not in the alphabet ${this.m.alphabet.join("/")})`;
        t.step(`read '${c}' — this machine has no transition for that character (its alphabet is ${this.m.alphabet.join(", ")}), so the string is rejected`,
          { snapshot: snap(cur), highlight: { danger: [cur] } });
        return t.trace();
      }
      t.count("read");
      t.step(`read '${c}': ${this.m.states[cur].label} ──${c}──► ${this.m.states[next].label}${next === cur ? "  (a self-loop — the state does not change)" : ""}`,
        { snapshot: snap(next), highlight: { cur: [next], edges: [[cur, next]] } });
      cur = next;
    }

    const ok = this.m.states[cur].accept;
    this.cur = cur;
    this.summary = `"${s}" → ${this.m.states[cur].label} — ${ok ? "ACCEPT" : "reject"}`;
    t.step(`input exhausted in ${this.m.states[cur].label}, which ${ok ? "IS" : "is NOT"} an accepting state → ${ok ? "ACCEPT" : "REJECT"}. `
      + `Note where the decision happens: at the END. Passing through an accepting state mid-string means nothing.`,
      { snapshot: snap(cur), highlight: ok ? { done: [cur] } : { danger: [cur] } });
    return t.trace();
  }
}
