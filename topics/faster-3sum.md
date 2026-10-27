<!--
  TOPIC · Designing a faster 3-sum.
  Teaches: analysis guiding design; 2-sum by sorting and binary search; the
           sum and product rules for orders of growth; the preprocessing
           trade; 3-sum in N² log₂ N and in N² with two pointers; the idea of a
           lower bound.
  Needs:   the recursion topic (binary search); the growth-classes topic.
  Demos:   threesum-fast (binary search; two pointers); lib/measure/doubling.html (race, embedded).
  Figures: an-sum-costs (tools/gen-analysis-figures.mjs).
  Programs: topics/code/faster-3sum/faster.cpp, twopointer.cpp
  Budget:  ~31 min, 20 slides.
-->

### Designing a faster 3-sum

> For decades 3-sum was conjectured to need about $n^2$ time. In 2014 Allan Grønlund and Seth Pettie showed that slightly less suffices.

<small>A. Grønlund and S. Pettie, “Threesomes, Degenerates, and Love Triangles,” FOCS 2014</small>

--

## Can cubic be beaten?

3-sum is $N^3$. **Is that the best possible?**

The usual first reaction: "every triple has to be checked, so no."

Test that claim, starting with a smaller problem.

--

## Warm-up: 2-sum, brute force

Count the **pairs** that sum to 0:

```cpp
long twoSum(const vector<int>& a) {        // N^2
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            if (a[i] + a[j] == 0) cnt++;
    return cnt;
}
```

About $N^2/2$ pairs: order of growth $\boldsymbol{N^2}$.

--

## How could 2-sum be faster?

Read the inner loop as a question. For each `a[i]`:

> Is `-a[i]` somewhere in the array?

A scan answers it in $N$ steps. If the array were **sorted**, binary search would answer it in about $\boldsymbol{\log\_2 N}$.

--

## 2-sum, fast

**Sort once**, then **binary-search** for each `-a[i]`:

```cpp
long twoSumFast(vector<int> a) {           // N log2 N
    sort(a.begin(), a.end());              // N log2 N, once
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)            // N searches,
        if (rankOf(-a[i], a) > i) cnt++;   // log2 N each
    return cnt;
}
```

`rankOf(x, a)` is binary search: the index of `x` in sorted `a`, or $-1$. Testing `> i` counts each pair once.

--

## The sum rule

Step A, **then** step B: the costs **add**, and the larger one determines the order of growth.

Sort ($N \log\_2 N$), then $N$ searches of $\log\_2 N$ each:

$$N \log\_2 N + N \log\_2 N = 2N \log\_2 N$$

| sum | order of growth |
| --- | --- |
| $N \log\_2 N + N \log\_2 N$ | $N \log\_2 N$ |
| $N \log\_2 N + N^2$ | $N^2$ |
| $N^2 + 100N + 5000$ | $N^2$ |

--

## The product rule

Work **nested** inside a loop **multiplies**: iterations $\times$ work per iteration.

- $N$ iterations $\times$ $\log\_2 N$ each $=$ $\boldsymbol{N \log\_2 N}$
- $N^2$ iterations $\times$ $\log\_2 N$ each $=$ $\boldsymbol{N^2 \log\_2 N}$

$N$ iterations doing $\log\_2 N$ work is $N \log\_2 N$, not $N + \log\_2 N$.

--

## The preprocessing trade

We **added** a sort to **remove** a loop:

| 2-sum | order |
| --- | --- |
| brute force | $N^2$ |
| sort + binary search | $\boldsymbol{N \log\_2 N}$ |

Spend a little up front so each lookup is cheap. Now lift the idea to 3-sum.

--

## Same idea: fast 3-sum

Sort, then for each **pair** binary-search for `-(a[i] + a[j])`:

```cpp
long threeSumFast(vector<int> a) {         // N^2 log2 N
    sort(a.begin(), a.end());
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            if (rankOf(-a[i] - a[j], a) > j) cnt++;
    return cnt;
}
```

Sum rule and product rule: $N \log\_2 N + N^2 \cdot \log\_2 N$ gives $\boldsymbol{N^2 \log\_2 N}$, down from $N^3$.

--

## Demo: one probe per frame

<div class="algo-viz" data-algo="threesum-fast" data-config='{"height":110,"chrome":{"costsInline":true,"showInput":false,"showClear":false},"defaultOp":"Binary search","openRun":true,"ops":[{"name":"Two pointers","enabled":false}]}'>
<pre class="viz-fallback">
sorted: -5 -3 -1  0  1  2  3  4
pair (-5, -3): search for 8   probes a[3]=0, a[5]=2, a[6]=3, a[7]=4: absent
pair (-5,  1): search for 4   probes a[3]=0, a[5]=2, a[6]=3, a[7]=4: found at 7 > j, counted
28 pairs, 80 probes, 6 triples
</pre>
</div>

--

## See the gap

<div style="font-size:0.8em">

| $N$ | 2-sum $N^2$ | 2-sum $N \log\_2 N$ | 3-sum $N^3$ | 3-sum $N^2 \log\_2 N$ |
| --: | --: | --: | --: | --: |
| 1000 | 999,000 | 10,979 | 498,501,000 | 5,915,535 |
| 2000 | 3,998,000 | 23,937 | 3,994,002,000 | 25,670,081 |
| 4000 | 15,996,000 | 51,928 | 31,976,004,000 | 110,834,631 |

</div>

