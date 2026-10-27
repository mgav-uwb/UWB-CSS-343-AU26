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

> A BST built by random insertions has average depth about $2 \ln n \approx 1.39 \log\_2 n$, only 39% more than a perfectly balanced tree.

<small>D. E. Knuth, The Art of Computer Programming, Volume 3, §6.2.2</small>

--

## Cost = the length of a path = depth

Every BST operation walks **one or two paths** root→down: $\Theta(\text{depth})$ each, worst case $\Theta(\text{height})$.

> **Proposition E.** In a BST, all operations take time proportional to the **height** of the tree, in the worst case.

Everything reduces to **one question: how tall is the tree?**

--

## Best, typical, worst

<img src="../../topics/figures/trees/fig-07-bst-shapes-best-typical-worst.svg" alt="The same seven keys inserted in four orders: a balanced best case, a typical case, and two worst-case paths from sorted and reverse-sorted input" style="width:96%">

<small>The same keys, different insertion orders: **balanced** (height about $\log\_2 n$), **typical**, and a **path** (height $n - 1$) from sorted or reverse-sorted input. Cost follows height: so which one do we usually get?</small>

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

<small>**Shuffle** the right tree: sorted insertion → a **path**; random → **bushy** (average depth about $1.39 \log\_2 n$). Same keys, different shapes.</small>

--

## What "typical" really looks like

<img src="../../topics/figures/trees/fig-08-typical-bst-256-keys.svg" alt="A BST built from 256 random keys: average depth 8.2 against log2 256 = 8, height 16" style="height:340px">

<small>A BST from **256 random keys**: bushy and shallow, average depth **8.2** against $\log\_2 256 = 8$, not a path. Random insertion ≈ random quicksort pivots.</small>

--

## Prop C: average search cost

Compares for a search **hit** = 1 + the node's **depth**; summing all depths gives the **internal path length**.

> **Proposition C.** Search hits in a BST built from $N$ **random** keys use $\sim 2 \ln N \approx 1.39 \log\_2 N$ compares on average.

The proof is a recurrence, the same one as quicksort's.

--

## Proposition D: insertion

> **Proposition D.** Insertions and search **misses** also use $\sim 1.39 \log\_2 N$ compares on average.

A random BST costs only **about 39% more** than a balanced one and inserts in $O(\log n)$; a sorted array inserts in **linear** time. **Why?**

<details class="answer"><summary>Answer:</summary>

Both find the spot in about $\log\_2 n$ compares. The **array** shifts every larger key right (up to $n$ moves); the **BST** hangs the node on a **null link** (**nothing moves**).

</details>

--

## Demo: theory meets data

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

<small>**Run trial**: random BSTs of growing $N$; the average compares track $1.39 \log\_2 N - 1.85$, so a random BST stays shallow.</small>

--

## Cost summary

| implementation | search worst | insert worst | search avg | insert avg |
|---|:---:|:---:|:---:|:---:|
| unordered list | $\Theta(n)$ | $\Theta(n)$ | $\Theta(n)$ | $\Theta(n)$ |
| sorted array | $\Theta(\log n)$ | $\Theta(n)$ | $\Theta(\log n)$ | $\boldsymbol{\Theta(n)}$ |
| **BST** | $\Theta(n)$ | $\Theta(n)$ | $\boldsymbol{\Theta(\log n)}$ | $\boldsymbol{\Theta(\log n)}$ |

Only the BST has **logarithmic insert on average**: a sorted array's is linear. Its one weakness is the **worst case**.

--

## Height ≠ average depth

Two different logarithms for a random BST:

- average **depth** (internal path length) → $\sim 1.39 \log\_2 N$ (Prop C)
- average **height** → $\sim 2.99 \log\_2 N$ (Robson; Devroye): taller, still logarithmic

**Random is a hope, not a guarantee**: sorted input builds a path, height $n - 1$ → **balanced trees**: $\Theta(\log n)$ for *any* order.

