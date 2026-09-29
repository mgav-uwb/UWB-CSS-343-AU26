// CSS 343 unified library — structures/nfa.js
// Regular expression → NFA (Sedgewick §5.4, Thompson-style construction) plus
// simulation by tracking the SET of reachable states (no backtracking).
//
// Supported RE subset: concatenation, | (or), * (closure), () (grouping), over
// a small letter alphabet — e.g. "(A*B|AC)D". Construction follows Sedgewick's
// array-of-states trick directly: a regex of length M gets M+1 states, 0..M.
// State i (i<M) corresponds to re[i]; state M is a virtual "accept" state with
// no character of its own. Two kinds of transition:
//   - a char-match edge i → i+1, taken only if the input character equals re[i]
//     (metacharacters '(',')','|','*' never match an input letter, so only
//     "real" character states produce a char-match edge);
//   - ε-transitions (a digraph, epsAdj), added for '*' (skip/repeat the
//     closure's operand), '|' (skip either branch), and '(' / ')' (structural,
//     so control always can flow past a paren without consuming input).
// Simulation (recognizes()) never backtracks: it maintains the SET of states
// reachable by ε-transitions from wherever it currently is (the "reachable
// state set"), advances every state whose character matches the next input
// character, then re-closes over ε-edges. Accept iff state M is in the final
// set. This is the general Thompson build, not a hardcoded example — it works
// for any RE in the supported subset, not just the default.
//
// Rendered with NfaRenderer (core/renderers/nfa.js), the Sedgewick line
// layout: states in one row (position = regex index, the character beneath),
// char-match transitions straight along the line, ε-transitions as red curved
// arcs (forward above the row, the star's repeats below), each transition
// labeled with a bubble. simulate() frames also carry {input, pos}, which the
// renderer draws as an input strip with the consumed prefix tinted and the
// last consumed character filled. The legacy zigzag x/y in the snapshot's
// nodes are kept for compatibility but the line renderer ignores them.

import { Tracer } from "../core/tracer.js";

const DEFAULT_RE = "(A*B|AC)D";
const isMeta = (c) => c === "(" || c === ")" || c === "|" || c === "*";

export class NFA {
  constructor() {
    this.re = "";
    this.m = 0;
    this.states = [];     // [{id,x,y,label,kind}]
    this.epsAdj = [];     // epsAdj[i] = [j, ...] — ε out-neighbors of state i
    this.epsEdges = [];   // [[u,v], ...] in construction order
    this.charEdges = [];  // [{u,v,ch}] — char-match transition u -> u+1 on ch
  }

  /** Lay out states 0..m left→right, zigzagged so ε-edges of different span don't all collide. */
  _layout(m) {
    const states = [];
    for (let i = 0; i <= m; i++) {
      const x = 0.05 + (i / m) * 0.9;
      const y = i % 2 === 0 ? 0.38 : 0.62;
      const label = i === m ? "M" : this.re[i];
      const kind = i === 0 ? "start" : i === m ? "accept" : isMeta(this.re[i]) ? "meta" : "char";
      states.push({ id: i, x, y, label, kind });
    }
    return states;
  }

  /** Build snapshot from a (possibly partial, mid-construction) edge set. */
  _snap(epsEdges, charEdges) {
    return {
      nodes: this.states.map((n) => ({ ...n })),
      edges: [
        ...epsEdges.map(([u, v]) => ({ u, v, w: "ε", directed: true })),
        ...charEdges.map((e) => ({ u: e.u, v: e.v, w: e.ch, directed: true })),
      ],
    };
  }

