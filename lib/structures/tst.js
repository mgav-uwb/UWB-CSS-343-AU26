// CSS 343 unified library — structures/tst.js
// TERNARY SEARCH TRIE (Bentley–Sedgewick), for L16 Part 2 — the space fix for
// the R-way trie, and the demo that answers the question the text kept dodging:
// if `mid` is where the next character goes, what exactly is the "small BST"?
//
// The answer this demo is built to make visible: a TST is ONE ternary tree —
// every link points to another node of the same kind, which is what "ternary"
// names — but the three links mean different things.
//
//   left / right   stay at the SAME character position; they search among the
//                  characters actually used there. That little BST is what
//                  replaces the R-way node's child array.
//   mid            ADVANCES one position; it points at the ROOT of the next
//                  position's BST. So the following characters do hang under
//                  mid.
//
// So the array lookup `next[c]` becomes two steps: BST-search on left/right
// for c, then follow that node's mid. Only mid consumes a character, which is
// why a key of length L costs L mid-steps plus an O(log R) sibling search each.
//
// Every node carries its POSITION as a sub-label, so "all the nodes sharing a
// number form one BST" is readable straight off the picture, and crossing an
// `=` edge is exactly what increments it.

import { Tracer } from "../core/tracer.js";

const WORD_DOT = "•"; // • marks "a key ends here" (same convention as the trie demo)

class Node {
  constructor(c) { this.c = c; this.left = null; this.mid = null; this.right = null; this.word = false; }
}

export class TST {
  constructor() { this.root = null; this.summary = "no run yet"; }

  // ---- untraced reference ------------------------------------------------
  // The tests compare against these; the traced ops must agree with them.

  /** build(words) — insert each word, no frames. Returns `this`. */
  build(words = []) {
    this.root = null;
    for (const w of words) this._put(w);
    return this;
  }

  _put(word) {
    const key = String(word ?? "");
    if (!key) return;
    const put = (x, d) => {
      const c = key[d];
      if (x === null) x = new Node(c);
      if (c < x.c) x.left = put(x.left, d);
      else if (c > x.c) x.right = put(x.right, d);
      else if (d < key.length - 1) x.mid = put(x.mid, d + 1);
      else x.word = true;
      return x;
    };
    this.root = put(this.root, 0);
  }

  /** has(word) — reference membership, no frames. */
  has(word) {
    const n = this._node(String(word ?? ""));
    return !!n && n.word;
  }

  /** _node(key) — the node the key ENDS ON, or null if the path falls off. */
  _node(key) {
    if (!key) return null;
    let x = this.root, d = 0;
    while (x) {
      const c = key[d];
      if (c < x.c) x = x.left;
      else if (c > x.c) x = x.right;
      else if (d < key.length - 1) { x = x.mid; d++; }
      else return x;
    }
    return null;
  }

  /** keys() — every stored key, in lexicographic order. A TST is an ORDERED
   *  symbol table: an in-order walk (left, then this character, then right)
   *  yields the keys sorted, which is the thing a hash table cannot do. */
  keys() {
    const out = [];
    const walk = (x, pre) => {
      if (!x) return;
      walk(x.left, pre);
      if (x.word) out.push(pre + x.c);
      walk(x.mid, pre + x.c);
      walk(x.right, pre);
    };
    walk(this.root, "");
    return out;
  }

  /** nodeCount() — TST nodes, each three pointers. Contrast with an R-way
   *  trie, which spends R pointers per NODE-position regardless of use. */
  nodeCount() {
    const walk = (x) => (x ? 1 + walk(x.left) + walk(x.mid) + walk(x.right) : 0);
    return walk(this.root);
  }

  /** charsAtPositionOf(prefix) — the characters of the BST reached by
   *  following `prefix` and then one mid link: literally "what can come next".
   *  Exposed because it is the claim the demo is making, so a test can check
   *  it rather than take the picture's word for it. */
  charsAtPositionOf(prefix) {
    const bst = (x, out) => { if (!x) return out; bst(x.left, out); out.push(x.c); bst(x.right, out); return out; };
    if (prefix === "") return bst(this.root, []);
    const n = this._node(prefix);
    return n && n.mid ? bst(n.mid, []) : [];
  }

