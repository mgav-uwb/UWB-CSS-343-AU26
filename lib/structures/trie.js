// CSS 343 unified library — structures/trie.js
// The trie (prefix tree): each node holds a map of char → child and a `word`
// flag marking a complete key. insert/search walk one character at a time —
// Θ(key length), independent of how many other keys are stored. delete finds
// the key, unmarks its •, then prunes bottom-up any node with no children and
// no • (stopping at the first node another key still needs). keysWithPrefix
// and longestPrefixOf are the two prefix queries a trie adds over a BST.
//
// Rendering reuses the shared TreeRenderer (binary key/left/right nodes only —
// see core/renderers/tree.js), so an n-ary trie node is encoded as a binary
// node via the classic "first-child, next-sibling" (LCRS) transform: a node's
// `left` is its first child; a node's `right` is its NEXT SIBLING (not a
// second child). Every char-node still renders at a stable position and never
// collides with another, because each trie node corresponds to a UNIQUE
// prefix, and that prefix — not the single character — is what we use as the
// renderer's `key` (so "she" and "sea" both having an 's' never collide). A
// terminal (complete-word) node gets a trailing "•" baked into its displayed
// key (e.g. "she•") since TreeRenderer has no separate "is this a word" flag
// to read — this is purely a label trick, no renderer change needed. Sibling
// chains beyond the first render diagonally deeper (an LCRS artifact) rather
// than side-by-side; still a fully faithful, lossless picture of the trie.

import { Tracer } from "../core/tracer.js";

const DEFAULT_WORDS = ["she", "sells", "sea", "shells", "shell"];

const newNode = () => ({ children: {}, word: false });

/** Display key for a node at `prefix`: the empty root shows "∅"; a complete word gets a trailing "•". */
const keyFor = (prefix, isWord) => (prefix.length ? prefix : "∅") + (isWord ? "•" : "");

/** Renderer-facing clone: the n-ary trie encoded as a binary {key,left,right,word} tree (LCRS). */
function toBinary(node, prefix) {
  const rn = { key: keyFor(prefix, node.word), word: node.word, left: null, right: null };
  const chars = Object.keys(node.children).sort();
  if (!chars.length) return rn;
  const kids = chars.map((c) => toBinary(node.children[c], prefix + c));
  rn.left = kids[0];
  for (let i = 1; i < kids.length; i++) kids[i - 1].right = kids[i];
  return rn;
}

export class Trie {
  constructor() { this.root = newNode(); }

  /** build(keys) — insert every word silently; an empty/missing list falls back to a small sample. */
  build(keys) {
    const words = Array.isArray(keys) && keys.length ? keys : DEFAULT_WORDS;
    for (const w of words) this._insertSilent(String(w));
    return this;
  }
  _insertSilent(word) {
    let cur = this.root;
    for (const ch of word) {
      if (!cur.children[ch]) cur.children[ch] = newNode();
      cur = cur.children[ch];
    }
    cur.word = true;
  }

  snapshot() { return toBinary(this.root, ""); }

  /** inorder() — every stored word, alphabetically (a DFS over the trie). */
  inorder() {
    const out = [];
    (function walk(node, prefix) {
      if (node.word) out.push(prefix);
      for (const ch of Object.keys(node.children).sort()) walk(node.children[ch], prefix + ch);
    })(this.root, "");
    return out;
  }