  /** Shared core: Sedgewick's construction. `source` is wrapped in an implicit
   *  outer "( )" first — exactly as Sedgewick's book code does — so a top-level
   *  '|' or a '*' applied to the whole expression has a matching paren to
   *  anchor its ε-edges (without the wrap, "A|B" or "AB*" split across the
   *  whole string would have no enclosing '(' / ')' pair to hang the
   *  alternation/closure ε-edges on). If `t` is given, emits a step per
   *  ε-edge added and per char-match edge added, so the caller gets a trace
   *  of the NFA being built up edge by edge. */
  _construct(source, t) {
    this.source = source;
    const re = `(${source})`;
    const m = re.length;
    this.re = re; this.m = m;
    this.epsAdj = Array.from({ length: m + 1 }, () => []);
    this.epsEdges = [];
    this.charEdges = [];
    this.states = this._layout(m);

    const snap = () => this._snap(this.epsEdges, this.charEdges);
    if (t) t.step(`${m + 1} states laid out (0..${m}), one per character of "${re}" — state ${m} is the accept state`,
      { snapshot: snap(), highlight: {} });

    const addEps = (u, v, why) => {
      this.epsAdj[u].push(v);
      this.epsEdges.push([u, v]);
      if (t) {
        t.count("link");
        t.step(`ε-edge ${u} → ${v} — ${why}`,
          { snapshot: snap(), highlight: { nodes: { active: [u, v] }, edges: { active: [[u, v]] } } });
      }
    };

    const ops = []; // stack of positions of '(' and '|'
    for (let i = 0; i < m; i++) {
      let lp = i;
      const c = re[i];
      if (c === "(" || c === "|") {
        ops.push(i);
      } else if (c === ")") {
        const or = ops.pop();
        if (re[or] === "|") {
          lp = ops.pop();
          addEps(lp, or + 1, `'(' at ${lp} skips to the branch after '|' at ${or}`);
          addEps(or, i, `'|' at ${or} skips to ')' at ${i}`);
        } else {
          lp = or;
        }
      }
      if (i < m - 1 && re[i + 1] === "*") {
        addEps(lp, i + 1, `closure '*' at ${i + 1} — skip the operand starting at ${lp}`);
        addEps(i + 1, lp, `closure '*' at ${i + 1} — repeat the operand starting at ${lp}`);
      }
      if (c === "(" || c === "*" || c === ")") addEps(i, i + 1, `structural — fall through '${c}'`);
      if (!isMeta(c)) {
        this.charEdges.push({ u: i, v: i + 1, ch: c });
        if (t) {
          t.count("write");
          t.step(`char-match edge ${i} → ${i + 1} on '${c}'`,
            { snapshot: snap(), highlight: { nodes: { active: [i, i + 1] }, edges: { tree: [[i, i + 1]] } } });
        }
      }
    }
    if (t) t.step(`NFA complete for "${re}" — ${m + 1} states, ${this.epsEdges.length} ε-edges, ${this.charEdges.length} char-match edges`,
      { snapshot: snap(), highlight: { nodes: { done: [m] } } });
    return this;
  }

  /** build(re) — construct the NFA for regex `re` (default "(A*B|AC)D"). Guards
   *  against being called with a non-string (FullDemo's harness re-invokes
   *  build() with a parsed-number array on "Build"; that's ignored here, same
   *  trick Graph/WeightedGraph/DP use to keep a fixed sample instance). */
  build(re) {
    const pattern = typeof re === "string" && re.length ? re : DEFAULT_RE;
    this._construct(pattern, null);
    return this;
  }

  /** Traced construction of the current (or default) regex — one step per ε-edge
   *  and char-match edge added, ending with the complete NFA. */
  buildTraced(re = this.source || DEFAULT_RE) {
    const t = new Tracer();
    this._construct(re, t);
    return t.trace();
  }

  snapshot() { return this._snap(this.epsEdges, this.charEdges); }
  inorder() { return `regex "${this.source}" — ${this.m + 1} states, ${this.epsEdges.length} ε-edges, ${this.charEdges.length} char-match edges`; }

  /** ε-closure of a set of states (plain array/iterable of ids) — every state
   *  reachable via 0+ ε-edges. If `used` is given, every ε-edge that first
   *  reaches a new state is pushed onto it as [u, v] (the closure's DFS tree),
   *  so a caller can show WHICH free moves the closure took. */
  _closure(seed, used) {
    const seen = new Set(seed);
    const stack = [...seen];
    while (stack.length) {
      const u = stack.pop();
      for (const v of this.epsAdj[u] || []) {
        if (!seen.has(v)) { seen.add(v); stack.push(v); if (used) used.push([u, v]); }
      }
    }
    return seen;
  }

