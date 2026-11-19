<!--
  TOPIC · Mergesort.
  Teaches: the idea (trivial divide, the work in the merge); the merge drawn and in C++ (copy into aux, take the right front only when strictly smaller); ties go left, so mergesort is stable; inversions defined and what one merge step resolves; the top-down recursion in C++ (mid = lo + (hi - lo) / 2, inclusive ranges); the call tree; the mergesort demo (bottom-up); cost, space and stability; when to choose it.
  Needs:   divide and conquer, the memory topic (Lecture 3's mergesort and its buffer).
  Demos:   mergesort-lecture (the registry's bottom-up mergesort, slide spec in topics/demos.js); figures so-merge, so-merge-branches, so-mergesort-run (tools/gen-sort-figures.mjs)
  Program: code/mergesort/mergesort.cpp
  Budget:  ~18 min, 11 slides.
  Ported from Summer 2026 L13-sorting-dc.md, part 2.
-->

### Mergesort

> John von Neumann wrote a merge sort for the EDVAC in 1945, among the first programs written for a stored-program computer.

<small>D. E. Knuth, *The Art of Computer Programming*, Vol. 3, §5.5, Addison-Wesley, 1998</small>

--

## Mergesort: the idea

- **divide**: cut `a[lo..hi]` at `mid = lo + (hi - lo) / 2`
- **conquer**: sort `a[lo..mid]` and `a[mid+1..hi]` recursively
- **combine**: **merge** the two sorted halves
- base case: one key (or none) is sorted

The divide is free; all the work is in the merge.

--

## The merge

Take the **smaller front** of the two sorted runs:

<div><img src="../../topics/figures/sorting/so-merge.svg" style="height:310px" alt="
   L = 2 5 8, R = 1 3 9
   1 &lt; 2: emit 1 · 3 &lt; 2 false: emit 2 · 3 &lt; 5: emit 3
   9 &lt; 5 false: emit 5 · 9 &lt; 8 false: emit 8 · left exhausted: emit 9
   out = 1 2 3 5 8 9: five comparisons for six keys"></div>

At most one comparison per key: $\Theta(n)$.

--

## The merge, in C++

```cpp
// Merge two adjacent sorted runs a[lo..mid] and a[mid+1..hi] into sorted order,
// using aux[] as scratch. Every element is copied once: Theta(n).
void merge(int a[], int lo, int mid, int hi, int aux[]) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];    // copy into scratch
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)              a[k] = aux[j++];    // left run exhausted
        else if (j > hi)          a[k] = aux[i++];    // right run exhausted
        else if (aux[j] < aux[i]) a[k] = aux[j++];    // take the smaller front
        else                      a[k] = aux[i++];    // ties take left: STABLE
    }
}
```

`aux` is allocated **once**, by the caller, and shared by every merge.

--

## Ties go left: stable

<div><img src="../../topics/figures/sorting/so-merge-branches.svg" style="height:390px" alt="
   right exhausted: L = 9 82, R = 10: emit 9, 10, then the rest of L
   a tie goes left: L = 2₁ 4, R = 2₂ 5: 2₂ &lt; 2₁ is false, so 2₁ is emitted first"></div>

On a tie `aux[j] < aux[i]` is **false**: the left key goes first.

--

## Inversions

An **inversion** is a pair of positions $i < j$ with $a[i] > a[j]$: a pair out of order.

`2 5 8 1 3 9` has **5**: (2,1), (5,1), (5,3), (8,1), (8,3).

When the merge takes the **right** front `aux[j]`, how many inversions has it just resolved?

<details class="answer"><summary>Answer:</summary>

`mid - i + 1`: every key still waiting in the left run is larger than `aux[j]` and sits before it.

</details>

--

## Mergesort, in C++

```cpp
// Top-down mergesort: sort each half, then merge. T(n) = 2T(n/2) + Theta(n).
void mergesort(int a[], int lo, int hi, int aux[]) {
    if (hi <= lo) return;                 // base case: 0 or 1 element
    int mid = lo + (hi - lo) / 2;
    mergesort(a, lo, mid, aux);           // sort the left half
    mergesort(a, mid + 1, hi, aux);       // sort the right half
    merge(a, lo, mid, hi, aux);           // combine
}
```

The code **is** the recurrence: two half-size calls, then a linear merge.

--

## The calls

<div><img src="../../topics/figures/sorting/so-mergesort-run.svg" style="height:400px" alt="
   38 27 43 3 9 82 10 splits (0,3) | (4,6), down to single keys
   merges back: 27 38 · 3 43 · 9 82 · then 3 27 38 43 and 9 10 82
   last merge: 3 9 10 27 38 43 82"></div>

$\lceil \log\_2 n \rceil$ levels, $\Theta(n)$ each.

--

## Demo: mergesort

<div class="algo-viz" data-algo="mergesort-lecture" data-config='{"width":900}'>
<pre class="viz-fallback">
   bottom-up mergesort: merge runs of width 1, then 2, 4, ...
   each merge copies both runs into the aux row, then writes back the smaller front
   38 27 43 3 9 82 10 -> 3 9 10 27 38 43 82
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The second row is `aux`. The demo merges **bottom-up**: runs of width 1, 2, 4, …; the same merges as the calls, without the recursion.</small>

--

## Cost and properties

$$T(n) = 2T(n/2) + \Theta(n) = \Theta(n \log n)$$

| | mergesort |
| --- | --- |
| time | $\Theta(n \log n)$ on **every** input |
| extra memory | $\Theta(n)$ for `aux`, plus $\Theta(\log n)$ stack |
| stable | **yes**: ties go left |
| in place | **no** |

--

## When to choose mergesort

- a **guaranteed** $n \log n$, whatever the input
- **stability**: sort by date, then stably by name, and each name's records stay in date order
- **linked lists** and **external** data: the merge reads each run front to back, so it needs no random access

Python's `sorted` and Java's sort for objects are mergesort hybrids (Timsort).

