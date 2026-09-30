<!--
  TOPIC · Designing a faster 3-sum.
  Teaches: analysis guiding design; 2-sum by sorting and binary search; the
           sum and product rules for orders of growth; the preprocessing
           trade; 3-sum in N² lg N and in N² with two pointers; the idea of a
           lower bound.
  Needs:   the recursion topic (binary search); the growth-classes topic.
  Demos:   none.
  Programs: topics/code/faster-3sum/faster.cpp, twopointer.cpp
  Budget:  ~28 min, 14 slides.
-->

### Designing a faster 3-sum

<small>(~28 min)</small>

--

## Can cubic be beaten?

3-sum is N³. **Is that the best possible?**

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

About N²/2 pairs: order of growth **N²**.

--

## How could 2-sum be faster?

Read the inner loop as a question. For each a[i]:

> Is **−a[i]** somewhere in the array?

A scan answers it in N steps. If the array were **sorted**, binary search would answer it in about **lg N**.

--

## 2-sum, fast

**Sort once**, then **binary-search** for each −a[i]:

```cpp
long twoSumFast(vector<int> a) {           // N lg N
    sort(a.begin(), a.end());              // N lg N, once
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)            // N searches,
        if (rankOf(-a[i], a) > i) cnt++;   // lg N each
    return cnt;
}
```

`rankOf(x, a)` is binary search: the index of x in sorted a, or −1. Testing `> i` counts each pair once.

--

## The sum rule

Step A, **then** step B: the costs **add**, and the larger one determines the order of growth.

Sort (N lg N), then N searches of lg N each:

$$N \lg N + N \lg N = 2N \lg N \quad\Rightarrow\quad \text{order } N \lg N$$

| sum | order of growth |
| --- | --- |
| N + N² | N² |
| N lg N + N² | N² |
| N² + 100N + 5000 | N² |

--

## The product rule

Work **nested** inside a loop **multiplies**: iterations × work per iteration.

- N iterations × lg N each = **N lg N**
- N² iterations × lg N each = **N² lg N**

N iterations doing lg N work is N lg N, not N + lg N.

--

## The preprocessing trade

We **added** a sort to **remove** a loop:

| 2-sum | order |
| --- | --- |
| brute force | N² |
| sort + binary search | **N lg N** |

Spend a little up front so each lookup is cheap. Now lift the idea to 3-sum.

--

## Same idea: fast 3-sum

Sort, then for each **pair** binary-search for −(a[i] + a[j]):

```cpp
long threeSumFast(vector<int> a) {         // N^2 lg N
    sort(a.begin(), a.end());
    int N = a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            if (rankOf(-a[i] - a[j], a) > j) cnt++;
    return cnt;
}
```

Sum rule and product rule: N lg N + N² · lg N ⇒ **N² lg N**, down from N³.

--

## See the gap

```text
         2-sum                   3-sum
   N     N^2        N lg N       N^3            N^2 lg N
1000     999000     10979        498501000      5915535
2000     3998000    23937        3994002000     25670081
4000     15996000   51912        31976004000    110849629
```

<img src="../../topics/figures/sum-costs.svg" style="width:62%">

--

## Can the lg N go too?

Fast 3-sum re-searches for every pair. On sorted data, fix a[i] and close **two pointers** in from the ends of the rest, with s = a[i] + a[lo] + a[hi]:

- **s < 0**: a[lo] pairs with nothing that is left, so lo++
- **s > 0**: a[hi] is finished, so hi--
- **s = 0**: count it and retire both

Each step **retires an index for good**, so at most N steps per i.

--

## 3-sum with two pointers

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

N lg N + N · N ⇒ **N²**: the lg N is gone.

--

## The whole ladder

| algorithm | idea | order | doubling ratio |
| --- | --- | --- | --- |
| threeSum | test every triple | N³ | 8 |
| threeSumFast | sort; binary-search the third | N² lg N | a little over 4 |
| threeSumTwoPointer | sort; retire an index per step | N² | 4 |

```text
$ ./twopointer 16000
```

--

## How fast can 3-sum go?

A **lower bound** is a cost **no** algorithm can beat.

- 3-sum must at least read its input: **N**
- our **N²** is essentially the best known: only logarithmic improvements exist (Grønlund and Pettie, 2014)
- whether substantially less than N² is possible is **open**

When an algorithm meets a proven lower bound, stop optimizing.

