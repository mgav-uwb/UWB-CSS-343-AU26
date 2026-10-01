// CSS 343 unified library: structures/hanoi.js
// TOWERS OF HANOI, two ways on the same pegs:
//
//   solve(n)  the recursive solution, traced: every call pushes a frame,
//             every move is a frame, so the call stack is shown beside the
//             pegs while the disks move
//   play(n)   a game: the person moves disks one at a time (pick a peg, then
//             another), illegal moves are refused, and a hint gives the next
//             move of a shortest solution from wherever the disks are now
//
// The point of the pair: to move n disks, move the n - 1 smaller ones out of
// the way, move the largest, and move the n - 1 back on top. So
// moves(n) = 2 moves(n - 1) + 1 = 2^n - 1, and the recursion's stack is the
// plan a person has to keep in their head while playing.
//
// Snapshot contract: { pegs: [[disk, ...] x 3] (bottom first, disk 1 the
// smallest), n, moves, optimal, mode, sel, last, hint, msg, stack, legend,
// maxDepth }. HanoiRenderer reads the pegs; StackRenderer reads the rest.

import { Tracer } from "../core/tracer.js";

export const HANOI_LIMITS = { nMin: 1, nAuto: 8, nPlay: 8 };
export const PEG = ["A", "B", "C"];

const clonePegs = (p) => p.map((s) => s.slice());

export class Hanoi {
  constructor(n = 3) {
    this.reset(n, "idle");
    this.stack = []; this.maxDepth = 0;
  }

  reset(n, mode = "idle") {
    this.n = n;
    this.pegs = [[], [], []];
    for (let d = n; d >= 1; d--) this.pegs[0].push(d);
    this.moves = 0; this.mode = mode; this.sel = null; this.last = null; this.hint = null;
    this.history = [];
    this.stack = []; this.maxDepth = 0;
  }

  snapshot() {
    return {
      pegs: clonePegs(this.pegs), n: this.n, moves: this.moves, optimal: Hanoi.minMoves(this.n),
      mode: this.mode, sel: this.sel, last: this.last ? { ...this.last } : null,
      hint: this.hint ? { ...this.hint } : null,
      stack: this.stack.map((f) => ({ ...f, lines: f.lines.slice() })),
      legend: this.mode === "auto" || this.mode === "done" ? "hanoi(n, from, to, via)"
        : this.mode === "play" ? (this.stack.length ? "the plan: goals, the current one on top" : "ask for a Hint to see the plan") : "",
      maxDepth: this.maxDepth,
    };
  }
  inorder() { return ""; }

  // ── untraced references: what the tests and the slides' numbers come from ──

  static minMoves(n) { return 2 ** n - 1; }

  /** read the disk count a person typed: { n, note }, clamped to [nMin, max] */
  static readN(raw, max) {
    const t = String(raw ?? "").trim();
    if (!/^[+-]?\d+$/.test(t)) return { n: 3, note: t ? `"${t}" is not a whole number of disks; using 3. ` : "" };
    const v = parseInt(t, 10);
    if (v < HANOI_LIMITS.nMin) return { n: 1, note: `${v} disks is too few; using 1. ` };
    if (v > max) return { n: max, note: `${v} disks is more than this view draws (${2 ** v - 1} moves); using ${max}. ` };
    return { n: v, note: "" };
  }

  /** the move list of the recursive solution: [{disk, from, to}], pegs 0..2 */
  static solution(n, from = 0, to = 2, via = 1, out = []) {
    if (n === 0) return out;
    Hanoi.solution(n - 1, from, via, to, out);
    out.push({ disk: n, from, to });
    Hanoi.solution(n - 1, via, to, from, out);
    return out;
  }

  /** where each disk is: pos[d] = peg index */
  static positions(pegs, n) {
    const pos = new Array(n + 1).fill(-1);
    pegs.forEach((s, p) => s.forEach((d) => { pos[d] = p; }));
    return pos;
  }

  /** fewest moves that put disks 1..k on peg dest, from any legal position */
  static distance(pegs, n, dest = 2) {
    const pos = Hanoi.positions(pegs, n);
    const go = (k, t) => {
      if (k === 0) return 0;
      if (pos[k] === t) return go(k - 1, t);
      const other = 3 - pos[k] - t;
      return go(k - 1, other) + 1 + (2 ** (k - 1) - 1);
    };
    return go(n, dest);
  }

  /** the first move of a shortest way to put every disk on dest, or null if done.
   *  The largest disk not yet on dest must move there, which needs every smaller
   *  disk on the third peg first: so recurse on that subgoal. */
  static nextMove(pegs, n, dest = 2) {
    const pos = Hanoi.positions(pegs, n);
    const go = (k, t) => {
      if (k === 0) return null;
      if (pos[k] === t) return go(k - 1, t);
      const other = 3 - pos[k] - t;
      return go(k - 1, other) || { disk: k, from: pos[k], to: t };
    };
    return go(n, dest);
  }

