<!--
  TOPIC · Trees and binary trees.
  Teaches: tree vocabulary and the recursive definition; depth and height; the binary-tree node; full, perfect, complete and balanced shapes; height ranges from log2 n to n - 1.
  Needs:   the recursion topic.
  Demos:   tree-shapes, tree-height (Summer canvas demos)
  Program: none
  Budget:  ~12 min, 9 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 1, 2.
-->

### Trees and binary trees

> Arthur Cayley showed in 1889 that there are n<sup>n−2</sup> different trees on n labeled vertices.

<small>A. Cayley, “A Theorem on Trees,” Quarterly Journal of Mathematics 23, 1889</small>

--

## What is a tree?

A **tree** is nodes joined by **links** (edges); each link is **null** or points to another node:

- **root**: the one node with no parent
- **parent / child / siblings**; **ancestor / descendant**
- **leaf**: no children; **internal**: has children
- **subtree**: a node plus all its descendants (a link "points to a subtree")

**Recursive definition.** A tree is **empty**, or a **node** plus zero or more **subtrees**: each itself a tree.

--

## Anatomy of a (binary) tree

<small>binary = at most two children per node (defined below); the vocabulary is the same for all trees</small>

<img src="../../topics/figures/trees/fig-01-anatomy-binary-tree.webp" alt="Anatomy of a tree: root, a left link, the right child of the root, a subtree, and null links" style="width:46%">


--

## Depth, level, and height

- **depth / level** of a node: links from the root (root is depth **0**)
- **height** of a tree: the **maximum** depth of any node (longest root-to-leaf path)

> Conventions differ (root at level 0 vs 1). We use **root depth 0**. State it; be consistent. **Height is the quantity that determines every BST operation's worst-case cost** (Prop E, later).

--

## The binary tree node

**At most two children**: a `left` and a `right`:

```cpp
struct Node {
    Object item;
    Node*  left;
    Node*  right;
};
```

Classic uses:

- **expression trees**
- **binary search trees**
- **heaps**
- **Huffman trees** (greedy algorithms)

--

## Tree shapes

| term | definition |
|---|---|
| **full** | every node has **0 or 2** children |
| **perfect** | full **and** all leaves at the **same** level |
| **complete** | every level filled except possibly the **last**, packed **left** |
| **balanced** | at every node, subtree **heights differ by ≤ 1** |

**Every complete tree is balanced: not conversely.**

--

## Demo: classify the shape

<div class="algo-viz" data-algo="tree-shapes">
<pre class="viz-fallback">
            1
          /   \
         2     3            full ✗   (node 5 has one child)
        / \   / \           perfect ✗
       4   5 6   7          complete ✓  (last level packed left)
      / \  |                balanced ✓
     8   9 10
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Click a **+** slot to add a leaf, a leaf to remove it; the badges report **full / perfect / complete / balanced**. Try the presets.</small>

--

## Min and max height for n nodes

- **minimum** ≈ **⌊log₂ n⌋**: every level packed (balanced/complete)
- **maximum** = **n − 1**: a degenerate **path**

In one line: **a binary tree's height ranges from log n to n**, and *which* you get decides every operation's cost.

--

## Demo: height ranges from log₂ n to n

<div class="algo-viz" data-algo="tree-height">
<pre class="viz-fallback">
   minimum height = floor(log2 n)          maximum height = n − 1
            o                                  o
          /   \                                 \
         o     o                                 o
        / \   / \                                 \
       o   o o   o        (n = 7)                  o
                                                    \ ... a path
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Drag **n**: the **shortest** tree (height ⌊log₂ n⌋) beside the **tallest** (a path, n−1).</small>

