<!--
  TOPIC · The order-of-growth classes.
  Teaches: the handful of growth rates that recur; which code shapes produce
           each; how they compare in practice; what faster hardware buys for
           each (Moore's law in doubling terms).
  Needs:   the cost-model topic (order of growth).
  Demos:   none.
  Program: none.
  Budget:  ~16 min, 11 slides.
-->

### The order-of-growth classes

<small>(~16 min)</small>

--

## The few that matter

| order | name | code shape | example |
| --- | --- | --- | --- |
| 1 | constant | a statement | add two numbers |
| lg N | logarithmic | halve each step | binary search |
| N | linear | one loop | find the maximum |
| N lg N | linearithmic | divide and conquer | mergesort |
| N² | quadratic | double loop | check all pairs |
| N³ | cubic | triple loop | 3-sum |
| 2ᴺ | exponential | every subset | exhaustive search |

<small>Every structure and algorithm of the course, colored by growth: the <a href="../../media/big-o-cheatsheet.html">Big-O cheat sheet</a>.</small>

--

## Where each shape comes from

- **constant**: work that does not loop over the input
- **logarithmic**: each step discards a constant fraction (binary search halves)
- **linear**: touch each element a constant number of times
- **linearithmic**: split in half, recurse, combine in linear time (mergesort)

--

## Where lg N comes from

```cpp
int halvings(int n) {
    int count = 0;
    while (n > 1) { n /= 2; count++; }   // n: N, N/2, N/4, …, 1
    return count;
}
```

| N | 1 | 2 | 3 | 8 | 1000 | 10⁶ | 10⁹ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| halvings | 0 | 1 | 1 | 3 | 9 | 19 | 29 |

The count is **⌊lg N⌋**: **doubling N adds one step**.

--

## The logarithm facts we use

- **lg N** means log₂ N: lg 2ᵏ = k, so lg 1024 = 10
- **lg(ab) = lg a + lg b**: doubling N adds 1, since lg 2N = lg N + 1
- **lg(Nᵏ) = k lg N**: so lg N² = 2 lg N
- **change of base**: lg N = log₁₀ N / log₁₀ 2 ≈ 3.32 log₁₀ N

The base changes only a **constant factor**, so "logarithmic" needs no base.

--

## The expensive ones

- **quadratic**: every pair, a loop inside a loop
- **cubic**: every triple, three nested loops
- **exponential**: every subset, 2ᴺ; infeasible past tiny N

Nesting **multiplies** the counts, which is why the exponents climb so fast.

--

## Why the exponent rules

<img src="../../topics/figures/orders-of-growth.svg" style="width:84%">

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

<small>(a) N · lg N: **N lg N** (10,240 at N = 1024) · (b) N + N/2 + … + 1 ~ 2N: **N** (2047) · (c) 100 · N(N − 1)/2 ~ 50N²: **N²** · (d) i runs to √N: **√N** (32), between lg N and N.</small> <!-- .element: class="fragment" -->

--

## What it means in seconds

At **N = 10⁶**, on a machine doing 10⁹ operations a second:

| growth | time |
| --- | --- |
| N | 1 ms |
| N lg N | 20 ms |
| N² | about 17 minutes |
| N³ | about 31 years |
| 2ᴺ | longer than the age of the universe |

The **algorithm** decides what is feasible: ask for a better order of growth before a faster machine.

--

## Moore's law: who keeps up?

A machine **twice as fast** solves a bigger problem in the same time. For an Nᵇ algorithm, the feasible N grows by **2^(1/b)**:

| order | ratio when N doubles | a 2× machine grows N by |
| --- | --- | --- |
| N | 2 | **× 2** |
| N² | 4 | × √2 ≈ 1.41 |
| N³ | 8 | × ∛2 ≈ 1.26 |
| 2ᴺ | | **+ 1 element** |

--

## To double the problem size

Solving **2N** in the same time needs a **2ᵇ×** faster machine:

| order | speedup to double N |
| --- | --- |
| N | 2× |
| N² | 4× |
| N³ | 8× |
| 2ᴺ | impossible: it squares the work |

The exponent **b** you read off the doubling ratio is exactly this number of hardware doublings.