  /** every peg holds disks in decreasing order, bottom to top */
  isLegal() { return this.pegs.every((s) => s.every((d, i) => i === 0 || s[i - 1] > d)); }
  solved() { return this.pegs[2].length === this.n; }
  top(p) { const s = this.pegs[p]; return s.length ? s[s.length - 1] : 0; }

  /** may the top disk of peg a go onto peg b? */
  canMove(a, b) { return a !== b && this.top(a) > 0 && (this.top(b) === 0 || this.top(a) < this.top(b)); }

  // ── the game ──

  play(n, note = "") {
    this.reset(n, "play");
    return this._frame(`${note}Game: move all ${n} disks from A to C. Click a peg to pick up its top disk, then click where it goes. A larger disk may never sit on a smaller one. The minimum is ${Hanoi.minMoves(n)} moves.`);
  }

  /** one click on peg p: select a source, or move the selected disk there */
  click(p) {
    if (this.mode !== "play") return this._frame("Choose Play to start a game (or Solve to watch the recursion).");
    this.hint = null;
    if (this.sel === null) {
      if (!this.pegs[p].length) return this._frame(`Peg ${PEG[p]} is empty: pick a peg with a disk on it.`);
      this.sel = p;
      return this._frame(`Picked up disk ${this.top(p)} from ${PEG[p]}. Click the peg to put it on (or ${PEG[p]} again to put it back).`);
    }
    const a = this.sel;
    this.sel = null;
    if (a === p) return this._frame(`Put disk ${this.top(p)} back on ${PEG[p]}.`);
    return this.move(a, p);
  }

  /** move the top disk of peg a to peg b, if legal */
  move(a, b) {
    if (this.mode !== "play") return this._frame("Choose Play to start a game first.");
    this.sel = null; this.hint = null;
    if (!this.pegs[a].length) return this._frame(`Peg ${PEG[a]} is empty: nothing to move.`);
    if (a === b) return this._frame(`Disk ${this.top(a)} stays on ${PEG[a]}.`);
    if (!this.canMove(a, b))
      return this._frame(`Not allowed: disk ${this.top(a)} cannot go on disk ${this.top(b)}, which is smaller.`);
    const disk = this.pegs[a].pop();
    this.pegs[b].push(disk);
    this.moves++;
    this.last = { disk, from: a, to: b };
    this.history.push({ disk, from: a, to: b });
    if (this.solved()) {
      this.mode = "won";
      const opt = Hanoi.minMoves(this.n), extra = this.moves - opt;
      return this._frame(extra === 0
        ? `Solved in ${this.moves} moves: the minimum, 2^${this.n} - 1 = ${opt}.`
        : `Solved in ${this.moves} moves. The minimum is 2^${this.n} - 1 = ${opt}, so ${extra} ${extra === 1 ? "move was" : "moves were"} extra.`);
    }
    const left = Hanoi.distance(this.pegs, this.n);
    return this._frame(`Moved disk ${disk} from ${PEG[a]} to ${PEG[b]}. ${this.moves} ${this.moves === 1 ? "move" : "moves"} so far; at least ${left} more to finish.`);
  }

  /** highlight the next move of a shortest solution from here */
  hintMove() {
    if (this.mode !== "play") return this._frame("Hints are for the game: choose Play first.");
    this.sel = null;
    const m = Hanoi.nextMove(this.pegs, this.n);
    this.hint = m;
    this.stack = Hanoi.plan(this.pegs, this.n);
    this.maxDepth = this.stack.length;
    const left = Hanoi.distance(this.pegs, this.n);
    return this._frame(`Hint: move disk ${m.disk} from ${PEG[m.from]} to ${PEG[m.to]}. From here, a shortest finish takes ${left} ${left === 1 ? "move" : "moves"}.`);
  }

  undo() {
    if (this.mode === "won") this.mode = "play";
    if (this.mode !== "play") return this._frame("Nothing to undo.");
    this.sel = null; this.hint = null;
    const m = this.history.pop();
    if (!m) return this._frame("Nothing to undo: no moves yet.");
    this.pegs[m.to].pop(); this.pegs[m.from].push(m.disk);
    this.moves--; this.last = this.history.length ? { ...this.history[this.history.length - 1] } : null;
    return this._frame(`Undid: disk ${m.disk} back from ${PEG[m.to]} to ${PEG[m.from]}. ${this.moves} ${this.moves === 1 ? "move" : "moves"} so far.`);
  }

  _frame(msg) {
    const t = new Tracer();
    if (this.moves) t.count("move", this.moves);        // the game's running move count
    t.step(msg, { snapshot: this.snapshot() });
    this.stack = []; this.maxDepth = 0;                 // a hint's plan is shown once
    return t.trace();
  }

