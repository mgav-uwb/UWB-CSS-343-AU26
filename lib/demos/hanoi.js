// CSS 343 unified library: demos/hanoi.js
// Towers of Hanoi: the recursive solution beside its call stack (Solve), and a
// game on the same pegs (Play) where clicks move disks, illegal moves are
// refused, and Hint gives the next move of a shortest solution.

import { Hanoi, HANOI_LIMITS, PEG } from "../structures/hanoi.js";
import { HanoiRenderer } from "../core/renderers/hanoi.js";
import { StackRenderer } from "../core/renderers/stack.js";

const given = (vals, key, dflt) => { const v = vals ? vals[key] : undefined; return v == null ? dflt : v; };
const N0 = "3";

/** "A C", "a,c", "1 3" or "AC": the two pegs of a move, or null */
function readPegs(text) {
  const t = String(text ?? "").toUpperCase().replace(/[^ABC123]/g, "");
  if (t.length !== 2) return null;
  const idx = (ch) => ("ABC".includes(ch) ? "ABC".indexOf(ch) : "123".indexOf(ch));
  return [idx(t[0]), idx(t[1])];
}

const CODE = `<pre>void hanoi(int n, char from, char to, char via) {
    if (n == 1) { move(1, from, to); return; }
    hanoi(n - 1, from, via, to);     // 1. the n - 1 smaller disks out of the way
    move(n, from, to);               // 2. the largest disk
    hanoi(n - 1, via, to, from);     // 3. the n - 1 back on top of it
}</pre>`;

