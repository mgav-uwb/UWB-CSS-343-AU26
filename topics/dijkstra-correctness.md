<!--
  TOPIC · Dijkstra: correctness and limits.
  Teaches: the correctness proof; where negative weights break it; Bellman-Ford for negative weights; negative cycles; Dijkstra against BFS; choosing a shortest-path algorithm; A* in one slide.
  Needs:   Dijkstra's algorithm.
  Demos:   dijkstra-neg (slide spec)
  Program: none
  Budget:  ~20 min, 10 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 5.
-->

### Dijkstra: correctness and limits

<small>(~20 min)</small>

--

## The proof: setup

Let S = the settled set. **Induction hypothesis: `dist[x] = δ(x)` for every x ∈ S**: true at the start (S = {s}, dist[s] = 0). Dijkstra is about to settle **u**, the nearest unsettled vertex. **Claim: dist[u] = δ(u) too.**

```text
   take ANY path P from s to u.
   P starts inside S (at s) and ends outside (at u)
   → P crosses the boundary somewhere:

   let  x → y  be P's FIRST edge with  x ∈ S,  y ∉ S
```

--

## The proof: the chain

```text
   cost(P) =  cost(s ⇝ x)  +  w(x→y)  +  cost(y ⇝ u)

           ≥     δ(x)      +  w(x→y)  +  0      ← weights ≥ 0
           =   dist[x]     +  w(x→y)            ← IH: x ∈ S
           ≥   dist[y]                 ← x→y relaxed when x settled
           ≥   dist[u]                 ← u is the NEAREST unsettled

   every path to u costs ≥ dist[u]  ⇒  dist[u] = δ(u)  ∎
```

--

## Where negative weights break it

```text
   s ──1──→ a        greedy settles a at dist 1: final!
   │        ↑
   2       −4        but s→b→a = 2 + (−4) = −2
   │        │        the cheaper route arrives too late
   └──→ b ──┘
```

The proof's `cost(y ⇝ u) ≥ 0` line **fails**: a negative tail CAN undercut a settled label. **Dijkstra silently returns 1, not −2.**

--

## Demo: watch it break

<div class="algo-viz" data-algo="dijkstra-neg">
<pre class="viz-fallback">
   append "7 1 -20" to the edge triples and rebuild:
   Dijkstra still reports dist[1] = 4, but the final
   edge re-check finds 7→1 still relaxes (15−20 = −5):
   the settled label was WRONG.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## Bellman-Ford (for negative weights)

Relax **every edge, V−1 times**:

```text
   for i in 1..V-1:
       for each edge (u,v,w):
           relax(u, v, w)
```

Handles negative weights; detects **negative cycles**. Slower: **O(V·E)**. Round i finalizes every shortest path of **≤ i edges**.

--

## Negative cycles

If a cycle's weights **sum to negative**, "shortest path" is **undefined**: loop it forever, cost → −∞:

```text
   a → b → c → a   with total weight −2
   each lap subtracts 2 → no minimum exists
```

Bellman-Ford **detects** this: an edge still relaxing on a **V-th** pass → a negative cycle.

--

## Dijkstra vs BFS

BFS is **Dijkstra with all weights = 1**:

| | BFS | Dijkstra |
|---|---|---|
| edge weights | all 1 | nonnegative |
| frontier | **queue** | **priority queue** |
| gives | fewest edges | least weight |
| cost | Θ(V+E) | O(E log V) |

Same algorithm; the PQ replaces the plain queue.

--

## Which shortest-path algorithm?

| situation | use | cost |
|---|---|---|
| unweighted | **BFS** | Θ(V+E) |
| DAG (any weights) | **topo-order relax** | Θ(V+E) |
| nonnegative, sparse | **Dijkstra + heap** | O(E log V) |
| nonnegative, dense | **Dijkstra + array** | O(V²) |
| negative weights | **Bellman-Ford** | O(V·E) |

--

## A*: Dijkstra with a hint

Point-to-point on a **road map**. Every vertex has **coordinates**: cheap knowledge from *outside* the graph:

```text
   h(u) = straight-line distance u → target t
        = √( (xᵤ−xₜ)² + (yᵤ−yₜ)² )
          O(1), from coordinates: NOT from the edges

   priority = dist[u] + h(u)      h(u) = cost still to go,
                                  estimated
```

**One changed line** of the Dijkstra code: `PQ.push({dist[v] + h(v), v})`: and the frontier leans **toward the goal**.

