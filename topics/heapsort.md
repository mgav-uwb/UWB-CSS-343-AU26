<!--
  TOPIC · Heapsort and priority queues in practice.
  Teaches: heapsort as selection sort with a heap; sorting down in place (C++); a worked trace; heapsort among the n log n sorts; library priority queues; common heap bugs.
  Needs:   heapify.
  Demos:   heap-sort (slide spec); figure hp-sort-down (tools/gen-heap-figures.mjs)
  Program: none
  Budget:  ~20 min, 8 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 8, 9; figures and class-style code 2026-10-21.
-->

### Heapsort and priority queues in practice

> Heapsort guarantees $n \log n$ time in place, yet on modern machines it usually loses to quicksort: sink jumps across the array and misses the cache.

<small>A. LaMarca and R. E. Ladner, “The Influence of Caches on the Performance of Sorting,” J. Algorithms 31, 1999</small>

--

## Selection sort with a heap

Selection sort repeatedly finds the max of what is left, by a $\boldsymbol{\Theta(n)}$ **scan**. A heap finds the max in $\boldsymbol{\Theta(\log n)}$:

| step                      | selection sort | heapsort       |
| ------------------------- | -------------- | -------------- |
| find the max of the rest  | scan, $\Theta(n)$ | delMax, $\Theta(\log n)$ |
| $n$ rounds                | $\boldsymbol{\Theta(n^2)}$ | $\boldsymbol{\Theta(n \log n)}$ |

And `delMax` already **parks the max at the end** (`swap a[1], a[n]`), so the sorted part grows in the same array. That is **heapsort**.

--

## Sort down, in place

```cpp
// Sort a[1..n] ascending, in place.
void heapsort(int a[], int n) {
    heapify(a, n);                     // Theta(n)
    for (int end = n; end > 1; end--) {
        std::swap(a[1], a[end]);   // the max of a[1..end] to its final place
        sink(a, 1, end - 1);       // a[1..end-1] is a heap again
    }
}
```

**Loop invariant:** `a[1..end]` is a heap of the `end` **smallest** keys; `a[end+1..n]` holds the rest, **sorted, in final position**.

The heap shrinks from the right and the sorted tail grows: **no extra array**.

--

## Sort down: worked

<div><img src="../../topics/figures/heaps/hp-sort-down.svg" style="height:380px" alt="
   heap:   [ 95 90 70 80 60 ]          heap | sorted
   swap 95↔end, sink:  90 80 70 60 | 95
   swap 90↔end, sink:  80 60 70    | 90 95
   swap 80↔end, sink:  70 60       | 80 90 95
   swap 70↔end, sink:  60          | 70 80 90 95
                                    | 60 70 80 90 95"></div>

Each round: swap the max to the boundary, sink the new root. The bar is the heap | sorted boundary.

--

## Demo: heapsort

<div class="algo-viz" data-algo="heap-sort">
<pre class="viz-fallback">
   Build: load a raw array.
   press Heapify: bottom-up sinks → a max-heap.
   press Sort Down (enabled after Heapify): repeatedly swap
     a[1] to the end, shrink, sink → sorted tail grows right.
   or press Heapsort to run both phases back-to-back.
   final: the whole array is sorted ascending, in place.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Heapify**, then **Sort Down** (grayed out until Heapify runs: a non-heap cannot be sorted down); the sorted tail grows on the right, all in **one** array. **Heapsort** runs both phases.</small>

--

## Which $\Theta(n \log n)$ sort?

| sort          | worst          | space    | stable  | in practice           |
| ------------- | -------------- | -------- | ------- | --------------------- |
| mergesort     | $\Theta(n \log n)$ | $\boldsymbol{\Theta(n)}$ | **yes** | needs a buffer |
| quicksort     | $\boldsymbol{\Theta(n^2)}$ | $\Theta(\log n)$ | no | fastest constants |
| **heapsort**  | $\boldsymbol{\Theta(n \log n)}$ | $\boldsymbol{\Theta(1)}$ | no | the fallback |

Of the three, only heapsort is **guaranteed** $n \log n$ **and** in place; `std::sort` (**introsort**) falls back to it when quicksort recurses too deep.

--

## Library priority queues

You will rarely write one yourself:

- **C++**: `std::priority_queue`: **max**-heap
- **Java**: `java.util.PriorityQueue`: **min**-heap
- **Python**: `heapq`: **min**-heap (negate keys for max)

All are binary heaps: push and pop $\Theta(\log n)$, build $\Theta(n)$, peek $\Theta(1)$.

--

## Common heap bugs

- **wrong direction**: a min-heap where you meant max (or the reverse)
- **sink not picking the larger child**: a bigger key stays below a smaller one
- **off-by-one**: 1-indexed math (`k/2`) on a 0-indexed array
- $\boldsymbol{n}$ **inserts** ($\Theta(n \log n)$) where **heapify** ($\Theta(n)$) was intended

