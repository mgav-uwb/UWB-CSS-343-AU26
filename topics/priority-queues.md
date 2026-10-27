<!--
  TOPIC · Priority queues and the binary heap.
  Teaches: the priority-queue ADT (as a C++ interface); why sorted and unsorted arrays and balanced trees are not the right fit; heap order and completeness; a complete tree in an array with index arithmetic; the MaxHeap class; heap is not a BST; height floor(log2 n); what the invariants imply (subtrees are heaps, the min at a leaf, leaves are the back half, paths sorted, levels not).
  Needs:   tree basics.
  Demos:   none; figures hp-conditions, hp-tree-array, hp-array-links, hp-subtrees, hp-leaves, hp-paths (tools/gen-heap-figures.mjs)
  Program: none
  Budget:  ~30 min, 17 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 1, 2, 3; figures and class-style code 2026-10-21.
-->

### Priority queues and the binary heap

> Python's heapq module and C++'s std::priority_queue are both binary heaps stored in an array.

<small>Python and C++ standard library documentation</small>

--

## Beyond FIFO

| ADT                | serves next        | rule       |
| ------------------ | ------------------ | ---------- |
| stack              | newest             | LIFO       |
| queue              | oldest             | FIFO       |
| **priority queue** | **most important** | by **key** |

- an OS scheduler runs the **highest-priority** ready thread
- an ER treats the **most critical** patient first
- an event simulator processes the **earliest** event next

--

## The priority-queue ADT

```cpp
class MaxPQ {                    // a max-priority-queue of int keys
public:
    void insert(int key);        // add a key
    int  max() const;            // the largest key
    int  delMax();               // remove and return the largest key
    bool isEmpty() const;
    int  size() const;
};
```

A **min**-PQ is the mirror image: `min()`, `delMin()`. We build the **max** version; every comparison flips for the min version.

--

## Why the obvious choices are too slow

| implementation       | insert       | delMax       |
| -------------------- | ------------ | ------------ |
| unordered array/list | $\Theta(1)$ | $\boldsymbol{\Theta(n)}$ |
| ordered array/list   | $\boldsymbol{\Theta(n)}$ | $\Theta(1)$ |
| **binary heap**      | $\boldsymbol{\Theta(\log n)}$ | $\boldsymbol{\Theta(\log n)}$ |

Each simple option makes **one** operation cheap by making the other **linear**. We want **both** fast.

--

## Why not an AVL tree?

An AVL tree already works as a PQ: insert and delete-max in $\Theta(\log n)$, the max at the rightmost node. Why a new structure?

|                   | AVL tree                  | binary heap     |
| ----------------- | ------------------------- | --------------- |
| memory            | node + 2 pointers per key | **plain array** |
| build from $n$ keys | $\Theta(n \log n)$ | $\boldsymbol{\Theta(n)}$ |
| code              | rotations, balancing      | **~20 lines**   |

A heap keeps **less** order than a search tree, so it costs less: no pointers, no rotations, a linear-time build.

--

## The idea: partial order

A sorted list has **too much** order (expensive to maintain). An unsorted list has **none** (expensive to search).

A heap keeps a **partial** order, **each parent** $\boldsymbol{\ge}$ **its children**, which is:

- **strong enough**: the maximum is always at the top
- **loose enough**: after a change, only **one root-to-leaf path** needs repair

--

## Two conditions

A **binary (max-)heap** is a binary tree that is both:

1. **complete**: every level full except possibly the last, which is filled **left to right**
2. **heap-ordered**: every node's key is $\boldsymbol{\ge}$ **both its children**

<div><img src="../../topics/figures/heaps/hp-conditions.svg" style="height:228px" alt="
       90                  90                  90
      /  \                /  \                /  \
    80    70            80    70            80    70
   /  \   /            /  \     \          /  \   /
  30  60 50           30  60  _  50       30  85 50
   a heap            not complete:       not heap-ordered:
                     a gap               85 &gt; 80"></div>

--

## No pointers: use an array

A **complete** tree has no gaps, so number the nodes **level by level**, $1$ to $n$, and store them in `a[1..n]`:

<div><img src="../../topics/figures/heaps/hp-tree-array.svg" style="height:282px" alt="
            90 (1)
           /      \
       80 (2)     70 (3)
       /   \       /
   30 (4) 60 (5) 50 (6)
   a: [ _ | 90 | 80 | 70 | 30 | 60 | 50 ]
        0    1    2    3    4    5    6"></div>

