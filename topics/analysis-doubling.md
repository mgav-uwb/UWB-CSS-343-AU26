<!--
  TOPIC · Observe: the doubling experiment.
  Teaches: measuring cost by counting operations and by timing; the doubling
           experiment and the ratio 2^b; log-log plots and power laws;
           predicting from a measured exponent; why the constant cancels.
  Needs:   the k-sum topic (3-sum, count3, C(n,3)).
  Demos:   none.
  Program: topics/code/analysis-doubling/threesum.cpp
  Budget:  ~22 min, 10 slides.
-->

### Observe: the doubling experiment

<small>(~22 min)</small>

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

$$\lg T(N) = b \lg N + \lg a$$

A **straight line** in (lg N, lg T) with **slope b** and intercept lg a.

Plot log-log, read the slope, and you have the exponent, without knowing anything about the code.

--

## Predict, then check

Slope **b = 3**, so T(N) = a·N³. Solve for a from one measured point, then **forecast**:

- T(4000) ≈ 8 × T(2000)
- T(8000) ≈ 8 × T(4000)

The forecast stands or falls on the **next measurement**.

Measuring gives the exponent and a forecast. It never says **why** the exponent is 3.

