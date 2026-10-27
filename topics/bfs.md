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

<div><img src="../../topics/figures/graphs/gr-bfs-layers.svg" style="height:235px" alt="
   layer 0: {start}
   layer 1: start's neighbors
   layer 2: their unseen neighbors
   …"></div>

The frontier is a **queue** (FIFO) instead of a stack.

--

## BFS: the code

```cpp
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

The diamond again, lists $0 \to [1, 2]$, $1 \to [3]$, $2 \to [3]$, $3 \to []$: one row per step, from the engine's own run:

<div id="bfs-worked" style="display:flex;justify-content:center"></div>

--

## Why mark on enqueue?

If you marked a vertex only when **dequeued**, two neighbors could both enqueue it → it enters the queue **twice** → re-processed, wrong distances.

Mark the instant you **enqueue**: each vertex enters the queue **once**, so BFS costs $\Theta(V + E)$.

--

## Lemma: the queue is sorted by distance

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-bfs-queue.svg" style="height:250px" alt="
   queue:  [ d  d  …  d | d+1  d+1  …  d+1 ]">
<div style="text-align:left; max-width:300px; font-size:0.9em">

While distance-$d$ vertices leave, only distance-$(d+1)$ vertices **join**.

At most **two** values, in order: vertices leave in **non-decreasing distance**.

</div>
</div>

--

## Theorem: BFS distances are shortest

**Claim:** $\text{dist}[v] = \delta(v)$, the true fewest-edge distance.

- ($\ge$) BFS reached $v$ along **real** edges: a path with $\text{dist}[v]$ edges exists, and none is shorter than $\delta(v)$
- ($\le$) take a shortest path $s = v\_0 \to v\_1 \to \cdots \to v\_k = v$. By induction each $v\_i$ is discovered by the time $v\_{i-1}$ is dequeued, so $\text{dist}[v\_i] \le \text{dist}[v\_{i-1}] + 1 \le i$

Both directions: $\boldsymbol{\text{dist}[v] = \delta(v)}$. ∎

--

## Your turn: BFS on the course DAG

<div style="display:flex; align-items:center; justify-content:center; gap:36px">
<img src="../../topics/figures/graphs/gr-course.svg" style="height:250px" alt="
   0 → 1, 3, 5   2 → 3         4 → 5, 7
   1 → 2, 3      3 → 4, 7      5 → 6">
<div style="text-align:left; max-width:560px">

BFS from 0: what is `dist[6]`?

<details class="answer"><summary>Answer:</summary>

Layers $\lbrace 0 \rbrace$, $\lbrace 1, 3, 5 \rbrace$, $\lbrace 2, 4, 6, 7 \rbrace$: **`dist[6]` = 2**, via $0 \to 5 \to 6$. Everything is within two edges of 0, the opposite of DFS's deep dive.

</details>

</div>
</div>

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
| memory | $O(\text{longest path})$ | $O(\text{widest layer})$ |
| cost | $\Theta(V + E)$ | $\Theta(V + E)$ |

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

```cpp
void search(Graph& g, int s, Frontier& f) {   // f: add, remove, empty
    vector<bool> done(g.V, false);
    f.add(s);
    while (!f.empty()) {
        int u = f.remove();
        if (done[u]) continue;          // skip duplicates
        done[u] = true;                 // visit u: final on REMOVE
        for (int v : g.adj[u])
            if (!done[v]) f.add(v);     // may re-add: that's fine
    }
}
```

| frontier | explores | you get |
|---|---|---|
| stack (last in, first out) | deepest first | **DFS** |
| queue (first in, first out) | oldest first | **BFS** |
| priority queue by path cost | cheapest first | **Dijkstra** |
| priority queue by "looks close" | most promising | **A\*** (games, AI) |

--

## BFS beyond graphs: grids

A grid or maze is an **implicit** graph: each cell a vertex, edges to its 4 neighbors:

<div style="display:flex; align-items:center; justify-content:center; gap:36px">
<img src="../../topics/figures/graphs/gr-bfs-grid.svg" style="height:240px" alt="
   . . # .        BFS from S → fewest moves to every
   S . # .        reachable cell; '#' = wall (no edge)
   . . . E">
<div style="text-align:left; max-width:420px">

BFS from S: the fewest moves to every reachable cell (a wall has no edges); E is 4 moves away.

</div>
</div>

Same BFS code: just compute neighbors $(r \pm 1, c)$, $(r, c \pm 1)$ on the fly.

