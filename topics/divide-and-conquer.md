<!--
  TOPIC · Divide and conquer, and the master theorem.
  Teaches: divide, conquer, combine, and the base case; the recurrence T(n) = aT(n/b) + f(n); the recursion tree and its level sums as a geometric series; the master theorem's three cases as the three behaviours of that series; the recurrence demo; mergesort and binary search worked; cases 1 and 3 worked; the gap the theorem does not cover; a practice; divide and conquer beyond sorting; why balanced splits matter.
  Needs:   recursion, counting recurrences (unrolling), asymptotic notation.
  Demos:   recurrence (registry slug)
  Program: none (every number is arithmetic on the slide)
  Budget:  ~16 min, 12 slides.
  Ported from Summer 2026 L13-sorting-dc.md, part 1.
-->

### Divide and conquer

> In 1960 Kolmogorov conjectured that multiplying two n-digit numbers needs on the order of n² digit operations; within a week, his student Anatoly Karatsuba found a divide-and-conquer method that needs about n^1.58.

<small>A. A. Karatsuba, “The Complexity of Computations,” Proceedings of the Steklov Institute of Mathematics 211, 1995</small>

--

## Divide, conquer, combine

- **divide** the problem into smaller instances of itself
- **conquer** each one recursively
- **combine** their answers into the answer
- a **base case** small enough to solve directly stops the recursion

Binary search (one half, nothing to combine) and mergesort (two halves, a linear merge) are both instances.

--

## Recurrences

A divide-and-conquer algorithm's cost satisfies a **recurrence**:

$$T(n) = a\\,T(n/b) + f(n)$$

- $a$ subproblems, each of size $n/b$
- $f(n)$: the divide and combine work at one call

| algorithm | $a$ | $b$ | $f(n)$ |
| --- | --: | --: | --- |
| binary search | 1 | 2 | $\Theta(1)$ |
| mergesort | 2 | 2 | $\Theta(n)$ |

--

## The recursion tree

| level | subproblems | size | level cost |
| --: | --: | --: | --- |
| 0 | $1$ | $n$ | $f(n)$ |
| 1 | $a$ | $n/b$ | $a\\,f(n/b)$ |
| $i$ | $a^i$ | $n/b^i$ | $a^i f(n/b^i)$ |
| $\log\_b n$ | $a^{\log\_b n} = n^{\log\_b a}$ | $1$ | $\Theta(n^{\log\_b a})$ |

$T(n)$ is the **sum of the level costs**.

--

## The level costs are geometric

With $f(n) = n^c$, level $i$ costs $n^c \cdot (a / b^c)^i$, a geometric series with ratio $r = a/b^c$:

| ratio | the series | the sum |
| --- | --- | --- |
| $r < 1$ | shrinks: the **root** dominates | $\Theta(n^c)$ |
| $r = 1$ | flat: every level ties | $\Theta(n^c \log n)$ |
| $r > 1$ | grows: the **leaves** dominate | $\Theta(n^{\log\_b a})$ |

--

## Demo: the level sum

<div class="algo-viz" data-algo="recurrence" data-config='{"width":900}'>
<pre class="viz-fallback">
   one bar per level of the recursion tree, its length the level's cost:
     2T(n/2) + n     flat bars: every level ties, times log n
     8T(n/2) + n²    growing bars: the leaves win, n³
     2T(n/2) + n²    shrinking bars: the root wins, n²
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Type a recurrence: **flat** bars are case 2, **growing** case 1, **shrinking** case 3. End with `2T(n/2) + n log n`.</small>

--

## The master theorem

For $T(n) = a\\,T(n/b) + f(n)$, compare $f(n)$ with $n^{\log\_b a}$:

1. $f(n) = O(n^{\log\_b a - \varepsilon})$ for some $\varepsilon > 0$: $\\;T(n) = \Theta(n^{\log\_b a})$
2. $f(n) = \Theta(n^{\log\_b a})$: $\\;T(n) = \Theta(n^{\log\_b a} \log n)$
3. $f(n) = \Omega(n^{\log\_b a + \varepsilon})$, and $a f(n/b) \le c f(n)$ for some $c < 1$: $\\;T(n) = \Theta(f(n))$

--

## Reading the case

| recurrence | $n^{\log\_b a}$ | against $f(n)$ | case | $T(n)$ |
| --- | --- | --- | --- | --- |
| mergesort: $2T(n/2) + n$ | $n$ | equal | 2 | $\Theta(n \log n)$ |
| binary search: $T(n/2) + 1$ | $1$ | equal | 2 | $\Theta(\log n)$ |
| $8T(n/2) + n^2$ | $n^3$ | larger | 1 | $\Theta(n^3)$ |
| $2T(n/2) + n^2$ | $n$ | smaller | 3 | $\Theta(n^2)$ |

--

## The gap

$$T(n) = 2T(n/2) + n \log n$$

- $n^{\log\_2 2} = n$, and $f(n) = n \log n$ is larger, but not by a **polynomial** factor $n^\varepsilon$
- no case applies
- the level sum still answers: level $i$ costs $n \log(n / 2^i) = n(\log n - i)$, and

$$\sum\_{i=0}^{\log n} n(\log n - i) = \Theta(n \log^2 n)$$

--

## Your turn: read the recurrence

1. $T(n) = 4T(n/2) + n$
2. $T(n) = 7T(n/2) + n^2$
3. $T(n) = T(n/2) + n$

<details class="answer"><summary>Answer:</summary>

1. $n^{\log\_2 4} = n^2$ beats $n$: case 1, $\Theta(n^2)$
2. $n^{\log\_2 7} \approx n^{2.81}$ beats $n^2$: case 1, $\Theta(n^{\log\_2 7})$, Strassen's matrix multiplication
3. $n^{\log\_2 1} = 1$ loses to $n$: case 3, $\Theta(n)$; the level costs $n + n/2 + n/4 + \ldots < 2n$

</details>

--

## Beyond sorting

| algorithm | recurrence | cost |
| --- | --- | --- |
| binary search | $T(n/2) + O(1)$ | $\Theta(\log n)$ |
| Karatsuba multiplication | $3T(n/2) + O(n)$ | $\Theta(n^{\log\_2 3}) \approx n^{1.58}$ |
| closest pair of points | $2T(n/2) + O(n)$ | $\Theta(n \log n)$ |
| Strassen's matrix product | $7T(n/2) + O(n^2)$ | $\Theta(n^{\log\_2 7}) \approx n^{2.81}$ |

--

## Balance is everything

| split | depth | cost of linear work per level |
| --- | --- | --- |
| even: $n/2$ and $n/2$ | $\log\_2 n$ | $\Theta(n \log n)$ |
| skewed: $1$ and $n - 1$ | $n$ | $\Theta(n^2)$ |

Mergesort always splits evenly. Quicksort splits where its pivot lands.

