// CSS 343 unified library — demos/trie.js
// Full-demo spec for the trie (prefix tree): insert/search/delete/prefix, all
// Θ(key length). The initial box takes a comma/space-separated WORD list (buildRaw
// hands the raw text through — the numeric parser never sees it); an empty box
// replays the classic sample. Rendered with the dedicated TrieRenderer: root
// at top center, one drawn edge per character, • marks a stored word.

import { Trie, TrieRenderer } from "../index.js";
import { concatTraces } from "../core/tracer.js";

const SAMPLE = ["she", "sells", "sea", "shells", "shell"];
const words = (text) => String(text ?? "").toLowerCase().split(/[^a-z]+/).filter(Boolean).slice(0, 10);

export const trieDemo = {
  id: "trie",
  title: "Trie (Prefix Tree)",
  blurb: "Each edge is one character; a node is a stored word only if a key ends there (shown as a trailing '•') — that mark says a key ends here, not that the tree ends here, since a word can be a prefix of a longer word. insert/search/delete/prefix cost only the length of the key — independent of how many other keys are stored. Delete unmarks the •, then prunes upward exactly the nodes no other key needs. The initial box takes your own comma-separated word list.",
  about: `
      <p class="lede">A symbol table whose keys are <em>strings</em>, stored by their character
      path. The cost of a search is the length of the key — not the number of keys — and the shape
      of the tree answers prefix questions a hash table cannot.</p>
      <h3>The subtlety, in both directions</h3>
      <p><b>A path existing is not the same as a key being stored.</b> Search <code>shells</code>
      (walks the shared path to a node marked <b>•</b> — found) and then <code>shel</code>: the
      path exists, because it is on the way to shell/shells, but the node carries no <b>•</b>,
      so it is correctly rejected. That distinction is the commonest trie bug, and the ICA tests it.</p>
      <p><b>And a key need not sit at a leaf.</b> A word can be a prefix of another word, so the
      node a key ends on may have children — in the default set, <code>she</code> is a word with an
      <code>l</code> hanging off it, and the <code>to/tea/ted/ten/in/inn</code> preset has
      <code>in</code> marked with an <code>n</code> below it. This is exactly why the mark is a
      stored bit and not a computed test: if every key ended at a leaf you could just ask "no
      children?" and drop it. So read <b>•</b> as <em>a key ends here</em>, never <em>the tree ends
      here</em>. Only the converse always holds: every leaf carries a <b>•</b>, since nothing but an
      inserted key would have created it.</p>
      <h3>What to run</h3>
      <ul>
        <li><b>Insert</b> a branching word like <code>sun</code> into the default set — only the
        missing suffix appears; the <code>s</code> is reused. That prefix sharing is why a
        dictionary of English words is far smaller as a trie than as a list.</li>
        <li><b>Search</b> <code>shells</code> ✓ then <code>shel</code> ✗ — the subtlety above.</li>
        <li><b>Prefix</b> <code>sh</code> — the highlighted subtree <em>is</em> the answer to
        "what completes this?". No search, no sorting: the structure already grouped them.</li>
        <li><b>Delete</b> <code>shells</code> — two phases: unmark the <b>•</b>, then prune
        bottom-up any node with no children and no <b>•</b>. One node is freed, and pruning stops
        at <code>shell</code> because it is itself a stored word. Then Delete <code>she</code>:
        <em>no</em> node is freed at all — its node stays, unmarked, because other keys still pass
        through it. The stopping rule is the shared-structure trap: never remove a node another
        key needs. (Delete <code>cat</code> in the no-sharing preset to watch a whole branch
        prune back to the root.)</li>
      </ul>
      <p>Watch the step count rather than the tree: adding more words never slows a search, only
      longer words do. The presets contrast heavy prefix sharing (to/tea/ted/ten/in/inn) with none
      at all (cat/dog/fox), which is the same contrast as a compressed trie's best and worst case.</p>`,
  links: [
    { href: "../handouts/ch16-strings-tries.html#trie", label: "Chapter 16 §2: R-way tries →" },
    { href: "../sessions/S16-strings-tries/index.html", label: "Lecture 16 — Part 1 →" },
  ],
  make: () => new Trie(),
  initial: "she, sells, sea, shells, shell",
  presets: [
    { name: "she sells sea shells…", initial: "she, sells, sea, shells, shell" },
    { name: "shared prefixes (to/tea/ted/ten/in/inn)", initial: "to, tea, ted, ten, in, inn" },
    { name: "no sharing (cat, dog, fox)", initial: "cat, dog, fox" },
  ],
  initialPlaceholder: "word, word, …",
  initialTitle: "comma/space-separated words (up to 10) — Build inserts them one by one",
  buildRaw: (s, text) => {
    const ws = words(text);
    return concatTraces((ws.length ? ws : SAMPLE).map((w) => s.insert(w)));
  },
  proto: "trie",
  valPlaceholder: "word",
  stateMsg: (tr) => `words: ${tr.inorder().join(", ")} — edit the list and press Build, or Insert one word`,
  renderer: (c) => new TrieRenderer(c),
  costs: ["compare", "visit", "alloc", "write", "free"],
  ops: [
    { name: "Insert", arg: "string", run: (s, v) => s.insert(v) },
    { name: "Search", arg: "string", ghost: true, run: (s, v) => s.search(v) },
    { name: "Delete", arg: "string", run: (s, v) => s.delete(v) },
    { name: "Prefix", arg: "string", ghost: true, run: (s, v) => s.prefix(v) },
  ],
};