  /** Traced simulation: maintain the SET of reachable states, in TWO steps per
   *  character — (1) read: every active letter state whose character matches
   *  advances along its match edge; (2) close: follow ε-edges from wherever
   *  that landed. Each step is its own frame, with the transitions it took
   *  highlighted, and every frame carries the input string plus how much of
   *  it has been consumed (the renderer's input strip). Accept iff the accept
   *  state (m) is in the final set. No backtracking, no recursion. */
  simulate(text) {
    const t = new Tracer();
    const snap = (pos) => Object.assign(this.snapshot(), { input: text, pos });
    const show = (s) => `{${[...s].sort((a, b) => a - b).join(",")}}`;

    t.step(`start: the machine begins in state 0, before reading anything`,
      { snapshot: snap(0), highlight: { nodes: { active: [0] } } });
    let used = [];
    let pc = this._closure([0], used);
    t.count("visit", pc.size);
    t.step(`apply ε-transitions: ε-closure({0}) = ${show(pc)}, every state reachable for free`,
      { snapshot: snap(0), highlight: { nodes: { active: [...pc], fresh: [...pc].filter((v) => v !== 0) }, edges: { usedEps: used } } });

    let dead = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (dead) {
        t.step(`read '${c}' (${i + 1}/${text.length}): the set is empty and stays empty`,
          { snapshot: snap(i + 1), highlight: { nodes: { danger: [] } }, pace: "fast" });
        continue;
      }
      const match = new Set();
      const taken = [];
      for (const v of pc) {
        if (v === this.m) continue;
        t.count("compare");
        if (this.re[v] === c) { match.add(v + 1); taken.push([v, v + 1]); }
      }
      if (match.size === 0) {
        dead = true; pc = match;
        t.step(`read '${c}' (${i + 1}/${text.length}): NO active state matches '${c}' → { }; an empty set can never recover, the string is dead`,
          { snapshot: snap(i + 1), highlight: { nodes: { danger: [] } } });
        continue;
      }
      t.step(`read '${c}' (${i + 1}/${text.length}): ${taken.length} state${taken.length === 1 ? " matches and advances" : "s match and advance"} (${taken.map(([u, v]) => `${u}→${v}`).join(", ")}), giving ${show(match)}`,
        { snapshot: snap(i + 1), highlight: { nodes: { active: [...match] }, edges: { used: taken } } });
      used = [];
      pc = this._closure(match, used);
      t.count("visit", pc.size);
      const fresh = [...pc].filter((v) => !match.has(v));
      t.step(`apply ε-transitions: ε-closure(${show(match)}) = ${show(pc)}${fresh.length ? `, ${fresh.length} state${fresh.length === 1 ? "" : "s"} reached for free` : ", nothing new is reachable"}`,
        { snapshot: snap(i + 1), highlight: { nodes: { active: [...pc], fresh }, edges: { usedEps: used } } });
    }

