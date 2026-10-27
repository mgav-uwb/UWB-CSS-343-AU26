<!--
  TOPIC · Insert and delete-max: swim and sink.
  Teaches: insert by appending and swimming up; delete-max by swapping with the last element and sinking down; swim, sink and the two MaxHeap members in C++; worked examples and your-turn exercises; the whole API.
  Needs:   priority queues.
  Demos:   heap-insert, heap-ops (slide specs); figures hp-swim, hp-sink (tools/gen-heap-figures.mjs)
  Program: none
  Budget:  ~24 min, 12 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 4, 5; figures and class-style code 2026-10-21.
-->

### Insert and delete-max: swim and sink

> In an array heap the children of node k sit at 2k and 2k + 1, so the tree needs no pointers at all; Williams's 1964 heapsort already used this layout.

<small>J. W. J. Williams, “Algorithm 232: Heapsort,” CACM 7(6), 1964</small>

--

## insert: add, then swim

To insert a key:

1. put it at the **end** (`a[++n]`): the tree stays **complete**
2. it may exceed its parent, so **swim** it up: while it is bigger than its parent, **swap**

Only the new node's **path to the root** can be out of order, so repairing that one path is enough.

--

## swim: the code

```cpp
// a[1..n] is a heap, except that a[k] may be larger than its parent.
// Lift a[k] until its parent is at least as large.
void swim(int a[], int k) {
    while (k > 1 && a[k/2] < a[k]) {
        std::swap(a[k/2], a[k]);       // the larger key moves up
        k = k/2;                       // continue from the parent
    }
}

void MaxHeap::insert(int key) {
    a[++n] = key;                  // append: the tree stays complete
    swim(a, n);                    // repair the path to the root
}
```

--

## swim: worked example

Insert **95** into `[90 80 70 30 60 50]`: it lands at `a[7]`, the right child of 70, beats 70, then beats 90:

<div><img src="../../topics/figures/heaps/hp-swim.svg" style="height:252px" alt="
  append at a[7]:        95 &gt; 70, swap:        95 &gt; 90, swap:
      90                     90                     95
     /  \                   /  \                   /  \
   80    70               80    95               80    90
   / \   / \              / \   / \              / \   / \
  30 60 50 95            30 60 50 70            30 60 50 70
  a: 90 80 70 30 60 50 95   →   90 80 95 30 60 50 70   →   95 80 90 30 60 50 70"></div>

Two compares, two swaps. The left subtree (80, 30, 60) never moves.

--

## swim: your turn

Into the heap `a = [ 90 80 70 30 60 50 ]`, **insert 85**. Where does it land?

<details class="answer"><summary>Answer:</summary>

append at index 7 (child of 70) → 85 beats 70, swap up to index 3 → 85 loses to its parent 90, stop. Final: [ 90 80 85 30 60 50 70 ]; 85 sits at index 3, one level up.

</details>

--

## Demo: insert (swim)

<div class="algo-viz" data-algo="heap-insert">
<pre class="viz-fallback">
  a: [ 90 80 70 30 60 50 ]   (a max-heap)
  press Insert and type a key → append at the end → swim up:
     new key vs parent → swap while larger → stop when a
     parent dominates.
  the array view (top) and the tree view (bottom) update together.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The **array** (top) and the tree (bottom) are the same data. This is the your-turn heap: **Insert 85** and check your prediction, then **95** (all the way up); each compare is a parent–child check, each swap lifts the key one level.</small>

--

## delMax: swap to the end, then sink

The max is `a[1]`. To remove it:

1. **swap** `a[1]` with the **last** element `a[n]`, then **shrink** (`n--`): the old max is parked past the end
2. the new root may be too small, so **sink** it: swap with its **larger** child while it is smaller

Again only **one path**, root to a leaf, can be wrong.

--

## sink: the code

```cpp
// a[1..n] is a heap, except that a[k] may be smaller than a child.
// Push a[k] down, always under its larger child.
void sink(int a[], int k, int n) {
    while (2*k <= n) {                 // a[k] has a left child
        int j = 2*k;
        if (j < n && a[j] < a[j+1]) j++;   // j: the larger child
        if (a[k] >= a[j]) break;       // a[k] >= both children
        std::swap(a[k], a[j]);
        k = j;
    }
}

int MaxHeap::delMax() {
    int top = a[1];
    std::swap(a[1], a[n--]);       // the max to the end; shrink
    sink(a, 1, n);                 // repair the path from the root
    return top;
}
```

--

## sink: worked example

`delMax` on `[ 95 90 70 80 60 50 ]`: **50** (the last leaf) goes on top, then sinks:

<div><img src="../../topics/figures/heaps/hp-sink.svg" style="height:228px" alt="
  before:          root ↔ last, shrink:    50 &lt; 90, swap:     50 &lt; 80, swap:
      95                 50                     90                  90
     /  \               /  \                   /  \                /  \
   90    70           90    70               50    70            80    70
   / \   /            / \                    / \                 / \
  80 60 50           80 60     (95 parked)  80 60               50 60"></div>

**95** is returned. 50 loses to the **larger** child twice: first 90 (not 70), then 80 (not 60), and settles as a leaf.

--

## sink: your turn

After inserting 95 we had `a = [ 95 80 90 30 60 50 70 ]`. Now run **delMax**. What comes back, and what remains?

<details class="answer"><summary>Answer:</summary>

swap 95 ↔ 70 (last), shrink → [ 70 80 90 30 60 50 ] → sink: 70 loses to the larger child 90, swap → 70 at index 3 beats its child 50, stop. Returns 95; heap = [ 90 80 70 30 60 50 ], the heap insert started from: this delMax undid the insert.

</details>

--

## sink vs swim: the whole API

|                  | swim (insert) | sink (delMax)                |
| ---------------- | ------------- | ---------------------------- |
| starts at        | the last leaf | the **root**                 |
| moves            | **up**        | **down**                     |
| compares against | **1 parent**  | **2 children** (pick larger) |
| cost             | $O(\log n)$   | $O(\log n)$                  |

Heapify, heapsort, Huffman coding and Dijkstra's algorithm all call these two.

--

## Demo: the live PQ

<div class="algo-viz" data-algo="heap-ops">
<pre class="viz-fallback">
  press Insert (type a key): append → swim up.
  press Delete Max: a[1] is the answer;
   1) swap a[1] with the last element → shrink
   2) sink the new root: swap with the LARGER child
      while smaller → it settles at its level.
  the array view (top) and the tree view (bottom) update together.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The full PQ: **Insert** (swim) and **Delete Max** (sink) interleaved on one heap. Watch sink compare **both children** and follow the **larger** one, and watch the counters stay under the height either way.</small>

