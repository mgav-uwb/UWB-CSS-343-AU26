// CSS 343 unified library: demos/recursion.js
// Three bindings of structures/recursion.js. Each shows the same two views of
// one execution, side by side: the RECURSION TREE (every call made so far, its
// result written in as it returns) and the CALL STACK (the calls open now).
// The point is the mechanism, not the answer, so the inputs are small.

import { Recursion, StackRenderer, TreeRenderer } from "../index.js";

// An input box may be HIDDEN (a slide sets chrome.showInput: false), in which
// case the op receives no value for it and uses the spec's default instead.
// A box that is shown and left EMPTY is passed through as it is: the structure
// says what is missing, since running the default would contradict the box.
const given = (vals, key, dflt) => {
  const v = vals ? vals[key] : undefined;
  return v == null ? dflt : v;
};
const whole = (v) => (/^\s*[+-]?\d+\s*$/.test(String(v)) ? parseInt(v, 10) : NaN);
const FACT = { n: "5" };
const KSUM = { a: "1, 2, 3, 4", k: "2", target: "5" };
const THREE = { a: "-1, 0, 1, 2" };

const views = () => ({
  renderer: [
    (c, o) => new TreeRenderer(c, { labels: "none", R: 15, M: 28, centerSingle: true, ...o }),
    (c) => new StackRenderer(c),
  ],
  layout: "row", cols: [640, 240], width: 880, height: 300,
});

const READING = `
      <h3>How to read it</h3>
      <ul>
        <li><b>Left, the tree.</b> A node appears when its call is made. A two-cell node shows the
        call on the left and its result on the right; the right cell is empty until the call
        returns.</li>
        <li><b>Right, the stack.</b> One box per call that has started and not yet returned,
        the newest on top. The box with the marker is running; the boxes under it are waiting
        for the call above them.</li>
        <li><b>Colour.</b> Solid purple is the running call. Pale purple is a waiting call, so the
        purple nodes are exactly the boxes on the stack, in the same order. Green is a call that is
        returning, or a result that counts.</li>
      </ul>
      <p>The stack is always one path in the tree, from the root down to the running call. The
      tree keeps growing; the stack grows and shrinks.</p>`;

const lectureLinks = [
  { href: "../textbook/foundations/foundation-recursion.html", label: "Course text: Recursion & Induction →" },
];

export const factorialDemo = {
  id: "factorial",
  title: "Recursion: factorial",
  blurb: "factorial(n) calls factorial(n-1) and waits. Watch the frames pile up on the way down, one per call, each with its own n, and watch the multiplications happen on the way back up as the frames are popped.",
  about: `
      <p class="lede">A recursive call is a frame pushed on a stack. <code>factorial(n)</code>
      cannot multiply until <code>factorial(n-1)</code> has returned, so it waits, and its frame
      stays on the stack with its own copy of <code>n</code>.</p>
      <pre>long factorial(int n) {
    if (n &lt;= 1) return 1;
    return n * factorial(n - 1);
}</pre>${READING}
      <h3>What to watch for</h3>
      <ul>
        <li>On the way <b>down</b> nothing is multiplied. Every frame ends on a line such as
        <code>5 * factorial(4) = ?</code>.</li>
        <li>The <b>base case</b> is the first call that returns. For <code>factorial(5)</code> the
        stack is 5 frames deep at that moment.</li>
        <li>On the way <b>up</b> each frame receives a value, multiplies, returns, and is
        popped: 1, 2, 6, 24, 120.</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li><code>n = 1</code> and <code>n = 0</code>: the base case alone, one frame.</li>
        <li><code>n = 8</code>: the deepest chain that is drawn. The tree is a single path,
        because each call makes one recursive call.</li>
        <li>Step backward from the end to watch the frames being pushed again.</li>
      </ul>
      <p>Counters: <b>calls</b>, <b>comparisons</b> (the test <code>n &lt;= 1</code>, once per
      call) and <b>multiplications</b>. For <code>n</code> above 1 they are n, n and n - 1.</p>
      <p>The tree and stack are drawn for n up to 8. Larger n reports the exact counts in one
      line; the value is exact up to n = 18.</p>`,
  links: lectureLinks,
  make: () => new Recursion({ kind: "factorial", n: 5 }),
  initial: "", noBuild: true,
  chrome: { showValue: false },
  stateMsg: (s) => s.summary || "factorial(5): press Run, then step. Watch the stack on the way down and the results on the way up",
  costs: ["call", "compare", "multiply"],
  inputs: [{ key: "n", label: "n", value: FACT.n, width: 50 }],
  presets: [
    { name: "n = 5 (the lecture)", values: { n: "5" } },
    { name: "n = 1 (the base case alone)", values: { n: "1" } },
    { name: "n = 8 (the deepest drawn)", values: { n: "8" } },
  ],
  ops: [{ name: "Run factorial", run: (s, _v, vals) => s.factorial(given(vals, "n", FACT.n)) }],
  ...views(),
};

