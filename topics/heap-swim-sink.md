<!--
  TOPIC · Insert and delete-max: swim and sink.
  Teaches: insert by appending and swimming up; delete-max by swapping with the last element and sinking down; the code, worked examples and your-turn exercises; the whole API.
  Needs:   priority queues.
  Demos:   heap-insert, heap-ops (slide specs)
  Program: none
  Budget:  ~24 min, 12 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 4, 5.
-->

### Insert and delete-max: swim and sink

<small>(~24 min)</small>

--

## insert: add, then swim

To insert a key:

1. put it at the **end** (`a[++n]`): keeps the tree **complete**
2. it may exceed its parent → **swim** it up: while it is bigger than its parent, **swap**

Only the new node's **path to the root** can be out of order, so fixing that one path suffices.

--

## swim: the code

```text
void swim(MaxHeap& h, int k) {
    while (k > 1 && h.a[k/2] < h.a[k]) {
        swap(h.a[k/2], h.a[k]);   // parent < child: lift
        k = k / 2;                // move up to the parent
    }
}
void insert(MaxHeap& h, int x) {
    h.a[++h.n] = x;               // append (stays complete)
    swim(h, h.n);                 // restore heap order
}
```

--

## swim: worked example

Insert **95**: it lands at index 7: the **right child of 70**: then beats 70, then beats 90:

```text
  insert 95:           append at a[7]:        swim ×2:
      [90]                 [90]                   [95]
     /    \               /    \                 /    \
   [80]  [70]     →     [80]  [70]      →     [80]  [90]
   /  \   /             /  \   /  \           /  \   /  \
 [30][60][50]        [30][60][50][95]      [30][60][50][70]
```

```text
  a: 90 80 70 30 60 50      +95 → swap@3 → swap@1
  a: 95 80 90 30 60 50 70   (two compares, two swaps)
```

--

## swim: your turn

Into the heap `a = [ 90 80 70 30 60 50 ]`, **insert 85**. Where does it land?

<details class="answer"><summary>Answer:</summary>

append at index 7 (child of 70) → 85 beats 70, swap up to index 3 → 85 loses to parent 90, STOP. Final: [ 90 80 85 30 60 50 70 ]; 85 sits at index 3, having swum one level.

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

<small>The **array** (top) and the tree (bottom) are the same data: no pointers. This is the your-turn heap: **Insert 85** and check your prediction, then **95** (all the way up); each compare is a parent–child check, each swap lifts the key one level.</small>

--

## delMax: swap to the end, then sink

The max is `a[1]`. To remove it:

1. **swap** `a[1]` with the **last** element `a[n]`, then **shrink** (`n--`): the old max is parked past the end
2. the new root may be too small → **sink** it: swap with its **larger** child while it is smaller

Again only **one path**: root to a leaf: can be wrong.

--

## sink: the code

```text
void sink(MaxHeap& h, int k) {
    while (2*k <= h.n) {
        int j = 2*k;                       // left child
        if (j < h.n && h.a[j] < h.a[j+1])
            j++;                           // pick the larger child
        if (h.a[k] >= h.a[j]) break;       // already ≥ both children
        swap(h.a[k], h.a[j]);
        k = j;                             // move down
    }
}
int delMax(MaxHeap& h) {
    int top = h.a[1];
    swap(h.a[1], h.a[h.n--]);              // max to the end, shrink
    sink(h, 1);                            // restore heap order
    return top;
}
```

--

## sink: worked example

`delMax` on `[ 95 90 70 80 60 50 ]`: **50** (the last leaf) goes on top, then sinks:

```text
  delMax:             root↔last, pop:       sink 50 ×2:
      [95]                 [50]                  [90]
     /    \               /    \                /    \
   [90]  [70]     →     [90]  [70]     →     [80]  [70]
   /  \   /             /  \                 /  \
 [80][60][50]         [80][60]             [50][60]
```

**95** is returned. 50 loses to the **larger** child twice: first 90 (not 70), then 80 (not 60); and settles as a leaf.

--

## sink: your turn

Insert left us `a = [ 95 80 90 30 60 50 70 ]` (after inserting 95). Now run **delMax**. What comes back, and what remains?

<details class="answer"><summary>Answer:</summary>

swap 95 ↔ 70 (last), shrink → [ 70 80 90 30 60 50 ] → sink: 70 loses to the larger child 90, swap → 70 at index 3 beats its child 50, STOP. Returns 95; heap = [ 90 80 70 30 60 50 ]: exactly where insert started: delMax undid the insert.

</details>

--

## sink vs swim: the whole API

|                  | swim (insert) | sink (delMax)                |
| ---------------- | ------------- | ---------------------------- |
| starts at        | the last leaf | the **root**                 |
| moves            | **up**        | **down**                     |
| compares against | **1 parent**  | **2 children** (pick larger) |
| cost             | O(log n)      | O(log n)                     |

**Everything from here on is these two primitives, re-wrapped.**

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

<small>The full PQ: **Insert** (swim) and **Delete Max** (sink) interleaved on one heap. Watch sink compare **both children** and follow the **larger** one: and watch the counters stay under the height either way.</small>

