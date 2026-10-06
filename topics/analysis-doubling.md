<!--
  TOPIC · Observe: the doubling experiment.
  Teaches: measuring cost by counting operations and by timing; the doubling
           experiment and the ratio 2^b; log-log plots and power laws;
           predicting from a measured exponent; why the constant cancels.
  Needs:   the k-sum topic (3-sum, count3, C(n,3)).
  Demos:   lib/measure/doubling.html (embedded, brute force to N = 2000).
  Program: topics/code/analysis-doubling/threesum.cpp
  Budget:  ~24 min, 15 slides.
-->

### Observe: the doubling experiment

> Gordon Moore predicted in 1965 that the number of components on a chip would double every year; in 1975 he revised the period to two years.

<small>G. E. Moore, “Cramming More Components onto Integrated Circuits,” Electronics 38(8), 1965</small>

--

## Two questions about any program

- **How long will it take** on a bigger input?
- **How much memory** will it need?

The answers seem to depend on everything: the machine, the language, the input. We can still answer them **scientifically**: observe, hypothesize, predict, verify.

--

## Recall: brute-force 3-sum

```cpp [5]
long count3(const vector<int>& a, long long& ops) {
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            for (int k = j + 1; k < N; k++) { ops++;
                if (a[i] + a[j] + a[k] == 0) cnt++; }
    return cnt;
}
```

`ops` counts **one tick per triple tested**. The cost depends on N, not on the values.

--

## Run it, doubling N

```text
$ g++ -std=c++17 -O2 threesum.cpp -o threesum && ./threesum
```

Each line **doubles N** and prints the operation count, the time, and each one's **ratio** to the line before.

**Before each line prints:** how much longer will it take?

<small>Code: <a href="../../topics/code/analysis-doubling/threesum.cpp">threesum.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## What we observe

```text
     N   triples     operations   ratio   time(s)  tratio
   250         0        2573000    0.00     0.002    0.00
   500         8       20708500    8.05     0.018   11.75
  1000        62      166167000    8.02     0.156    8.77
  2000       512     1331334000    8.01     1.050    6.72
```

The **operation ratio → 8** every time N doubles. The **time ratio agrees, noisily.**

--

## Demo: the experiment in your browser

<iframe data-src="../../lib/measure/doubling.html?embed=1&alg=brute&max=2000" style="width:100%;height:470px;border:0" title="doubling experiment"></iframe>

--

## When the ratio wobbles

Count ratios are exact; time ratios scatter:

- **N too small**: below the timer's resolution
- **warm-up**: compiling, loading, filling caches
- **other processes** share the machine
- **caches**: data outgrows a level, accesses slow down

Remedy: **count** when you can; repeat timings, keep the best; trust the larger N.

--

## Reading the ratio

When N **doubles**, the work is multiplied by the ratio:

- × 2 per doubling: linear
- × 4 per doubling: quadratic
- **× 8 per doubling: cubic**

The ratio is the exponent in disguise: **8 = 2³**.

--

## Why the ratio is 2ᵇ

Suppose the cost is a **power law**, T(N) = a·Nᵇ. Then

$$\frac{T(2N)}{T(N)} = \frac{a (2N)^{b}}{a N^{b}} = 2^{b}$$

- the constant **a cancels**: the machine drops out
- lower-order terms fade as N grows (8.05 → 8.02 → 8.01)

So **b = log₂(ratio)**: here log₂ 8 = 3.

--

## Plot the data

<img src="../../topics/figures/threesum-plots.svg" style="width:88%">

Left: the raw curve. Right: the **log-log plot, a straight line of slope 3**.

--

## Why a log-log plot?

Take logs of T(N) = a·Nᵇ:

$$\log\_2 T(N) = b \log\_2 N + \log\_2 a$$

A **straight line** in (log₂ N, log₂ T) with **slope b** and intercept log₂ a.

Plot log-log, read the slope, and you have the exponent, without knowing anything about the code.

--

## Predict, then check

Slope **b = 3**, so T(N) = a·N³. Solve for a from one measured point, then **forecast**:

- T(4000) ≈ 8 × T(2000)
- T(8000) ≈ 8 × T(4000)

The forecast stands or falls on the **next measurement**.

Measuring gives the exponent and a forecast. It never says **why** the exponent is 3.

--

## Estimate a once b is known

With b = 3, one row fixes the constant. From **T(2000) = 1.050 s**:

$$a = \frac{1.050}{2000^3} = 1.31 \times 10^{-10} \text{ s}$$

Then T(N) ≈ 1.31 × 10⁻¹⁰ · N³ predicts:

| N | predicted T(N) |
| --- | --- |
| 4000 | 8.4 s |
| 16000 | 538 s, about 9 minutes |

--

## Same b, different machine

| run | T(2000) | doubling ratio | b |
| --- | --- | --- | --- |
| C++, -O2, the authoring laptop | 1.05 s | 8.0 | 3 |
| JavaScript, Chrome, same laptop | 2.5 s | 8.7 | 3 |

A different language or machine changes **a**, the constant; the exponent **b** is the algorithm's.

--

## Your turn: predict the next row

A program you have not seen:

| N | 1000 | 2000 | 4000 | 8000 |
| --- | --: | --: | --: | --: |
| time (s) | 0.21 | 0.83 | 3.32 | ? |

Estimate b, then predict T(8000) and T(16000).

<details class="answer"><summary>Answer:</summary>

Ratios 3.95, 4.00 → 2ᵇ ≈ 4 → **b ≈ 2**. T(8000) ≈ 4 × 3.32 ≈ **13.3 s**; T(16000) ≈ 4 × 13.3 ≈ **53 s**.

</details>