const K_CODE = `<pre>long countK(const vector&lt;int&gt;&amp; a, int start, int k, long target) {
    if (k == 0) return target == 0 ? 1 : 0;
    long cnt = 0;
    for (int i = start; i &lt; (int)a.size(); i++)
        cnt += countK(a, i + 1, k - 1, target - a[i]);
    return cnt;
}</pre>`;

export const kSumDemo = {
  id: "k-sum",
  title: "Recursion: k-sum",
  blurb: "countK chooses k elements one at a time. Each call picks one element in a loop and calls itself to choose the rest, so the tree fans out by the number of choices and its depth is k. A root-to-leaf path spells one complete choice.",
  about: `
      <p class="lede">In how many ways can <b>k</b> of these integers be chosen so that they sum
      to the target? <code>countK</code> picks one element, then calls itself to pick the
      remaining k - 1 from the elements after it.</p>${K_CODE}${READING}
      <h3>Reading this tree</h3>
      <ul>
        <li>A <b>node</b> shows the element that was picked to make its call, so the nodes on a
        path from the root spell the choice made so far. The root, ∅, has picked nothing.</li>
        <li>The target still to be made up is the third argument in the stack frame's title,
        <code>countK(start, k, target)</code>.</li>
        <li>A <b>round leaf</b> is a call with k = 0: a complete choice, tested once. It is green
        when the choice sums to what was asked.</li>
        <li>A <b>two-cell node with no children</b> is a call whose loop never ran, because no
        element was left to pick. It returns 0 without testing anything.</li>
      </ul>
      <h3>What to watch for</h3>
      <ul>
        <li>The stack is never deeper than <b>k + 1</b> frames, however wide the tree gets.</li>
        <li>Each frame keeps its own <code>i</code> and its own <code>cnt</code>. When a call
        returns, the frame under it adds the result to its <code>cnt</code> and moves
        <code>i</code> on.</li>
        <li><b>Checks</b> equal the number of ways to choose k of n. <b>Calls</b> equal the number
        of ways to choose 0, 1, … up to k of n, added together.</li>
      </ul>
      <h3>Things to try</h3>
      <ul>
        <li><code>1, 2, 3, 4</code> with k = 2 and target 5: 11 calls, 6 checks, 2 pairs.</li>
        <li>The same array with k = 3: the tree gets deeper and the stack grows by one frame.</li>
        <li>k = 0: one call, one check. The empty choice sums to 0.</li>
      </ul>
      <h3>Input</h3>
      <p>Integers separated by commas or spaces. Anything that is not a whole number, such as
      <code>3.5</code> or a word, is left out and named in the first message. Trees of up to 48
      leaves are drawn; a larger input still gets its exact answer and counts, in one line.</p>`,
  links: lectureLinks,
  make: () => new Recursion({ kind: "ksum", target: 5 }),
  initial: "", noBuild: true,
  chrome: { showValue: false },
  stateMsg: (s) => s.summary || "choose k of the integers so that they sum to the target: press Run, then step",
  costs: ["call", "check"],
  inputs: [
    { key: "a", label: "a", value: KSUM.a, width: 150 },
    { key: "k", label: "k", value: KSUM.k, width: 40 },
    { key: "target", label: "target", value: KSUM.target, width: 50 },
  ],
  presets: [
    { name: "1,2,3,4 · k = 2 · target 5 (the lecture)", values: { a: "1, 2, 3, 4", k: "2", target: "5" } },
    { name: "-3,-1,0,1,4 · k = 3 · target 0 (3-sum)", values: { a: "-3, -1, 0, 1, 4", k: "3", target: "0" } },
    { name: "1,2,3,4,5 · k = 4 · target 10", values: { a: "1, 2, 3, 4, 5", k: "4", target: "10" } },
    { name: "5,7 · k = 0 · target 0 (the empty choice)", values: { a: "5, 7", k: "0", target: "0" } },
  ],
  ops: [{ name: "Run countK", run: (s, _v, vals) => s.kSum(String(given(vals, "a", KSUM.a)),
    whole(given(vals, "k", KSUM.k)), whole(given(vals, "target", KSUM.target))) }],
  ...views(),
};

