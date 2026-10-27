<!--
  TOPIC · Model: counting the basic operation, tilde, order of growth.
  Teaches: Knuth's cost × frequency; the exact frequency of 3-sum's inner
           loop; tilde notation and why dropping terms is legitimate; order
           of growth; propositions under a cost model; model meets experiment.
  Needs:   the doubling-experiment topic; the counting-loops topic.
  Demos:   none.
  Figures: an-leading-term (tools/gen-analysis-figures.mjs).
  Program: none (numbers from topics/code/analysis-doubling/threesum.cpp).
  Budget:  ~25 min, 18 slides.
-->

### Model: count it from the code

> "An algorithm must be seen to be believed."

<small>Donald Knuth, The Art of Computer Programming, Volume 1, §1.1, 1968</small>

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
| test `i < N` | $N + 1$ | $\sim N$ |
| test `j < N` | $\binom{N}{2} + N$ | $\sim N^2/2$ |
| test `k < N` | $\binom{N}{3} + \binom{N}{2}$ | $\sim N^3/6$ |
| the `if` | $\binom{N}{3}$ | $\sim N^3/6$ |
| `cnt++` | triples found | input-dependent |

Only the **innermost** rows matter at scale.

--

## How often does the inner test run?

Once per triple $i < j < k$: the number of ways to choose **3 of** $\boldsymbol{N}$.

$$\binom{N}{3} = \frac{N(N-1)(N-2)}{6}$$

Counted with the tools from the review: the dependent loops, or Pascal's rule on the recursion.

--

## Expand it

$$\binom{N}{3} = \frac{N^3}{6} - \frac{N^2}{2} + \frac{N}{3}$$

At $\boldsymbol{N = 1000}$:

$$\frac{10^9}{6} - \frac{10^6}{2} + \frac{1000}{3} = 166{,}167{,}000$$

**Exactly** the count the experiment printed.

--

## Tilde: keep the leading term

At $N = 1000$ the terms after $N^3/6$ add up to about $-499{,}667$, tiny beside $N^3/6 \approx 1.667 \times 10^8$:

<div><img src="../../topics/figures/complexity/an-leading-term.svg" style="height:230px" alt="
   N(N-1)(N-2)/6 and N^3/6 for N = 0 .. 1000: one curve on top of the other;
   166,167,000 and 166,666,667 at N = 1000"></div>

$$\frac{N(N-1)(N-2)}{6} \sim \frac{N^3}{6}$$

--

## Why dropping them is legitimate

$$\frac{N^3/6 - N^2/2 + N/3}{N^3/6} = 1 - \frac{3}{N} + \frac{2}{N^2} \longrightarrow 1$$

The dropped terms vanish **in proportion**.

They even explain the printed ratios exactly:

$$\frac{\binom{2N}{3}}{\binom{N}{3}} = \frac{4(2N - 1)}{N - 2} = 8 + \frac{12}{N - 2}$$

which is **8.048, 8.024, 8.012** at $N = 250, 500, 1000$.

--

## The sums you will meet

| sum | exact | tilde | at $N = 1024$ |
| --- | --- | --- | --: |
| $1 + 2 + \cdots + N$ | $N(N + 1)/2$ | $\sim N^2/2$ | 524,800 |
| pairs $i < j$ | $N(N - 1)/2$ | $\sim N^2/2$ | 523,776 |
| $1^2 + 2^2 + \cdots + N^2$ | $N(N + 1)(2N + 1)/6$ | $\sim N^3/3$ | 358,438,400 |
| triples $i < j < k$ | $N(N - 1)(N - 2)/6$ | $\sim N^3/6$ | 178,433,024 |
| $1 + 2 + 4 + \cdots + N$ ($N = 2^k$) | $2N - 1$ | $\sim 2N$ | 2,047 |
| halvings of $N$ to 1 | $\lfloor \log\_2 N \rfloor$ | $\sim \log\_2 N$ | 10 |

--

## Why pairs are $\sim N^2/2$

```cpp
for (int i = 0; i < N; i++)
    for (int j = 0; j < i; j++)   // runs i times
        op();
```

<div style="font-size:0.82em">

$$\sum_{i=0}^{N-1} i = 0 + 1 + \dots + (N-1) = \frac{N(N-1)}{2} \sim \frac{N^2}{2}$$

</div>

