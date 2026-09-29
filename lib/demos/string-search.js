// CSS 343 unified library — demos/string-search.js
// Substring search as a SIDE-BY-SIDE race: brute force (worst case Θ(nm)) vs
// KMP (worst case Θ(n+m)) run the SAME text/pattern pair in lockstep, one
// trace frame per tick — KMP finishes and freezes while brute force keeps
// re-trying shifts. Both find EVERY occurrence and count matches. The view is
// the codec-style SearchPanels: the TEXT lives in an editable box (top panel;
// long input welcome), the value box takes only the PATTERN, and the pattern —
// with its failure function, on the KMP panel — is drawn under the text.
// Repeat shorthand works in both (A^40B).

import { StringSearch, SearchPanels, MatrixRenderer } from "../index.js";
import { expandRepeats } from "../core/sequence.js";
import { TEXT_MAX, PATTERN_MAX } from "../structures/string-search.js";

const DTEXT = "ABABABCABABABCAB", DPAT = "ABABC";

// The editable text panel registers itself here so the ops can read it (one
// active mount per page — the same convention the adaptive-Huffman demo uses).
// Case is PRESERVED (the text shows as typed; comparisons are case-insensitive
// in the structure), and a pattern may contain spaces — only edges are trimmed
// and runs of whitespace collapse to one space, in text and pattern alike.
const view = {};
const cleanPattern = (v) =>
  expandRepeats(String(v ?? "")).replace(/\s+/g, " ").trim().slice(0, PATTERN_MAX);
const cleanText = (t) =>
  expandRepeats(String(t ?? "")).replace(/\s+/g, " ").trim().slice(0, TEXT_MAX);
const currentText = () => cleanText(view.top?.text()) || DTEXT;

const PROSE =
  "Beneath the bustling metropolitan streets lies a hidden, sprawling underground world " +
  "that few urban residents ever truly notice. Thousands of busy commuters rush through " +
  "the noisy underground subway tubes every single morning, completely unaware of the " +
  "fascinating historical underground tunnels stretching out right beside them. Many " +
  "underprepared city planners often underestimate this massive underground infrastructure " +
  "network, which effectively serves as the city's invisible foundation, safely sheltering " +
  "complex utility lines, forgotten transit tracks, and ancient brick pathways. While " +
  "modern life moves rapidly above, this quiet underground labyrinth remains completely " +
  "frozen in time, safely guarding the historic secrets that casual pedestrians walking " +
  "on the surface will never experience today.";

const MTDNA =  // Homo sapiens mitochondrion (rCRS, NC_012920.1), bases 1–1150
  "GATCACAGGTCTATCACCCTATTAACCACTCACGGGAGCTCTCCATGCATTTGGTATTTTCGTCTGGGGGGTATGC" +
  "ACGCGATAGCATTGCGAGACGCTGGAGCCGGAGCACCCTATGTCGCAGTATCTGTCTTTGATTCCTGCCTCATCCT" +
  "ATTATTTATCGCACCTACGTTCAATATTACAGGCGAACATACTTACTAAAGTGTGTTAATTAATTAATGCTTGTAG" +
  "GACATAATAATAACAATTGAATGTCTGCACAGCCACTTTCCACACAGACATCATAACAAAAAATTTCCACCAAACC" +
  "CCCCCTCCCCCGCTTCTGGCCACAGCACTTAAACACATCTCTGCCAAACCCCAAAAACAAAGAACCCTAACACCAG" +
  "CCTAACCAGATTTCAAATTTTATCTTTTGGCGGTATGCACTTTTAACAGTCACCCCCCAACTAACACATTATTTTC" +
  "CCCTCCCACTCCCATACTACTAATCTCATCAATACAACCCCCGCCCATCCTACCCAGCACACACACACCGCTGCTA" +
  "ACCCCATACCCCGAACCAACCAAACCCCAAAGACACCCCCCACAGTTTATGTAGCTTACCTCCTCAAAGCAATACA" +
  "CTGAAAATGTTTAGACGGGCTCACATCACCCCATAAACAAATAGGTTTGGTCCTAGCCTTTCTATTAGCTCTTAGT" +
  "AAGATTACACATGCAAGCATCCCCGTTCCAGTGAGTTCACCCTCTAAATCACCACGATCAAAAGGAACAAGCATCA" +
  "AGCACGCAGCAATGCAGCTCAAAACGCTTAGCCTAGCCACACCCCCACGGGAAACAGCAGTGATTAACCTTTAGCA" +
  "ATAAACGAAAGTTTAACTAAGCTATACTAACCCCAGGGTTGGTCAATTTCGTGCCAGCCACCGCGGTCACACGATT" +
  "AACCCAAGTCAATAGAAGCCGGCGTAAAGAGTGTTTTAGATCACCCCCTCCCCAATAAAGCTAAAACTCACCTGAG" +
  "TTGTAAAAAACTCCAGTTGACACAAAATAGACTACGAAAGTGGCTTTAACATATCTGAACACACAATAGCTAAGAC" +
  "CCAAACTGGGATTAGATACCCCACTATGCTTAGCCCTAAACCTCAACAGTTAAATCAACAAAACTGCTCGCCAGAA" +
  "CACTACGAGC";

