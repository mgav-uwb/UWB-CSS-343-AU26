<!--
  TOPIC · B-trees and B+ trees.
  Teaches: nodes with many keys; one node per disk block; M-ary search trees and the order property; B-tree insertion by split and promote; B+ trees with values in linked leaves and range scans; choosing the order M; which balanced tree to use when.
  Needs:   2-3 trees, the computer systems primer (memory hierarchy).
  Demos:   btree-insert (slide spec), bplus (registry)
  Program: none
  Budget:  ~33 min, 21 slides.
  Ported from Summer 2026 L05-2-3-b-trees.md, parts 4, 5.
-->

### B-trees and B+ trees

> SQLite keeps every table and every index of a database as a B-tree in one file, in pages of 4,096 bytes by default.

<small>SQLite, Database File Format documentation</small>

--

## Generalize: let nodes hold *many* keys

A 2-3 node holds 1–2 keys. Why stop at 2? A **B-tree of order M** lets each node hold up to **M − 1 keys** (M children), and keeps every leaf at the same depth: same split-and-promote, splitting when a node reaches **M** keys.

2-3 trees are just **B-trees of order 3**.

--

## Why fat nodes? The disk.

Reading from disk/SSD isn't ≈1× RAM: it's **≈10⁵× slower**, and it comes a whole **block** (page) at a time. So the cost that matters is **number of node accesses = disk reads**, not comparisons.

```text
   register  ~1 ns
   RAM      ~100 ns
   SSD      ~100 µs      ← ~1000× RAM
   disk     ~10 ms       ← ~100000× RAM
```

--

## Make each node one disk block

Size a node to fill **one block** → each node holds **hundreds** of keys → the tree is only a few levels deep. Height = **log_M n**.

```text
   order M = 1000,  n = 1,000,000,000 keys
   height ≈ log_1000(10^9) = 3
```

A **billion** keys, any lookup in **≈3 disk reads**. That is why databases and filesystems use B-trees.

--

## An M-ary search tree

Generalize the search rule: a node holds a **sorted array** of up to `M−1` keys and `M` child pointers.

```text
   [ k1 | k2 | … | k_{M-1} ]
    /   |    |         \
  <k1  k1..k2  …       >k_{M-1}
```

One block read brings the whole key array into memory; a single in-memory binary search picks the child. **1 disk read per level.**

--

## The order property

A **B-tree of order M** requires:

