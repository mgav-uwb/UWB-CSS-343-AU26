<!--
  TOPIC · Union-find.
  Teaches: disjoint sets and dynamic connectivity; the two-array structure; quick-find and quick-union and the trade they make; weighting (union by size) and the doubling proof of the log₂ n height; path compression, full and halving; the cost table and the inverse Ackermann function; connected components online; what union-find cannot do; std::swap (a slide of its own, before the first code that uses it).
  Needs:   trees (parent links, height), amortized cost.
  Demos:   union-find (registry); figures uf-quick-find, uf-quick-union, uf-forest, uf-weighting, uf-full, uf-halving, uf-components (tools/gen-wgraph-figures.mjs)
  Program: code/union-find/uf.cpp (every slide's code, compiled and run on the slide examples)
  Budget:  ~35 min, 21 slides.
  Ported from Summer 2026 L11-mst-union-find.md, part 1.
-->

### Union-find

> Bernard Galler and Michael Fischer introduced the disjoint-set forest, one tree of parent links per set, in 1964.

<small>B. A. Galler and M. J. Fischer, “An Improved Equivalence Algorithm,” Communications of the ACM 7(5), 1964</small>

--

## Disjoint sets

Union-find keeps a **partition** of the elements $0, 1, \ldots, n - 1$: every element is in exactly **one** set.

```cpp
int  find(int x);           // a representative of x's set
bool unite(int x, int y);   // merge x's set with y's set
```

- same set **iff** same representative
- start: $n$ **singleton** sets
- sets only ever **merge**

<small>Also called **disjoint-set union (DSU)**. The classic name of the second operation is `union`, a reserved word in C++: the code says `unite`.</small>

--

## Dynamic connectivity

The same structure, seen as connections arriving one at a time:

| connections | sets |
| ----------- | ---- |
| a connected group | a set |
| connect p and q | `unite(p, q)` |
| are p and q connected? | `find(p) == find(q)` |

"Is connected to" is reflexive, symmetric and **transitive**: an equivalence relation, so the connected groups **are** a partition.

--

## The structure: two arrays

```cpp
struct UF {
    vector<int> parent, size;
    UF(int n) : parent(n), size(n, 1) {
        for (int i = 0; i < n; i++) parent[i] = i;   // n singleton sets
    }
    int  find(int x);              // the root of x's tree
    bool unite(int a, int b);      // false if a and b were already one set
    bool connected(int a, int b) { return find(a) == find(b); }
};
```

Everything rests on `find`: `connected` compares two finds, and `unite` starts with two.

--

## Quick-find (eager)

`id[i]` is the **label** of i's set: same set iff same label.

```cpp
bool connected(int p, int q) { return id[p] == id[q]; }   // O(1)

void unite(int p, int q) {                                 // O(n)
    int from = id[p], to = id[q];
    for (int i = 0; i < n; i++)                // every entry, every time
        if (id[i] == from) id[i] = to;
}
```

`connected` is one comparison; `unite` relabels a whole set, so it scans all $n$ entries.

--

## Quick-find, worked

<div><img src="../../topics/figures/wgraphs/wg-uf-quick-find.svg" style="height:200px" alt="
   start        id = 0 1 2 3 4 5
   unite(1, 4)  id = 0 4 2 3 4 5   label 1 becomes 4 (1 cell)
   unite(2, 3)  id = 0 4 3 3 4 5   label 2 becomes 3 (1 cell)
   unite(4, 3)  id = 0 3 3 3 3 5   label 4 becomes 3 (2 cells)
   each unite scans all 6 entries"></div>

Joining $n$ elements into one set takes $n - 1$ unites of $n$ steps each: about $n^2$, **quadratic**.

--

## Quick-union (lazy)

`parent[i]` is i's parent: each set is a **tree**, and its **root** (its own parent) is the representative. `find(x)` returns x's root.

```cpp
int find(int p) {
    while (p != parent[p]) p = parent[p];   // walk up to the root
    return p;
}
void unite(int p, int q) {
    parent[find(p)] = find(q);              // root under root: one write
}
```

The link is one write. The walk costs the **height** of the tree.

--

## Quick-union, worked

<div><img src="../../topics/figures/wgraphs/wg-uf-quick-union.svg" style="height:235px" alt="
   start        parent = 0 1 2 3 4 5 6 7 8 9   all roots
   unite(4, 3)  parent = 0 1 2 3 3 5 6 7 8 9   parent[4] = 3
   unite(3, 8)  parent = 0 1 2 8 3 5 6 7 8 9   parent[3] = 8
   unite(6, 5)  parent = 0 1 2 8 3 5 5 7 8 9   parent[6] = 5
   unite(9, 4)  parent = 0 1 2 8 3 5 5 7 8 8   find(4) walks 4, 3, 8: parent[9] = 8"></div>

The first three unites name two **roots**: nothing to walk. In `unite(9, 4)`, 4 is not a root: `find(4)` walks $4 \to 3 \to 8$, and 9 goes under **8**, not under 4.

--

## The same array, as a forest

<div><img src="../../topics/figures/wgraphs/wg-uf-forest.svg" style="height:250px" alt="
     8          5        0   1   2   7
    / \         |
   3   9        6        each root points at itself
   |
   4             six sets, six roots"></div>

Count roots to count sets. `unite` links root to root, so every set keeps **exactly one** root.

--

## Predict: the worst case

On 10 singletons, what do `unite(0, 1)`, `unite(1, 2)`, …, `unite(8, 9)` build under quick-union?

<details class="answer"><summary>Answer:</summary>

A **path**: each unite puts the old root under the new element, so $0 \to 1 \to \cdots \to 9$, height 9, and `find(0)` walks 9 links. In general $n - 1$ unites can build height $n - 1$: `find` is $O(n)$.

</details>

--

## [`std::swap`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<utility>`: exchange two values.

```cpp
if (size[ra] < size[rb]) swap(ra, rb);     // ra: the larger root
```

- afterwards `x` holds `y`'s old value and `y` holds `x`'s
- $O(1)$ for numbers and pointers; two `vector`s swap their internal pointers, also $O(1)$
- both arguments are **variables** of the same type, passed by reference

--

## Weighted quick-union

Link the **smaller** tree under the **larger**; `size[r]` counts r's tree.

```cpp [3-7]
bool unite(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;                // already one set
    if (size[ra] < size[rb]) swap(ra, rb);     // ra: the larger root
    parent[rb] = ra;                           // smaller under larger
    size[ra] += size[rb];
    return true;
}
```

On a **tie**, b's root goes under a's (no swap).

<small>This is **union by size**. **Union by rank** keeps a bound on each root's height instead, with the same guarantee.</small>

--

## Height at most $\log\_2 n$

Follow one element $x$:

- $x$ gets one level **deeper** only when its tree goes under a tree **at least as large**
- so each time, the size of $x$'s tree at least **doubles**
- that size starts at 1 and never exceeds $n$

$$2^{\mathit{depth}(x)} \le n \quad\Longrightarrow\quad \mathit{depth}(x) \le \log\_2 n$$

So `find`, and with it `unite`, is $O(\log n)$.

--

## Your turn: two forests

`unite(4, 3)`, `unite(3, 8)`, `unite(9, 4)` under both rules. Draw each forest: how tall?

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/wgraphs/wg-uf-weighting.svg" style="height:200px" alt="
   PLAIN: 8 over 3 and 9, 4 under 3     height 2
   WEIGHTED: 4 over 3, 8 and 9          height 1"></div>

Weighted: `unite(4, 3)` is a tie, so 3 goes under 4; 8 and 9 then join the larger tree at 4.

</details>

--

## Path compression

`find` walks to the root anyway. On the way back, point every node it passed **straight at the root**:

```cpp
int find(int x) {
    if (parent[x] == x) return x;       // x is the root
    parent[x] = find(parent[x]);        // point x at the root
    return parent[x];
}
```

<div><img src="../../topics/figures/wgraphs/wg-uf-full.svg" style="height:250px" alt="
   before: 4 → 3 → 2 → 1 → 0 (root 0), height 4
   find(4) walks to 0, then points 4, 3 and 2 at 0
   after: 1, 2, 3, 4 all under 0, height 1"></div>

--

## Path halving

```cpp
int find(int x) {
    while (x != parent[x]) {
        parent[x] = parent[parent[x]];  // point x at its grandparent
        x = parent[x];
    }
    return x;
}
```

<div><img src="../../topics/figures/wgraphs/wg-uf-halving.svg" style="height:215px" alt="
   before: 4 → 3 → 2 → 1 → 0 (root 0), height 4
   find(4): 4 → its grandparent 2, then 2 → its grandparent 0
   after: 1 and 2 under 0, 3 and 4 under 2, height 2"></div>

<small>On this chain full compression moves 3 nodes, halving 2. **Same bound**; either is accepted.</small>

--

## The cost of union-find

| implementation | `unite` | `find` |
| -------------- | ------- | ------ |
| quick-find | $O(n)$ | $O(1)$ |
| quick-union | $O(n)$ | $O(n)$ |
| weighting only | $O(\log n)$ | $O(\log n)$ |
| compression only | $O(\log n)$ amortized | $O(\log n)$ amortized |
| **weighting + compression** | $O(\alpha(n))$ **amortized** | $O(\alpha(n))$ **amortized** |

Either fix alone: $\log n$. **Both**: $\alpha(n)$, **amortized**, averaged over any sequence of operations.

--

## Inverse Ackermann

Ackermann's function $A$ outgrows any tower of exponentials; its inverse $\alpha$ grows absurdly slowly:

| $n$ | 0–2 | 3 | 4–7 | 8–2047 | 2048 to $A\_4(1)$ |
| --- | :-: | :-: | :-: | :-: | :-: |
| $\alpha(n)$ | 0 | 1 | 2 | 3 | 4 |

$A\_4(1)$ is far larger than $10^{80}$, the estimated number of atoms in the observable universe. For any $n$ a computer can hold, $\alpha(n) \le 4$.

<small>Values: Cormen, Leiserson, Rivest and Stein, *Introduction to Algorithms*, 3rd ed., §21.4.</small>

--

## Demo: union-find

<small>**Unite** `4 3`, `3 8`, `9 4` replays the your-turn. **Link** is plain quick-union; **Find** flattens its path.</small>

<div class="algo-viz" data-algo="union-find" data-config='{"width":960,"height":[170,56],"chrome":{"costsInline":true}}'>
<pre class="viz-fallback">
   weighted quick-union with full path compression:
   unite links the smaller tree under the larger;
   find flattens the path it walks.
   cell i of the array shows parent[i]; a root points at itself.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

--

## Connected components

An **undirected** graph arrives as a list of edges. How many **connected components** does it have, and are $u$ and $v$ in the same one?

```cpp
UF uf(V);
for (const Edge& e : edges) uf.unite(e.u, e.v);   // u and v: one component
int components = 0;
for (int v = 0; v < V; v++)
    if (uf.find(v) == v) components++;            // one root per component
```

When the edges are all in, each **set** is one **component**: two vertices share a set iff a path joins them.

--

## Components, worked

<div><img src="../../topics/figures/wgraphs/wg-uf-components.svg" style="height:220px" alt="
   edges in arrival order: 0-1, 2-3, 4-5, 1-2, 6-7, 0-3
   after all six: {0, 1, 2, 3}, {4, 5}, {6, 7}
   0-3 joins two vertices already in one set: unite returns false
   parent = 0 0 0 0 4 4 6 6, roots 0, 4, 6: 3 components"></div>

Edge 6, 0–3, closes a **cycle**: `unite` returns `false` and nothing changes. Kruskal's algorithm skips exactly these edges.

<small>Unlike a DFS, union-find takes the edges **one at a time, in any order**, and answers `connected` between arrivals. On a **directed** graph it ignores direction: these are not the strongly connected components.</small>

--

## What union-find can't do

Sets only **merge**:

- no split, and no "remove this edge": the structure stores **sets**, not edges
- compression has erased which `unite` put a node where, so a merge cannot be undone

Connectivity can only grow. That restriction is what buys the $\alpha(n)$ bound.