export const hanoiDemo = {
  id: "hanoi",
  title: "Recursion: Towers of Hanoi",
  blurb: "Move a tower of disks from peg A to peg C, one disk at a time, never putting a larger disk on a smaller one. Solve shows the recursive solution beside its call stack; Play lets you try it yourself, with the minimum, 2^n - 1 moves, to beat.",
  about: `
      <p class="lede">To move <b>n</b> disks from A to C: move the <b>n - 1</b> smaller disks to B,
      out of the way; move disk <b>n</b> to C; move the n - 1 disks from B onto it. The two smaller
      problems are the same puzzle with one disk fewer, so the solution is recursive.</p>${CODE}
      <h3>Two modes</h3>
      <ul>
        <li><b>Solve</b> runs the code above and records every call and every move. Left, the pegs;
        right, the call stack. Each frame shows which of its three steps it is on: a check mark for
        a finished step, a marker for the current one.</li>
        <li><b>Play</b> is the game. Click a peg to pick up its top disk (it lifts and the peg turns
        purple), then click the peg to put it on. A move onto a smaller disk is refused. The counter
        compares your moves with the minimum. <b>Hint</b> draws the next move of a shortest
        solution from wherever the disks are now, as a dashed arrow; <b>Undo</b> takes back a move.
        While a hint is shown, the right panel holds its reasoning as a <b>stack of goals</b>:
        every disk onto C at the bottom, and above it each smaller goal that has to be met first,
        up to the one move to make now. Keyboard: choose <b>Move</b> and type two pegs, such as
        <code>A C</code>.</li>
      </ul>
      <h3>What to watch for</h3>
      <ul>
        <li><b>Moves:</b> M(1) = 1 and M(n) = 2 M(n - 1) + 1, so M(n) = 2<sup>n</sup> - 1: 7 for
        3 disks, 15 for 4, 255 for 8. Each extra disk doubles the work.</li>
        <li><b>Depth:</b> the stack never holds more than <b>n</b> frames, although the solution
        makes 2<sup>n</sup> - 1 calls. Exponential time, linear stack space.</li>
        <li><b>Disk 1</b> moves on every other move, always around the pegs in the same direction.
        A person can solve the puzzle with that rule alone; the recursion explains why it works.</li>
        <li><b>The game:</b> the hint is itself recursive. The largest disk not yet on C has to get
        there, and before it can, every smaller disk has to be on the third peg.</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li>Play 3 disks without hints, then Solve 3 and compare. Can you finish 4 in 15?</li>
        <li>Solve 4 and pause when disk 4 moves: the stack is one frame deep, and the three
        smaller disks are all on B.</li>
        <li>In the game, make a few wasted moves, then ask for a hint: the remaining minimum is
        printed, so you can see what each mistake cost.</li>
      </ul>
      <p>Disks: 1 to ${HANOI_LIMITS.nAuto}. Counters: <b>calls</b> and <b>moves</b>, both
      2<sup>n</sup> - 1 for Solve.</p>`,
  links: [
    { href: "../textbook/foundations/foundation-recursion.html", label: "Course text: Recursion & Induction →" },
  ],
  make: () => new Hanoi(3),
  initial: "", noBuild: true,
  valPlaceholder: "e.g. A C",
  stateMsg: () => "3 disks on peg A. Solve to watch the recursion, or Play to move them yourself.",
  resetMsg: () => "Reset: 3 disks on peg A, inputs restored. Solve to watch the recursion, or Play to move them yourself.",
  costs: ["call", "move"],
  inputs: [{ key: "n", label: "disks", value: N0, width: 46 }],
  presets: [
    { name: "3 disks (7 moves)", values: { n: "3" } },
    { name: "4 disks (15 moves)", values: { n: "4" } },
    { name: "5 disks (31 moves)", values: { n: "5" } },
    { name: "1 disk (the base case)", values: { n: "1" } },
  ],
  defaultOp: "Solve",
  ops: [
    { name: "Solve", desc: "run the recursive solution from A to C, showing the call stack",
      run: (s, _v, vals) => { const { n, note } = Hanoi.readN(given(vals, "n", N0), HANOI_LIMITS.nAuto); return s.solve(n, note); } },
    { name: "Play", desc: "start a game: click a peg to pick up its top disk, then click where it goes", autoplay: false,
      run: (s, _v, vals) => { const { n, note } = Hanoi.readN(given(vals, "n", N0), HANOI_LIMITS.nPlay); return s.play(n, note); } },
    { name: "Hint", desc: "show the next move of a shortest solution from the current position", autoplay: false,
      enabledWhen: (s) => s.mode === "play", requires: "a game in progress (Play)",
      run: (s) => s.hintMove() },
    { name: "Undo", desc: "take back the last move of the game", autoplay: false,
      enabledWhen: (s) => (s.mode === "play" || s.mode === "won") && s.history.length > 0, requires: "a game with at least one move",
      run: (s) => s.undo() },
    { name: "Move", arg: "string", desc: "move the top disk between two pegs, typed as A C (the keyboard way to play)", autoplay: false,
      enabledWhen: (s) => s.mode === "play", requires: "a game in progress (Play)",
      run: (s, v) => { const pg = readPegs(v); return pg ? s.move(pg[0], pg[1]) : s._frame(`"${v}" is not two pegs: type, for example, A C.`); } },
  ],
  renderer: [
    (c) => new HanoiRenderer(c),
    (c) => new StackRenderer(c, { minSlots: 4, title: "stack" }),
  ],
  layout: "row", cols: [580, 300], width: 880, height: 320,
  // the game is played on the canvas: a click picks a peg
  onMount: (demo) => {
    const cv = demo.player.canvases[0];
    cv.addEventListener("click", (e) => {
      const r = cv.getBoundingClientRect();
      const rend = demo.player.renderers[0];
      const x = (e.clientX - r.left) * (cv.width / r.width) / (rend.scale || 1);
      const p = rend.pegAt(x);
      if (p == null) return;
      // outside a game a click must not replace a Solve replay the reader is
      // stepping through; only the opening and finished-game states answer it
      if (demo.inst.mode !== "play") {
        if (demo.inst.mode === "won") demo.player.load(demo.inst._frame("Solved. Choose Play for a new game, or Undo to take moves back."));
        else if (demo.inst.mode === "idle") demo.player.load(demo.inst._frame(`Clicked peg ${PEG[p]}: choose Play, then Run, to start a game.`));
        return;
      }
      demo.player.load(demo.inst.click(p));
      demo._updateOpEnable();
    });
    cv.style.cursor = "pointer";
  },
};
