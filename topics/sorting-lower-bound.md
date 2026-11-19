<!--
  TOPIC · The lower bound for comparison sorting.
  Teaches: a comparison sort as a binary decision tree; n! leaves force height at least log2(n!); the decision tree for three keys drawn; log2(n!) = Theta(n log n) by bounding n! from both sides; a practice; counting and radix sort escape the bound by not comparing.
  Needs:   mergesort, quicksort, binary trees (height and leaves).
  Demos:   figure so-decision-tree (tools/gen-sort-figures.mjs)
  Program: none (the arithmetic is on the slides)
  Budget:  ~9 min, 6 slides.
  Ported from Summer 2026 L13-sorting-dc.md, part 4.
-->

### The lower bound

> The fewest comparisons that sort n keys in the worst case equals ⌈log₂ n!⌉ for every n up to 11; at n = 12 it is 30, one more than ⌈log₂ 12!⌉ = 29.

<small>D. E. Knuth, *The Art of Computer Programming*, Vol. 3, §5.3.1, Addison-Wesley, 1998</small>

--

## Can any sort beat $n \log n$?

A **comparison sort** learns about the keys only by comparing two of them.

- each comparison has **two** outcomes
- the input is one of $n!$ orderings, and different orderings need different rearrangements
- so the comparisons must tell all $n!$ apart

$h$ comparisons have at most $2^h$ outcome sequences: $2^h \ge n!$, so $h \ge \log\_2 n!$.

--

## The decision tree

<div><img src="../../topics/figures/sorting/so-decision-tree.svg" style="height:260px" alt="
   a1:a2 at the root; then a2:a3 or a1:a3; then one more comparison where needed
   six leaves: (1,2,3) (1,3,2) (3,1,2) (2,1,3) (2,3,1) (3,2,1); height 3"></div>

Insertion sort on three keys: **6 = 3!** leaves, height **3** $= \lceil \log\_2 6 \rceil$.

--

## Why $\log\_2 n!$ is $\Theta(n \log n)$

$$n! \le n^n \quad\Rightarrow\quad \log\_2 n! \le n \log\_2 n$$

$$n! \ge \left(\tfrac{n}{2}\right)^{n/2} \quad\Rightarrow\quad \log\_2 n! \ge \tfrac{n}{2} \log\_2 \tfrac{n}{2}$$

The second line keeps only the top half of the factors, each at least $n/2$. Both bounds are $\Theta(n \log n)$: **every comparison sort makes $\Omega(n \log n)$ comparisons** in the worst case.

--

## Your turn: how many comparisons?

At least how many comparisons does any comparison sort need, in the worst case, for

1. 4 keys?
2. 5 keys?

<details class="answer"><summary>Answer:</summary>

1. $4! = 24$, and $2^4 = 16 < 24 \le 32 = 2^5$: **5**
2. $5! = 120$, and $2^6 = 64 < 120 \le 128 = 2^7$: **7**

</details>

--

## Sorting without comparing

The bound covers only **comparison** sorts. Keys with structure can be sorted without comparing two of them:

| sort | keys | time |
| --- | --- | --- |
| counting sort | integers in $0..k-1$ | $\Theta(n + k)$ |
| radix sort (LSD) | $d$-digit keys, base $R$ | $\Theta(d\\,(n + R))$ |

