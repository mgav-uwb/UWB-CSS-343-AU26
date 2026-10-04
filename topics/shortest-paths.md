<!--
  TOPIC · Weighted graphs and shortest paths.
  Teaches: weighted digraphs; path cost; fewest edges is not least weight; the single-source shortest-path problem; why enumerating paths fails; the shortest-paths tree; optimal substructure; representation; the nonnegative-weight assumption.
  Needs:   BFS.
  Demos:   wgraph-tour (slide spec)
  Program: none
  Budget:  ~22 min, 12 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 2.
-->

### Weighted graphs and shortest paths

<small>(~22 min)</small>

--

## Recall: BFS shortest paths

BFS found the path with the **fewest edges**: and we proved it, because every edge counted the same (1 step).

```text
   0 -- 1 -- 3      BFS: 0→3 in 2 edges
```

But what if edges have **different costs**?

--

## Weighted graphs

Each edge carries a **weight**:

```text
   0 -2→ 1        weights = distance, time,
   |     |        price, latency, …
   5     4
   ↓     ↓
   2 -8→ 3
```

The **cost of a path** is now the **sum** of its edge weights.

--

## Path cost: worked

```text
   path 0 → 1 → 3           path 0 → 2 → 3
   weights   2   4          weights   5   8
   cost = 2 + 4 = 6         cost = 5 + 8 = 13
```

Among all s→t paths, the **shortest** is the one with the **minimum sum**: here 0 → 1 → 3, at cost 6.

--

## Fewest edges ≠ least weight

Add one **direct edge** `0 -9→ 3` to our digraph:

```text
   fewest edges:  0 → 3          1 edge,  cost 9
   least weight:  0 → 1 → 3      2 edges, cost 6
```

**BFS picks the direct edge** (fewest edges = 1): and pays **9** when **6** was available. Fewest ≠ cheapest.

--

## The shortest-path problem

Given a **weighted digraph** and a **source** s, find the **minimum-total-weight** path from s to every vertex.

```text
   single-source shortest paths (SSSP)
   answer: dist[v] for every v, + the path itself
```

--

## Why not enumerate all paths?

A graph can have **exponentially many** s → t paths: listing them is hopeless:

```text
   301 vertices can pack 2^100 ≈ 10^30 s→t routes
   at 10^9 paths/sec: ≈ 40 trillion years
```

Dijkstra finds shortest distances to **all V** vertices in **O(E log V)**: **without** enumerating a single path. *Proof of that 2¹⁰⁰: next slide.*

--

## The shortest-paths tree

The shortest paths from s form a **tree** rooted at s:

```text
        s
       / \        each vertex's path to s
      a   b       is unique in the tree;
      |           follow parent pointers back
      c
```

Store one **parent[v]** (the edge used to reach v) → reconstruct any path.

--

## Optimal substructure

> Any **sub-path** of a shortest path is itself a **shortest path**.

```text
   if  s → … → u → … → t  is shortest,
   then  s → … → u  is the shortest route to u

   why: a cheaper s ⇝ u prefix could be swapped in,
        beating the "shortest" path: contradiction
```

This is *why* building paths from shorter ones can work at all.

--

## Representation

Adjacency list, now with weights:

```text
struct Edge {
    int to;   // the neighbor this edge leads to
    int w;    // the edge's weight (cost to traverse)
};
vector<vector<Edge>> adj;    // adj[u] = u's weighted out-edges

adj[0] = { {1,2}, {2,5} };   // 0→1 (2), 0→2 (5)
```

Same Θ(V + E) structure as the unweighted list: each neighbor just carries a weight.

--

## The nonnegative assumption

Dijkstra requires **all weights ≥ 0**.

```text
   distances, times, costs, capacities → naturally ≥ 0
```

Negative weights break the greedy logic: the correctness slides show the **exact line of the proof** that fails.

--

## The course graph

```text
   0→1(4)  0→3(6)  1→2(1)  1→3(5)   2→3(8)  0→5(20)
   3→4(2)  3→7(11) 4→5(3)  5→6(9)   4→7(7)
```

<div class="algo-viz" data-algo="wgraph-tour">
<pre class="viz-fallback">
   8 vertices, 11 weighted directed edges.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Exactly the course DAG, now weighted**: same 8 vertices, same 11 edges, weights added. You met this graph for DFS and BFS; now it carries distances. The triples above are its build string.</small>

