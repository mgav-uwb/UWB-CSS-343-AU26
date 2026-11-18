<!--
  TOPIC · Huffman's algorithm.
  Teaches: the greedy idea (merge the two lightest trees); the CLRS build merge by merge; the finished tree, its codes and its 224 bits; the min-heap of nodes and its tie rule; the build in C++; the build counted (n - 1 merges, a full tree of 2n - 1 nodes, O(n log n)); the huffman-build demo; std::map (the code table); reading the codes off the tree in C++; a practice build; ties change the tree, never the cost.
  Needs:   prefix-free codes, priority queues (binary heaps).
  Demos:   huffman-build (slide spec in topics/demos.js); figures hf-merges-a, hf-merges-b, hf-trie, hf-turn, hf-tie (tools/gen-greedy-figures.mjs)
  Program: code/huffman-build/huffman.cpp
  Budget:  ~23 min, 13 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 3.
-->

### Huffman's algorithm

> Shannon and Fano built their codes top down, splitting the symbols into two groups of nearly equal weight. Huffman built his bottom up, from the two rarest symbols, and only the bottom-up code is always optimal.

<small>D. A. Huffman, “A Method for the Construction of Minimum-Redundancy Codes,” Proc. IRE 40(9), 1952</small>

--

## The greedy idea

**Deep** leaves have **long** codewords, so they should hold **rare** symbols.

Until one tree is left:

1. take the **two lightest** trees from the pool
2. **merge** them under a parent whose frequency is their sum

The two rarest symbols become sibling leaves at the bottom. Why that is safe is proved after the algorithm.

--

## The first two merges

<div><img src="../../topics/figures/greedy/hf-merges-a.svg" style="height:260px" alt="
   pool  a:5 b:9 c:12 d:13 e:16 f:45
   merge a + b → 14     pool  c:12 d:13 14(a,b) e:16 f:45
   merge c + d → 25     pool  14(a,b) e:16 25(c,d) f:45"></div>

Each merge removes the two lightest roots and puts back one tree, ringed, of their **sum**.

--

## The last merges

<div><img src="../../topics/figures/greedy/hf-merges-b.svg" style="height:360px" alt="
   merge 14 + e → 30    pool  25(c,d) 30(14, e) f:45
   merge 25 + 30 → 55   pool  f:45 55
   then merge f + 55 → 100: the root"></div>

A merged tree competes by its **sum**. Last: $45 + 55 \to 100$.

--

## The finished tree

<div><img src="../../topics/figures/greedy/hf-trie.svg" style="height:255px" alt="
            (100)
           0/   \1
          f:45  (55)
               0/  \1
            (25)    (30)
           0/ \1   0/  \1
          c   d  (14)   e
                0/ \1
                a   b"></div>

| $f$ | $c$ | $d$ | $e$ | $a$ | $b$ |
| --- | --- | --- | --- | --- | --- |
| `0` | `100` | `101` | `111` | `1100` | `1101` |

$45 \cdot 1 + (12 + 13 + 16) \cdot 3 + (5 + 9) \cdot 4 = 224$ bits, against **300**.

--

## The pool is a min-heap

```cpp
struct Node {
    long freq;
    char sym;                    // '\0' for an internal node
    long id;                     // creation order: ties go to the older node
    Node* left;
    Node* right;
};

struct HigherFreq {              // the SMALLEST frequency on top
    bool operator()(const Node* a, const Node* b) const {
        if (a->freq != b->freq) return a->freq > b->freq;
        return a->id > b->id;    // equal frequencies: the older node first
    }
};
```

“The two lightest trees” is two `pop`s from a **min-heap** of roots.

--

## The build, in C++

```cpp
struct Symbol { char sym; long freq; };     // one input symbol and its count

// Merge the two lightest trees until one is left.
Node* buildHuffman(const vector<Symbol>& symbols) {
    priority_queue<Node*, vector<Node*>, HigherFreq> pq;
    long nextId = 0;
    for (const Symbol& s : symbols)
        pq.push(new Node{s.freq, s.sym, nextId++, nullptr, nullptr});
    while (pq.size() > 1) {
        Node* x = pq.top(); pq.pop();       // the two smallest frequencies
        Node* y = pq.top(); pq.pop();
        pq.push(new Node{x->freq + y->freq, '\0', nextId++, x, y});   // merge
    }
    return pq.top();                        // the single remaining root
}
```

The first node popped becomes the **left** child, bit 0.

--

## The build, counted

- start: $n$ single-leaf trees
- each merge: two roots out, one in, so exactly $n - 1$ merges
- the tree has $2n - 1$ nodes, and every internal node has **two** children: it is **full**
- each merge is 2 pops and 1 push, $O(\log n)$ each

$$\text{build} = O(n \log n) \qquad \text{read the codes} = O(n)$$

--

## Demo: Huffman build

<div class="algo-viz" data-algo="huffman-build" data-config='{"width":900,"height":[60,215]}'>
<pre class="viz-fallback">
   pool a:5 b:9 c:12 d:13 e:16 f:45, then merge the two smallest roots:
     a + b → 14,  c + d → 25,  14 + e → 30,  25 + 30 → 55,  f + 55 → 100
   100 symbols: ASCII 800 bits · fixed 3-bit 300 · Huffman 224
   try 8, 8, 8, 8: Huffman 64 = fixed 64, no saving
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The row above the tree is the pool, smallest first. Try `TEXT(…)` with a sentence, and `8, 8, 8, 8`.</small>

--

## `std::map`

`<map>`: key → value pairs, **sorted** by key in a red-black tree; every call is $O(\log n)$.

```cpp
map<char, string> code;
```

| call | does |
| --- | --- |
| `code[k] = v` | insert `k`, or overwrite its value |
| `code[k]` | `k`'s value; a **missing** `k` is inserted with `""` |
| `code.count(k)` | 1 if `k` is a key, else 0 |

`unordered_map`, a hash table: the same calls, $O(1)$ on average.

--

## Reading off the codes

```cpp
// Walk the tree once: left adds '0', right adds '1', a leaf records its path.
void extractCodes(Node* node, string path, map<char, string>& code) {
    if (!node->left && !node->right) {      // a leaf: the path is its code
        code[node->sym] = path;
        return;
    }
    extractCodes(node->left, path + "0", code);
    extractCodes(node->right, path + "1", code);
}
```

One traversal of $2n - 1$ nodes: $O(n)$. The encoder keeps this table.

--

## Your turn: build a code

$p{:}2$, $q{:}3$, $r{:}3$, $s{:}4$, $t{:}8$. On a tie the **older** tree pops first; the first popped is the **left** child.

Give every codeword and the total bits.

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/greedy/hf-turn.svg" style="height:255px" alt="
   p + q → 5 (q pops before r: older),  r + s → 7,  5 + 7 → 12,  t + 12 → 20
   t = 0, p = 100, q = 101, r = 110, s = 111
   8·1 + (2 + 3 + 3 + 4)·3 = 44 bits"></div>

</details>

--

## Ties change the tree

<div><img src="../../topics/figures/greedy/hf-tie.svg" style="height:430px" alt="
   a:1 b:1 c:2 d:2
   forced: a + b → 2; now three roots tie at 2
   choice A: pop c, d → 4; then 2 + 4 → 6: a=00 b=01 c=10 d=11, cost 12
   choice B: pop ab, c → 4; then d + 4 → 6: d=0 c=10 a=110 b=111, cost 12"></div>

Both cost **12**: the cost is unique, the tree is not.

