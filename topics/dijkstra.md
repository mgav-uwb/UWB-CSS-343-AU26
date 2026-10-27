<!--
  TOPIC · Dijkstra's algorithm.
  Teaches: the greedy idea; why the nearest unsettled vertex is safe; settled and frontier vertices; the algorithm and a worked run; Dijkstra with a binary heap and lazy deletion; the cost; the O(V²) array-scan version; common bugs.
  Needs:   edge relaxation, binary heaps.
  Demos:   dijkstra (slide spec); figures wg-zones, wg-worked, wg-practice, wg-course (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~32 min, 15 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 4.
-->

### Dijkstra's algorithm

> Dijkstra published the algorithm in 1959 in a three-page paper that also gave the minimum spanning tree algorithm now credited to Prim.

<small>E. W. Dijkstra, “A Note on Two Problems in Connexion with Graphs,” Numerische Mathematik 1, 1959</small>

--

## The greedy idea

Repeatedly pick the **unsettled vertex with the smallest tentative distance**, declare it **settled** (final), and **relax its out-edges**.

- **settled**: the shortest distance is now known
- **frontier**: tentative distances, still improving

<small>The greedy template, instantiated: **choice rule** = nearest unsettled vertex; **commitment** = the settled set.</small>

--

## Why the nearest is safe

Settle the **nearest** unsettled vertex $u$: no other route to $u$ can be shorter.

- another route **leaves** the settled region through some unsettled vertex $y$
- $y$ is **at least as far** as $u$ ($u$ is the nearest)
- the rest of the route only **adds** weight ($w \ge 0$)

The correctness slides turn this into a real proof. **Nonnegativity is doing the work.**

--

## Once settled, never revisited

Because settling the nearest vertex makes its distance **final**:

- each vertex is **settled exactly once**
- stale PQ entries are **skipped**, never reprocessed
- one pass: not Bellman-Ford's $V - 1$ rounds

Correctness of the greedy step is what **buys the speed**.

--

## Dijkstra: the algorithm

```cpp
using Entry = pair<long, int>;                // (dist, vertex)

void dijkstra(int s) {
    dist.assign(V, INF);  settled.assign(V, false);
    dist[s] = 0;
    priority_queue<Entry, vector<Entry>, greater<Entry>> pq;   // a min-heap
    pq.push({0, s});
    while (!pq.empty()) {
        int u = pq.top().second;  pq.pop();   // the nearest unsettled
        if (settled[u]) continue;             // a stale entry: skip it
        settled[u] = true;                    // dist[u] is now final
        for (Edge e : adj[u])                 // relax the out-edges
            if (!settled[e.to] && dist[u] + e.w < dist[e.to]) {
                dist[e.to] = dist[u] + e.w;
                pq.push({dist[e.to], e.to});
            }
    }
}
```

--

## Settled vs frontier

The course graph from 0, after settling 0 and 1:

<div><img src="../../topics/figures/wgraphs/wg-zones.svg" style="height:300px" alt="
   settled:  { s }              dist final
   frontier: neighbors of s     tentative, in the PQ
   ∞:        everyone else       not yet discovered"></div>

Each iteration moves the **nearest frontier vertex** into *settled* and pushes its neighbors onto the frontier.

--

## Dijkstra, step by step

<div><img src="../../topics/figures/wgraphs/wg-worked.svg" style="height:400px" alt="
   0→1(2)  0→2(5)  1→2(1)  1→3(7)  2→3(3)
   pop (0,0) → settle 0           PQ ∅
     relax 0→1: dist[1]=2         PQ (2,1)
     relax 0→2: dist[2]=5         PQ (2,1)(5,2)
   pop (2,1) → settle 1           PQ (5,2)
     relax 1→2: 2+1=3 < 5         PQ (3,2)(5,2) stale
     relax 1→3: dist[3]=9         PQ (3,2)(5,2)(9,3)
   pop (3,2) → settle 2           PQ (5,2)(9,3)
     relax 2→3: 3+3=6 < 9         PQ (5,2)(6,3)(9,3)
   pop (5,2) → 2 settled: SKIP    PQ (6,3)(9,3)
   pop (6,3) → settle 3           PQ (9,3)
   pop (9,3) → 3 settled: SKIP    PQ ∅ → done
   dist: 0 2 3 6      settle order: 0 1 2 3"></div>

<small>Entries are (dist, vertex). Improving a vertex **pushes a duplicate**: (5,2) goes stale the moment $1 \to 2$ finds $3 \lt 5$, and (9,3) when $2 \to 3$ finds $6 \lt 9$. Stale entries are **skipped at pop**.</small>

--

## Practice: settle order

<div><img src="../../topics/figures/wgraphs/wg-practice.svg" style="height:195px" alt="
   0→1 (4)   0→2 (1)   2→1 (2)   1→3 (3)"></div>

From 0: which vertex settles 2nd? What is `dist[1]`?

<details class="answer"><summary>Answer:</summary>

Settle 0 (dist 0) and relax: $\mathit{dist}[1] = 4$, $\mathit{dist}[2] = 1$. The nearest unsettled is **2** (dist 1): it **settles 2nd**. Relax $2 \to 1$: $1 + 2 = 3 \lt 4$, so **$\mathit{dist}[1] = 3$**. Then 1 settles (3), then 3 (6).

</details>

--

## Your turn: the course graph

<div><img src="../../topics/figures/wgraphs/wg-course.svg" style="height:250px" alt="
   0→1(4)  0→3(6)  1→2(1)  1→3(5)   2→3(8)  0→5(20)
   3→4(2)  3→7(11) 4→5(3)  5→6(9)   4→7(7)"></div>

From 0: which vertex settles 3rd? What is `dist[5]`?

<details class="answer"><summary>Answer:</summary>

The settle order starts 0 (0), 1 (4), **2 (5)**: **2 settles 3rd**. **$\mathit{dist}[5] = 11$**, via $0 \to 3 \to 4 \to 5$ ($6 + 2 + 3$), not the direct 20.

</details>

--

## Demo: Dijkstra

<div class="algo-viz" data-algo="dijkstra">
<pre class="viz-fallback">
   Dijkstra on the course's weighted digraph: repeatedly
   SETTLE the nearest unsettled vertex (label now final)
   and RELAX its out-edges. accent edges = the
   shortest-paths tree.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## Finding the min: a heap

The bottleneck is "which unsettled vertex is nearest?": a **min-heap priority queue**.

- `push` is a heap insert (swim): $O(\log V)$
- `top` and `pop` are a delete-min (sink): $O(\log V)$

In C++, `priority_queue` with `greater` is a min-heap. **This is why we built heaps first.**

--

## Lazy deletion

When we relax $v$, we **push a new** (smaller) entry: we don't update the old one. Old entries go **stale**, and the pop skips them:

```cpp
int u = pq.top().second;  pq.pop();
if (settled[u]) continue;             // a stale entry: skip it
```

Simpler than decrease-key; the duplicates cost only a log factor.

--

## Cost: the aligned count

| operation | how many | each |
|---|---|---|
| push | $\le E$ (one per improving relaxation) | $O(\log E)$ |
| pop | $\le E$ | $O(\log E)$ |
| edge scan | $\sum \text{out-deg} = E$ | $O(1)$ |
| settle | $V$ | $O(1)$ |

$$\log E \le \log V^2 = 2 \log V, \text{ so } O(\log E) = O(\log V)$$

$$\text{total} = O((V + E) \log V) = O(E \log V)$$

--

## The array-scan version

No priority queue: **scan all vertices** for the nearest unsettled one.

```cpp
void dijkstraArray(int s) {                   // no priority queue
    dist.assign(V, INF);  settled.assign(V, false);
    dist[s] = 0;
    for (int round = 0; round < V; round++) {
        int u = -1;                           // the nearest unsettled: O(V)
        for (int x = 0; x < V; x++)
            if (!settled[x] && (u == -1 || dist[x] < dist[u])) u = x;
        if (dist[u] == INF) break;            // the rest is unreachable
        settled[u] = true;
        for (Edge e : adj[u])                 // relax: O(deg u)
            if (dist[u] + e.w < dist[e.to]) dist[e.to] = dist[u] + e.w;
    }
}
```

$V$ rounds of an $O(V)$ scan: $O(V^2)$. **Better for dense graphs**: with $E \approx V^2$, $V^2 \lt E \log V$.

--

## Common Dijkstra bugs

- no **stale skip** → reprocessing old PQ entries (slow, or wrong with careless updates)
- **negative** weights → silently **wrong** answers
- lowering `dist[v]` but **not pushing** → the improvement never propagates
- settling on **push** instead of **pop** → a vertex is frozen while it could still improve

