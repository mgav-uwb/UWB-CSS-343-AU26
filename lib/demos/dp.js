// CSS 343 unified library — demos/dp.js
// Full-demo specs for dynamic programming: the fib arc (memoized vs naive vs
// two variables — the S14 race, one op per version), rod cutting (the first
// optimization DP: a max over choices plus the cut[] record its traceback
// reads), and the three classic table fills (LCS, 0/1 knapsack, edit
// distance), all on the shared MatrixRenderer. The string demos take their
// words from NAMED input boxes (ported from the S14–S15 lecture demos), so any
// pair can be tried.

import { DP, MatrixRenderer, TreeRenderer } from "../index.js";
import { expandRepeats } from "../core/sequence.js";

const word = (v, dflt) => {
  const s = expandRepeats(String(v ?? "")).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12);
  return s || dflt;
};

export const fibDemo = {
  id: "fib",
  proto: "dp",
  title: "Fibonacci — the DP arc (one version at a time)",
  blurb: "The whole DP arc on one function. Naive recursion recomputes the same values exponentially often (the 'times' row counts the waste — 2·fib(n+1)−1 calls). Memoization caches each fib(k) once (2n−1 calls). The two-variable version never holds more than two cells — Θ(1) space. Run each version at the same n and compare the counters — or open the Fibonacci RACE demo to watch all three in lockstep.",
  about: `
      <p class="lede">One function, four implementations of one recurrence, each strictly better
      than the last. Run all three versions at the same n and read the counters — the whole
      argument for dynamic programming is the gap between them.</p>
      <h3>The three versions</h3>
      <ul>
        <li><b>Naive fib</b> — the textbook recursion, no memory. Two rows: each fib(k)'s value,
        and how many TIMES it has been computed. The trace is one frame per call, so its length
        <em>is</em> the call count: exactly 2·fib(n+1) − 1.</li>
        <li><b>Memo fib</b> — the same recursion plus a cache checked first. Every cache hit is a
        whole subtree of recomputation that never happens. 2n − 1 calls.</li>
        <li><b>2 vars</b> — bottom-up, keeping only the last two values. Watch the table: it never
        grows past two cells. Θ(1) space, n additions.</li>
      </ul>
      <h3>The number worth pausing on</h3>
      <p>At n = 10: <b>177</b> calls, <b>19</b>, <b>10</b> — and 166 of the naive 177 are pure
      recomputation. Look at the <em>times</em> row after a naive run: 34, 55, 34, 21, 13, 8, 5,
      3, 2, 1, 1. Those are Fibonacci numbers themselves — fib(k) is recomputed fib(n−k+1)
      times, the recursion tree measuring itself. At n = 16 the naive lane needs 3,193 calls
      against 31.</p>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#fib", label: "Chapter 14 §1: the whole arc →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 2 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  // the box must START with a value: an op declaring arg:"number" with an empty
  // box is refused by FullDemo, which focuses the box instead of running — and
  // this demo IS its op, so an empty box made it look broken
  valInitial: "10", valPlaceholder: "n (2–16)", valWidth: 70,
  stateMsg: () => "type n (2–16) and pick a version — compare the call counters (try n = 10: 177 vs 19 vs 10)",
  renderer: (c) => new MatrixRenderer(c),
  costs: ["call", "cache-hit", "recompute", "add", "write"],
  ops: [
    { name: "Naive fib", arg: "number", run: (s, v) => s.fibNaive(Math.min(16, Number(v) || 10)) },
    { name: "Memo fib", arg: "number", run: (s, v) => s.fib(Math.min(16, Number(v) || 10)) },
    { name: "2 vars", arg: "number", run: (s, v) => s.fibTwoVar(Number(v) || 10) },
  ],
  width: 900, height: 150,
};

const priceList = (v, dflt) => {
  const nums = String(v ?? "").split(/[,\s]+/).map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x >= 0);
  return nums.length ? nums.slice(0, 12) : dflt;
};

export const rodcutDemo = {
  id: "rodcut",
  proto: "dp",
  title: "Rod cutting — the first optimization DP",
  blurb: "best[len] = the most a rod of that length can earn = max over every first cut i of price[i] + best[len−i]. One frame per candidate, so the Θ(n²) is counted rather than asserted: length len tries len candidates. The cut row records which first cut won each length — that record, not the value, is what the traceback reads back to recover the actual pieces.",
  about: `
      <p class="lede">Fibonacci has overlap but nothing to <em>choose</em>. Rod cutting adds the
      missing ingredient — a decision at every step — and with it the full shape of an
      optimization DP: a max over choices, and a record of which choice won.</p>
      <h3>The three rows</h3>
      <ul>
        <li><b>price</b> — given, never changes. <code>price[i]</code> is what a piece of
        length <code>i</code> sells for.</li>
        <li><b>best</b> — the table being filled. <code>best[len]</code> is the most a rod of
        length <code>len</code> can earn, over every way of cutting it.</li>
        <li><b>cut</b> — the winning FIRST cut at each length. The value alone cannot tell you
        how to cut the rod; this row can, and the traceback at the end walks it.</li>
      </ul>
      <h3>What to watch</h3>
      <ul>
        <li>Every candidate reads a <em>smaller</em> <code>best[]</code> cell (highlighted as it
        is read) — cells that earlier lengths already computed. That reuse is the overlap; without
        the table, <code>best[2]</code> would be recomputed along every first-cut path, exactly
        like naive Fibonacci's <code>fib(2)</code>.</li>
        <li>The candidate counter ends at <code>n(n+1)/2</code>: ≈ n subproblems &times; O(n)
        choices each, which is where Θ(n²) comes from.</li>
        <li>Ties are common and harmless — the code keeps the first winner, so a different
        tie-break finds a different, equally optimal, set of cuts.</li>
      </ul>
      <h3>Instances worth running</h3>
      <ul>
        <li><code>1, 5, 8, 9</code> at n = 4 — the lecture instance. Greedy takes the best
        price-per-length piece (length 3, ratio 2.67) and earns 9; the DP finds 5 + 5 = 10.</li>
        <li><code>2, 5, 7, 8</code> at n = 4 — the your-turn instance. best[3] is a three-way
        tie at 7; best[4] is 10 again.</li>
        <li><code>1, 5, 8, 9, 10</code> at n = 5 — best[5] = 13 by 2 + 3, and both i = 2 and
        i = 3 achieve it (the code records the first).</li>
        <li><code>3, 5, 8, 9, 10, 17, 17, 20</code> at n = 8 — CLRS's price list, where the
        answer is eight length-1 pieces: the whole-rod price is never even close.</li>
      </ul>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#rod", label: "Chapter 14 §2: rod cutting →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 2 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  stateMsg: () => "ready: prices 1,5,8,9 and a rod of length 4 — press Run",
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  chrome: { showValue: false },
  inputs: [
    { key: "prices", label: "price[1..k]", value: "1,5,8,9", width: 150 },
    { key: "n", label: "rod n", value: "4", width: 60 },
  ],
  presets: [
    { name: "1,5,8,9 · n = 4 (the lecture)", values: { prices: "1,5,8,9", n: "4" } },
    { name: "2,5,7,8 · n = 4 (your turn)", values: { prices: "2,5,7,8", n: "4" } },
    { name: "1,5,8,9,10 · n = 5", values: { prices: "1,5,8,9,10", n: "5" } },
    { name: "3,5,8,9,10,17,17,20 · n = 8 (CLRS)", values: { prices: "3,5,8,9,10,17,17,20", n: "8" } },
  ],
  height: 190,
  ops: [
    { name: "Run rod cutting", run: (s, _v, vals) => s.rodCut(priceList(vals.prices, [1, 5, 8, 9]), parseInt(vals.n, 10)) },
  ],
};