const EXAMPLES = [
  { name: "lecture default — 2 matches", text: DTEXT, pattern: DPAT },
  { name: "prose: “underground”, 5 matches", text: PROSE, pattern: "underground" },
  { name: "DNA: GATC in human mtDNA (rCRS 1–1150)", text: MTDNA, pattern: "GATC" },
  { name: "adversarial: A^40B / A^6B", text: "A^40B", pattern: "A^6B" },
  { name: "skipped alignments: AABAAC (handout)", text: "AABAABAAC", pattern: "AABAAC" },
  { name: "shorter border rescues: AABAAB (handout)", text: "AABAAABAAB", pattern: "AABAAB" },
  { name: "overlapping matches: AA in A^6", text: "A^6", pattern: "AA" },
];

// The race is PAIRWISE: two panels, and the Run dropdown picks which two of
// the three algorithms they hold. Each panel resolves its algorithm (and its
// title) from the chosen pairing at run time.
const ALGO_TITLE = { bruteForce: "brute force", kmp: "KMP", boyerMoore: "Boyer–Moore" };
const PAIRINGS = [
  ["BF vs KMP", ["bruteForce", "kmp"]],
  ["BF vs Boyer", ["bruteForce", "boyerMoore"]],
  ["KMP vs Boyer", ["kmp", "boyerMoore"]],
];

const mkPanel = (side, opts) => {
  const panel = {
    title: ALGO_TITLE[PAIRINGS[0][1][side]], // before the first run: BF vs KMP
    make: () => { const s = new StringSearch(); s.build([DTEXT, DPAT]); return s; },
    renderer: (c) => {
      const p = new SearchPanels(c, opts);
      if (opts.editable) view.top = p;
      return p;
    },
    // HONEST accounting: a KMP fall-back or a Boyer–Moore bad-character
    // lookup is a table read + jump, real work a compare-only counter would
    // hide — so the title totals compares + table reads into "ops", and on
    // low-self-overlap text KMP's total visibly EXCEEDS brute force's. That
    // is the finding, not a bug.
    stat: (snap, f) => {
      const c = (snap && snap.found ? snap.found : []).length;
      const cmp = f.counters["compare"] || 0, tbl = f.counters["read"] || 0;
      const ops = tbl ? `${cmp} cmp + ${tbl} tbl = ${cmp + tbl} ops` : `${cmp} ops`;
      return `${ops} · ${c} match${c === 1 ? "" : "es"}`;
    },
    width: 900, height: 32,
    ops: {},
  };
  for (const [name, algos] of PAIRINGS) {
    panel.ops[name] = (s, v) => {
      panel.title = ALGO_TITLE[algos[side]]; // the panel heading follows the pairing
      s.build([currentText(), cleanPattern(v) || DPAT]);
      return s[algos[side]]();
    };
  }
  return panel;
};