```cpp
int parent(int k) { return k / 2; }      // integer division
int left(int k)   { return 2 * k; }
int right(int k)  { return 2 * k + 1; }
```

--

## Reading the array as a tree

<div><img src="../../topics/figures/heaps/hp-array-links.svg" style="height:320px" alt="
   a: [ _ | 90 | 80 | 70 | 30 | 60 | 50 ]
        0    1    2    3    4    5    6
   k = 2 (80):  children a[4] = 30, a[5] = 60;  parent a[1] = 90
   a[1] = 90: children a[2], a[3];  a[3] = 70: child a[6]"></div>

Node $k = 2$ (key 80): children $2k = 4$ and $2k + 1 = 5$ (30, 60), parent $\lfloor k/2 \rfloor = 1$ (90). Every move to a child or a parent is a **multiply or divide by 2**.

--

## Quick check: index arithmetic

For a heap in `a[1..15]` (1-indexed):

- the children of `a[6]` are at indices **?**
- the parent of `a[11]` is at index **?**
- is `a[8]` a leaf? ($n = 15$)

<details class="answer"><summary>Answer:</summary>

children of 6: **12, 13** · parent of 11: **5** · a[8] leaf? its children would be $16, 17 > 15$ → **yes, a leaf**.

</details>

--

## The heap type

```cpp
class MaxHeap {
public:
    bool isEmpty() const { return n == 0; }
    int  size()    const { return n; }
    int  max()     const { return a[1]; }   // the root: Theta(1)
    void insert(int key);                   // append, then swim
    int  delMax();                          // swap with the last, then sink
private:
    int a[CAP + 1];                         // a[1..n]; a[0] unused
    int n = 0;
};
```

<small>`a[0]` is unused, so the root sits at index 1 and `k / 2`, `2 * k`, `2 * k + 1` need no correction. A classic variant stores the size `n` in `a[0]`.</small>

--

## Heap ≠ BST

Same picture (a binary tree), **different invariant**:

|       | BST                 | heap                |
| ----- | ------------------- | ------------------- |
| order | $\text{left} < \text{node} < \text{right}$ | $\text{parent} \ge \text{children}$ |
| finds | any key, in order   | **only the max**    |
| shape | can be unbalanced   | always **complete** |

A heap gives up "find any key" to make "find the max" and "stay balanced" trivial.

--

## Height of a heap

A complete binary tree on $n$ nodes has height

$$h = \lfloor \log_2 n \rfloor$$

Every level except the last is full, so the levels hold $1, 2, 4, \dots$ nodes. Any operation that walks one root-to-leaf path costs $\boldsymbol{O(\log n)}$, guaranteed.

--

## Every subtree is a heap

Both conditions are **local** (parent against child, level by level), so both hold in every subtree:

<div><img src="../../topics/figures/heaps/hp-subtrees.svg" style="height:255px" alt="
            90
           /  \
        (80)  (70)      each outlined subtree
        /  \   /        is itself a heap
      30  60  50"></div>

**A heap is heaps all the way down**: every proof about heaps uses this recursion.

--

## So where's the min?

- down every path keys only **shrink**, so the **root is the global max** (transitivity)
- a node with a child is $\ge$ that child, so a non-leaf **cannot** be the min
- so the **min is at a leaf**, but no rule says **which** leaf: finding it is a $\boldsymbol{\Theta(n)}$ scan

--

## Leaves are the back half of the array

Node $k$ has a child exactly when $2k \le n$:

<div><img src="../../topics/figures/heaps/hp-leaves.svg" style="height:280px" alt="
   internal nodes:  k = 1 .. n/2
   leaves:          k = n/2 + 1 .. n
   a: [ _ | 90  80  70 | 30  60  50 ]     n = 6
           internal      leaves"></div>

**At least half** of any heap is leaves.

--

## Paths sorted, levels not

<div><img src="../../topics/figures/heaps/hp-paths.svg" style="height:300px" alt="
          90
         /  \
       30    80        siblings: no rule
      /  \   /
    10   20 75         90 ≥ 80 ≥ 75 (a path)"></div>

- every root-to-leaf **path** is non-increasing
- but $\boldsymbol{75 > 30}$, a level up: nothing holds **across** subtrees; only **ancestor–descendant** pairs are ordered

