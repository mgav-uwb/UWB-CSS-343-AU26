<!--
  TOPIC · Prim's algorithm.
  Teaches: grow one tree by its lightest exit (the tree-against-the-rest cut); the lazy min-heap of candidate edges and stale entries; the code; the run on the course graph and its heap, traced; the MST is not the shortest-path tree; Prim against Dijkstra and against Kruskal; the O(V²) array-scan version for dense graphs.
  Needs:   minimum spanning trees (the cut property), binary heaps, Dijkstra's algorithm (lazy deletion), the weighted adjacency list.
  Demos:   prim (slide spec); figures prim-run-a, prim-run-b, prim-vs-spt (tools/gen-wgraph-figures.mjs)
  Program: code/mst/mst.cpp (the slides' code, compiled and run on the course graph; prints the heap trace)
  Budget:  ~24 min, 13 slides.
  Ported from Summer 2026 L11-mst-union-find.md, part 4.
-->

### Prim's algorithm

> Michael Fredman and Robert Tarjan's Fibonacci heap (1987) brings Prim's algorithm to $O(E + V \log V)$ time.

<small>M. L. Fredman and R. E. Tarjan, “Fibonacci Heaps and Their Uses in Improved Network Optimization Algorithms,” JACM 34(3), 1987</small>

--

## One tree, grown

Start with a tree of one vertex, $s$. Repeat until every vertex is in: add the **lightest edge leaving the tree**, and the vertex at its far end.

- the tree against the rest is a **cut**
- the lightest edge crossing it is safe: the **cut property**, directly

--

## Practice: which edge next?

On the course graph, Prim's tree so far is {0, 1}. The edges leaving it:

| edge | 1–2 | 1–3 | 0–3 | 0–5 |
| ---- | :-: | :-: | :-: | :-: |
| weight | 1 | 5 | 6 | 20 |

Which edge does Prim add next?

<details class="answer"><summary>Answer:</summary>

**1–2 (1)**: the lightest edge leaving the tree, so 2 joins. Which tree vertex an edge starts from does not matter.

</details>

--

## A heap of candidates

A **min-heap** of (weight, vertex) entries:

- when $v$ joins, push an entry for each edge from $v$ to an **outside** vertex
- pop the lightest; if its vertex is **already in**, the entry is **stale**: skip it

**Lazy deletion**, as in Dijkstra's algorithm.

<small>**Eager** Prim keeps one entry per outside vertex and lowers its key: also $O(E \log V)$.</small>

--

## Prim: the code

```cpp [9-13]
using Entry = pair<int, int>;                  // (weight, vertex)

long prim(int s) {                             // adj: the weighted lists
    vector<bool> inTree(V, false);
    priority_queue<Entry, vector<Entry>, greater<Entry>> pq;   // a min-heap
    long total = 0;
    pq.push({0, s});                           // s joins at no cost
    while (!pq.empty()) {
        auto [w, u] = pq.top();  pq.pop();     // the lightest candidate
        if (inTree[u]) continue;               // stale: u is already in
        inTree[u] = true;  total += w;         // take the edge into u
        for (Edge e : adj[u])
            if (!inTree[e.to]) pq.push({e.w, e.to});
    }
    return total;
}
```

Each edge is pushed at most twice, once from each end: $O(E \log E) = O(E \log V)$.

--

## Prim's run (1)

<div><img src="../../topics/figures/wgraphs/wg-prim-run-a.svg" style="height:480px" alt="
   start: the tree {0}
   add 0-1 (4): total 4
   add 1-2 (1): total 5
   add 1-3 (5): total 10
   add 3-4 (2): total 12
   add 4-5 (3): total 15"></div>

--

## Prim's run (2)

<div><img src="../../topics/figures/wgraphs/wg-prim-run-b.svg" style="height:260px" alt="
   add 4-7 (7): total 22
   add 5-6 (9): total 31"></div>

The **same seven edges** as Kruskal, weight **31**, in a different order: Prim's tree stays connected; Kruskal's forest merged.

--

## Prim's heap, traced (1)

| pop | action | total | heap after, lightest first |
| --- | ------ | :---: | -------------------------- |
| (0, 0) | 0 joins | 0 | (4, 1) (6, 3) (20, 5) |
| (4, 1) | 1 joins | 4 | (1, 2) (5, 3) (6, 3) (20, 5) |
| (1, 2) | 2 joins | 5 | (5, 3) (6, 3) (8, 3) (20, 5) |
| (5, 3) | 3 joins | 10 | (2, 4) (6, 3) (8, 3) (11, 7) (20, 5) |
| (2, 4) | 4 joins | 12 | (3, 5) (6, 3) (7, 7) (8, 3) (11, 7) (20, 5) |
| (3, 5) | 5 joins | 15 | (6, 3) (7, 7) (8, 3) (9, 6) (11, 7) (20, 5) |

Three entries for vertex 3: **(5, 3)** wins; **(6, 3)** and **(8, 3)** are now stale.

--

## Prim's heap, traced (2)

| pop | action | total | heap after, lightest first |
| --- | ------ | :---: | -------------------------- |
| (6, 3) | **stale**: skip | 15 | (7, 7) (8, 3) (9, 6) (11, 7) (20, 5) |
| (7, 7) | 7 joins | 22 | (8, 3) (9, 6) (11, 7) (20, 5) |
| (8, 3) | **stale**: skip | 22 | (9, 6) (11, 7) (20, 5) |
| (9, 6) | 6 joins | 31 | (11, 7) (20, 5) |
| (11, 7) | **stale**: skip | 31 | (20, 5) |
| (20, 5) | **stale**: skip | 31 | empty |

12 pops: 8 vertices join, 4 stale entries are skipped. Total **31**.

--

## Demo: Prim

<small>Run **Prim from** 0: red heap entries are stale. From 6: the same tree, in another order.</small>

<div class="algo-viz" data-algo="prim" data-config='{"width":960,"height":[180,62],"chrome":{"costsInline":true}}'>
<pre class="viz-fallback">
   grow ONE tree from the start: each step adds the lightest
   edge from the tree to a new vertex. the second row is the
   min-heap of candidate edges, lightest first; red entries
   are stale (their far end is already in the tree).
[ interactive demo: open this deck on the course site ]
</pre>
</div>

--

## MST ≠ shortest-path tree

<div><img src="../../topics/figures/wgraphs/wg-prim-vs-spt.svg" style="height:200px" alt="
   triangle 0-1 (2), 1-2 (2), 0-2 (3)
   MST: 0-1, 1-2, total 4; the path 0 to 2 costs 4
   shortest-path tree from 0: 0-1, 0-2, total 5; distance to 2 is 3"></div>

The MST minimizes the **total** weight; the shortest-path tree, each **distance** from the source.

On the course graph: from 0, the shortest-path tree reaches 3 by **0–3** (distance 6), the MST by **1–3**.

--

## Prim against Dijkstra

The same skeleton: a min-heap, a set of finished vertices, lazy deletion. **One line differs**, the key pushed for edge $u \to v$:

| | Prim | Dijkstra |
| - | ---- | -------- |
| key of $v$ | $w(u, v)$ | $\mathit{dist}[u] + w(u, v)$ |
| builds | the cheapest **tree** | the cheapest **paths** from $s$ |
| cost (binary heap) | $O(E \log V)$ | $O(E \log V)$ |

--

## Kruskal against Prim

| | Kruskal | Prim |
| - | ------- | ---- |
| grows | a **forest** that merges | **one tree** |
| takes | the globally lightest safe edge | the lightest edge leaving the tree |
| needs | a sort + **union-find** | a **min-heap** |
| input | an edge list | adjacency lists |
| cost | $O(E \log V)$ | $O(E \log V)$; $O(V^2)$ with an array |

Same theorem underneath; both are greedy.

--

## Prim with an array: $O(V^2)$

<small>`best[v]`: the lightest edge from the tree to outside vertex $v$. Each round **scans** for the minimum.</small>

```cpp [6-8]
long primArray(const vector<vector<int>>& w, int s) {  // w[u][v], INF: none
    int n = w.size();
    vector<int> best(n, INF);  vector<bool> inTree(n, false);
    best[s] = 0;  long total = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;                           // the nearest outside vertex
        for (int v = 0; v < n; v++)
            if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        if (best[u] == INF) break;            // the rest is unreachable
        inTree[u] = true;  total += best[u];
        for (int v = 0; v < n; v++)           // cheaper ways in through u
            if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
    }
    return total;
}
```

<small>$n$ rounds of $O(n)$ scans: $O(V^2)$, better than $O(E \log V)$ when $E$ is near $V^2$.</small>