export const stringSearchDemo = {
  id: "string-search",
  title: "Substring Search race (BF · KMP · Boyer–Moore)",
  blurb: "The SAME text scanned side by side, one comparison-frame per tick, in lockstep — and the Run menu picks the pairing: BF vs KMP, BF vs Boyer, or KMP vs Boyer. All three find EVERY occurrence, with a live match count and honest op totals (compares + table reads). Type the text into the left panel (editable; long prose is fine — repeat shorthand like A^40B expands); the value box takes only the pattern (spaces allowed, case ignored). Bold colored chips mark the indices, the tinted run is the current partial match in text and pattern (a SUFFIX of the window for Boyer–Moore, which compares right-to-left), green runs are completed matches, and each panel draws its own aid under the pattern: KMP's fail[], Boyer–Moore's right[] bad-character table.",
  about: `
      <p class="lede">Both searchers on one text, stepped in lockstep, with an operation counter
      and a match count per panel. The counting is deliberately honest: KMP's title splits into
      <b>cmp + tbl</b> — character comparisons plus failure-table consultations, because a
      fall-back is a memory read and a jump, real work a compare-only counter would hide. On
      realistic text that honesty changes the verdict (see the DNA run below).</p>
      <h3>How to drive it</h3>
      <p>The <b>left text box is editable</b> — click in, type or paste anything up to ${TEXT_MAX}
      characters (repeat shorthand expands: <code>A^40B</code>). The value box takes only the
      <b>pattern</b>; a pattern may contain <b>spaces</b> ("underground world"), and matching
      <b>ignores case</b> while the text stays exactly as you typed it. The <b>Run menu picks
      the pairing</b> — BF vs KMP, BF vs Boyer, KMP vs Boyer — and the <b>examples…</b> menu in
      the text panel's header fills text and pattern together. Every algorithm searches the
      WHOLE text and reports every occurrence. <b>Playback paces itself</b>: frames
      where the very first pattern letter misses are routine, so they play at a fraction of the
      tick, and playback slows down wherever a partial match is being extended or torn down —
      on prose, the scan sprints between the interesting neighbourhoods.</p>
      <h3>How to read the picture</h3>
      <p>A thin <b>frame</b> outlines the m text cells the pattern currently covers — the
      alignment itself, sliding right as the search advances. The filled bold chip is the
      character being compared — purple on a match, red on a mismatch — and it sits at text[i]
      and P[j] simultaneously, so the two indices are always visible. The lighter tinted run is the <b>current partial match</b>: the same j characters
      highlighted in the text and in the pattern, which is exactly the "matched prefix survives"
      claim drawn live. For <b>Boyer–Moore</b> the picture mirrors: it compares each window
      <em>right-to-left</em>, so the tinted run is the window's already-matched SUFFIX, growing
      leftward. Completed occurrences turn green and stay. Each panel draws its algorithm's aid
      under the pattern — KMP's fail[] (amber = the entry a fall-back consulted: the matched
      prefix's next border), Boyer–Moore's right[] bad-character table (amber = the entry that
      just decided a shift). Watch the framed window: it slides by ONE under brute force, jumps
      by the border amount under KMP, and under Boyer–Moore can leap its whole length past a
      character the pattern doesn't contain.</p>
      <h3>Runs worth making</h3>
      <ul>
        <li><b>lecture default</b> — <code>ABABABCABABABCAB</code> / <code>ABABC</code>: 2
        matches everywhere; BF 32 ops, KMP 18 + 4 = 22, Boyer–Moore 15 + 5 = 20.</li>
        <li><b>prose</b> — <code>underground</code> in a paragraph of real English (the examples…
        menu): 5 occurrences. BF 897 and KMP 835 + 33 = 868 nearly tie — <b>and Boyer–Moore
        demolishes both: 158 compares + 91 table reads = 249 ops.</b> It examined 158 characters
        of an 807-character text — <em>sublinear, live</em>: run BF vs Boyer and watch the framed
        window leap over words the pattern's letters never touch. The adaptive pacing still slows
        at every <code>under…</code>, including the near-misses <code>underprepared</code> and
        <code>underestimate</code>.</li>
        <li><b>DNA</b> — <code>GATC</code> in the first 1150 bases of the human mitochondrial
        genome (the rCRS reference sequence, NC_012920 — real data, and the genome literally
        opens with a GATC). This is what restriction enzymes do for a living: Sau3AI cuts at
        every <code>GATC</code>, and the 3 green runs are its cut sites. <b>Here brute force
        beats BOTH clever algorithms</b>: BF 1364, KMP 1315 + 168 = 1483, Boyer–Moore
        1000 + 707 = 1707. A 4-letter alphabet defeats them symmetrically: every teardown costs
        KMP a table read while <code>fail = [0,0,0,0]</code> never saves a comparison, and every
        text character occurs somewhere in <code>GATC</code>, so the bad-character rule never
        gets its big leap — the average shift is barely 2.</li>
        <li><b>adversarial</b> — <code>A^40B</code> / <code>A^6B</code>: one match at the very
        end; BF 245 ops, KMP 75 + 35 = 110, Boyer–Moore 41 + 34 = 75. Every brute-force shift
        re-matches six A's; KMP never re-reads a text character; Boyer–Moore pays one look per
        window. Use ⏩.</li>
        <li><b>the handout's two diagrams, live</b> — <code>AABAABAAC</code> / <code>AABAAC</code>
        (the fall-back's first stop works) and <code>AABAAABAAB</code> / <code>AABAAB</code> (the
        first stop fails and the SHORTER border rescues the search — watch j fall twice while i
        stands still).</li>
        <li><b>overlapping matches</b> — <code>AA</code> in <code>A^6</code>: five occurrences,
        because after a full match KMP continues with j = fail[m−1] instead of 0. Brute force
        finds the same five by just trying every shift.</li>
      </ul>
      <p>The gap grows with the <em>pattern</em> length, so a six-character pattern can only show
      a few ×. The lecture's n = 10⁶, m = 1000 figure — a billion comparisons against a million —
      is the same effect at a scale no animation can show.</p>
      <h3>So which one wins?</h3>
      <p>Read the runs together and each algorithm's honest shape falls out. <b>Brute force</b>
      is ≈ n on typical text and wins outright on DNA — a small alphabet defeats both
      heuristics. <b>KMP</b> never beats brute force by much on real text; what it buys is the
      <b>worst-case guarantee</b> and the property that the text pointer <b>never moves
      backward</b>, so it alone runs on a stream you cannot rewind (Boyer–Moore re-reads inside
      every window). <b>Boyer–Moore</b> is the practical champion exactly where real searching
      lives — a big alphabet and a longish pattern (the prose run is sublinear on screen) —
      which is why grep and editors use its family; its plain worst case is still Θ(nm), and
      DNA shows the alphabet shrinking its skips to a crawl. Three algorithms, three different
      bets; the counters let you check each claim on your own text.</p>`,
  links: [
    { href: "../handouts/ch16-strings-tries.html#kmp", label: "Chapter 16 §6: KMP →" },
    { href: "../sessions/S16-strings-tries/index.html", label: "Lecture 16 — Parts 3–4 →" },
  ],
  proto: "kmp",
  panels: [   // side by side — the two texts scan in lockstep next to each other
    mkPanel(0, { label: "text", editable: true, initialText: DTEXT, height: 84 }),
    mkPanel(1, { label: "text (same input)", height: 84 }),
  ],
  ops: PAIRINGS.map(([name, algos]) => ({ name, arg: "string",
    run: (s, v) => { s.build([currentText(), cleanPattern(v) || DPAT]); return s[algos[0]](); } })),
  defaultOp: "BF vs KMP",
  valLabel: "pattern", valWidth: 170,
  initialValue: DPAT, placeholder: "pattern (A^6B expands)",
  speed: 300, speedControl: true, finishButton: true,
  onMount: (demo) => view.top?.setExamples(EXAMPLES, (ex) => {
    view.top.setText(cleanText(ex.text));
    demo.bar.setVal(ex.pattern);
  }),
};

