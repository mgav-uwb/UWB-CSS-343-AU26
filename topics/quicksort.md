<!--
  TOPIC · Quicksort.
  Teaches: the idea (the work in the partition, no combine); what a partition must achieve; std::swap; Lomuto's partition in C++ (pivot a[hi], strict <) and traced on 3 7 1 9 4 8 6 2 5; a practice partition; the whole sort's pivots; the recursion in C++; the quicksort demo; best and worst recurrences; the worst case drawn (66 comparisons on 12 sorted keys); the expected 2n ln n comparisons, derived; Homework 8's random pivot (499,500 against 10,522 comparisons on 1..1000); equal keys and the three-way idea; mergesort against quicksort; why quicksort wins in practice.
  Needs:   divide and conquer, mergesort.
  Demos:   quicksort-lecture (the registry's quicksort on the lecture's array, slide spec in topics/demos.js); figures so-lomuto-a, so-lomuto-b, so-degenerate (tools/gen-sort-figures.mjs)
  Program: code/quicksort/quicksort.cpp
  Budget:  ~26 min, 18 slides.
  Ported from Summer 2026 L13-sorting-dc.md, part 3; Hoare's partition is the appendix topic hoare-partition.
-->

### Quicksort

> Tony Hoare thought of quicksort in 1959, as a visiting student in Moscow, while working out how to put the words of a sentence in order for a machine-translation program.

<small>L. Shustek, “An Interview with C.A.R. Hoare,” Communications of the ACM 52(3), 2009</small>

--

## Quicksort: the idea

- **divide**: **partition** around a pivot: smaller keys to its left, the rest to its right, the pivot between
- **conquer**: sort the two sides recursively
- **combine**: nothing; the array is sorted in place

Mergesort's mirror image: the work moves from the combine to the divide.

--

## What a partition does

Pivot = the **last** key, `a[hi]`:

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| before | 3 | 7 | 1 | 9 | 4 | 8 | 6 | 2 | **5** |
| after | 3 | 1 | 4 | 2 | **5** | 8 | 6 | 9 | 7 |

- the pivot is in its **final** place, index 4
- everything left of it is smaller, everything right of it is not
- neither side is sorted

--

## [`std::swap`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<utility>`: exchange two values.

```cpp
swap(a[++i], a[j]);           // grow the region, swap the element in
```

- afterwards `x` holds `y`'s old value and `y` holds `x`'s
- $O(1)$ for numbers and pointers
- both arguments are **variables** of the same type, passed by reference

--

## Partition, in C++

```cpp
// Lomuto partition around the last element as pivot. Elements < pivot are moved
// to the front; the pivot ends in its final sorted slot, whose index is returned.
int partition(int a[], int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;                       // boundary of the "< pivot" region
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot)
            swap(a[++i], a[j]);           // grow the region, swap the element in
    swap(a[i + 1], a[hi]);                // drop the pivot just past the region
    return i + 1;                         // the pivot's final index
}
```

`a[lo..i]` holds keys **smaller** than the pivot; `j` scans; $m$ keys cost $m - 1$ comparisons.

--

## Lomuto, traced (1)

<div><img src="../../topics/figures/sorting/so-lomuto-a.svg" style="height:450px" alt="
   pivot = a[8] = 5, i = -1
   j = 0: 3 &lt; 5, take: i = 0, a no-op swap
   j = 1: 7 &lt; 5? no
   j = 2: 1 &lt; 5, take: i = 1, swap a[1] and a[2]
   j = 3: 9 &lt; 5? no
   j = 4: 4 &lt; 5, take: i = 2, swap a[2] and a[4]"></div>

--

## Lomuto, traced (2)

<div><img src="../../topics/figures/sorting/so-lomuto-b.svg" style="height:350px" alt="
   j = 5: 8 &lt; 5? no
   j = 6: 6 &lt; 5? no
   j = 7: 2 &lt; 5, take: i = 3, swap a[3] and a[7]
   place: swap(a[i+1], a[hi]): 3 1 4 2 5 8 6 9 7, p = 4"></div>

8 comparisons, 4 takes; the pivot lands at `i + 1 = 4`.

--

## Your turn: partition

Lomuto, pivot = `a[hi]`:

`5 9 3 8 6 7`

Where does the pivot land, and what are the two sides?

<details class="answer"><summary>Answer:</summary>

`5 3 6 [7] 9 8`: the pivot lands at index 3. Takes at `j = 0` (5), `j = 2` (3) and `j = 4` (6); 9 and 8 are skipped. Left `5 3 6`, right `9 8`.