The pairs fill **half of the** $\boldsymbol{N \times N}$ **square**, the triangle below its diagonal.

--

## An $N \log\_2 N$ loop

```cpp
for (int i = 0; i < N; i++)          // N values of i
    for (int j = 1; j < i; j *= 2)   // ⌈log₂ i⌉ values
        op();
```

Each $i \ge N/2$ takes at least $\log\_2 N - 1$ steps; none takes more than $\log\_2 N$:

$$\frac{N}{2}(\log\_2 N - 1) \le \sum\_{i<N} \lceil \log\_2 i \rceil \le N \log\_2 N$$

At $N = 1024$: **9,207** ($N \log\_2 N = 10{,}240$). Order $\boldsymbol{N \log\_2 N}$.

--

## Predict: is this $N \log\_2 N$ too?

```cpp
for (int i = 1; i < N; i *= 2)    // i = 1, 2, 4, …
    for (int j = 0; j < i; j++)   // i iterations
        op();
```

Outer loop: $\log\_2 N$ passes. Inner loop: up to $N$. How many calls at $N = 1024$? What order of growth?

<details class="answer"><summary>Answer:</summary>

**1023**, linear: the inner count changes with $i$, so it is a sum, not a product. $1 + 2 + 4 + \cdots + N/2 = N - 1 \sim N$, against 9,207 when the inner loop doubles instead.

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

<details class="answer"><summary>Answer:</summary>

For each $i$ the $j$ loop runs $N - i$ times: $N + (N - 1) + \cdots + 1 = N(N + 1)/2$, times 3. Exactly $\boldsymbol{3N(N + 1)/2}$, so $\boldsymbol{\sim 3N^2/2}$: order $N^2$. At $N = 10$: 165.

</details>

--

## Order of growth

Drop the constant too, and keep the **shape**:

| exact frequency | tilde | order of growth |
| --- | --- | --- |
| $N(N - 1)(N - 2)/6$ | $\sim N^3/6$ | $\boldsymbol{N^3}$ |
| $N^2/2 - N/2$ | $\sim N^2/2$ | $\boldsymbol{N^2}$ |
| $\lfloor \log\_2 N \rfloor + 1$ | $\sim \log\_2 N$ | $\boldsymbol{\log\_2 N}$ |

The order of growth is the function of $N$ the cost is **proportional to**.

--

## A cost model, and a proposition

Counting **array accesses** instead of triples:

> **Proposition.** Brute-force 3-sum makes $\sim N^3/2$ array accesses: three (`a[i]`, `a[j]`, `a[k]`) for each of $\sim N^3/6$ triples.

A cost model lets us state a fact about the **algorithm**, not about one run on one machine.

<small>Code: <a href="../../topics/code/faster-3sum/faster.cpp">faster.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>


--

## Cost models: what to count

<div style="font-size:0.8em">

| cost model | counts | example |
| --- | --- | --- |
| RAM model | every primitive operation, 1 each | behind $O$, $\Omega$, $\Theta$ |
| inner-loop executions | each pass through the inner body | 3-sum: $N(N - 1)(N - 2)/6$ |
| array accesses | each array read or write | 3-sum: $\sim N^3/2$ |
| compares | each key comparison | searching and sorting |
| compares and exchanges | both, separately | selection sort: $\sim N^2/2$ and $N - 1$ |

</div>

--

## More cost models

<div style="font-size:0.8em">

| cost model | counts | example |
| --- | --- | --- |
| probes | each slot or element inspected | binary search: $\lfloor \log\_2 N \rfloor + 1$ |
| vertices and edges | each visit, each adjacency entry | graph search: $V + E$ |
| bit operations | each operation on one bit | $n$-bit multiplication: $\Theta(n^2)$ |
| block transfers | each block moved between memories | external-memory model |

</div>

**Our counters:** `threesum.cpp` counts inner-loop executions, `faster.cpp` array accesses.

--

## Model meets experiment

| route | result |
| --- | --- |
| **model** (count from the code) | $\sim N^3/6$ triples |
| **experiment** (run, doubling $N$) | ratio tends to 8, log-log slope 3 |
| **both** | order of growth $\boldsymbol{N^3}$ |

Two independent routes, one answer.

--

## Separating algorithm from machine

The order of growth $N^3$ does **not** depend on:

- the language: C++, Java, Python
- the machine: laptop, phone, server

It depends on the **algorithm**: it examines every triple.