  /** insert(word) — walk/create nodes char by char, then mark the terminal. */
  insert(word) {
    const t = new Tracer();
    let cur = this.root, prefix = "";
    const path = [keyFor("", cur.word)];
    t.step(`insert "${word}": start at the root`, { snapshot: toBinary(this.root, ""), highlight: { cur: path[0], path: [...path] } });
    for (const ch of word) {
      const existed = !!cur.children[ch];
      if (!existed) { cur.children[ch] = newNode(); t.count("alloc"); }
      cur = cur.children[ch]; prefix += ch; t.count("visit");
      const k = keyFor(prefix, cur.word);
      path.push(k);
      t.step(`'${ch}' — ${existed ? "edge exists, follow it" : "no edge yet, create a node"} → "${prefix}"`,
        { snapshot: toBinary(this.root, ""), highlight: existed ? { cur: k, path: [...path] } : { appear: k, cur: k, path: [...path] } });
    }
    if (cur.word) {
      t.step(`"${word}" was already a complete word — no change`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor(prefix, true), path: [...path] } });
    } else {
      cur.word = true; t.count("write");
      t.step(`mark "${prefix}" as a complete word (terminal) — done`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor(prefix, true), path: [...path] } });
    }
    return t.trace();
  }

  /** search(word) — walk char by char; found only if the path exists AND ends on a terminal. */
  search(word) {
    const t = new Tracer();
    let cur = this.root, prefix = "";
    const path = [keyFor("", cur.word)];
    t.step(`search "${word}": start at the root`, { snapshot: toBinary(this.root, ""), highlight: { cur: path[0], path: [...path] } });
    for (const ch of word) {
      t.count("compare");
      if (!cur.children[ch]) {
        t.step(`'${ch}' — no edge from "${prefix}" → "${word}" not found`, { snapshot: toBinary(this.root, ""), highlight: { danger: keyFor(prefix, cur.word), path: [...path] } });
        return t.trace();
      }
      cur = cur.children[ch]; prefix += ch; t.count("visit");
      const k = keyFor(prefix, cur.word);
      path.push(k);
      t.step(`'${ch}' → node "${prefix}"`, { snapshot: toBinary(this.root, ""), highlight: { cur: k, path: [...path] } });
    }
    if (cur.word) {
      t.step(`"${word}" found — terminal reached after ${word.length} character(s)`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor(prefix, true), path: [...path] } });
    } else {
      t.step(`"${word}" is a path in the trie but not marked complete — not found`, { snapshot: toBinary(this.root, ""), highlight: { danger: keyFor(prefix, false), path: [...path] } });
    }
    return t.trace();
  }

  /** delete(word) — find it like search; unmark the terminal (the key is gone
   *  at that instant), then prune bottom-up: a node with no children that is
   *  not itself a word serves no key, so free it and reconsider its parent,
   *  stopping at the first node some other key still needs. Θ(key length). */
  delete(word) {
    const t = new Tracer();
    let cur = this.root, prefix = "";
    const stack = [cur]; // stack[i] = the node at word[0..i-1]; stack[0] = root
    const path = [keyFor("", cur.word)];
    t.step(`delete "${word}": first find it — start at the root`, { snapshot: toBinary(this.root, ""), highlight: { cur: path[0], path: [...path] } });
    for (const ch of word) {
      t.count("compare");
      if (!cur.children[ch]) {
        t.step(`'${ch}' — no edge from "${prefix}" → "${word}" is not stored; nothing to delete`, { snapshot: toBinary(this.root, ""), highlight: { danger: keyFor(prefix, cur.word), path: [...path] } });
        return t.trace();
      }
      cur = cur.children[ch]; prefix += ch; t.count("visit");
      stack.push(cur);
      const k = keyFor(prefix, cur.word);
      path.push(k);
      t.step(`'${ch}' → node "${prefix}"`, { snapshot: toBinary(this.root, ""), highlight: { cur: k, path: [...path] } });
    }
    if (!cur.word) {
      t.step(`"${word}" is a path in the trie but carries no • — not a stored key; nothing to delete`, { snapshot: toBinary(this.root, ""), highlight: { danger: keyFor(prefix, false), path: [...path] } });
      return t.trace();
    }
    cur.word = false; t.count("write");
    path[path.length - 1] = keyFor(prefix, false);
    t.step(`unmark "${prefix}" — the • comes off and the key is gone; now prune any node no key still needs`, { snapshot: toBinary(this.root, ""), highlight: { cur: keyFor(prefix, false), path: [...path] } });
    for (let i = stack.length - 1; i >= 1; i--) {
      const node = stack[i], pre = word.slice(0, i);
      const kidChars = Object.keys(node.children).sort();
      if (kidChars.length) {
        t.step(`done — "${word}" deleted. "${pre}" keeps its node: other keys still pass through it (child${kidChars.length > 1 ? "ren" : ""}: ${kidChars.join(", ")}), so pruning stops`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor(pre, node.word), path: [...path] } });
        return t.trace();
      }
      if (node.word) {
        t.step(`done — "${word}" deleted. "${pre}" keeps its node: it is itself a stored word (•), so pruning stops`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor(pre, true), path: [...path] } });
        return t.trace();
      }
      delete stack[i - 1].children[word[i - 1]];
      t.count("free");
      path.pop();
      const parentPre = word.slice(0, i - 1);
      t.step(`"${pre}" has no children and no • — no key needs it; free the node and climb to "${parentPre || "∅"}"`, { snapshot: toBinary(this.root, ""), highlight: { cur: keyFor(parentPre, stack[i - 1].word), path: [...path] } });
    }
    t.step(`done — "${word}" deleted; its whole branch is gone (pruning reached the root)`, { snapshot: toBinary(this.root, ""), highlight: { done: keyFor("", this.root.word), path: [...path] } });
    return t.trace();
  }

  /** Walk to the node at `prefix` (untraced helper), or null if the path doesn't exist. */
  _nodeAt(prefix) {
    let cur = this.root;
    for (const ch of prefix) { if (!cur.children[ch]) return null; cur = cur.children[ch]; }
    return cur;
  }

  /** keysWithPrefix(prefix) — every stored word starting with `prefix`. */
  keysWithPrefix(prefix) {
    const start = this._nodeAt(prefix);
    const out = [];
    if (start) (function walk(node, pre) {
      if (node.word) out.push(pre);
      for (const ch of Object.keys(node.children).sort()) walk(node.children[ch], pre + ch);
    })(start, prefix);
    return out;
  }

  /** longestPrefixOf(query) — the longest stored word that is a prefix of `query` (or ""). */
  longestPrefixOf(query) {
    let cur = this.root, prefix = "", longest = "";
    for (const ch of query) {
      if (!cur.children[ch]) break;
      cur = cur.children[ch]; prefix += ch;
      if (cur.word) longest = prefix;
    }
    return longest;
  }

  /** prefix(query) — traced: walk `query` down the trie, tracking the longest complete-word
   *  prefix seen; if the full query is a path, also collect every word stored under it. */
  prefix(query) {
    const t = new Tracer();
    let cur = this.root, pre = "", longest = "", ok = true;
    const path = [keyFor("", cur.word)];
    t.step(`prefix("${query}"): start at the root`, { snapshot: toBinary(this.root, ""), highlight: { cur: path[0], path: [...path] } });
    for (const ch of query) {
      t.count("compare");
      if (!cur.children[ch]) {
        t.step(`'${ch}' — no edge from "${pre}" → "${query}" is not a path in the trie`, { snapshot: toBinary(this.root, ""), highlight: { danger: keyFor(pre, cur.word), path: [...path] } });
        ok = false; break;
      }
      cur = cur.children[ch]; pre += ch; t.count("visit");
      if (cur.word) longest = pre;
      const k = keyFor(pre, cur.word);
      path.push(k);
      t.step(`'${ch}' → "${pre}"${cur.word ? " — a complete word (candidate longest prefix)" : ""}`,
        { snapshot: toBinary(this.root, ""), highlight: { cur: k, path: [...path] } });
    }
    // BOTH queries are always reported, even when the walk fell off. Dropping
    // keysWithPrefix on a miss made the demo look like it answers only one
    // question, and contradicted Chapter 16, which promises both at once —
    // "no keys start with that" is an answer, and {} is how to say it.
    const words = ok ? this.keysWithPrefix(query) : [];
    const summary = `done — longestPrefixOf("${query}") = "${longest || "(none)"}"; `
      + `keysWithPrefix("${query}") = {${words.join(", ")}}`
      + (ok ? "" : ` — the walk fell off, so nothing starts with "${query}"`);
    t.step(summary, { snapshot: toBinary(this.root, ""), highlight: longest ? { done: keyFor(longest, true), path: [...path] } : { path: [...path] } });
    const trace = t.trace();
    trace.result = { longestPrefixOf: longest, keysWithPrefix: words };
    return trace;
  }
}