</details>

--

## The whole sort

| call | range | pivot lands | sides |
| --- | --- | --- | --- |
| 1 | `3 7 1 9 4 8 6 2 5` | **5** at 4 | `3 1 4 2` · `8 6 9 7` |
| 2 | `3 1 4 2` | **2** at 1 | `1` · `4 3` |
| 3 | `4 3` | **3** at 2 | · `4` |
| 4 | `8 6 9 7` | **7** at 6 | `6` · `9 8` |
| 5 | `9 8` | **8** at 7 | · `9` |

Five partitions, 16 comparisons: `1 2 3 4 5 6 7 8 9`.

--

## Quicksort, in C++

```cpp
// Quicksort: partition, then recurse on each side. No combine step.
void quicksort(int a[], int lo, int hi) {
    if (hi <= lo) return;                 // base case: 0 or 1 element
    int p = partition(a, lo, hi);         // pivot lands at its final index p
    quicksort(a, lo, p - 1);              // sort the smaller side
    quicksort(a, p + 1, hi);              // sort the larger side
}
```

The work is **before** the calls; mergesort's is **after** them.

--

## Demo: quicksort

<div class="algo-viz" data-algo="quicksort-lecture" data-config='{"width":900}'>
<pre class="viz-fallback">
   partition around a[hi], then recurse on each side; each pivot locks into its final slot
   3 7 1 9 4 8 6 2 5: 16 comparisons; 1..12 sorted: 66
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Run **Lomuto** on the lecture's array, then build `1..12`, already sorted: every pivot is the largest key.</small>

--

## The cost

$$\begin{aligned} \text{even splits: } T(n) &= 2T(n/2) + \Theta(n) = \Theta(n \log n) \\\\ \text{a pivot at an end: } T(n) &= T(n - 1) + \Theta(n) = \Theta(n^2) \end{aligned}$$

- extra memory: the recursion stack, $\Theta(\log n)$ expected, $\Theta(n)$ in the worst case
- in place; **not** stable

--

## The worst case

<div><img src="../../topics/figures/sorting/so-degenerate.svg" style="height:280px" alt="
   pivot = 1, the smallest: 4 compares, none true; left 0 keys, right 4
   pivot = 11, the largest: 4 compares, all true, 4 no-op swaps; left 4 keys, right 0"></div>

Sorted input with the last key as pivot: every pivot is the **largest** key. 12 keys: $11 + 10 + \cdots + 1 = 66$ comparisons.

--

## The average: $2n \ln n$

Keys of ranks $i < j$ are compared **only if** one of them is the first pivot drawn from ranks $i..j$:

$$P(i, j \text{ compared}) = \frac{2}{j - i + 1}$$

$$E[\text{comparisons}] = \sum\_{i \lt j} \frac{2}{j - i + 1} \le 2n \sum\_{d=2}^{n} \frac{1}{d}$$

$$\approx 2n \ln n \approx 1.39\\, n \log\_2 n$$

--

## A random pivot

Homework 8 moves a random key into the pivot slot first:

```cpp
swap(a[randomIndex(lo, hi)], a[hi]);  // a random pivot, moved to a[hi]
```

| sorted `1..1000` | comparisons |
| --- | --: |
| last key as pivot | 499,500 |
| random pivot | 10,522 |

Now no **input** is bad: $\Theta(n^2)$ needs a run of bad coin flips.

--

## Equal keys

All twelve keys equal: `a[j] < pivot` is never true, every pivot lands at the end: **66** comparisons, quadratic.

**Three-way partitioning** splits into $\lbrack \lt v \rbrack \lbrack = v \rbrack \lbrack \gt v \rbrack$ and recurses on the outer two only: all-equal input takes **one** linear pass.

--

## Mergesort against quicksort

| | mergesort | quicksort |
| --- | --- | --- |
| work in | the combine (merge) | the divide (partition) |
| time | $\Theta(n \log n)$ always | $\Theta(n \log n)$ expected, $\Theta(n^2)$ worst |
| extra memory | $\Theta(n)$ | $\Theta(\log n)$ expected stack |
| stable | yes | no |

--

## Why quicksort wins in practice

- **in place**: no buffer to allocate, fill and copy back
- **cache-friendly**: each partition scans contiguous memory
- fewer data moves than merging

`std::sort` is **introsort**: quicksort, switching to heapsort when the recursion gets too deep, and to insertion sort on small ranges.

