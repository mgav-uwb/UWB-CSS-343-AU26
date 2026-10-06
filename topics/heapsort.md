<!--
  TOPIC · Heapsort and priority queues in practice.
  Teaches: heapsort as selection sort with a heap; sorting down in place; a worked trace; heapsort among the n log n sorts; library priority queues; common heap bugs.
  Needs:   heapify.
  Demos:   heap-sort (slide spec)
  Program: none
  Budget:  ~20 min, 8 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 8, 9.
-->

### Heapsort and priority queues in practice

> Heapsort guarantees n log n in place, yet on modern machines it usually loses to quicksort: sink jumps across the array and misses the cache.

<small>A. LaMarca and R. E. Ladner, “The Influence of Caches on the Performance of Sorting,” J. Algorithms 31, 1999</small>

--

## Selection sort, done smart

Selection sort repeatedly finds the max of what's left: by **Θ(n) scan**. A heap **is** a find-max machine:

```text
   find the max of the rest:   scan Θ(n)  →  delMax Θ(log n)
   ─────────────────────────────────────────────────────────
   n rounds:                   Θ(n²)      →  Θ(n log n)
```

And `delMax` already **parks the max at the end** (swap `a[1] ↔ a[n]`): the sorted pile grows in the same array, free. That's **heapsort**.

--

## Sort down, in place

```text
   heapify: for k = n/2 .. 1:  sink(k, n)     // Θ(n)
   for end = n down to 2:                     // n − 1 rounds
       swap(a[1], a[end]);     // park the max at a[end]
       sink(1, end − 1);       // re-heapify the rest
```

**Loop invariant:** `a[1..end]` is a heap of the `end` **smallest** keys; `a[end+1..n]` holds the rest, **sorted, in final position**.

The heap shrinks from the right; the sorted tail grows: **no extra array**.

--

## Sort down: worked

```text
   heap:   [ 95 90 70 80 60 ]          heap | sorted
   swap 95↔end, sink:  90 80 70 60 | 95
   swap 90↔end, sink:  80 60 70    | 90 95
   swap 80↔end, sink:  70 60       | 80 90 95
   swap 70↔end, sink:  60          | 70 80 90 95
                                    | 60 70 80 90 95  ✓
```

Each round: park the max at the boundary, re-sink the new root.

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

<small>**Heapify**, then **Sort Down** (grayed out until Heapify runs: you can't sort down a non-heap); the sorted tail grows on the right, all in **one** array. **Heapsort** = both phases at once.</small>

--

## Which Θ(n log n) sort?

| sort          | worst          | space    | stable  | in practice           |
| ------------- | -------------- | -------- | ------- | --------------------- |
| mergesort     | Θ(n log n)     | **Θ(n)** | **yes** | needs a buffer        |
| quicksort     | **Θ(n²)**      | Θ(log n) | no      | fastest constants     |
| **heapsort**  | **Θ(n log n)** | **Θ(1)** | no      | the safety net        |

Heapsort is the only one **guaranteed** `n log n` **and** in place: which is why `std::sort` (**introsort**) falls back to it when quicksort recurses too deep.

--

## Library priority queues

You will rarely hand-roll one:

- **C++**: `std::priority_queue`: **max**-heap
- **Java**: `java.util.PriorityQueue`: **min**-heap
- **Python**: `heapq`: **min**-heap (negate keys for max)

All are binary heaps: push/pop Θ(log n), build Θ(n), peek Θ(1).

--

## Common heap bugs

- **wrong direction**: min-heap where you meant max (or vice-versa)
- **sink not picking the larger child**: a bigger key stays below a smaller one
- **off-by-one**: 1-indexed math (`k/2`) on a 0-indexed array
- **n inserts** (Θ(n log n)) where **heapify** (Θ(n)) was intended

