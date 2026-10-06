<!--
  TOPIC · How tall is a BST?
  Teaches: every operation costs Θ(height); best, typical and worst shapes; insertion order decides the shape; random BSTs: ~1.39 log2 N compares (Propositions C and D); the cost table; average depth versus height.
  Needs:   bst search and insert, asymptotic notation.
  Demos:   bst-shape, bst-experiments (Summer canvas demos)
  Program: none
  Budget:  ~14 min, 10 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 9.
-->

### How tall is a BST?

> A BST built by random insertions has average depth about 2 ln n ≈ 1.39 log₂ n, only 39% more than a perfectly balanced tree.

<small>D. E. Knuth, The Art of Computer Programming, Volume 3, §6.2.2</small>

--

## Cost = the length of a path = depth

Every BST operation walks **one or two paths** root→down: **Θ(depth)** each, worst case **Θ(height)**.

> **Proposition E (Sedgewick).** In a BST, all operations take time proportional to the **height** of the tree, in the worst case.

Everything reduces to **one question: how tall is the tree?**

--

## Best, typical, worst

<img src="../../topics/figures/trees/fig-07-bst-shapes-best-typical-worst.webp" alt="BST possibilities: a balanced best case, a typical case, and a worst-case path" style="height:420px">

<small>The same keys, three shapes: **balanced** (height ~log₂ n), **typical**, and a **path** (height n−1). Cost follows height: so which one do we usually get?</small>

--

## Demo: insertion order shapes the tree

<div class="algo-viz" data-algo="bst-shape">
<pre class="viz-fallback">
  SAME 15 keys, two insertion orders:
  sorted 1,2,3,…,15 → a path        random order → bushy
    1                                      8
     \                                   /   \
      2                                 4     12
       \                               / \   /  \
        3                             2   6 10   14
         \  … height 14 = n−1        avg depth ≈ 1.39·log2 n
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Shuffle** the right tree: sorted insertion → a **path**; random → **bushy** (~1.39 log₂ n average depth). Same keys, different shapes.</small>

--

## What "typical" really looks like

<img src="../../topics/figures/trees/fig-08-typical-bst-256-keys.jpeg" alt="A typical BST built from 256 random keys: bushy and shallow" style="width:66%">

<small>A BST from **256 random keys**: bushy and shallow (~**1.39 log₂ n** deep), not a path. Random insertion ≈ random quicksort pivots.</small>

--

## Prop C: average search cost

Compares for a search **hit** = 1 + the node's **depth**; summing all depths gives the **internal path length**.

> **Proposition C.** Search hits in a BST built from **N random** keys use **~ 2 ln N ≈ 1.39 log₂ N** compares on average.

Sedgewick proves it with a recurrence, the same one as quicksort's.

--

## Proposition D: and why it pays off

> **Proposition D.** Insertions and search **misses** also use **~ 1.39 log₂ N** compares on average.

So a random BST is only **~39% costlier** than a perfectly balanced one: and unlike binary search in a sorted array, it gives **O(log n) insertion**, not linear.

--

## Demo: theory meets measurement

<div class="algo-viz" data-algo="bst-experiments">
<pre class="viz-fallback">
  avg compares per search
  16 |                                     theory: 1.39·log2 N − 1.85
     |                        ____....••••
   8 |          ____....••••**    • • = measured (random BSTs)
     |  __..••**
   0 +-----+-------+-------+-------+
        50      200      800     3200    N (log scale)
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Run trial**: build random BSTs of growing N, plot the average compares. The measured cost tracks **1.39 log₂ N − 1.85**: a random BST stays shallow.</small>

--

## Cost summary (Sedgewick fig-09)

| implementation | search worst | insert worst | search avg | insert avg |
|---|:---:|:---:|:---:|:---:|
| unordered list | Θ(n) | Θ(n) | Θ(n) | Θ(n) |
| sorted array | Θ(log n) | Θ(n) | Θ(log n) | **Θ(n)** |
| **BST** | Θ(n) | Θ(n) | **Θ(log n)** | **Θ(log n)** |

Only the BST has **logarithmic insert on average**: a sorted array's is linear. Its one weakness is the **worst case**.

--

## Height ≠ average depth

Two different "log n"s for a random BST:

- average **depth** (internal path length) → **~1.39 log₂ N** (Prop C)
- average **height** → **~2.99 log₂ N** (Robson; Devroye): taller, still logarithmic

**Random is a hope, not a guarantee**: sorted input builds a path, height **n−1** → **balanced trees**: Θ(log n) for *any* order.

