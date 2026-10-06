<!--
  TOPIC · Building a heap in linear time.
  Teaches: heapify by sinking bottom-up; why it is correct; why it is Θ(n): sink pays the height, the sum telescopes, fewer than n swaps; two ways to build; a linear build does not contradict the sorting bound.
  Needs:   heap swim and sink, summations.
  Demos:   heap-heapify (slide spec)
  Program: none
  Budget:  ~26 min, 14 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 6, 7.
-->

### Building a heap in linear time

> Six months after Williams published heapsort, Robert Floyd built the heap bottom up, in linear time.

<small>R. W. Floyd, “Algorithm 245: Treesort 3,” CACM 7(12), 1964</small>

--

## Build from n given keys

Given `n` keys already in an array, make it a heap. Obvious way: **insert each one**: i.e. swim `a[i]` for `i = 1..n`:

```text
   for i = 1..n: swim(i)          // n inserts
```

- worst case: keys arrive **ascending**: every key swims **all the way to the root**
- cost: sum of the depths ≈ `n·log n` → **Θ(n log n)**

Can we do better with all the data **up front**?

--

## Heapify: sink bottom-up

Put all `n` keys in the array as-is (a complete tree, wrong values everywhere), then **sink every internal node, last to first**:

```text
   for k = n/2 down to 1:
       sink(k);
```

- `a[n/2+1 .. n]` are **leaves**: already heaps, skipped
- when `sink(k)` runs, everything **below k is already fixed**

--

## Heapify: a worked pass

```text
  i:      1  2  3  4  5  6  7  8  9
  a:    [ 30 60 50 90 85 40 70 45 20 ]     raw, n = 9

  sink 4: 90 ≥ 45, 20                  no swap
  sink 3: 50 < max(40, 70) → swap 70
        [ 30 60 70 90 85 40 50 45 20 ]
  sink 2: 60 < max(90, 85) → swap 90 ; 60 ≥ 45, 20
        [ 30 90 70 60 85 40 50 45 20 ]
  sink 1: 30↔90, 30↔85, 30 is a leaf
        [ 90 85 70 60 30 40 50 45 20 ]   ✓ a heap
```

Start at `k = n/2 = 4`; the root sinks **last**, when both its subtrees already work.

--

## Demo: heapify

<div class="algo-viz" data-algo="heap-heapify">
<pre class="viz-fallback">
   Build: load an arbitrary array (a complete tree, not a heap)
   press Heapify: sink node n/2, n/2−1, …, 1  (bottom-up)
   each sink swaps down with the larger child
   → a valid max-heap.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Bottom-up **heapify**: sink each internal node from `n/2` down to `1`. Watch the swaps cluster **near the bottom**: and watch the swap counter stay **under n**.</small>

--

## What one sink guarantees

**Lemma.** If both subtrees under `k` are heaps, `sink(k)` makes the whole subtree at `k` a heap.

```text
    before sink(k):                after:
         [ x ]  ← only x may           a heap,
        /     \    be misplaced        rooted at k
    (heap)   (heap)
```

**Why:** the lifted **larger child** beats `x`, beats its sibling, and beats its own old subtree: top fixed; the same one-bad-node picture recurs a level down, until `x` dominates or is a leaf.

--

## Heapify is correct

**Invariant:** when the loop reaches `k`, every node **after** `k` roots a valid heap.

- **start** `k = n/2`: all nodes after are **leaves**: one-node heaps ✓
- **step:** children `2k, 2k+1` come after `k` → heaps → the **lemma** makes `k` a heap root too
- **end:** after `k = 1`, node 1 roots a heap: **the whole array** ∎

--

## Swim pays depth; sink, height

| depth | nodes | swim = depth | sink = height |
| ----- | ----- | ------------ | ------------- |
| 0     | 1     | 0            | **h**         |
| 1     | 2     | 1            | h − 1         |
| …     | …     | …            | …             |
| h     | ~n/2  | **h**        | **0**         |

- n inserts pay the **swim** column: half the nodes pay ≈ h → **Θ(n log n)**
- heapify pays the **sink** column: half the nodes pay **0** → … let's count.

--

## Counting every swap

**Full** tree, `n = 2^(h+1) − 1`. A sink from height `j` costs ≤ `j` swaps: total, level by level:

```text
   depth d   nodes    sink ≤ h−d   contributes
   0         1        h            h·1
   1         2        h−1          (h−1)·2
   2         4        h−2          (h−2)·4
   ⋮         ⋮        ⋮            ⋮
   h−1       2^(h−1)  1            1·2^(h−1)
   h         2^h      0            0
```

<div style="font-size:0.8em">

$$S = h \cdot 1 + (h-1) \cdot 2 + (h-2) \cdot 4 + \dots + 1 \cdot 2^{h-1}$$

</div>

--

## The trick: double it and align

Doubling shifts every term **one column right** (each `2^d` becomes `2^(d+1)`):

```text
   S  =  h·1 + (h−1)·2 + (h−2)·4 + ⋯ + 1·2^(h−1)
   2S =        h·2     + (h−1)·4 + ⋯ + 2·2^(h−1) + 1·2^h
```

Equal powers of two now share a **column**: and in every column, the `2S` coefficient is exactly **one more** than the `S` coefficient below… so subtract!

--

## Subtract: the sum telescopes

Column-by-column, `2S − S` leaves **one copy of each power of two**: plus the unmatched ends:

```text
   2S − S  =  −h·1  +  1·2 + 1·4 + ⋯ + 1·2^(h−1) + 1·2^h

   S  =  ( 2 + 4 + ⋯ + 2^h )  −  h        [2S − S = S]
      =  ( 2^(h+1) − 2 )  −  h            [geometric sum]
```

$$S = 2^{h+1} - h - 2$$

--

## Fewer than n swaps

The **full** tree has `n = 2^(h+1) − 1` nodes, so `2^(h+1) = n + 1`:

$$S = n - h - 1 < n$$

**Building a heap costs fewer swaps than there are nodes**: and for *any* complete tree, `2^h ≤ n` gives `S ≤ 2n`. **heapify ∈ Θ(n).**

--

## Two ways to build

| method              | pays per node       | cost           |
| ------------------- | ------------------- | -------------- |
| repeated **insert** | its **depth** (swim)  | **Θ(n log n)** |
| **heapify**         | its **height** (sink) | **Θ(n)**       |

Same result. Heapify wins whenever the data is **all there up front**; a live PQ (keys arriving over time) still inserts one by one.

--

## Θ(n) build vs the sorting bound

Comparison sorting needs **Ω(n log n)** comparisons (the sorting lower bound). Did we just beat it? **No**: a heap is **not sorted**:

- heap order holds only **along paths**: far less information than sorted order
- extracting the sorted order still costs `n ×` Θ(log n): that's **heapsort**, next

**Θ(n) buys partial order; full order still costs n log n.**

