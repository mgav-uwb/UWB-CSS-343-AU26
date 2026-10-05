<!--
  TOPIC · Memory: counting bytes, and space as a function of N.
  Teaches: sizeof for primitives and structs; alignment and padding; field
           order; stack vs heap; per-node overhead; array vs linked list;
           order of growth for space; auxiliary space; mergesort's buffer
           and grid BFS's per-cell table; time and space as separate budgets;
           what a std::vector costs (header, capacity doubling); recursion
           depth as stack space. (Locality and layout: the machine-models topic.)
  Needs:   the cpp-owning-memory topic (new/delete); the growth-classes topic.
  Demos:   legacy canvas demos mergesort-memory and bfs-memory
           (topics/viz/; the lecture page loads viz.css, mergesort.js, bfs.js
           and calls initVizMergesort() and initVizBfs()).
  Programs: topics/code/memory/sizeof_demo.cpp, vector_locality.cpp,
           mergesort.cpp, bfs_grid.cpp
  Budget:  ~31 min, 23 slides.
-->

### Memory: how many bytes?

<small>(~31 min)</small>

--

## The question

A data structure occupies memory. **How much?**

Start with the pieces. **How many bytes is an `int`? A pointer? A `double`?**

--

## `sizeof`: the primitive types

On a typical 64-bit machine:

| type | bytes | | type | bytes |
| --- | :-: | --- | --- | :-: |
| `char` | 1 | | `long` | 8 |
| `bool` | 1 | | `double` | 8 |
| `int` | 4 | | **pointer** | **8** |

`sizeof(x)` is the size in bytes, known at compile time.

--

## Predict: how big is this node?

```cpp
struct Node {
    int   data;
    Node* next;
};
```

int is 4, a pointer is 8. **Vote: `sizeof(Node)` is 12 or 16?**

--

## Alignment and padding

`sizeof(Node)` is **16**, not 12:

```text
offset  0        4        8                16
        [ data:4 ][ pad:4  ][ next:8          ]
```

An 8-byte pointer must start at a multiple of 8, so the compiler inserts **4 bytes of padding** after `data`.

--

## Field order changes the size

```cpp
struct A { char a; int b; char c; };
struct B { int b; char a; char c; };
```

**Vote: `sizeof(A)`? `sizeof(B)`?**

<details class="answer"><summary>Answer:</summary>

`A` is **12**: 3 bytes of padding after `a` to align `b`, and 3 after `c` to round the size up to 4. `B` is **8**: the two chars share the tail.

Order fields from **largest to smallest** alignment to minimize padding.

</details>

--

## Live: `sizeof_demo.cpp`

```text
PRIMITIVES (bytes)
  char   1      bool   1
  int    4      long   8
  double 8      ptr    8
STRUCTS: int(4) + ptr(8) = 12 logically, sizeof(Node) = 16
HEAP BYTES FOR N ELEMENTS (measured)
       N     array B      list B    ratio
    1000        4000       16000     4.0x
   16000       64000      256000     4.0x
```

The bottom table is **measured**: every heap byte is counted as it is allocated.

<small>Code: <a href="../../topics/code/memory/sizeof_demo.cpp">sizeof_demo.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Stack and heap

```cpp
Node  a;              // STACK: freed at scope end
Node* p = new Node;   // HEAP: lives until delete p
```

- **stack**: local variables; fast; released when the function returns
- **heap**: `new` and `delete`; lives until freed; where dynamic structures grow

--

## The price of a link

A list node holds **4 bytes of data** and costs **16**:

- 4 bytes of data
- 4 bytes of padding + 8 bytes of pointer = **12 bytes of overhead**

Choosing a structure sets a memory price as well as a time price.

--

## N elements: array or list?

| structure | bytes for N ints | order of growth |
| --- | :-: | :-: |
| array | 4N | N |
| linked list | 16N | N |

<img src="../../topics/figures/memory-array-vs-list.svg" style="width:44%">

Same **order of growth**, a **4× constant**.

--

## `std::vector`: a header and a heap block

```cpp
vector<int> v;     // the header: 24 bytes, wherever v lives
v.push_back(7);    // the data: a separate block on the heap
```

`sizeof(vector<int>)` is **24**: three 8-byte fields.

- a pointer to the heap block
- the **size**: elements in use
- the **capacity**: elements the block can hold

`sizeof` never counts the heap block: it reports the header only.

--

## Capacity doubles

`push_back` 1000 times and print the capacity each time it changes:

```text
1  2  4  8  16  32  64  128  256  512  1024
```

- when size reaches capacity, a **new block twice as large** is allocated and **every element is copied**
- at N = 1000 the block holds **1024**: up to about half the block can sit unused
- total copies for all the regrowths: 1 + 2 + … + 512 = **1023**, fewer than **2N**

--

## Space has an order of growth

| holds | memory | order of growth |
| --- | --- | :-: |
| a few variables | fixed | 1 |
| an array or list of N | proportional to N | N |
| an N × N table | proportional to N² | N² |

