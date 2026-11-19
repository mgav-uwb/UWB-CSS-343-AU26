<!--
  TOPIC · Selection and quickselect.
  Teaches: the k-th smallest (0-indexed rank) without sorting; order statistics; quickselect (partition, then the one side that holds rank k) in C++; a worked run drawn (k = 4 in 7 2 9 4 1 6 3); the expected Theta(n) from a geometric series; the quickselect demo; a practice; median of medians for a guaranteed O(n), and selection in libraries.
  Needs:   quicksort (Lomuto's partition), divide and conquer.
  Demos:   quickselect-lecture (the registry's quickselect on 7 2 9 4 1 6 3, slide spec in topics/demos.js); figures so-qselect-1, so-qselect-23 (tools/gen-sort-figures.mjs)
  Program: code/quickselect/quickselect.cpp
  Budget:  ~13 min, 10 slides.
  Ported from Summer 2026 L13-sorting-dc.md, part 4.
-->

### Selection

> Four of the five authors of the 1973 paper that found a linear-time selection algorithm, Blum, Floyd, Rivest and Tarjan, later received the Turing Award.

<small>M. Blum, R. Floyd, V. Pratt, R. Rivest and R. Tarjan, “Time Bounds for Selection,” Journal of Computer and System Sciences 7(4), 1973</small>

--

## The k-th smallest

Rank $k$, **0-indexed**: the key that would sit at `a[k]` if the array were sorted.

| $k$ | the key |
| --- | --- |
| $0$ | the minimum |
| $\lfloor n/2 \rfloor$ | the median (for odd $n$) |
| $n - 1$ | the maximum |

Sorting first costs $\Theta(n \log n)$ for one answer. Quickselect finds it in $\Theta(n)$ expected.

--

## Quickselect

After a partition the pivot sits at its **final** rank $p$. Compare $p$ with $k$:

- $p = k$: the pivot **is** the answer
- $k < p$: the answer is on the **left**; ignore the right
- $k > p$: the answer is on the **right**; ignore the left

Quicksort recurses on **both** sides; quickselect on **one**.

--

## Quickselect, in C++

```cpp
// Quickselect: the k-th smallest element (0-indexed). Partition, then recurse
// into ONLY the side that contains rank k. Average Theta(n). Reuses partition().
int quickselect(int a[], int lo, int hi, int k) {
    if (lo == hi) return a[lo];           // one element left
    int p = partition(a, lo, hi);         // pivot lands at rank p
    if (k == p)      return a[p];          // found it
    else if (k < p)  return quickselect(a, lo, p - 1, k);   // left side only
    else             return quickselect(a, p + 1, hi, k);   // right side only
}
```

The same `partition` as quicksort.

--

## A run: $k = 4$ (1)

<div><img src="../../topics/figures/sorting/so-qselect-1.svg" style="height:450px" alt="
   call 1: quickselect(0, 6, k = 4) on 7 2 9 4 1 6 3, pivot a[6] = 3
   takes 2 and 1; the pivot lands at p = 2 &lt; k = 4: recurse right on (3, 6)
   6 compares"></div>

--

## A run: $k = 4$ (2)

<div><img src="../../topics/figures/sorting/so-qselect-23.svg" style="height:420px" alt="
   call 2: quickselect(3, 6, k = 4), pivot 9: it lands at 6 &gt; 4, recurse left on (3, 5), 3 compares
   call 3: quickselect(3, 5, k = 4), pivot 6: it lands at 4 = k, return 6, 2 compares"></div>

**6**: $6 + 3 + 2 = 11$ comparisons, three partitions.

--

## Why $\Theta(n)$ expected

A random pivot lands in the **middle half** of the ranks with probability $\tfrac12$, and then at most $\tfrac34$ of the keys survive. So on average every **two** partitions shrink the range by $\tfrac34$:

$$E[T(n)] \le 2n + E[T(\tfrac34 n)] \le 2n \left(1 + \tfrac34 + \left(\tfrac34\right)^2 + \cdots\right) = 8n$$

Worst case: a pivot at an end every time, $\Theta(n^2)$; `k = 0` on sorted `1..1000` costs **499,500** comparisons.

--

## Demo: quickselect

<div class="algo-viz" data-algo="quickselect-lecture" data-config='{"width":900}'>
<pre class="viz-fallback">
   partition, see where the pivot lands, then keep only the side that holds rank k
   the range shrinks until the pivot lands on k
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Enter a rank and run **Quickselect**; the range in play shrinks each step. Try ranks 0 and $n - 1$, and a full **Quicksort** of the same array for comparison.</small>

--

## Your turn: select

Quickselect with $k = 6$ on `3 7 1 9 4 8 6 2 5` (the first partition is the one already traced). How many partitions, and what does it return?

<details class="answer"><summary>Answer:</summary>

Partition 1 puts 5 at index 4 $< 6$: recurse right on `8 6 9 7` (indices 5 to 8). Partition 2 puts 7 at index **6** $= k$: return **7**. Two partitions, $8 + 3 = 11$ comparisons.

</details>

--

## A guaranteed $O(n)$, and selection in practice

- **median of medians** (Blum, Floyd, Pratt, Rivest, Tarjan): pivot on the median of the medians of groups of 5; at least 30% of the keys fall on each side, so $O(n)$ in the **worst** case, with a large constant
- randomized quickselect: $O(n)$ expected, a small constant; the usual choice
- `std::nth_element` is quickselect (introselect)

