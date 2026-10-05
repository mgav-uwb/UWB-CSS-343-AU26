<!--
  TOPIC · Priority queues and the binary heap.
  Teaches: the priority-queue ADT; why sorted and unsorted arrays and balanced trees are not the right fit; heap order and completeness; a complete tree in an array with index arithmetic; heap is not a BST; height floor(log2 n); what the invariants imply (subtrees are heaps, leaves are the back half, paths sorted, levels not).
  Needs:   tree basics.
  Demos:   none
  Program: none
  Budget:  ~30 min, 17 slides.
  Ported from Summer 2026 L06-heaps-pq.md, parts 1, 2, 3.
-->

### Priority queues and the binary heap

<small>(~30 min)</small>

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

A **max-priority-queue** of comparable keys supports:

```text
   insert(x)      add a key
   max()          return the largest key
   delMax()       remove and return the largest key
   isEmpty(), size()
```

(A **min**-PQ is the mirror image: `delMin`. We'll build the **max** version; everything flips symmetrically.)

--

## Why the obvious choices are too slow

| implementation       | insert       | delMax       |
| -------------------- | ------------ | ------------ |
| unordered array/list | Θ(1)         | **Θ(n)**     |
| ordered array/list   | **Θ(n)**     | Θ(1)         |
| **binary heap**      | **Θ(log n)** | **Θ(log n)** |

Each simple option makes **one** operation cheap by making the other **linear**. We want _both_ fast.

--

## Isn't an AVL tree already a PQ?

It is! Insert and delete-max, both Θ(log n): max = walk right. So why a new structure?

|                   | AVL tree                  | binary heap     |
| ----------------- | ------------------------- | --------------- |
| memory            | node + 2 pointers per key | **plain array** |
| build from n keys | Θ(n log n)                | **Θ(n)**        |
| code              | rotations, balancing      | **~20 lines**   |

The heap is not the *only* PQ: it's the **cheapest** one: it **does less, so it costs less**.

--

## The idea: partial order

A sorted list is **too** ordered (expensive to maintain). An unsorted list has **no** order (expensive to search).

A heap keeps a **partial** order: **each parent ≥ its children**: which is:

- **strong enough**: the maximum is always at the top
- **loose enough**: restoring it after a change costs only **one root-to-leaf path**

--

## Two conditions

A **binary (max-)heap** is a binary tree that is both:

1. **complete**: every level full except possibly the last, which is filled **left-to-right**
2. **heap-ordered**: every node's key is **≥ both its children**

```text
            [ 90 ]
           /      \
        [80]      [70]
        /  \      /
     [30] [60] [50]        ← complete + heap-ordered
```

--

## No pointers: use an array

A **complete** tree has no gaps, so number the nodes **level by level, 1..n** and store them in an array `a[1..n]`. The tree structure becomes **arithmetic**:

```text
   a: [ _ | 90 | 80 | 70 | 30 | 60 | 50 ]
        0    1    2    3    4    5    6
```

```text
   parent(k) = k / 2      (integer division)
   left(k)   = 2k
   right(k)  = 2k + 1
```

--

## Reading the array as a tree

```text
   a: [ _ | 90 | 80 | 70 | 30 | 60 | 50 ]
             1    2    3    4    5    6

   a[1]=90  children a[2]=80, a[3]=70
   a[2]=80  children a[4]=30, a[5]=60
   a[3]=70  child    a[6]=50
```

Every "go to my child / parent" is a **multiply / divide by 2**: no dereferencing.

--

## Quick check: index arithmetic

For a heap in `a[1..15]` (1-indexed):

- the children of `a[6]` are at indices **?**
- the parent of `a[11]` is at index **?**
- is `a[8]` a leaf? (n = 15)

<details class="answer"><summary>Answer:</summary>

children of 6: **12, 13** · parent of 11: **5** · a[8] leaf? its children would be 16, 17 > 15 → **yes, a leaf**.

</details>

--

## The heap type

```text
struct MaxHeap {
    int a[CAP + 1];   // a[0] unused
    int n = 0;        // current size
};

int  parent(int k) { return k / 2; }
int  left  (int k) { return 2 * k; }
int  right (int k) { return 2*k + 1; }
bool empty (MaxHeap& h) { return h.n == 0; }
int  max   (MaxHeap& h) { return h.a[1]; }  // Θ(1)
```

<small>Slot `a[0]` is wasted so the root sits at 1 and the `k/2`, `2k` arithmetic stays clean. Classic trick: since `a[0]` is free anyway, store the heap **size** there instead of a separate `n`.</small>

--

## Heap ≠ BST

Same picture (a binary tree), **different invariant**:

|       | BST                 | heap                |
| ----- | ------------------- | ------------------- |
| order | left < node < right | parent ≥ children   |
| finds | any key, in order   | **only the max**    |
| shape | can be unbalanced   | always **complete** |

A heap gives up "find any key" to make "find the max" and "stay balanced" trivial.

--

## Height of a heap

A complete binary tree on `n` nodes has height

$$h = \lfloor \log_2 n \rfloor$$

Every level except the last is full, so the levels double: `1, 2, 4, …` nodes. Any operation that touches a single root-to-leaf path costs **O(log n)**: guaranteed.

--

## Every subtree is a heap

Both conditions are **local**: parent-vs-child, level-by-level: so both survive restriction to a subtree:

```text
            [ 90 ]
           /      \
        (80)      (70)      ← each circled subtree
        /  \      /            is itself a valid heap
     [30] [60] [50]
```

**A heap is heaps all the way down**: the recursion every proof about heaps leans on.

--

## So where's the min?

- down every path keys only **shrink** → the **root is the global max** (transitivity)
- a node with a child is ≥ that child → a non-leaf **can't** be the min
- so the **min is at a leaf**: but *no rule says which one*: finding it is a **Θ(n)** scan

--

## Leaves are the back half of the array

Node `k` has a child iff `2k ≤ n`: so:

```text
   internal nodes:  k = 1 .. n/2
   leaves:          k = n/2 + 1 .. n

   a: [ _ | 90  80  70 | 30  60  50 ]     n = 6
           └ internal ┘ └─ leaves ─┘
```

**At least half** of any heap is leaves.

--

## Paths sorted, levels not

```text
        [ 90 ]
       /      \
    [30]      [80]        ← siblings: no rule
    /  \      /
 [10] [20] [75]           90 ≥ 80 ≥ 75 ✓ (a path)
```

- every root-to-leaf **path** is non-increasing
- but **75 > 30**, a level up!: nothing holds **across** subtrees; only **ancestor–descendant** pairs are ordered