export const kmpFailDemo = {
  id: "kmp-fail",
  proto: "string-search",
  title: "KMP — building the failure function",
  blurb: "The table the search demo takes for granted, built step by step: the pattern matched against ITSELF. fail[j] is the longest proper prefix of P[0..j] that is also a suffix of it, and a mismatch falls back through the part of the table already built — the same never-back-up trick the search uses, applied to the pattern.",
  about: `
      <p class="lede">The search demo starts with <code>fail[]</code> already built. This is where
      it comes from — and it is the piece the exam asks for, because it is the only part of KMP
      that is not a straight loop.</p>
      <h3>What fail[j] means</h3>
      <p>The longest <b>proper prefix</b> of <code>P[0..j]</code> that is also a <b>suffix</b> of
      it. Read operationally: <em>"if I have matched j+1 characters and the next one fails, how
      much of that match survives?"</em> — because those surviving characters are already aligned,
      the text pointer need not move.</p>
      <h3>The build, in three moves</h3>
      <ul>
        <li><b>match</b> — <code>P[j] == P[k]</code>: the overlap grows, write <code>k+1</code>.</li>
        <li><b>fall back</b> — mismatch with <code>k &gt; 0</code>: set <code>k = fail[k-1]</code>
        and try again. This reads the part of the table <em>already built</em>, which is the
        self-reference that keeps the whole build Θ(m).</li>
        <li><b>give up</b> — mismatch with <code>k == 0</code>: write 0 and move on.</li>
      </ul>
      <h3>How to read the picture</h3>
      <p>Three rows: the pattern, <code>fail[]</code> filling in, and the two pointers the whole
      build consists of. <b>j</b> marks the cell being filled; <b>k</b> is the current overlap
      length, and it doubles as an index because <code>P[k]</code> is exactly the character
      <code>P[j]</code> is compared against. Watch which one moves: a <em>match</em> advances
      both, a <em>fall back</em> moves <b>k</b> alone and leaves <b>j</b> standing still. That
      asymmetry is the algorithm — j only ever goes forward, m times, which is why the build is
      \\(\\Theta(m)\\) despite the inner loop.</p>
      <h3>The two patterns from the slides</h3>
      <ul>
        <li><code>AABAA</code> → <b>[0, 1, 0, 1, 2]</b>. The B breaks the run to 0, then AA
        re-grows it.</li>
        <li><code>ABABAC</code> → <b>[0, 0, 1, 2, 3, 0]</b> — the your-turn pattern. Watch the C
        at the end fall 3 → fail[2] = 1 → fail[0] = 0 → 0: <em>three</em> fallbacks in one step,
        each one consulting a cell the build already wrote.</li>
      </ul>
      <p>Then look at the <a href="demo.html?ds=string-search">search demo</a> again: on a
      mismatch after j matched characters it sets <code>j = fail[j-1]</code> and leaves the text
      pointer alone. Same table, same move.</p>`,
  links: [
    { href: "../handouts/ch16-strings-tries.html#kmp", label: "Chapter 16 §6: KMP →" },
    { href: "../sessions/S16-strings-tries/index.html", label: "Lecture 16 — Part 4 →" },
  ],
  make: () => new StringSearch(),
  initial: "",
  noBuild: true,
  chrome: { showValue: false },
  stateMsg: () => 'ready: fail("ABABAC") — the your-turn pattern',
  renderer: (c) => new MatrixRenderer(c),
  costs: ["compare", "read", "write"],
  inputs: [{ key: "p", label: "pattern", value: "ABABAC", width: 130 }],
  presets: [
    { name: "ABABAC (the your-turn)", values: { p: "ABABAC" } },
    { name: "AABAA (the worked slide)", values: { p: "AABAA" } },
    { name: "AABAAC (the search trace)", values: { p: "AABAAC" } },
    { name: "AABAAABAAAABAAAB (two partial fall-backs — the handout's diagram)", values: { p: "AABAAABAAAABAAAB" } },
    { name: "AAAB (the adversarial pattern)", values: { p: "AAAB" } },
    { name: "ABCDE (no self-overlap at all)", values: { p: "ABCDE" } },
  ],
  height: 210,   // three rows now: P, fail[], and the j / k pointers
  ops: [
    { name: "Build fail[]", run: (s, _v, vals) => {
      const pat = expandRepeats(String(vals.p ?? "")).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 20) || "ABABAC";
      s.build(["", pat]);
      return s.failTable();
    } },
  ],
};
