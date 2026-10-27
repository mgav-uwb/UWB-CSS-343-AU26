<!--
  TOPIC · Dijkstra: correctness and limits.
  Teaches: the correctness proof; where negative weights break it; Bellman-Ford for negative weights; negative cycles; Dijkstra against BFS; choosing a shortest-path algorithm; A* in one slide.
  Needs:   Dijkstra's algorithm.
  Demos:   dijkstra-neg (slide spec); bellman-ford (registry demo, slide spec in demos.js); figures wg-cut, wg-neg, wg-negcycle (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~20 min, 10 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 5.
-->

### Dijkstra: correctness and limits

> OSPF, the main routing protocol inside large networks, has each router run Dijkstra's algorithm on the link costs it has learned.

<small>RFC 2328, OSPF Version 2, 1998</small>

--

## The proof: setup

**Hypothesis:** $\mathit{dist}[x] = \delta(x)$ for every settled $x \in S$ (at the start, $S = \lbrace s \rbrace$). Dijkstra now settles $u$, the nearest unsettled vertex. **Claim:** $\mathit{dist}[u] = \delta(u)$.

Any path $P$ to $u$ leaves $S$ by a **first** edge $x \to y$, with $x \in S$, $y \notin S$:

<div><img src="../../topics/figures/wgraphs/wg-cut.svg" style="height:200px" alt="
   take ANY path P from s to u.
   P starts inside S (at s) and ends outside (at u)
   → P crosses the boundary somewhere:
   let  x → y  be P's FIRST edge with  x ∈ S,  y ∉ S"></div>

--

## The proof: the chain

$$\mathit{cost}(P) = \mathit{cost}(s \leadsto x) + w(x, y) + \mathit{cost}(y \leadsto u)$$

$$
\begin{alignedat}{2}
\mathit{cost}(P) &\ge \delta(x) + w(x, y) + 0 &\qquad& \text{every weight} \ge 0 \\\\
&= \mathit{dist}[x] + w(x, y) && \text{hypothesis: } x \in S \\\\
&\ge \mathit{dist}[y] && x \to y \text{ relaxed when } x \text{ settled} \\\\
&\ge \mathit{dist}[u] && u \text{ is the nearest unsettled}
\end{alignedat}
$$

Every path to $u$ costs at least $\mathit{dist}[u]$, so $\mathit{dist}[u] = \delta(u). \enspace \blacksquare$

--

## Where negative weights break it

<div><img src="../../topics/figures/wgraphs/wg-neg.svg" style="height:215px" alt="
   s ──1──→ a        greedy settles a at dist 1: final!
   │        ↑
   2       −4        but s→b→a = 2 + (−4) = −2
   │        │        the cheaper route arrives too late
   └──→ b ──┘"></div>

The proof's $\mathit{cost}(y \leadsto u) \ge 0$ line **fails**: a negative tail **can** undercut a settled label. **Dijkstra silently returns 1, not −2.**

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

## Bellman-Ford

For negative weights: relax **every edge, $V - 1$ times**.

```cpp
struct WEdge { int from, to, w; };
vector<WEdge> edges;                          // every edge, in input order

void bellmanFord(int s) {
    dist.assign(V, INF);
    dist[s] = 0;
    for (int round = 1; round <= V - 1; round++)
        for (WEdge e : edges)                 // relax every edge
            if (dist[e.from] != INF && dist[e.from] + e.w < dist[e.to])
                dist[e.to] = dist[e.from] + e.w;
}
```

Handles negative weights; detects **negative cycles**. Slower: $O(VE)$. Round $i$ finalizes every shortest path of **at most $i$ edges**.

--

## Demo: Bellman-Ford on the negative edge

<div class="algo-viz" data-algo="bellman-ford">
<pre class="viz-fallback">
s = 0, a = 1, b = 2:  s→a 1, s→b 2, b→a −4
round 1: dist[a] = 1, dist[b] = 2, then b→a: 2 + (−4) = −2 < 1 → dist[a] = −2
round 2: nothing changes → stop early; dist = 0, −2, 2
</pre>
</div>

--

## Negative cycles

If a cycle's weights **sum to negative**, "shortest path" is **undefined**: loop it forever and the cost goes to $-\infty$:

<div><img src="../../topics/figures/wgraphs/wg-negcycle.svg" style="height:220px" alt="
   a → b → c → a   with total weight −2
   each lap subtracts 2 → no minimum exists"></div>

Bellman-Ford **detects** this: an edge that still relaxes on a **$V$-th** pass proves a negative cycle.

--

## Dijkstra vs BFS

BFS is **Dijkstra with every weight 1**:

| | BFS | Dijkstra |
|---|---|---|
| edge weights | all 1 | nonnegative |
| frontier | **queue** | **priority queue** |
| gives | fewest edges | least weight |
| cost | $\Theta(V + E)$ | $O(E \log V)$ |

Same algorithm; the PQ replaces the plain queue.

--

## Which shortest-path algorithm?

| situation | use | cost |
|---|---|---|
| unweighted | **BFS** | $\Theta(V + E)$ |
| DAG (any weights) | **topo-order relax** | $\Theta(V + E)$ |
| nonnegative, sparse | **Dijkstra + heap** | $O(E \log V)$ |
| nonnegative, dense | **Dijkstra + array** | $O(V^2)$ |
| negative weights | **Bellman-Ford** | $O(VE)$ |

--

## A*: Dijkstra with a hint

Point-to-point on a **road map**, where every vertex has **coordinates**. Let $h(u)$ = the straight-line distance from $u$ to the target $t$, an estimate of the cost still to go:

$$h(u) = \sqrt{(x\_u - x\_t)^2 + (y\_u - y\_t)^2}$$

$O(1)$ from the coordinates, **not** from the edges. The priority becomes $\mathit{dist}[u] + h(u)$.

**One changed line** of the Dijkstra code, `pq.push({dist[v] + h(v), v})`, and the frontier leans **toward the goal**.

