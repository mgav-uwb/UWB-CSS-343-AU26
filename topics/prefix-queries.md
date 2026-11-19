<!--
  TOPIC · Prefix queries on a trie.
  Teaches: keysWithPrefix (walk, then collect the subtree) in C++ and drawn; longestPrefixOf (one walk remembering the last word-marked node; a length, -1 if none) in C++ and drawn; where prefix queries are used.
  Needs:   tries.
  Demos:   figures str-trie-kwp-she, str-trie-lpo (tools/gen-string-figures.mjs)
  Program: code/tries/trie.cpp
  Budget:  ~10 min, 7 slides.
  Ported from Summer 2026 L16-strings-tries.md, part 2.
-->

### Prefix queries

> Since 1993 every internet router forwards a packet along the route whose prefix is the longest match for its destination address.

<small>V. Fuller, T. Li, J. Yu and K. Varadhan, “Classless Inter-Domain Routing (CIDR),” RFC 1519, 1993</small>

--

## Keys with a prefix

Autocomplete: every stored key that starts with `she`.

1. walk down the prefix: one node per character
2. collect every word-marked node in the subtree below

$\Theta(\text{prefix length} + \text{size of the subtree})$: the keys elsewhere are never visited.

--

## Collect a subtree

```cpp
void collect(Node* t, string& path, vector<string>& out) {
    if (t->isWord) out.push_back(path);    // a stored key ends here
    for (int c = 0; c < R; c++)
        if (t->next[c]) {
            path.push_back('a' + c);       // extend the path by this character
            collect(t->next[c], path, out);
            path.pop_back();
        }
}
```

A depth-first search; children in letter order, so the keys come out **sorted**.

--

## Keys with a prefix, in C++

```cpp
vector<string> keysWithPrefix(Node* t, const string& prefix) {
    vector<string> out;
    for (char ch : prefix) {
        t = t->next[ch - 'a'];
        if (!t) return out;                // no key starts with the prefix
    }
    string path = prefix;
    collect(t, path, out);
    return out;
}
```

<div><img src="../../topics/figures/strings/str-trie-kwp-she.svg" style="height:250px" alt="
   keysWithPrefix(she) on she, shell, shells, sea: the walk s h e, then the subtree: she, shell, shells; sea is never visited"></div>

--

## The longest prefix

`longestPrefixOf(s)`: the length of the longest stored key that is a **prefix of $s$**, or $-1$. A key is a prefix of itself.

```cpp
int longestPrefixOf(Node* t, const string& s) {
    int best = t->isWord ? 0 : -1;         // the empty key, if stored
    for (int d = 0; d < (int)s.size(); d++) {
        t = t->next[s[d] - 'a'];
        if (!t) break;                     // fell off: no longer key
        if (t->isWord) best = d + 1;       // a key ends here: remember it
    }
    return best;
}
```

One walk; remember the **last** word-marked node passed.

--

## The longest prefix, drawn

<div><img src="../../topics/figures/strings/str-trie-lpo.svg" style="height:100px" alt="
   longestPrefixOf(shellsort) on she and shells: passes she (remember 3), then shells (remember 6), then no o child: 6"></div>

`shellsort` with `she` and `shells` stored: **6**, `shells`. `sheet`: 3. `sx`: $-1$.

--

## Where prefix queries are used

- **autocomplete**: keys with the typed prefix
- **IP routing**: a router forwards a packet by the **longest prefix** of its address that matches a route
- **spell checking** and word games: does any word start with these letters?
- **tokenizing**: the longest keyword at the current position