  // ---- the view ----------------------------------------------------------
  // TreeRenderer wants unique NUMERIC keys (its edge-label path maps them
  // through Number()), so ids are assigned in a stable pre-order and the
  // character rides along as `label`.

  _view(marks = {}) {
    let id = 0;
    const seen = new Map();          // Node -> id, so highlights can name nodes
    const conv = (x, d, edge) => {
      if (!x) return null;
      const key = id++;
      seen.set(x, key);
      const kids = [conv(x.left, d, "<"), conv(x.mid, d + 1, "="), conv(x.right, d, ">")].filter(Boolean);
      return {
        key,
        label: x.c + (x.word ? WORD_DOT : ""),
        sub: String(d),              // the character POSITION — the whole point
        ...(edge ? { edge } : {}),
        ...(kids.length ? { kids } : {}),
      };
    };
    const tree = conv(this.root, 0, null);
    this._ids = seen;
    return tree;
  }

  /** idsFor(nodes) — display keys for a set of structure nodes, for highlights. */
  _idsFor(nodes) { return nodes.map((n) => this._ids.get(n)).filter((v) => v != null); }

  snapshot() { const tree = this._view(); return tree ? { tree } : { tree: null }; }

  inorder() {
    const k = this.keys();
    return k.length ? `${k.length} keys · ${this.nodeCount()} nodes · ${k.join(", ")}` : "empty";
  }

  // ---- traced operations -------------------------------------------------

  /** buildAll(words) — one frame per inserted word, so the shape grows on
   *  screen. The per-character detail is what `insert` is for. */
  buildAll(words = []) {
    const t = new Tracer();
    this.root = null;
    const snap = () => ({ tree: this._view() });
    t.step(`empty TST — insert ${words.length} keys, one at a time`, { snapshot: snap() });
    for (const w of words) {
      const before = this.nodeCount();
      this._put(w);
      const after = this.nodeCount();
      t.count("alloc", after - before);
      const path = this._pathNodes(w);
      t.step(`insert "${w}" — ${after - before} new node${after - before === 1 ? "" : "s"}, `
        + `${w.length} character${w.length === 1 ? "" : "s"} of it already had one`,
        { snapshot: snap(), highlight: { path: this._idsFor(path), cur: this._idsFor(path.slice(-1)) } });
    }
    this.summary = this.inorder();
    t.step(`done — ${this.keys().length} keys in ${this.nodeCount()} nodes of three pointers each`,
      { snapshot: snap() });
    return t.trace();
  }

  /** _pathNodes(key) — the nodes a search for `key` touches, in order. */
  _pathNodes(key) {
    const out = [];
    let x = this.root, d = 0;
    while (x && d < key.length) {
      out.push(x);
      const c = key[d];
      if (c < x.c) x = x.left;
      else if (c > x.c) x = x.right;
      else { if (d === key.length - 1) break; x = x.mid; d++; }
    }
    return out;
  }

