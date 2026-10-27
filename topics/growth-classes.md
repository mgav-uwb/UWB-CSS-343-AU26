<!--
  TOPIC · The order-of-growth classes.
  Teaches: the handful of growth rates that recur; which code shapes produce
           each; how they compare in practice; what faster hardware buys for
           each (Moore's law in doubling terms).
  Needs:   the cost-model topic (order of growth).
  Demos:   none.
  Figures: an-orders-of-growth (tools/gen-analysis-figures.mjs).
  Program: none.
  Budget:  ~16 min, 11 slides.
-->

### The order-of-growth classes

> At one operation per nanosecond, $2^{100}$ operations take about $4 \times 10^{13}$ years, about 2,900 times the age of the universe.

<small>2<sup>100</sup> ns ≈ 1.3 × 10<sup>21</sup> s; age of the universe ≈ 13.8 billion years</small>

--

## The few that matter

| order | name | code shape | example |
| --- | --- | --- | --- |
| $1$ | constant | a statement | add two numbers |
| $\log\_2 N$ | logarithmic | halve each step | binary search |
| $N$ | linear | one loop | find the maximum |
| $N \log\_2 N$ | linearithmic | divide and conquer | mergesort |
| $N^2$ | quadratic | double loop | check all pairs |
| $N^3$ | cubic | triple loop | 3-sum |
| $2^N$ | exponential | every subset | exhaustive search |

<small>Every structure and algorithm of the course, colored by growth: the <a href="../../media/big-o-cheatsheet.html">Big-O cheat sheet</a>.</small>

--

## Where each shape comes from

- **constant**: work that does not loop over the input
- **logarithmic**: each step discards a constant fraction (binary search halves)
- **linear**: touch each element a constant number of times
- **linearithmic**: split in half, recurse, combine in linear time (mergesort)

--

## Where $\log\_2 N$ comes from

```cpp
int halvings(int n) {
    int count = 0;
    while (n > 1) { n /= 2; count++; }   // n: N, N/2, ..., 1
    return count;
}
```

| $N$ | 1 | 2 | 3 | 8 | 1000 | $10^6$ | $10^9$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| halvings | 0 | 1 | 1 | 3 | 9 | 19 | 29 |

The count is $\boldsymbol{\lfloor \log\_2 N \rfloor}$: **doubling** $\boldsymbol{N}$ **adds one step**.

<small>Some authors write lg N for log₂ N; this course writes log₂.</small>

--

## The logarithm facts we use

- $\log\_2 N$ **is the power of 2 that gives** $\boldsymbol{N}$: $\log\_2 2^k = k$, so $\log\_2 1024 = 10$
- $\log\_2(ab) = \log\_2 a + \log\_2 b$: doubling $N$ adds 1, since $\log\_2 2N = \log\_2 N + 1$
- $\log\_2(N^k) = k \log\_2 N$: so $\log\_2 N^2 = 2 \log\_2 N$
- **change of base**: $\log\_2 N = \log\_{10} N / \log\_{10} 2 \approx 3.32 \log\_{10} N$

The base changes only a **constant factor**, so "logarithmic" needs no base.

--

## The expensive ones

- **quadratic**: every pair, a loop inside a loop
- **cubic**: every triple, three nested loops
- **exponential**: every subset, $2^N$; infeasible past tiny $N$

Nesting **multiplies** the counts, which is why the exponents climb so fast.

--

## Why the exponent rules

<div><img src="../../topics/figures/complexity/an-orders-of-growth.svg" style="height:350px" alt="
   standard plot (N to 40): 2^N, N^3, N^2 leave the frame; the rest hug the floor
   log-log plot (N to 1024): N, N^2, N^3 are straight lines of slope 1, 2, 3;
   log2 N flattens; 2^N bends upward out of the frame"></div>

On a log-log plot each class is a **line whose slope is its exponent**.

--

## Your turn: classify the loop

```cpp
for (int i = 0; i < N; i++)                       // (a)
    for (int j = 1; j < N; j *= 2) op();
for (int i = N; i > 0; i /= 2)                    // (b)
    for (int j = 0; j < i; j++) op();
for (int i = 0; i < N; i++)                       // (c)
    for (int j = 0; j < i; j++)
        for (int k = 0; k < 100; k++) op();
for (int i = 0; i * i < N; i++) op();             // (d)
```

<details class="answer"><summary>Answer:</summary>

- (a) $N \cdot \log\_2 N$: $\boldsymbol{N \log\_2 N}$ (10,240 at $N = 1024$)
- (b) $N + N/2 + \cdots + 1 \sim 2N$: $\boldsymbol{N}$ (2047)
- (c) $100 \cdot N(N - 1)/2 \sim 50N^2$: $\boldsymbol{N^2}$
- (d) $i$ runs to $\sqrt{N}$: $\boldsymbol{\sqrt{N}}$ (32), between $\log\_2 N$ and $N$

</details>

--

## What it means in seconds

At $\boldsymbol{N = 10^6}$ and $10^9$ operations a second:

| growth | time |
| --- | --- |
| $N$ | 1 ms |
| $N \log\_2 N$ | 20 ms |
| $N^2$ | about 17 minutes |
| $N^3$ | about 31 years |
| $2^N$ | longer than the age of the universe |

The **algorithm** decides what is feasible: a better order of growth before a faster machine.

--

## Moore's law: who keeps up?

A machine **twice as fast** solves a bigger problem in the same time. For an $N^b$ algorithm, the feasible $N$ grows by $\boldsymbol{2^{1/b}}$:

| order | ratio when $N$ doubles | a $2\times$ machine grows $N$ by |
| --- | --- | --- |
| $N$ | 2 | $\boldsymbol{\times 2}$ |
| $N^2$ | 4 | $\times \sqrt{2} \approx 1.41$ |
| $N^3$ | 8 | $\times \sqrt[3]{2} \approx 1.26$ |
| $2^N$ | | **+ 1 element** |

--

## To double the problem size

Solving $\boldsymbol{2N}$ in the same time needs a $\boldsymbol{2^b}$ **times** faster machine:

| order | speedup to double $N$ |
| --- | --- |
| $N$ | $2\times$ |
| $N^2$ | $4\times$ |
| $N^3$ | $8\times$ |
| $2^N$ | impossible: it squares the work |

The exponent $b$ you read off the doubling ratio is exactly this number of hardware doublings.