  /** the hint's reasoning as a stack of goals: the outermost goal (every disk
   *  on C) at the bottom, each subgoal it needs above it, the move on top */
  static plan(pegs, n, dest = 2) {
    const pos = Hanoi.positions(pegs, n), frames = [];
    const go = (k, t) => {
      if (k === 0) return;
      if (pos[k] === t) return go(k - 1, t);
      const other = 3 - pos[k] - t;
      frames.push({ title: k === 1 ? `disk 1 onto ${PEG[t]}` : `disks 1..${k} onto ${PEG[t]}`, lines: [`disk ${k} is on ${PEG[pos[k]]}: it must go ${PEG[pos[k]]} \u2192 ${PEG[t]}`, k > 1 ? `first: disks 1..${k - 1} onto ${PEG[other]}` : "nothing is on top of it"], state: "wait" });
      go(k - 1, other);
    };
    go(n, dest);
    if (frames.length) frames[frames.length - 1].state = "run";
    return frames;
  }

  // ── the recursion, traced ──

  /** solve n disks from A to C by the recursive algorithm, one frame per call
   *  entry, per move, and per return to a waiting frame */
  solve(n, note = "") {
    this.reset(n, "auto");
    const t = new Tracer();
    const snap = (msg, hl = {}, pace = null) => t.step(msg, { snapshot: this.snapshot(), highlight: hl, pace });
    const name = (k, f, to, v) => `hanoi(${k}, ${PEG[f]}, ${PEG[to]}, ${PEG[v]})`;
    const total = Hanoi.minMoves(n);
    const smaller = (k) => (k - 1 === 1 ? "disk 1" : `the ${k - 1} smaller disks`);
    snap(n === 1
      ? `${note}Move 1 disk from A to C: the base case, one move.`
      : `${note}Move ${n} disks from A to C, using B as the spare. The recursion: move the ${n - 1} smaller ${n - 1 === 1 ? "disk" : "disks"} out of the way, move disk ${n}, move the ${n - 1} back on top.`);

    const go = (k, from, to, via) => {
      t.count("call");
      const frame = { title: name(k, from, to, via), lines: [], state: "run" };
      if (this.stack.length) this.stack[this.stack.length - 1].state = "wait";
      this.stack.push(frame);
      this.maxDepth = Math.max(this.maxDepth, this.stack.length);
      const doMove = () => {
        const disk = this.pegs[from].pop(); this.pegs[to].push(disk);
        this.moves++; t.count("move");
        this.last = { disk, from, to };
        return disk;
      };
      if (k === 1) {
        frame.lines = ["base case: one disk", `move disk 1  ${PEG[from]} → ${PEG[to]}`];
        snap(`${frame.title}: n = 1, the base case. Move the one disk directly.`, {}, "fast");
        doMove();
        frame.state = "return";
        snap(`Move ${this.moves} of ${total}: disk 1 from ${PEG[from]} to ${PEG[to]}. ${frame.title} returns.`, {}, "fast");
      } else {
        frame.lines = [`▶ 1. hanoi(${k - 1}, ${PEG[from]}, ${PEG[via]}, ${PEG[to]})`, `  2. move ${k} · 3. hanoi(${k - 1},${PEG[via]},${PEG[to]},${PEG[from]})`];
        snap(`${frame.title}: n = ${k} is not 1, so not the base case. First move ${smaller(k)} from ${PEG[from]} to ${PEG[via]}, out of the way of disk ${k}.`);
        go(k - 1, from, via, to);
        frame.state = "run";
        frame.lines = [`✓ 1. ${k - 1} on ${PEG[via]}`, `▶ 2. move disk ${k}  ${PEG[from]} → ${PEG[to]}`];
        snap(`Back in ${frame.title}: ${smaller(k)} ${k - 1 === 1 ? "is" : "are"} on ${PEG[via]}, so disk ${k} is free to move.`);
        doMove();
        frame.lines = [`✓ 2. disk ${k} on ${PEG[to]}`, `▶ 3. hanoi(${k - 1}, ${PEG[via]}, ${PEG[to]}, ${PEG[from]})`];
        snap(`Move ${this.moves} of ${total}: disk ${k} from ${PEG[from]} to ${PEG[to]}. Now move ${smaller(k)} from ${PEG[via]} onto it.`);
        go(k - 1, via, to, from);
        frame.state = "return";
        frame.lines = [`✓ 3. ${k - 1} on ${PEG[to]}`, `${k} disks on ${PEG[to]}: return`];
        snap(`${frame.title} is done: ${k} disks on ${PEG[to]}, in ${Hanoi.minMoves(k)} moves. It returns.`);
      }
      this.stack.pop();
      if (this.stack.length) this.stack[this.stack.length - 1].state = "run";
    };
    go(n, 0, 2, 1);
    this.last = null;
    this.mode = "done";
    snap(`Done: ${n} disks moved from A to C in ${this.moves} moves, which is 2^${n} - 1. The stack was never deeper than ${this.maxDepth} frames.`);
    return t.trace();
  }
}