- every node has at most **M** children (M−1 keys)
- every **non-root** node has at least **⌈M/2⌉** children
- the **root** has at least 2 children (unless it's a leaf)
- **all leaves at the same depth**

The min-children rule keeps nodes **at least half full** → guaranteed shallow.

--

## A B-tree node, in code

```cpp
struct BTreeNode {
    int   key[M];           // sorted keys (≤ M-1; one spare slot mid-overflow)
    BTreeNode* child[M+1];  // one more than keys
    int   n;                // current # of keys
    bool  leaf;
};

class BTree {
    BTreeNode* root;        // one node = one disk block
public:
    bool contains(int key) const;   // one block read per level
    void insert(int key);           // split full nodes upward
    void remove(int key);           // borrow or merge upward
};
```

Search: binary-search `key[]` in RAM, follow `child[i]`. **One node = one block = one disk read.**

--

## Why not a plain BST on disk?

A balanced **binary** tree over `10⁹` keys is ≈**30 levels** → up to **30 disk reads** per lookup (≈0.3 s on a spinning disk).

The same keys in an order-1000 B-tree: **3 reads** (≈30 ms). **10× fewer** block I/Os: the branching factor is doing all the work.

--

## Demo: B-tree insert

<div class="algo-viz" data-algo="btree-insert">
<pre class="viz-fallback">
   B-tree order 5 (each node holds up to 4 keys):

        [ 30 | 60 ]
        /    |     \
  [10|20] [40|50] [70|80|90]

   insert → find the leaf → if it reaches 5 keys, split,
   promoting the middle key up (same rule as 2-3, wider).
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Same **split-and-promote** as a 2-3 tree, just wider: a node splits when it fills (here at 5 keys). Watch the middle key rise and the fan-out stay high.</small>

--

## B-tree insert: worked (M = 5)

Insert **55** into a full leaf `[60|70|80|90]`:

```text
  temp [55|60|70|80|90]   (5 keys: overflow at M)
              ↓  split, promote the middle (70)
        parent gains 70
      [ … | 70 | … ]
       /          \
  [55|60]        [80|90]
```

Split at **M keys**, promote the **middle**, two half-full nodes remain: same rule, wider node.

--

## B+ trees: values in the leaves

Databases use a variant: the **B+ tree**:

- **internal nodes hold only keys** (routing), no values
- **all values live in the leaves**, which are **linked** in a list → fast **range scans** (`WHERE age BETWEEN 20 AND 40`)

Value-free internal nodes fan out even wider → even shorter trees.

--

## B+ tree structure

An index on `age`, order 3 (routers only: no records upstairs):

```text
  internal:          [ 30 | 60 ]
                    /      |      \
  leaves:   [10|20] → [30|45] → [60|90] → ∅
             ●  ●       ●  ●      ●  ●
             (each leaf key carries its own record)
```

- **internal** nodes: keys + child pointers, **no records**
- **leaves**: every key with its record, chained left → right
- a key can appear **twice**: as a router (30, 60) and in a leaf

--

## A B+ node, in code

```cpp
struct BPlusNode {
    bool       leaf;
    int        n;              // keys in use
    int        key[M];         // routers, or a leaf's keys
    BPlusNode* child[M + 1];   // router only: n + 1 children
    Record*    rec[M];         // leaf only: rec[i] is key[i]'s record
    BPlusNode* next;           // leaf only: the next leaf, or null
};
```

Routers carry **no records**; only leaves do, and `next` chains the leaves in key order.

--

## Routers: less goes left, equal or more goes right

At routers `[30 | 60]`, a key k goes to:

- **child 0** if k < 30
- **child 1** if 30 ≤ k < 60
- **child 2** if k ≥ 60

**Equal goes right.** A router is a copy of the first key of the subtree to its right, so a search for 30 passes router 30 and ends in the leaf `[30|45]`.

--

## Why a key appears twice

- **leaf split**: the new leaf's first key is **copied** up, and stays in its leaf
- **router split**: the middle router **moves** up: no new copy
- **delete**: a router can outlive its key, and still separates correctly

Insert 50 into that index, `[30|60]` (order 3):

```text
           [ 50 ]          50 copied up from [30|45|50],
          /      \         then moved up from [30|50|60]
      [30]        [60]
     /    \      /    \
 [10|20]→[30|45]→[50]→[60|90]
```

--

## Range scans for free

Because the leaves form a **sorted linked list**, a range query descends **once**, then **walks the chain**:

```text
   SELECT * WHERE age BETWEEN 20 AND 40
   → find 20 in the leaves → follow leaf links until 40
```

`ORDER BY`, `BETWEEN`, and pagination are all just sequential leaf walks.

--

## Demo: B+ tree

<div class="algo-viz" data-algo="bplus" data-config='{"height":185}'>
<pre class="viz-fallback">
   B+ tree, order 4: keys 5, 10, ..., 100 inserted in shuffled order

                     [ 25 | 55 ]
              /           |            \
          [15]        [35|45]        [70|80|90]
   leaves: [5|10]→[15|20]→[25|30]→[35|40]→[45|50]→[55|60|65]→[70|75]→[80|85]→[90|95|100]

   range 20 60: descend [25|55] → [15] → leaf [15|20], then follow the
   chain: 20 25 30 35 40 45 50 55 60, stop at 65. 7 node reads.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Grey nodes hold routers only; every key is in a white leaf, and the arrows are the chain. **Range** descends once, then walks the leaves. Try `insert 57`, `delete 75`, `delete 5`, or click a key to delete it.</small>

--

## B-tree vs B+ tree

| | B-tree | B+ tree |
|---|---|---|
| records stored | in **all** nodes | **leaves only** |
| internal node | keys + records | **keys only** (wider) |
| range scan | full tree walk | **leaf-chain** walk |
| a key appears | once | router **and** leaf |

B+ packs more keys per internal block → higher fan-out, shorter tree, faster ranges.

--

## Choosing the order M

Pick M so a node **fills one disk block**:

```text
   block 4096 B, key 8 B, pointer 8 B
   internal ≈ M·8 (ptrs) + (M−1)·8 (keys) ≈ 4096
   →  M ≈ 256
```

Bigger blocks or smaller keys → larger M → shallower tree.

--

## One goal, several tools

| structure | balance kept by | height | best when |
|---|---|---|---|
| plain BST | nothing | up to n−1 | keys already random |
| **AVL** | rotations, bf ∈ ±1 | ≤ 1.44 log₂n | **read-heavy** (tightest) |
| **red-black** | rotations + colors | ≤ 2 log₂n | **write-heavy** (std lib) |
| **2-3** | split & promote | log n | teaching / basis of RB |
| **B / B+** | split & promote | log_M n | **disk / databases** |

--

## Which one do I reach for?

```text
   in RAM, read-heavy      →  AVL
   in RAM, general/mutable  →  red-black  (std::map)
   on disk / a database     →  B+ tree
   learning / interviews    →  2-3  (explains red-black)
```

All Θ(log n); the machine and the workload pick the winner.

