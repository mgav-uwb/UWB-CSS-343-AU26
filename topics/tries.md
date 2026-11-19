<!--
  TOPIC · Tries.
  Teaches: string keys and the cost of comparing them; the R-way trie (one node per prefix, the root the empty string, word-marked nodes); the node in C++; search and insert in C++ and drawn; a practice (she, sea, sells: 9 nodes); the trie demo; Theta(L) per operation and the memory of R links per node; ternary search tries and radix trees for less memory; tries against hash tables and BSTs.
  Needs:   binary search trees, hashing (for the comparison).
  Demos:   trie (registry slug); figures str-trie-search-chain, str-trie-insert, str-trie-sss, str-tst-positions, str-radix (tools/gen-string-figures.mjs)
  Program: code/tries/trie.cpp
  Budget:  ~24 min, 12 slides.
  Ported from Summer 2026 L16-strings-tries.md, part 1.
-->

### Tries

> Edward Fredkin named the trie in 1960, from the middle of “retrieval.”

<small>E. Fredkin, “Trie Memory,” Communications of the ACM 3(9), 1960</small>

--

## String keys

A BST of $N$ strings: $O(\log N)$ comparisons, each up to $L$ characters. A **trie** reads each character of the key once:

- one node per **prefix** of the stored keys; the root is the empty string
- each edge is a character; a key is a path from the root
- a node is **word-marked** when a stored key ends there

--

## The node, in C++

```cpp
const int R = 26;                          // alphabet: lowercase a..z

struct Node {
    Node* next[R] = {};                    // one slot per possible character
    bool  isWord = false;
};
```

`next[c - 'a']` is the child for character `c`, or `nullptr`. A word-marked node need not be a leaf: `she` ends inside `shells`.

--

## Search

```cpp
bool search(Node* t, const string& key) {
    for (char ch : key) {
        int c = ch - 'a';
        if (!t->next[c]) return false;     // fell off: no such path
        t = t->next[c];
    }
    return t->isWord;                      // path exists: is it a word?
}
```

Two ways to miss: **fall off** the tree, or end on a node that is **not word-marked**.

--

## Search, drawn

<div><img src="../../topics/figures/strings/str-trie-search-chain.svg" style="height:200px" alt="
   the trie holding she, shell, shells: one path s h e l l s; she, shell, shells word-marked
   search(shell): five steps to a word-marked node: found
   search(shel): four steps to a node that is not word-marked: not a key"></div>

`shel` is a prefix of stored keys but not a key itself.

--

## Insert

```cpp
void insert(Node* t, const string& key) {
    for (char ch : key) {
        int c = ch - 'a';
        if (!t->next[c]) t->next[c] = new Node();   // create the missing suffix
        t = t->next[c];
    }
    t->isWord = true;                      // mark: a key ends here
}
```

The same walk, creating only the nodes that are missing.

--

## Insert, drawn

<div><img src="../../topics/figures/strings/str-trie-insert.svg" style="height:380px" alt="
   inserting sea into the trie holding she and shell:
   s exists and is followed; s has no e child, so e is created, then a, which is word-marked"></div>

--

## Your turn: build a trie

Insert `she`, `sea` and `sells` into an empty trie. Draw it. How many nodes, counting the root?

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/strings/str-trie-sss.svg" style="height:235px" alt="
   root - s; s - h - e (she); s - e - a (sea); e - l - l - s (sells)
   9 nodes counting the root"></div>

**9** nodes: the root, `s`, then `h e` and `e`, then `a` and `l l s`.

</details>

--

## Demo: trie

<div class="algo-viz" data-algo="trie" data-config='{"width":900,"height":250}'>
<pre class="viz-fallback">
   she, sells, sea, shells, shell, inserted key by key:
   a node per prefix, a mark where a key ends; search walks one character per step
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Insert the keys, then search for a key, a prefix that is not a key, and a word that falls off.</small>

--

## The cost

- search and insert: $\Theta(L)$ steps for a key of length $L$, **independent of $N$**
- a miss often stops early, after the first character that is not there
- memory: $R$ links per node; with $R = 26$ and 8-byte pointers, over 200 bytes per node

The seven keys `she sells sea shells by the shore`: 20 nodes, **520** links, almost all null.

--

## Less memory

<div><img src="../../topics/figures/strings/str-tst-positions.svg" style="height:250px" alt="
   the ternary search trie for she, sells, sea, shells, by, the, shore: 19 nodes, 57 links,
   each a character with left, mid and right links; mid advances to the next position"></div>

- **ternary search trie** (above): a character and three links per node, 19 nodes and 57 links; left and right search one position, mid moves on
- **radix tree**: a chain of one-child nodes becomes one edge labeled with a substring

--

## Trie, hash table or BST?

| | trie | hash table | balanced BST |
| --- | --- | --- | --- |
| search | $\Theta(L)$ | $\Theta(L)$ expected | $O(L \log N)$ |
| keys in order | yes | no | yes |
| prefix queries | **natural** | no | a range scan |
| memory | large ($R$ links per node) | small | small |

Choose a trie when prefix queries matter.