export const rodcutTreeDemo = {
  id: "rodcut-tree",
  proto: "dp",
  title: "Rod cutting — the subproblem tree",
  blurb: "The tree the table is an optimization of, walked three ways. A node is the length still to cut, an edge is the piece taken, so a root-to-leaf path IS one complete cutting and the leaves are all 2^(n-1) of them. Naive and Memoized run the SAME depth-first walk in the same order — the only difference is the cache, so the subtrees the memo skips are the ones you just watched being recomputed. Tabulated drops the recursion entirely.",
  about: `
      <p class="lede">The table says <em>what</em> the algorithm computes. This says <em>why</em>
      that is the right thing to compute — and it is the picture the recurrence
      <code>best(len) = max over i of price[i] + best(len−i)</code> is a description of.</p>
      <h3>How to read it</h3>
      <ul>
        <li>A <b>node</b> is the length still to be cut. The root is the whole rod; every
        <code>cut(0)</code> leaf is a rod fully used up.</li>
        <li>An <b>edge badge</b> is the piece taken at that step.</li>
        <li>So a <b>root-to-leaf path</b> is one complete cutting, and its badges spell it:
        2 → 2 means "cut a 2, then cut a 2".</li>
      </ul>
      <h3>The three things it shows that a table cannot</h3>
      <ul>
        <li><b>Every option, at once.</b> A rod of 4 has exactly 8 cuttings — the 8 leaves, which
        are the 2<sup>n−1</sup> compositions of n. The demo scores each one; the optimum
        (2 + 2 = 10) finishes as the only green path, with 9, 9, 9, 7, 7, 7, 4 behind it.</li>
        <li><b>Why greedy loses, as geometry.</b> Selling the rod whole, and the greedy
        best-ratio choice of a 3, are just other paths in the same tree — both reaching 9.
        Nothing about the price list announces which path wins, which is exactly why every
        first cut has to be tried.</li>
        <li><b>The overlap.</b> The last frames colour by length: cut(2) appears twice, cut(1)
        four times, cut(0) eight times. 16 nodes, 5 distinct subproblems. That gap IS dynamic
        programming — the table computes each of the 5 once and the 16 collapse.</li>
      </ul>
      <h3>The three buttons are the three algorithms, on one picture</h3>
      <p>The first two run the <b>same depth-first walk, in the same order, with the same
      narration</b>. The only difference is the cache — so run them back to back and the second
      one's greyed subtrees are exactly the ones you just watched the first one recompute.</p>
      <ul>
        <li><b>Naive (no memo)</b> — solve cut(n) by trying every first cut, and solve every
        remainder from scratch. Each node announces when it is being solved <em>again</em>, and
        nothing is written down: <b>2<sup>n</sup></b> nodes, 16 at n = 4 and 32 at n = 5.</li>
        <li><b>Memoized (top-down)</b> — identical, except each length is solved once. Every later
        time it is reached the node reports the stored value and its whole subtree <em>greys
        out</em>, so the saving is visible as absence. What stays lit is exactly
        <b>1 + n(n+1)/2</b> nodes — the root plus the table's candidate count: 11 of 16 at n = 4,
        16 of 32 at n = 5.</li>
        <li><b>Tabulated (bottom-up)</b> — no recursion at all. Lengths are filled smallest-first,
        each new cell linked to the cells it reads, which already hold answers. n+1 cells and
        n(n+1)/2 links, and nothing is explored twice because nothing is explored at all.</li>
      </ul>
      <p>All three end on the same optimum and the same green chain. The counters tell the story
      on their own: <b>recompute</b> on the first, <b>cache-hit</b> on the second, neither on the
      third.</p>
      <p>The three end on the same optimum, which is the point: they are one algorithm seen at
      three levels of implementation. The pruned tree's node count IS the table's candidate count,
      so this demo and <a href="demo.html?ds=rodcut">the table demo</a> are counting the same
      work in two pictures.</p>
      <h3>Reading a node</h3>
      <p>Each node is two cells: <b>the subproblem on the left</b> (the length still to cut) and
      <b>its answer on the right</b>. Each edge badge is <code>piece→price</code>. So the
      recurrence is readable straight off the picture: a parent's value is its badge plus the
      child's value — <code>[4|10]</code> sits above <code>2→5</code> above <code>[2|5]</code>,
      and 5 + 5 = 10. The <b>green chain</b> is the optimal solution: green nodes, green edges,
      green badges, root to base.</p>
      <p>The two tree views are capped at <b>n = 5</b> (32 nodes) — past that the drawing stops
      being readable, which is the argument for the table rather than a limitation of the demo;
      see <a href="demo.html?ds=rodcut-race">the race</a> for what n = 12 costs (4096 calls).
      <b>Tabulated has no such cap</b> and runs to n = 8, since it never builds a tree at all:
      it is n+1 cells and n(n+1)/2 links however large n gets, wrapping to two rows when it needs
      the room.</p>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#rod", label: "Chapter 14 §2: rod cutting →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 2 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  chrome: { showValue: false },
  stateMsg: () => "ready: prices 1,5,8,9, rod 4 — 8 ways to cut it. Run Naive, then Memoized: same walk, one difference",
  renderer: (c) => new TreeRenderer(c, { labels: "sym", R: 15 }),
  costs: ["compare", "recompute", "cache-hit", "read", "write"],
  inputs: [
    { key: "prices", label: "price[1..k]", value: "1,5,8,9", width: 150 },
    { key: "n", label: "rod n", value: "4", width: 60 },
  ],
  presets: [
    { name: "1,5,8,9 · n = 4 (the lecture)", values: { prices: "1,5,8,9", n: "4" } },
    { name: "2,5,7,8 · n = 4 (your turn)", values: { prices: "2,5,7,8", n: "4" } },
    { name: "1,5,8,9,10 · n = 5 (16 cuttings)", values: { prices: "1,5,8,9,10", n: "5" } },
    { name: "1,5,8 · n = 3 (the small case)", values: { prices: "1,5,8", n: "3" } },
    { name: "1,5,8,9,10,17,17,20 · n = 8 (tabulated only)", values: { prices: "1,5,8,9,10,17,17,20", n: "8" } },
  ],
  height: 360,
  ops: [
    { name: "Naive (no memo)", run: (s, _v, vals) => s.rodCutTree(priceList(vals.prices, [1, 5, 8, 9]), parseInt(vals.n, 10)) },
    { name: "Memoized (top-down)", run: (s, _v, vals) => s.rodCutTreeMemo(priceList(vals.prices, [1, 5, 8, 9]), parseInt(vals.n, 10)) },
    { name: "Tabulated (bottom-up)", run: (s, _v, vals) => s.rodCutTreeTab(priceList(vals.prices, [1, 5, 8, 9]), parseInt(vals.n, 10)) },
  ],
};

export const lcsTreeDemo = {
  id: "lcs-tree",
  proto: "dp",
  title: "LCS — the subproblem tree",
  blurb: "The recursion the LCS table is an optimization of. A node is a prefix pair (i,j); an edge is the move the recurrence makes — ↖ when the last characters MATCH (worth +1, one child), otherwise ↑ drop A's last character or ← drop B's (two children). Naive and Memoized run the same walk and differ only in the cache. The green chain is the traceback, and its ↖ edges spell the subsequence.",
  about: `
      <p class="lede">The <a href="demo.html?ds=lcs">LCS table</a> shows the answer being filled
      in. This shows the recursion that answer is an optimization of — and the same three-way
      story as <a href="demo.html?ds=rodcut-tree">rod cutting</a>, on a two-dimensional
      subproblem.</p>
      <h3>Reading it</h3>
      <ul>
        <li>A <b>node</b> is a prefix pair <code>(i,j)</code>: the first i characters of A against
        the first j of B. Its right-hand cell is the LCS length of those prefixes.</li>
        <li>An <b>edge</b> is the move: <b>↖ X</b> when the last characters match — pair them,
        worth +1, and only ONE child follows; <b>↑</b> drops A's last character and <b>←</b> drops
        B's, which is the two-way branch that makes the tree grow.</li>
        <li>A base case is any pair with an empty prefix: <code>(0,j)</code> or
        <code>(i,0)</code>, worth 0.</li>
      </ul>
      <h3>The payoff</h3>
      <p>The <b>green chain</b> is the traceback, and its ↖ edges are the matched characters —
      read them off and they spell the subsequence. For <code>AGCAT</code> / <code>GAC</code>
      that is <b>AC</b>; for <code>SUNDAY</code> / <code>SATURDAY</code>, <b>SUDAY</b>. The same
      path is the staircase of green cells in the table demo.</p>
      <h3>Naive vs Memoized</h3>
      <p>Same walk, same order, same words — one difference. On <code>AGCAT</code> /
      <code>GAC</code>: <b>27 nodes</b> without the memo, <b>19 visited over 16 distinct pairs</b>
      with it. The bound is what matters: however wildly the tree branches, there are never more
      than <b>(m+1)(n+1)</b> distinct pairs — 24 here — because a pair is just a cell of the
      table. That is the whole reason Θ(mn) is available for a recursion that otherwise explores
      exponentially many alignments.</p>
      <p>The tree is capped at ~90 nodes; longer strings are shortened from the front and the
      first frame says so. CLRS's <code>ABCBDAB</code> / <code>BDCABA</code> is 152 nodes
      uncapped, against 42 memoized — the ratio is the point, and
      <a href="demo.html?ds=lcs">the table</a> is where to run the full pair.</p>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#lcs", label: "Chapter 14 §3: LCS →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 3 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  chrome: { showValue: false },
  stateMsg: () => 'ready: LCS("AGCAT", "GAC") — 27 nodes naive, 19 memoized. Run both',
  renderer: (c) => new TreeRenderer(c, { labels: "none", R: 15 }),
  costs: ["compare", "recompute", "cache-hit"],
  inputs: [
    { key: "a", label: "A", value: "AGCAT", width: 90 },
    { key: "b", label: "B", value: "GAC", width: 90 },
  ],
  presets: [
    { name: "AGCAT / GAC (the lecture table)", values: { a: "AGCAT", b: "GAC" } },
    { name: "ABCB / BDCB (handout ex. 5)", values: { a: "ABCB", b: "BDCB" } },
    { name: "AB / CB (the smallest case)", values: { a: "AB", b: "CB" } },
    { name: "SUNDAY / SATURDAY", values: { a: "SUNDAY", b: "SATURDAY" } },
  ],
  height: 360,
  ops: [
    { name: "Naive (no memo)", run: (s, _v, vals) => s.lcsTree(word(vals.a, "AGCAT"), word(vals.b, "GAC")) },
    { name: "Memoized (top-down)", run: (s, _v, vals) => s.lcsTreeMemo(word(vals.a, "AGCAT"), word(vals.b, "GAC")) },
  ],
};

