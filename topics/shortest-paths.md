<!--
  TOPIC · Weighted graphs and shortest paths.
  Teaches: weighted digraphs; path cost; fewest edges is not least weight; the single-source shortest-path problem; why enumerating paths fails; the shortest-paths tree; optimal substructure; representation; the nonnegative-weight assumption.
  Needs:   BFS.
  Demos:   wgraph-tour (slide spec); figures wg-bfs-recall, wg-weighted, wg-path-cost, wg-fewest, wg-diamonds, wg-spt (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~22 min, 12 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 2.
-->

### Weighted graphs and shortest paths

> Dijkstra first demonstrated his algorithm in 1956 on a map of 64 Dutch cities, so that each city fit in the ARMAC computer's 6-bit codes.

<small>Interview with Philip Frana, CACM 53(8), 2010</small>

--

## Recall: BFS shortest paths

BFS found the path with the **fewest edges**: and we proved it, because every edge counted the same (1 step).

<div><img src="../../topics/figures/wgraphs/wg-bfs-recall.svg" style="height:215px" alt="
   0 -- 1 -- 3      BFS: 0→3 in 2 edges"></div>

But what if edges have **different costs**?

--

## Weighted graphs

Each edge carries a **weight**: a distance, a time, a price, a latency.

<div><img src="../../topics/figures/wgraphs/wg-weighted.svg" style="height:240px" alt="
   0 -2→ 1
   |     |
   5     4
   ↓     ↓
   2 -8→ 3"></div>

The **cost of a path** is now the **sum** of its edge weights.

--

## Path cost: worked

<div><img src="../../topics/figures/wgraphs/wg-path-cost.svg" style="height:250px" alt="
   path 0 → 1 → 3           path 0 → 2 → 3
   weights   2   4          weights   5   8
   cost = 2 + 4 = 6         cost = 5 + 8 = 13"></div>

Among all $s \to t$ paths, the **shortest** is the one with the **minimum sum**: here $0 \to 1 \to 3$, at cost 6.

--

## Fewest edges ≠ least weight

Add one **direct edge** $0 \to 3$, weight 9, to our digraph:

<div><img src="../../topics/figures/wgraphs/wg-fewest.svg" style="height:240px" alt="
   fewest edges:  0 → 3          1 edge,  cost 9
   least weight:  0 → 1 → 3      2 edges, cost 6"></div>

**BFS picks the direct edge** (one edge, the fewest) and pays **9** when **6** was available. Fewest is not cheapest.

--

## The shortest-path problem

Given a **weighted digraph** and a **source** $s$, find the **minimum-total-weight** path from $s$ to every vertex.

- this is the **single-source shortest-paths** (SSSP) problem
- the answer: `dist[v]` for every vertex $v$, plus the path itself

--

## Why not try every path?

A graph can have **exponentially many** $s \to t$ paths:

<div><img src="../../topics/figures/wgraphs/wg-diamonds.svg" style="height:150px" alt="
   v0 → a1, b1 → v1 → a2, b2 → v2 → a3, b3 → v3
   each diamond doubles the routes: 1, 2, 4, 8"></div>

- 100 diamonds: 301 vertices, $2^{100} \approx 1.3 \times 10^{30}$ routes
- at $10^9$ paths per second: about $4 \times 10^{13}$ years

Dijkstra finds **all** $V$ distances in $O(E \log V)$, **without** listing a single path.

--

## The shortest-paths tree

The shortest paths from $s$ form a **tree** rooted at $s$: each vertex's path back to $s$ in it is unique.

<div><img src="../../topics/figures/wgraphs/wg-spt.svg" style="height:230px" alt="
        s
       / \        each vertex's path to s
      a   b       is unique in the tree;
      |           follow parent pointers back
      c"></div>

Store one **`parent[v]`** (the edge used to reach $v$): follow parents back to reconstruct any path.

--

## Optimal substructure

> Any **sub-path** of a shortest path is itself a **shortest path**.

If $s \leadsto u \leadsto t$ is a shortest path to $t$, then its prefix $s \leadsto u$ is a shortest path to $u$.

**Why:** a cheaper route $s \leadsto u$ could replace the prefix and beat the shortest path to $t$: a contradiction.

This is *why* building paths from shorter ones can work at all.

--

## Representation

Adjacency list, now with weights:

```cpp
struct Edge {
    int to;   // the neighbor this edge leads to
    int w;    // its weight: the cost to traverse it
};
vector<vector<Edge>> adj;      // adj[u] = u's weighted out-edges

adj[0] = { {1, 2}, {2, 5} };   // 0 -> 1 (weight 2), 0 -> 2 (weight 5)
```

Same $\Theta(V + E)$ structure as the unweighted list: each neighbor just carries a weight.

--

## The nonnegative assumption

Dijkstra requires **every weight** $w(u, v) \ge 0$.

- distances, times, costs and capacities are naturally nonnegative

Negative weights break the greedy logic: the correctness slides show the **exact line of the proof** that fails.

--

## The course graph

<div class="algo-viz" data-algo="wgraph-tour">
<pre class="viz-fallback">
   8 vertices, 11 weighted directed edges.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Exactly the course DAG, now weighted**: same 8 vertices, same 11 edges, weights added. You met this graph for DFS and BFS; now it carries distances. The Dijkstra demo's input box lists it as `u v w` triples, one per edge.</small>

