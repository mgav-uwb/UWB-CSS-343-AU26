<!--
  TOPIC · Model: counting the basic operation, tilde, order of growth.
  Teaches: Knuth's cost × frequency; the exact frequency of 3-sum's inner
           loop; tilde notation and why dropping terms is legitimate; order
           of growth; propositions under a cost model; model meets experiment.
  Needs:   the doubling-experiment topic; the counting-loops topic.
  Demos:   none.
  Program: none (numbers from topics/code/analysis-doubling/threesum.cpp).
  Budget:  ~22 min, 16 slides.
-->

### Model: count it from the code

<small>(~22 min)</small>

--

## Knuth's insight

$$\text{total time} = \sum_{\text{statements}} \text{cost} \times \text{frequency}$$

- **cost** of a statement: a property of the machine and the compiler
- **frequency**, how often it runs: a property of the **algorithm** and the input

The interesting part is always the **frequency**.

--

## Every statement has a frequency

| statement | frequency | tilde |
| --- | --- | --- |
| test `i < N` | N + 1 | ~ N |
| test `j < N` | C(N, 2) + N | ~ N²/2 |
| test `k < N` | C(N, 3) + C(N, 2) | ~ N³/6 |
| the `if` | C(N, 3) | ~ N³/6 |
| `cnt++` | triples found | input-dependent |

Only the **innermost** rows matter at scale.

--

## How often does the inner test run?

Once per triple i < j < k: the number of ways to choose **3 of N**.

$$\binom{N}{3} = \frac{N(N-1)(N-2)}{6}$$

Counted with the tools from the review: the dependent loops, or Pascal's rule on the recursion.

--

## Expand it

$$\binom{N}{3} = \frac{N^3}{6} - \frac{N^2}{2} + \frac{N}{3}$$

At **N = 1000**:

$$\frac{10^9}{6} - \frac{10^6}{2} + \frac{1000}{3} = 166{,}167{,}000$$

**Exactly** the count the experiment printed.

--

## Tilde: keep the leading term

At N = 1000 the terms after N³/6 add up to about −499,667, tiny beside N³/6 ≈ 1.667 × 10⁸:

<img src="../../topics/figures/leading-term.svg" style="width:40%">

$$\frac{N(N-1)(N-2)}{6} \sim \frac{N^3}{6}$$

--

## Why dropping them is legitimate

$$\frac{N^3/6 - N^2/2 + N/3}{N^3/6} = 1 - \frac{3}{N} + \frac{2}{N^2} \longrightarrow 1$$

The dropped terms vanish **in proportion**.

They even explain the printed ratios exactly: C(2N)/C(N) = 4(2N − 1)/(N − 2) = 8 + 12/(N − 2) = **8.048, 8.024, 8.012** at N = 250, 500, 1000.

--

## The sums you will meet

| sum | exact | tilde | at N = 1024 |
| --- | --- | --- | --: |
| 1 + 2 + … + N | N(N + 1)/2 | ~ N²/2 | 524,800 |
| pairs i < j | N(N − 1)/2 | ~ N²/2 | 523,776 |
| 1² + 2² + … + N² | N(N + 1)(2N + 1)/6 | ~ N³/3 | 358,438,400 |
| triples i < j < k | N(N − 1)(N − 2)/6 | ~ N³/6 | 178,433,024 |
| 1 + 2 + 4 + … + N, N = 2ᵏ | 2N − 1 | ~ 2N | 2,047 |
| halvings of N to 1 | ⌊log₂ N⌋ | ~ log₂ N | 10 |

--

## Why pairs are ~ N²/2

```cpp
for (int i = 0; i < N; i++)
    for (int j = 0; j < i; j++)   // runs i times
        op();
```

$$\sum_{i=0}^{N-1} i = 0 + 1 + \dots + (N-1) = \frac{N(N-1)}{2} \sim \frac{N^2}{2}$$

The pairs fill **half of the N × N square**, the triangle below its diagonal.

--

## A true N log₂ N loop

```cpp
for (int i = 0; i < N; i++)          // N values of i
    for (int j = 1; j < N; j *= 2)   // j = 1, 2, 4, …: ⌈log₂ N⌉ values
        op();
```

The inner loop does the **same** ⌈log₂ N⌉ steps for every i, so the total is a product:

$$N \cdot \lceil \log\_2 N \rceil \sim N \log\_2 N$$

At N = 1024: 1024 × 10 = **10,240** operations.

--

## Predict: is this N log₂ N too?

```cpp
for (int i = 1; i < N; i *= 2)    // i = 1, 2, 4, …
    for (int j = 0; j < i; j++)   // i iterations
        op();
```

Outer loop: log₂ N passes. Inner loop: up to N. How many calls at N = 1024? What order of growth?

<details class="answer"><summary>Answer:</summary>

**1023**, linear: the inner count changes with i, so it is a sum, not a product. 1 + 2 + 4 + … + N/2 = N − 1 ~ N, not 10,240.

</details>

--

## Your turn: count it

```cpp
for (int i = 0; i < N; i++)
    for (int j = i; j < N; j++)
        for (int k = 0; k < 3; k++)
            op();
```

How many calls to `op()`, exactly and in tilde notation?

<small>For each i the j loop runs N − i times: N + (N − 1) + … + 1 = N(N + 1)/2, times 3. Exactly **3N(N + 1)/2**, so **~ 3N²/2**: order N². At N = 10: 165.</small> <!-- .element: class="fragment" -->

--

## Order of growth

Drop the constant too, and keep the **shape**:

| exact frequency | tilde | order of growth |
| --- | --- | --- |
| N(N − 1)(N − 2)/6 | ~ N³/6 | **N³** |
| N²/2 − N/2 | ~ N²/2 | **N²** |
| ⌊log₂ N⌋ + 1 | ~ log₂ N | **log₂ N** |

The order of growth is the function of N the cost is **proportional to**.

--

## A cost model, and a proposition

Counting **array accesses** instead of triples:

> **Proposition.** Brute-force 3-sum makes ~ N³/2 array accesses: three (a[i], a[j], a[k]) for each of ~ N³/6 triples.

A cost model lets us state a fact about the **algorithm**, not about one run on one machine.

<small>Code: <a href="../../topics/code/faster-3sum/faster.cpp">faster.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Model meets experiment

| route | result |
| --- | --- |
| **model** (count from the code) | ~ N³/6 triples |
| **experiment** (run, doubling N) | ratio → 8, log-log slope 3 |
| **both** | order of growth **N³** |

Two independent routes, one answer.

--

## Separating algorithm from machine

The order of growth N³ does **not** depend on:

- the language: C++, Java, Python
- the machine: laptop, phone, server

It depends on the **algorithm**: it examines every triple.