**Space is analyzed exactly like time**: count, then keep the order of growth.

--

## Auxiliary space

**Auxiliary space** is what an algorithm uses **beyond its input**:

```cpp
long sum(const vector<int>& a) {
    long s = 0;               // one accumulator
    for (int x : a) s += x;   // nothing allocated
    return s;
}
```

Order of growth **1** auxiliary space. Brute-force 3-sum: time **N³**, auxiliary space **1**, just loop counters.

--

## Recursion costs stack space

Each call pushes a **frame** (arguments, locals, return address); space counts frames **alive at once**.

```cpp
long fact(long n) { return n <= 1 ? 1 : n * fact(n - 1); }
```

| function | deepest recursion | auxiliary space |
| --- | :-: | :-: |
| `fact(n)` | n frames | Θ(n) |
| binary search, recursive | ⌊log₂ N⌋ + 1 frames | Θ(log₂ N) |
| mergesort | about log₂ N frames | Θ(log₂ N), plus the Θ(N) buffer |

--

## Mergesort: the merge needs room

**Problem:** sort N items. **Approach:** divide and conquer.

1. split the array into two halves
2. sort each half recursively
3. **merge** the two sorted halves

Splitting is free; **merging** needs a scratch buffer, and that buffer is the memory.

<small>Code: <a href="../../topics/code/memory/mergesort.cpp">mergesort.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Mergesort: the code

```cpp [2]
void merge(vector<int>& a, int lo, int mid, int hi) {
    vector<int> tmp(hi - lo + 1);              // scratch buffer
    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi)
        tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi)  tmp[k++] = a[j++];
    for (k = 0; k < (int)tmp.size(); k++) a[lo + k] = tmp[k];
}
void mergesort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergesort(a, lo, mid);  mergesort(a, mid + 1, hi);
    merge(a, lo, mid, hi);
}
```

The top merge's buffer holds N ints: **4N bytes**, order **N**. The recursion adds only **log₂ N** stack frames.

--

## Mergesort: watch the memory

<div class="legacy-viz" data-viz="mergesort-memory">
<div class="viz-panels">
<div class="panel"><div class="panel-label">progress: sorting the array</div><canvas class="viz-progress"></canvas></div>
<div class="panel"><div class="panel-label">memory: auxiliary bytes</div><canvas class="viz-memory"></canvas></div>
</div>
<div class="viz-controls">
<button data-act="play">▶ Play</button>
<button data-act="step">Step</button>
<button data-act="reset">Reset</button>
<span class="viz-status"></span>
</div>
</div>

--

## Grid BFS: memory per cell

**Problem:** a shortest path through an **n × n** grid maze. **Approach:** breadth-first search:

1. a **queue** holds the frontier
2. pop a cell; push each unvisited neighbor, recording **where it came from**
3. stop at the goal; walk the recorded predecessors back to the start

The memory is the table of predecessors, one per cell.

<small>Code: <a href="../../topics/code/memory/bfs_grid.cpp">bfs_grid.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## What each cell stores

| per cell | bytes | total | answers |
| --- | :-: | :-: | --- |
| visited flag (`char`) | 1 | n² | reachable? |
| distance (`int`) | 4 | 4n² | how many steps? |
| predecessor (`int`) | 4 | 4n² | which path? |
| direction came from (`char`) | 1 | n² | which path, 4× cheaper |

All order **n²**: the **constant tracks what you store**.

--

## Grid BFS: watch the memory

<div class="legacy-viz" data-viz="bfs-memory">
<div class="viz-panels">
<div class="panel"><div class="panel-label">progress: BFS through a maze (start to goal)</div><canvas class="viz-progress"></canvas></div>
<div class="panel"><div class="panel-label">memory: visited array (n²) vs queue</div><canvas class="viz-memory"></canvas></div>
</div>
<div class="viz-controls">
<button data-act="play">▶ Play</button>
<button data-act="step">Step</button>
<button data-act="reset">Reset</button>
<span class="viz-status"></span>
</div>
</div>

--

## The maze decides the reach, not the table

`bfs_grid.cpp`, open grid against a one-cell-wide L-shaped corridor:

```text
layout       n    reached R   path len   peak Q   fixed 4n^2 B
OPEN       100         9998        198      100          40000
L-PATH     100          198        198        1          40000
OPEN       800       639998       1598      800        2560000
L-PATH     800         1598       1598        1        2560000
```

The **fixed table is identical**; the cells **reached** follow the geometry.

<small>Code: <a href="../../topics/code/memory/bfs_grid.cpp">bfs_grid.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Time and space are separate budgets

| algorithm | time | auxiliary space |
| --- | :-: | :-: |
| array sum | N | 1 |
| brute-force 3-sum | N³ | **1** |
| mergesort | N log₂ N | N |
| BFS on an n × n grid | n² | n² |

Often you can **spend memory to save time**: a hash table for fast lookup, a table of subproblem answers in dynamic programming.