    const accept = pc.has(this.m);
    t.step(accept ? `ACCEPT "${text}": accept state ${this.m} is in the final set ${show(pc)}` : `REJECT "${text}": accept state ${this.m} is not in the final set ${show(pc)}`,
      { snapshot: snap(text.length), highlight: accept ? { nodes: { done: [this.m], active: [...pc] } } : { nodes: { danger: [...pc] } } });
    return t.trace();
  }

  /** matches(text) — plain boolean recognizer, same logic as simulate() without tracing. */
  matches(text) {
    let pc = this._closure([0]);
    for (const c of text) {
      const match = new Set();
      for (const v of pc) { if (v !== this.m && this.re[v] === c) match.add(v + 1); }
      pc = this._closure(match);
      if (pc.size === 0) return false;
    }
    return pc.has(this.m);
  }

  // ───────────────────────── subset construction ─────────────────────────
  // The simulation above, PRECOMPUTED: every subset of NFA states the
  // simulation could ever hold becomes ONE state of a DFA, and every
  // (subset, character) advance-and-close becomes one precomputed arrow.
  // Matching then costs one table read per character. The price is states:
  // up to 2^(m+1) subsets in the worst case, which is why engines choose
  // between this machine and the O(m)-per-character simulation.

  /** The distinct letters of the (wrapped) regex: the DFA's input alphabet. */
  alphabet() {
    return [...new Set([...this.re].filter((c) => !isMeta(c)))].sort();
  }

  /** UNTRACED reference: worklist subset construction. Returns (and caches on
   *  this.dfa) { states:[{ids,key,accept}], trans:[{ch:j}], alphabet,
   *  overflow }, states in discovery order, S0 = ε-closure({0}). Transitions
   *  into the empty set (the dead state) are omitted: a missing arrow rejects.
   *  Stops discovering past `cap` states (the 2^m blow-up guard). */
  determinize(cap = 32) {
    const key = (set) => [...set].sort((a, b) => a - b).join(",");
    const A = this.alphabet();
    const states = [];   // [{ids:[...], key, accept}] in discovery order
    const trans = [];    // trans[i][ch] = index of the target subset-state
    const index = new Map();
    const add = (set) => {
      const k = key(set);
      if (index.has(k)) return index.get(k);
      index.set(k, states.length);
      states.push({ ids: [...set].sort((a, b) => a - b), key: k, accept: set.has(this.m) });
      trans.push({});
      return states.length - 1;
    };
    add(this._closure([0]));
    let overflow = false;
    for (let i = 0; i < states.length && !overflow; i++) {
      for (const ch of A) {
        const match = new Set();
        for (const v of states[i].ids) { if (v !== this.m && this.re[v] === ch) match.add(v + 1); }
        if (!match.size) continue;               // → dead state ∅, left implicit
        const T = this._closure(match);
        if (!index.has(key(T)) && states.length >= cap) { overflow = true; break; }
        trans[i][ch] = add(T);
      }
    }
    this.dfa = { states, trans, alphabet: A, overflow, cap };
    return this.dfa;
  }

  /** Does the determinized machine accept `text`? (test hook; must always
   *  agree with matches()). Returns null if the walk needs a state past an
   *  overflow cut. */
  dfaAccepts(text) {
    const dfa = this.determinize();
    let cur = 0;
    for (const c of text) {
      const nxt = dfa.trans[cur][c];
      if (nxt == null) return dfa.overflow ? null : false;
      cur = nxt;
    }
    return dfa.states[cur].accept;
  }

  /** Node id for a subset-state: the subset itself, braced: GraphRenderer
   *  prints the label ("S1 ✓") in the circle and this id small beneath it, so
   *  every node carries its own "a DFA state IS a set of NFA states" caption. */
  _dfaId(s) { return `{${s.key}}`; }

  /** Ring positions per subset-state (discovery order clockwise from the
   *  top), the same layout the dfa demo's machines use. */
  _dfaLayout(dfa) {
    const n = dfa.states.length, pos = {};
    dfa.states.forEach((s, i) => {
      pos[this._dfaId(s)] = n <= 2
        ? { x: i === 0 ? 0.3 : 0.7, y: 0.5 }
        : { x: 0.5 + 0.38 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
            y: 0.5 + 0.38 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2) };
    });
    return pos;
  }

  /** GraphRenderer snapshot of the first `nStates` discovered subset-states
   *  plus the transitions recorded so far (parallel arrows merge labels, so
   *  "S2 ──A,B──► S2" reads as one arrow, like the dfa demo). */
  _dfaSnapshot(dfa, pos, nStates, recorded) {
    const byPair = new Map();
    for (const [i, ch, j] of recorded) {
      const k = `${i}>${j}`;
      byPair.set(k, (byPair.get(k) ? byPair.get(k) + "," : "") + ch);
    }
    return {
      nodes: dfa.states.slice(0, nStates).map((s, i) => ({
        id: this._dfaId(s), ...pos[this._dfaId(s)],
        label: `S${i}${s.accept ? " ✓" : ""}`,
      })),
      edges: [...byPair.entries()].map(([k, w]) => {
        const [i, j] = k.split(">").map(Number);
        return { u: this._dfaId(dfa.states[i]), v: this._dfaId(dfa.states[j]), w, directed: true };
      }),
    };
  }

  /** Traced subset construction, in two synchronized views (same frames, same
   *  messages, so the DualDemo panels play them in lockstep):
   *    view "dfa": the subset-machine growing state by state, arrow by arrow;
   *    view "nfa": the same steps shown ON the NFA line; each frame lights
   *    the subset just computed, the match edges that advanced it, and the
   *    ε-arcs the closure walked.
   *  One frame per (state, character) worklist entry, dead targets included. */
  determinizeTraced(view = "dfa") {
    const t = new Tracer();
    const dfa = this.determinize();
    const pos = this._dfaLayout(dfa);
    const show = (ids) => `{${ids.join(",")}}`;
    const recorded = [];
    let discovered = 1;

    const frame = (msg, nStates, hlDfa, hlNfa, opts = {}) => {
      t.step(msg, {
        snapshot: view === "dfa" ? this._dfaSnapshot(dfa, pos, nStates, recorded)
          : this.snapshot(),
        highlight: view === "dfa" ? hlDfa : hlNfa,
        ...opts,
      });
    };

    const S0 = dfa.states[0];
    const used0 = [];
    this._closure([0], used0);
    t.count("visit", S0.ids.length);
    t.count("write");
    frame(`ε-closure({0}) = ${show(S0.ids)} becomes the DFA's start state S0: everything the NFA can be in before reading any input`,
      1,
      { nodes: { active: [this._dfaId(S0)] } },
      { nodes: { active: [...S0.ids], fresh: S0.ids.filter((v) => v !== 0) }, edges: { usedEps: used0 } });

    outer:
    for (let i = 0; i < dfa.states.length; i++) {
      const src = dfa.states[i];
      for (const ch of dfa.alphabet) {
        const match = new Set(); const taken = [];
        for (const v of src.ids) {
          if (v === this.m) continue;
          t.count("compare");
          if (this.re[v] === ch) { match.add(v + 1); taken.push([v, v + 1]); }
        }
        if (!match.size) {
          frame(`from S${i} = ${show(src.ids)} read '${ch}': no state in the subset matches → the empty set; every missing arrow leads to the dead state ∅, left undrawn`,
            discovered,
            { nodes: { active: [this._dfaId(src)] } },
            { nodes: { active: [...src.ids] } },
            { pace: "fast" });
          continue;
        }
        const used = [];
        const T = this._closure(match, used);
        t.count("visit", T.size);
        const j = dfa.trans[i][ch];
        if (j == null) { // untraced construction stopped here: the overflow cut
          frame(`stopping at ${dfa.cap} DFA states: this regex's subsets keep multiplying (the 2^m blow-up in person); the NFA simulation stays O(m) per character regardless`,
            discovered, { nodes: { danger: [this._dfaId(src)] } }, { nodes: { danger: [...src.ids] } });
          break outer;
        }
        const isNew = j === discovered;
        if (isNew) { discovered++; t.count("write"); }
        recorded.push([i, ch, j]);
        t.count("link");
        const dst = dfa.states[j];
        const adv = [...match].sort((a, b) => a - b);
        frame(`from S${i} = ${show(src.ids)} read '${ch}': ${taken.map(([u, v]) => `${u}→${v}`).join(", ")} gives ${show(adv)}, ε-close → ${show(dst.ids)}${isNew ? `, a NEW subset: call it S${j}` : ` = S${j}, already discovered: just add the arrow`}`,
          discovered,
          { nodes: { active: [this._dfaId(src)], done: [this._dfaId(dst)] }, edges: { active: [[this._dfaId(src), this._dfaId(dst)]] } },
          { nodes: { active: [...dst.ids], fresh: [...dst.ids].filter((v) => !match.has(v)) }, edges: { used: taken, usedEps: used } });
      }
    }

    frame(`subset construction complete: ${discovered} DFA states discovered from the ${this.m + 1}-state NFA (worst case 2^${this.m + 1} = ${2 ** (this.m + 1)}), ${recorded.length} arrows; matching is now one table read per character`,
      discovered,
      { nodes: { done: dfa.states.slice(0, discovered).filter((s) => s.accept).map((s) => this._dfaId(s)) } },
      { nodes: { done: [this.m] } });
    return t.trace();
  }

  /** Traced run of the DETERMINIZED machine, the race's right lane: ONE
   *  frame and one table read per character (versus simulate()'s two frames
   *  and its per-character set work): the asymmetry is the lesson. */
  runDfa(text) {
    const t = new Tracer();
    const dfa = this.determinize();
    const pos = this._dfaLayout(dfa);
    const all = dfa.trans.flatMap((row, i) => Object.entries(row).map(([ch, j]) => [i, ch, j]));
    const snap = () => this._dfaSnapshot(dfa, pos, dfa.states.length, all);
    const id = (i) => this._dfaId(dfa.states[i]);
    const show = (i) => `{${dfa.states[i].key}}`;
    let cur = 0;

    t.step(`the precomputed DFA: ${dfa.states.length} states, each a frozen SET of NFA states; start in S0 = ${show(0)}, no closure work at run time`,
      { snapshot: snap(), highlight: { nodes: { active: [id(0)] } } });

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      t.count("read");
      const nxt = dfa.trans[cur][c];
      if (nxt == null) {
        t.step(`read '${c}' (${i + 1}/${text.length}): no arrow out of S${cur} on '${c}' → the dead state; REJECT "${text}"`,
          { snapshot: snap(), highlight: { nodes: { danger: [id(cur)] } } });
        return t.trace();
      }
      t.step(`read '${c}' (${i + 1}/${text.length}): S${cur} ──${c}──► S${nxt}${nxt === cur ? " (a self-loop)" : ""}: one table read, the set arithmetic was prepaid`,
        { snapshot: snap(), highlight: { nodes: { active: [id(nxt)] }, edges: { active: [[id(cur), id(nxt)]] } } });
      cur = nxt;
    }

    const ok = dfa.states[cur].accept;
    t.step(ok ? `ACCEPT "${text}": ended in S${cur} = ${show(cur)}, which contains the NFA's accept state ${this.m}`
      : `REJECT "${text}": ended in S${cur} = ${show(cur)}, which does not contain accept state ${this.m}`,
      { snapshot: snap(), highlight: ok ? { nodes: { done: [id(cur)] } } : { nodes: { danger: [id(cur)] } } });
    return t.trace();
  }
}