const gridRows = (v, dflt) => {
  const rows = String(v ?? "").split(/[;/\n]+/).map((r) =>
    r.split(/[,\s]+/).map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x)))
    .filter((r) => r.length);
  return rows.length ? rows : dflt;
};

export const gridDpDemo = {
  id: "grid-dp",
  proto: "dp",
  title: "Grid DP — cheapest path & counting paths",
  blurb: "Move right or down only. Two objectives on ONE table: the cheapest path (cell cost + min of up/left, traced back in green) and the number of paths (up + left). The state and the fill order are identical — only the combine step changes, which is the whole point of the shape.",
  about: `
      <p class="lede">The third table shape, and the one where "same state, different transition"
      is easiest to see: both objectives fill the identical grid in the identical order, and differ
      in one operator.</p>
      <h3>Two objectives, one table</h3>
      <ul>
        <li><b>Cheapest path</b> — <code>dp[i][j] = cost[i][j] + min(up, left)</code>. The corner
        holds the cost of the best route, and the green chain is the route: from the corner, step
        back to whichever neighbour the cell actually read.</li>
        <li><b>Count paths</b> — <code>dp[i][j] = up + left</code>. A <em>sum</em> instead of a
        min, because every way of reaching a neighbour is a distinct way of reaching this cell.</li>
      </ul>
      <p>Both read only up and left, so a plain row-major sweep is already a legal fill order — no
      recursion, no dependency analysis. That is what makes grid DP the friendliest of the shapes.</p>
      <h3>What to run</h3>
      <ul>
        <li><code>1 3 1 / 1 5 1 / 4 2 1</code>, cheapest → fills to
        <code>1 4 5 / 2 7 6 / 6 8 7</code>, answer <b>7</b> (the lecture's worked grid).</li>
        <li>All-ones, count → <code>1 1 1 / 1 2 3 / 1 3 6</code>, answer <b>6</b> — which is
        C(4,2), because a right/down route is just a choice of which 2 of 4 steps go down.</li>
        <li>Put a <b>wall</b> in the middle with a negative cost (<code>1 1 1 / 1 -1 1 / 1 1 1</code>):
        counting drops from 6 to <b>2</b>, the only two routes hugging the edges. Walls need no new
        machinery — a blocked cell simply contributes nothing.</li>
      </ul>
      <p>Robot paths, seam carving, dynamic time warping and the edit-distance table are all this
      shape; only the neighbour set and the combine step move.</p>`,
  links: [
    { href: "../handouts/ch15-dp-ii.html#grid", label: "Chapter 15 §4: grid & interval DP →" },
    { href: "../sessions/S15-dp-ii/index.html", label: "Lecture 15 — Part 3 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  chrome: { showValue: false },
  stateMsg: () => "ready: the lecture's 3x3 grid — run Cheapest path, then Count paths",
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  inputs: [{ key: "g", label: "grid (rows / rows)", value: "1 3 1 / 1 5 1 / 4 2 1", width: 200 }],
  presets: [
    { name: "1 3 1 / 1 5 1 / 4 2 1 (the lecture)", values: { g: "1 3 1 / 1 5 1 / 4 2 1" } },
    { name: "all ones 3x3 (count = 6)", values: { g: "1 1 1 / 1 1 1 / 1 1 1" } },
    { name: "a wall in the middle (count = 2)", values: { g: "1 1 1 / 1 -1 1 / 1 1 1" } },
    { name: "5x5 ramp", values: { g: "1 2 3 4 5 / 2 1 2 3 4 / 3 2 1 2 3 / 4 3 2 1 2 / 5 4 3 2 1" } },
  ],
  height: 260,
  ops: [
    { name: "Cheapest path", run: (s, _v, vals) => s.gridPath(gridRows(vals.g, [[1, 3, 1], [1, 5, 1], [4, 2, 1]]), "min") },
    { name: "Count paths", run: (s, _v, vals) => s.gridPath(gridRows(vals.g, [[1, 3, 1], [1, 5, 1], [4, 2, 1]]), "count") },
  ],
};

export const lcsDemo = {
  id: "lcs",
  proto: "dp",
  title: "LCS (longest common subsequence)",
  blurb: "Fill the (|a|+1)×(|b|+1) length table: a diagonal +1 on a character match, otherwise the max of the cell above and the cell to the left. Traceback from the bottom-right corner recovers the subsequence itself. Type any two words (the repeat shorthand works: A^6 vs (AB)^3).",
  about: `
      <p class="lede">The canonical two-dimensional DP, and the most deployed one you will meet
      this term: <code>L[i][j]</code> is the LCS length of the first i characters of a and the
      first j of b, and every cell reads only its up, left and diagonal neighbours.</p>
      <h3>The recurrence, as the cells show it</h3>
      <ul>
        <li><b>match</b> — the two last characters are equal, so pairing them costs nothing:
        <code>diagonal + 1</code>. One highlighted source cell.</li>
        <li><b>mismatch</b> — at least one of the two last characters is not in the LCS, so drop
        one and take the better: <code>max(up, left)</code>. Two highlighted source cells.</li>
        <li><b>traceback</b> — the corner holds only the LENGTH. Walking back from it, taking a
        diagonal step on each match and following the larger neighbour otherwise, spells the
        subsequence itself. This is why the whole table is kept: the two-row space optimization
        can report the length but not the string.</li>
      </ul>
      <h3>A built-in bug detector</h3>
      <p>Values never decrease going right or down, and adjacent cells never differ by more than
      1. A hand-filled table that drops or jumps by 2 is wrong, and the invariant pins the bug to
      within a cell.</p>
      <h3>Pairs worth trying</h3>
      <ul>
        <li><code>AGCAT</code> / <code>GAC</code> — the lecture table. Length 2; AC, GC and GA
        are all valid answers (the length is unique, the string is not).</li>
        <li><code>SUNDAY</code> / <code>SATURDAY</code> — length 5, SUDAY: SATURDAY has no N.</li>
        <li><code>ABCBDAB</code> / <code>BDCABA</code> — the CLRS pair, length 4 (BCBA).</li>
        <li><code>A^6</code> / <code>(AB)^3</code> — the repeat shorthand, and a table that is
        all matches down one staircase.</li>
      </ul>`,
  links: [
    { href: "../handouts/ch14-dp-i.html#lcs", label: "Chapter 14 §3: LCS →" },
    { href: "../sessions/S14-dp-i/index.html", label: "Lecture 14 — Part 3 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  stateMsg: () => 'ready: LCS("SUNDAY", "SATURDAY") — edit the words, press Run',
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  chrome: { showValue: false },
  inputs: [
    { key: "a", label: "a", value: "SUNDAY", width: 100 },
    { key: "b", label: "b", value: "SATURDAY", width: 100 },
  ],
  presets: [
    { name: "SUNDAY / SATURDAY", values: { a: "SUNDAY", b: "SATURDAY" } },
    { name: "ABCBDAB / BDCABA (CLRS)", values: { a: "ABCBDAB", b: "BDCABA" } },
    { name: "A^6 / (AB)^3 — repeat shorthand", values: { a: "A^6", b: "(AB)^3" } },
  ],
  ops: [
    { name: "Run LCS", run: (s, _v, vals) => s.lcs(word(vals.a, "SUNDAY"), word(vals.b, "SATURDAY")) },
  ],
};

export const knapsackDemo = {
  id: "knapsack",
  proto: "dp",
  title: "0/1 Knapsack",
  blurb: "Fill the (n+1)×(capacity+1) value table: for each item, take it (value + the best without its weight) or skip it (carry the row above), whichever is larger. Traceback compares each row to the one above to recover which items were taken. Edit the item set as weight/value pairs and the capacity after the arrow, e.g. 2/3, 3/4, 4/5, 5/6 -> 5.",
  about: `
      <p class="lede">The 2-D table where the state is <em>two</em> things at once: how many items
      you have considered, and how much capacity is left. Every cell asks one question — take this
      item, or skip it?</p>
      <h3>Reading a cell</h3>
      <ul>
        <li><b>skip</b> — the value directly ABOVE (same capacity, one fewer item available).</li>
        <li><b>take</b> — this item's value plus the cell one row up and <em>weight</em> columns
        left, i.e. the best use of what capacity remains. Only offered if the item fits.</li>
        <li>The cell keeps the larger. The highlighted source cells show exactly which two are
        being compared.</li>
      </ul>
      <h3>Writing an instance</h3>
      <p>The box holds the whole problem: the items, then the capacity after the arrow.</p>
      <ul>
        <li><code>2/3, 3/4, 4/5, 5/6 -&gt; 5</code> — each item is <b>weight/value</b>, so the
        pairing is on the screen rather than in your head. This is the lecture's set.</li>
        <li><code>w=1..12:2, v=(2,5,7,13,15,16) -&gt; 23</code> — generate the two columns instead,
        using the same range syntax as the other demos. The lists must be the same length; a
        mismatch is reported rather than quietly padded. Ordering one column (<code>:RAND</code>)
        shuffles it independently of the other, so the weight/value pairing changes too.</li>
      </ul>
      <h3>Change the capacity and watch the answer change</h3>
      <p>Keeping the lecture's set A(w2/v3) B(w3/v4) C(w4/v5) D(w5/v6):</p>
      <ul>
        <li><b>W = 5</b> → A + B, value <b>7</b> (the lecture table)</li>
        <li><b>W = 9</b> → A + B + C, value <b>12</b></li>
        <li><b>W = 12</b> → B + C + D, value <b>15</b> — <b>A drops out entirely.</b> The densest
        item is not in the answer, which is precisely why greedy has no license here.</li>
        <li><b>W = 14</b> → all four, value <b>18</b> (14 is the total weight, so everything fits)</li>
      </ul>
      <h3>Instances where greedy is not merely unproven but wrong</h3>
      <ul>
        <li><code>1/6, 2/10, 3/12 -&gt; 5</code> — densities 6, 5, 4. Greedy takes A then B and
        stops at <b>16</b>; the optimum is B + C = <b>22</b>.</li>
        <li><code>1/6, 5/25, 6/29 -&gt; 11</code> — the same trap, wider: greedy gets <b>31</b>,
        the optimum is <b>54</b>. Taking the densest item first costs you the only pair that fills
        the sack exactly.</li>
        <li><code>3/10, 5/12, 7/15 -&gt; 9</code> — the optimum uses <b>8</b> of the 9 capacity.
        A full sack is not the goal, and no rule says the best answer fills it.</li>
      </ul>
      <p>The traceback then walks up the last column comparing each cell to the one above it: a
      change means the item was taken. That "compare to the no-choice cell" test is all the
      reconstruction needs.</p>`,
  links: [
    { href: "../handouts/ch15-dp-ii.html#knap", label: "Chapter 15 §1: 0/1 knapsack →" },
    { href: "../sessions/S15-dp-ii/index.html", label: "Lecture 15 — Part 1 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  stateMsg: () => "ready: items and capacity from the box (weight/value pairs, then -> capacity) — press Run",
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  chrome: { showValue: false },
  inputs: [{ key: "spec", label: "items -> capacity", value: "2/3, 3/4, 4/5, 5/6 -> 5", width: 300 }],
  presets: [
    { name: "the lecture set, W = 5", values: { spec: "2/3, 3/4, 4/5, 5/6 -> 5" } },
    { name: "the lecture set, W = 12 (A drops out!)", values: { spec: "2/3, 3/4, 4/5, 5/6 -> 12" } },
    { name: "the lecture set, W = 14 (everything fits)", values: { spec: "2/3, 3/4, 4/5, 5/6 -> 14" } },
    { name: "greedy by density: 16, optimal 22", values: { spec: "1/6, 2/10, 3/12 -> 5" } },
    { name: "greedy by density: 31, optimal 54", values: { spec: "1/6, 5/25, 6/29 -> 11" } },
    { name: "the sack ends up NOT full (8 of 9)", values: { spec: "3/10, 5/12, 7/15 -> 9" } },
    { name: "generated: w=1..12:2, v=(2,5,7,13,15,16)", values: { spec: "w=1..12:2, v=(2,5,7,13,15,16) -> 23" } },
    { name: "generated: shuffled weights", values: { spec: "w=1..12:2:RAND, v=(2,5,7,13,15,16) -> 23" } },
  ],
  height: 280,
  ops: [
    { name: "Run knapsack", run: (s, _v, vals) => s.knapsackSpec(vals.spec) },
  ],
};

export const editDistanceDemo = {
  id: "edit-distance",
  proto: "dp",
  title: "Edit Distance (Levenshtein)",
  blurb: "Fill the (|a|+1)×(|b|+1) table: a free diagonal step on a character match, otherwise 1 + the min of insert / delete / replace. Traceback from the bottom-right corner recovers the shortest edit script. Type any two words.",
  about: `
      <p class="lede">The same 2-D prefix table as LCS with the objective flipped: LCS
      <em>maximizes</em> matches, edit distance <em>minimizes</em> edits. Three neighbours instead
      of two, a min instead of a max.</p>
      <h3>The three operations, as three neighbours</h3>
      <ul>
        <li><b>↑ up</b> — delete a character of A</li>
        <li><b>← left</b> — insert a character of B</li>
        <li><b>↖ diagonal</b> — replace (or, when the characters match, a <em>free</em> step: no
        edit at all, which is the only way the count fails to grow)</li>
      </ul>
      <p>Base row and column are 0,1,2,3… — turning a prefix into the empty string costs one
      deletion per character.</p>
      <h3>Pairs worth running</h3>
      <ul>
        <li><code>kitten</code> / <code>sitting</code> → <b>3</b>, the classic: replace k→s,
        replace e→i, insert g. Matches the lecture table.</li>
        <li><code>MONDAY</code> / <code>SUNDAY</code> → <b>2</b> (replace M→S, replace O→U) — a
        good one to predict before running.</li>
        <li><code>banana</code> / <code>banana</code> → 0, and the whole diagonal is free.</li>
      </ul>
      <h3>How the traceback works</h3>
      <ol>
        <li><b>Start</b> at the bottom-right cell <code>D[M][N]</code>, which holds the answer.</li>
        <li><b>Look back</b> at the three cells that could have produced it: <b>↖</b> (i−1, j−1),
        <b>↑</b> (i−1, j), <b>←</b> (i, j−1).</li>
        <li><b>Step</b> to the one that <em>accounts for</em> this cell's value under the
        recurrence — on a mismatch, the neighbour with <code>D[i][j] = 1 + neighbour</code>; on a
        match, the diagonal, taken free. (The rule is not "step to the smallest neighbour": it is
        the one the recurrence actually used.)</li>
        <li><b>Stop</b> at <code>(0,0)</code>, then <b>reverse</b> the moves — they were collected
        backwards, and reversing is what turns "how I got here" into "what to do".</li>
      </ol>
      <p>Each move names an operation: ↖ on matching characters is a <em>match</em>, ↖ on differing
      ones a <em>replace</em>, ↑ a <em>delete</em> from A, ← an <em>insert</em> from B. So the green
      path is the <em>edit script</em>, not just the count, which is what a spell-checker or a diff
      actually reports.</p>
      <p>When two neighbours both explain a cell there are several optimal scripts, and any one of
      them is correct: <code>ab</code> → <code>ba</code> has distance 2 by three different routes
      (replace both characters; insert b, match a, delete b; or delete a, match b, insert a).
      Weighting the three operations differently (a substitution matrix) changes the constants and
      nothing else — that generalization is Needleman–Wunsch alignment.</p>`,
  links: [
    { href: "../handouts/ch15-dp-ii.html#edit", label: "Chapter 15 §3: edit distance →" },
    { href: "../sessions/S15-dp-ii/index.html", label: "Lecture 15 — Part 2 →" },
  ],
  make: () => new DP(),
  initial: "",
  noBuild: true,
  stateMsg: () => 'ready: editDistance("kitten", "sitting") — edit the words, press Run',
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  chrome: { showValue: false },
  inputs: [
    { key: "a", label: "a", value: "kitten", width: 100 },
    { key: "b", label: "b", value: "sitting", width: 100 },
  ],
  presets: [
    { name: "kitten → sitting (the classic)", values: { a: "kitten", b: "sitting" } },
    { name: "intention → execution", values: { a: "intention", b: "execution" } },
    { name: "identical words (distance 0)", values: { a: "banana", b: "banana" } },
  ],
  ops: [
    { name: "Run edit distance", run: (s, _v, vals) => s.editDistance(expandRepeats(vals.a).toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || "kitten", expandRepeats(vals.b).toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || "sitting") },
  ],
};