<div><img src="../../topics/figures/complexity/an-sum-costs.svg" style="height:250px" alt="
   array accesses, N = 0 .. 4000: brute-force 2-sum climbs to 16 million and
   3-sum to 32 billion; sort + binary search stays on the floor"></div>

<small>Code: <a href="../../topics/code/faster-3sum/faster.cpp">faster.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Can the $\log\_2 N$ go too?

Fast 3-sum re-searches for every pair. On sorted data, fix `a[i]` and close **two pointers** in from the ends of the rest, with $s$ = `a[i] + a[lo] + a[hi]`:

- $\boldsymbol{s < 0}$: `a[lo]` pairs with nothing that is left, so `lo++`
- $\boldsymbol{s > 0}$: `a[hi]` is finished, so `hi--`
- $\boldsymbol{s = 0}$: count it and retire both

Each step **retires an index for good**, so at most $N$ steps per $i$.

--

## Why two pointers miss nothing

No move discards an index of an uncounted triple:

<div style="font-size:0.85em">

- $\boldsymbol{s < 0}$: $a[lo] + a[h] \le a[lo] + a[hi] < -a[i]$ for all $h \le hi$; $lo$ has no partner left
- $\boldsymbol{s > 0}$: $a[h] + a[hi] \ge a[lo] + a[hi] > -a[i]$ for all $h \ge lo$; $hi$ has no partner left
- $\boldsymbol{s = 0}$: distinct values: $lo$ and $hi$ are each other's only partner

</div>

Each test retires an index: **at most** $\boldsymbol{N - i - 2}$ **tests** per $i$.

--

## 3-sum with two pointers

<div style="font-size:0.9em">

```cpp
long threeSumTwoPointer(vector<int> a) {   // N^2
    sort(a.begin(), a.end());
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++) {
        int lo = i + 1, hi = N - 1;
        while (lo < hi) {
            int s = a[i] + a[lo] + a[hi];
            if      (s < 0) lo++;
            else if (s > 0) hi--;
            else { cnt++; lo++; hi--; }   // distinct values
        }
    }
    return cnt;
}
```

</div>

$N \log\_2 N + N \cdot N$ gives $\boldsymbol{N^2}$: the $\log\_2 N$ is gone.

--

## Demo: two pointers

<div class="algo-viz" data-algo="threesum-fast" data-config='{"height":110,"chrome":{"costsInline":true,"showInput":false,"showClear":false},"defaultOp":"Two pointers","openRun":true,"ops":[{"name":"Binary search","enabled":false}]}'>
<pre class="viz-fallback">
sorted: -5 -3 -1  0  1  2  3  4
i = -5: lo, hi close in: (-3, 4) = -4 lo++ ... (1, 4) = 0 counted ... (2, 3) = 0 counted
6 triples, 18 sum tests in all
</pre>
</div>

--

## Your turn: two pointers

Sorted: **−7 −3 −2 0 1 2 4 5 9**. Fix `a[i]` $= -7$; start `lo` at $-3$ and `hi` at $9$. Trace every test: which triples count, and how many tests run?

<details class="answer"><summary>Answer:</summary>

| test | 1 | 2 | 3 | 4 | 5 |
| --- | :-: | :-: | :-: | :-: | :-: |
| `a[lo]`, `a[hi]` | $-3$, $9$ | $-2$, $9$ | $0$, $5$ | $1$, $5$ | $2$, $5$ |
| $s$ | $-1$ | **0** | $-2$ | $-1$ | **0** |
| action | `lo++` | count | `lo++` | `lo++` | count |

Counted: $(-7, -2, 9)$ and $(-7, 2, 5)$. **5 tests, 2 triples**, within the bound $N - i - 2 = 7$.

</details>

--

## The whole ladder

| algorithm | idea | order | ratio |
| --- | --- | --- | --- |
| `threeSum` | every triple | $N^3$ | 8 |
| `threeSumFast` | sort, binary search | $N^2 \log\_2 N$ | just over 4 |
| `threeSumTwoPointer` | sort, two pointers | $N^2$ | 4 |

```shell
$ ./twopointer 16000
```

<small>Code: <a href="../../topics/code/faster-3sum/twopointer.cpp">twopointer.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>


--

## The gap, with two pointers

The same arrays as before, now with the third rung (array accesses, from faster.cpp):

| $N$ | $N^3$ | $N^2 \log\_2 N$ | $N^2$ (two pointers) |
| --: | --: | --: | --: |
| 1000 | 498,501,000 | 5,915,535 | 996,904 |
| 2000 | 3,994,002,000 | 25,670,081 | 3,993,112 |
| 4000 | 31,976,004,000 | 110,834,631 | 15,980,046 |

At $N = 4000$ two pointers needs **7 times** fewer accesses than binary search and **2,000 times** fewer than brute force.

--

## Demo: race all three, doubling N

<iframe data-src="../../lib/measure/doubling.html?embed=1&alg=race&max=4000" style="width:100%;height:470px;border:0" title="3-sum doubling race"></iframe>

--

## How fast can 3-sum go?

A **lower bound** is a cost **no** algorithm can beat.

- 3-sum must at least read its input: $\boldsymbol{N}$
- our $\boldsymbol{N^2}$ is essentially the best known: only logarithmic improvements exist (Grønlund and Pettie, 2014)
- whether substantially less than $N^2$ is possible is **open**

When an algorithm meets a proven lower bound, stop optimizing.