export const threeSumDemo = {
  id: "three-sum",
  title: "3-sum: loops and recursion",
  blurb: "The triple loop and the recursion with k = 3 visit the same tree in the same order and make the same checks. The loops do it in one frame, holding their position in i, j and k. The recursion holds its position on the stack, one frame per level.",
  about: `
      <p class="lede">Three nested loops and <code>countK</code> with k = 3 are the same
      algorithm. Run one, then the other, on the same integers.</p>
      <pre>for (int i = 0; i &lt; n; i++)
  for (int j = i + 1; j &lt; n; j++)
    for (int k = j + 1; k &lt; n; k++)
      if (a[i] + a[j] + a[k] == 0) cnt++;</pre>${K_CODE}${READING}
      <h3>What to compare</h3>
      <ul>
        <li><b>The tree is the same shape.</b> Level 1 is the choice of i, level 2 the choice of
        j, level 3 the choice of k. Each leaf is one triple.</li>
        <li><b>The stack is not.</b> The loops run in a single frame. The recursion pushes a frame
        per level and is 4 deep at every leaf.</li>
        <li><b>Only the recursion has results to pass up.</b> Its nodes have a second cell for
        the count each call returns. The loops keep one <code>cnt</code>.</li>
      </ul>
      <p>The counters agree on <b>checks</b>: 4 for four integers, 10 for five. The loops make
      1 call; the recursion makes 15 for four integers and 26 for five.</p>
      <p>What the recursion buys is that 3 can become a variable: see
      <a href="demo.html?ds=k-sum">the k-sum demo</a>.</p>`,
  links: lectureLinks,
  make: () => new Recursion({ kind: "ksum", target: 0 }),
  initial: "", noBuild: true,
  chrome: { showValue: false },
  stateMsg: (s) => s.summary || "run Loops, then Recursion, on the same integers: same tree, same checks, different stack",
  costs: ["call", "check"],
  inputs: [{ key: "a", label: "a", value: THREE.a, width: 170 }],
  presets: [
    { name: "-1,0,1,2 (the lecture: 4 checks, 1 triple)", values: { a: "-1, 0, 1, 2" } },
    { name: "-3,-1,0,1,4 (five integers, 10 checks)", values: { a: "-3, -1, 0, 1, 4" } },
    { name: "-2,-1,0,1,2,3 (six integers, 20 checks)", values: { a: "-2, -1, 0, 1, 2, 3" } },
    { name: "1,2,3,4 (no triple sums to 0)", values: { a: "1, 2, 3, 4" } },
  ],
  ops: [
    { name: "Loops (count3)", run: (s, _v, vals) => s.threeSumLoops(String(given(vals, "a", THREE.a)), 0) },
    { name: "Recursion (countK, k = 3)", run: (s, _v, vals) => s.kSum(String(given(vals, "a", THREE.a)), 3, 0) },
  ],
  ...views(),
};
