<!--
  TOPIC · Adaptive Huffman (FGK).
  Teaches: the two costs of static Huffman (two passes, the table); encoder and decoder updating one tree in lockstep; NYT, the escape for a new symbol; the sibling property and Gallager's theorem; std::map and the tree's fields (leafOf); the update rule in C++ (swap with the block leader, then increment); the first four symbols of abracadabra drawn; abracadabra sent in 60 bits with no table; the adaptive-huffman demo; static against adaptive, counted; where the idea survives.
  Needs:   Huffman's algorithm; encoding, decoding, and where Huffman loses.
  Demos:   adaptive-huffman (slide spec in topics/demos.js); figure hf-adaptive (tools/gen-greedy-figures.mjs)
  Program: tools/snippets/greedy/fgk-update.cpp (the chapter's FGK update, compiled and matched against lib/structures/adaptive-huffman.js); the bit counts from that library
  Budget:  ~17 min, 12 slides. Mounted in Lecture 14 as an appendix, after the close.
  Ported from Summer 2026 L12-greedy-huffman.md, part 5.
-->

### Adaptive Huffman

> The one-pass update is named FGK, after Newton Faller (1973), Robert Gallager (1978) and Donald Knuth (1985), who found it, proved it, and made it fast.

<small>D. E. Knuth, “Dynamic Huffman Coding,” Journal of Algorithms 6, 1985</small>

--

## Two passes, or one?

Static Huffman:

1. read the whole text and **count** the frequencies
2. **build** the tree
3. **encode**
4. **send the table** with the bits

A stream has no step 1. A short message cannot afford step 4.

--

## One tree, two machines

Both sides start from the **same empty tree** and run the **same update** after every symbol:

| encoder | decoder |
| --- | --- |
| send the codeword for $s$ | read bits until a leaf: that is $s$ |
| update the tree with $s$ | update the tree with $s$ |

The encoder codes $s$ with the tree built from the symbols **before** it, which is exactly the tree the decoder holds. No table is sent.

--

## NYT: the escape

The tree keeps one leaf of weight 0, **NYT** (not yet transmitted):

- a symbol **already** in the tree: send its path
- a **new** symbol: send the path to NYT, then its **8 ASCII bits**
- then NYT **splits**: a new NYT on the left, the symbol's leaf on the right

The very first symbol: the tree **is** NYT, its path is empty, and the symbol costs exactly 8 bits.

--

## The sibling property

Number the nodes bottom up, left to right; the root gets the highest number. A tree has the **sibling property** when

- every node except the root has a sibling, and
- the weights **never decrease** as the number grows

**Gallager's theorem**: a binary tree is a Huffman tree for its leaf weights **exactly when** it has the sibling property.

--

## [`std::map`: `leafOf`](../../textbook/foundations/foundation-stl-primer.html#map)

The fields of `AdaptiveTree`:

```cpp
static const int TOP = 512;           // the root's number
vector<Node*> byNumber = vector<Node*>(TOP + 1, nullptr);
map<char, Node*> leafOf;              // the leaf of each symbol seen
Node* nyt;                            // "not yet transmitted", weight 0
Node* root;
```

`map<K, V>` (`<map>`): key → value pairs **sorted** by key in a red-black tree; each call $O(\log n)$.

- `leafOf.count(s)`: 1 if $s$ has a leaf, 0 if $s$ is **new**
- `leafOf[s] = leaf`: `splitNYT` adds a leaf
- `leafOf[s]` on a **missing** $s$ inserts `nullptr`: `update` asks `count` first

--

## The update, in C++

```cpp
void update(char s) {
    Node* node;
    if (leafOf.count(s) == 0) {
        node = splitNYT(s);           // a new symbol: split NYT first
    } else {
        node = leafOf[s];
    }
    while (node != nullptr) {
        Node* lead = leader(node);
        if (lead != nullptr) {        // a same-weight node outranks it
            swapNodes(node, lead);    // positions swap, numbers stay
        }
        node->weight++;
        node = node->parent;
    }
}
```

`leader` finds the highest-numbered node of the same weight that is not an ancestor. One increment and at most one swap per level.

--

## The first four symbols

<div><img src="../../topics/figures/greedy/hf-adaptive.svg" style="height:420px" alt="
   after a:  root#3(1) → NYT#1(0), a#2(1)                    a costs 8 bits
   after b:  root#5(2) → #3(1) over NYT#1 and b#2, then a#4(1)   b costs 0 + 8 = 9
   after r:  the internal #5 swaps with a#6, then increments  r costs 00 + 8 = 10
   after a:  a is now #5 at depth 1: a costs 1 bit"></div>

The swap at $r$ lifts $a$ to depth 1.

--

## abracadabra, adaptively

| symbol | in tree? | sent | bits | total |
| --- | --- | --- | --: | --: |
| a | new | (NYT is the root) + ASCII | 8 | 8 |
| b | new | `0` + ASCII | 9 | 17 |
| r | new | `00` + ASCII | 10 | 27 |
| a | yes | `0` | 1 | 28 |
| c | new | `100` + ASCII | 11 | 39 |
| a | yes | `0` | 1 | 40 |
| d | new | `1100` + ASCII | 12 | 52 |
| a, b, r, a | yes | `0`, `110`, `110`, `0` | 8 | **60** |

--

## Demo: adaptive Huffman

<div class="algo-viz" data-algo="adaptive-huffman" data-config='{"width":900,"height":[186,100]}'>
<pre class="viz-fallback">
   the tree starts as one NYT leaf and reshapes as the text arrives;
   red marks the two nodes a swap just exchanged.
   "abracadabra" → 60 bits → "abracadabra", no table sent.
</pre>
</div>

<small>Encode, then Decode: the decoder starts from an **empty** tree and grows the same one. **Grey** bits route to NYT; **coloured** bits name a symbol.</small>

--

## Static against adaptive

| text | $n$ | ASCII | static body | static + table | adaptive |
| --- | --: | --: | --: | --: | --: |
| `abracadabra` | 11 | 88 | 23 | 96 | **60** |
| `mississippi` | 11 | 88 | 21 | 78 | **53** |
| `she sells sea…` | 37 | 296 | 112 | 268 | **191** |
| `the quick brown…` | 43 | **344** | 192 | 647 | 406 |

The static **body** always wins; the static **total** often does not.

--

## Where the idea survives

- **streaming**: encode as the data arrives, no first pass
- **no table**: the model is derived on both sides, never sent
- it **follows drift**: the code tracks the text as its statistics change
- cost: $O(\text{depth})$ per symbol, on both sides

Modern compressors keep the **adaptive model** and pair it with **arithmetic coding** or **ANS**, which escape the whole-bit-per-symbol floor.

