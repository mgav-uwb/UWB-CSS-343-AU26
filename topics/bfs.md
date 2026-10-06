<!--
  TOPIC · Breadth-first search.
  Teaches: BFS layer by layer with a queue; marking on enqueue; the queue is sorted by distance; BFS distances are shortest (fewest edges); BFS against DFS; one loop with four containers; BFS on grids.
  Needs:   DFS, queues.
  Demos:   graph-bfs, search-race (slide specs); the bfs-worked trace table
  Program: none
  Budget:  ~32 min, 13 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 3.
-->

### Breadth-first search

> Edward F. Moore published breadth-first search in 1959 to find the shortest path through a maze; C. Y. Lee found it independently in 1961 for routing wires.

<small>E. F. Moore, 1959; C. Y. Lee, 1961</small>

--

## BFS: go wide, layer by layer

**Breadth-first search** visits all vertices at distance 1, then all at distance 2, …: expanding in **rings** from the start.

```text
   layer 0: {start}
   layer 1: start's neighbors
   layer 2: their unseen neighbors
   …
```

The frontier is a **queue** (FIFO) instead of a stack.

--

## BFS: the code

```text
void bfs(Graph& g, int s) {
    queue<int> q; q.push(s);
    vector<bool> seen(g.V, false); seen[s] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();     // visit u
        for (int v : g.adj[u])
            if (!seen[v]) {
                seen[v] = true;         // mark on ENQUEUE
                q.push(v);
            }
    }
}
```

--

## BFS: a worked trace

The diamond again: `0 → [1,2] · 1 → [3] · 2 → [3] · 3 → []`: one row per step, from the engine's own run:

<div id="bfs-worked" style="display:flex;justify-content:center"></div>

--

## Why mark on enqueue?

If you marked a vertex only when **dequeued**, two neighbors could both enqueue it → it enters the queue **twice** → re-processed, wrong distances.

Mark the instant you **enqueue** → each vertex enters the queue **once** → Θ(V + E).

--

## Lemma: the queue is sorted by distance

While distance-d vertices are dequeued, only distance-(d+1) vertices are **enqueued**:

```text
   queue:  [ d  d  …  d | d+1  d+1  …  d+1 ]
```

At most **two** values, never out of order → vertices are dequeued in **non-decreasing distance** order.

--

## Theorem: BFS distances are shortest

```text
   claim:  dist[v] = δ(v), the true fewest-edge distance

   ≥  BFS reached v along REAL edges: a path with
      dist[v] edges exists, and none is shorter than δ ✓

   ≤  take a shortest path  s = v0 → v1 → … → vk = v.
      induction: each vi is discovered by the time
      v(i−1) is dequeued → dist[vi] ≤ dist[v(i−1)] + 1 ≤ i ✓
```

Both directions → **dist[v] = δ(v)**. ∎

--

## Your turn: BFS on the course DAG

```text
   0 → 1, 3, 5   2 → 3         4 → 5, 7
   1 → 2, 3      3 → 4, 7      5 → 6

   BFS from 0: what is dist[6]?
```

<details class="answer"><summary>Answer:</summary>

Layers: {0} → {1, 3, 5} → {2, 4, 6, 7}. So **dist[6] = 2** (via 0→5→6). Everything is within two edges of 0: this graph is shallow and wide from the source, the opposite of DFS's deep dive.

</details>

--

## Demo: BFS vs DFS

<div class="algo-viz" data-algo="graph-bfs">
<pre class="viz-fallback">
   BFS from vertex 0: expand in LAYERS via a queue (second
   row: watch it drain from the front). each vertex gets a
   distance label = fewest edges from 0. then run DFS from
   the same start and compare orders: same graph, different
   container, different order.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## DFS vs BFS

| | DFS | BFS |
|---|---|---|
| frontier | **stack** / recursion | **queue** |
| shape | deep, then backtrack | wide, in layers |
| finds | reachability, cycles, topo | **shortest (unweighted)** |
| memory | O(longest path) | O(widest layer) |
| cost | Θ(V+E) | Θ(V+E) |

Same cost, one data-structure apart: different questions.

--

## Demo: BFS vs DFS, racing

<div class="algo-viz" data-algo="search-race">
<pre class="viz-fallback">
   The same graph, the same start: BFS on top, DFS below,
   one step per tick in lockstep. The title lines show each
   frontier live: the queue drains layer by layer while the
   stack dives and backtracks.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## One loop, four algorithms

```text
   FRONTIER f;  f.add(start);
   while (!f.empty()) {
       u = f.remove();
       if (done[u]) continue;          // skip duplicates
       done[u] = true;                 // visit u: final on REMOVE
       for (v : adj[u])
           if (!done[v]) f.add(v);     // may re-add: that's fine
   }
```

| frontier | explores | you get |
|---|---|---|
| stack (LIFO) | deepest first | **DFS** |
| queue (FIFO) | oldest first | **BFS** |
| PQ by path cost | cheapest first | **Dijkstra** |
| PQ by "looks close" | most promising | **A\*** (games/AI) |

--

## BFS beyond graphs: grids

A grid or maze is an **implicit** graph: each cell a vertex, edges to its 4 neighbors:

```text
   . . # .        BFS from S → fewest moves to every
   S . # .        reachable cell; '#' = wall (no edge)
   . . . E
```

Same BFS code: just compute neighbors `(r±1, c), (r, c±1)` on the fly.

