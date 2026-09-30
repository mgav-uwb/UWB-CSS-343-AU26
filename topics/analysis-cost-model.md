<!--
  TOPIC · Model: counting the basic operation, tilde, order of growth.
  Teaches: Knuth's cost × frequency; the exact frequency of 3-sum's inner
           loop; tilde notation and why dropping terms is legitimate; order
           of growth; propositions under a cost model; model meets experiment.
  Needs:   the doubling-experiment topic; the counting-loops topic.
  Demos:   none.
  Program: none (numbers from topics/code/analysis-doubling/threesum.cpp).
  Budget:  ~20 min, 10 slides.
-->

### Model: count it from the code

<small>(~20 min)</small>

--

## Knuth's insight

$$\text{total time} = \sum_{\text{statements}} \text{cost} \times \text{frequency}$$

- **cost** of a statement: a property of the machine and the compiler
- **frequency**, how often it runs: a property of the **algorithm** and the input

The interesting part is always the **frequency**.

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

The correction even predicts the measured ratios: 8(1 + 3/(2N)) = **8.048, 8.024, 8.012** at N = 250, 500, 1000, against the measured 8.05, 8.02, 8.01.

--

## Order of growth

Drop the constant too, and keep the **shape**:

| exact frequency | tilde | order of growth |
| --- | --- | --- |
| N(N − 1)(N − 2)/6 | ~ N³/6 | **N³** |
| N²/2 − N/2 | ~ N²/2 | **N²** |
| ⌊lg N⌋ + 1 | ~ lg N | **lg N** |

The order of growth is the function of N the cost is **proportional to**.

--

## A cost model, and a proposition

Counting **array accesses** instead of triples:

> **Proposition.** Brute-force 3-sum makes ~ N³/2 array accesses: three (a[i], a[j], a[k]) for each of ~ N³/6 triples.

A cost model lets us state a fact about the **algorithm**, not about one run on one machine.

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