  /** search(word) — THE teaching op. One frame per node examined, and the
   *  message always says which of the two moves is happening: sideways within
   *  a position (the BST search) or down a mid link to the next position. */
  search(word) {
    const key = String(word ?? "").toLowerCase().replace(/\s+/g, "");
    const t = new Tracer();
    const snap = () => ({ tree: this._view() });
    if (!key) {
      this.summary = "type a word to search for";
      t.step("type a word in the box, then press Search", { snapshot: snap() });
      return t.trace();
    }

    const seen = [];
    let x = this.root, d = 0;
    t.step(`search "${key}" — start at the root, which is the BST over every character used at position 0: `
      + `{${this.charsAtPositionOf("").join(", ")}}. Looking for '${key[0]}'.`,
      { snapshot: snap(), highlight: { cur: this._idsFor(this.root ? [this.root] : []) } });

    while (x) {
      seen.push(x);
      const c = key[d];
      t.count("visit").count("compare");
      const ids = { path: this._idsFor(seen), cur: this._idsFor([x]) };
      if (c < x.c) {
        t.step(`position ${d}: '${c}' < '${x.c}' → go LEFT. Still position ${d} — left and right never consume a character, they just look for '${c}' among the characters used here.`,
          { snapshot: snap(), highlight: ids });
        x = x.left;
      } else if (c > x.c) {
        t.step(`position ${d}: '${c}' > '${x.c}' → go RIGHT, still position ${d}.`,
          { snapshot: snap(), highlight: ids });
        x = x.right;
      } else if (d < key.length - 1) {
        const next = this.charsAtPositionOf(key.slice(0, d + 1));
        t.step(`position ${d}: '${c}' matches → follow MID. This is the only link that consumes a character: `
          + `it lands on the ROOT of the BST for position ${d + 1}, whose characters are {${next.join(", ")}}. Now looking for '${key[d + 1]}'.`,
          { snapshot: snap(), highlight: ids });
        x = x.mid; d++;
      } else {
        const ok = x.word;
        this.summary = ok ? `"${key}" found` : `"${key}" is a path but not a stored key`;
        t.step(`position ${d}: '${c}' matches and the key is exhausted — so this is the node "${key}" ends on. `
          + (ok ? `It carries ${WORD_DOT} → FOUND.`
                : `It carries no ${WORD_DOT} → the path exists but no key ends here, so "${key}" is NOT stored.`),
          { snapshot: snap(), highlight: ok ? { path: this._idsFor(seen), best: this._idsFor(seen) } : { path: this._idsFor(seen), danger: this._idsFor([x]) } });
        return t.trace();
      }
    }

    this.summary = `"${key}" not found`;
    t.step(`no link to follow — the walk fell off the tree, so "${key}" is not stored. `
      + `A miss can stop long before the key is exhausted.`,
      { snapshot: snap(), highlight: { path: this._idsFor(seen), danger: this._idsFor(seen.slice(-1)) } });
    return t.trace();
  }

  /** insert(word) — the same walk as search, creating what is missing. */
  insert(word) {
    const key = String(word ?? "").toLowerCase().replace(/\s+/g, "");
    const t = new Tracer();
    const snap = () => ({ tree: this._view() });
    if (!key) {
      this.summary = "type a word to insert";
      t.step("type a word in the box, then press Insert", { snapshot: snap() });
      return t.trace();
    }
    if (this.has(key)) {
      t.step(`"${key}" is already stored — insert would only re-set its ${WORD_DOT}`, { snapshot: snap() });
      this.summary = `"${key}" already present`;
      return t.trace();
    }
    const before = this.nodeCount();
    this._put(key);
    const made = this.nodeCount() - before;
    t.count("alloc", made);
    const path = this._pathNodes(key);
    this.summary = this.inorder();
    t.step(`insert "${key}" — walked the same left/mid/right route as a search and created the ${made} node${made === 1 ? "" : "s"} it was missing, `
      + `then marked the node the key ends on with ${WORD_DOT}. Shared prefixes cost nothing new.`,
      { snapshot: snap(), highlight: { path: this._idsFor(path), best: this._idsFor(path) } });
    return t.trace();
  }

  /** position(prefix) — answer the structural question directly: follow a
   *  prefix, then show the BST that `mid` lands on. */
  position(prefix) {
    const p = String(prefix ?? "").toLowerCase().replace(/\s+/g, "");
    const t = new Tracer();
    const snap = () => ({ tree: this._view() });
    const chars = this.charsAtPositionOf(p);
    if (p && !this._node(p)) {
      this.summary = `"${p}" is not a path in this TST`;
      t.step(`"${p}" is not even a path here — nothing to show`, { snapshot: snap() });
      return t.trace();
    }
    const nodes = [];
    const bst = (x) => { if (!x) return; bst(x.left); nodes.push(x); bst(x.right); };
    if (p === "") bst(this.root);
    else { const n = this._node(p); if (n && n.mid) bst(n.mid); }
    this.summary = chars.length
      ? `after "${p}": {${chars.join(", ")}}`
      : `nothing follows "${p}"`;
    t.step(p === ""
      ? `Position 0 is the BST at the ROOT: {${chars.join(", ")}} — every character any key starts with. These are the highlighted nodes, and they are one binary search tree, reached by left/right only.`
      : chars.length
        ? `Follow "${p}", then one MID link. You land on the root of position ${p.length}'s BST, highlighted: {${chars.join(", ")}}. These are exactly the characters that can follow "${p}", and left/right walk among them without consuming anything.`
        : `"${p}" has no mid link — no key continues past it.`,
      { snapshot: snap(), highlight: { best: this._idsFor(nodes), path: this._idsFor(this._pathNodes(p)) } });
    return t.trace();
  }
}
