<!--
  TOPIC · Edge relaxation.
  Teaches: tentative distances; relaxing an edge; the invariant that dist never lies low; one primitive behind several algorithms; the order of relaxation matters; reconstructing a path from edgeTo.
  Needs:   shortest paths.
  Demos:   relax (slide spec); figure wg-relax-step (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~16 min, 9 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 3.
-->

### Edge relaxation

> Lester Ford's 1956 RAND report introduced the step now called relaxation: lower a vertex's distance whenever an edge offers a shorter route.

<small>L. R. Ford Jr., “Network Flow Theory,” RAND P-923, 1956</small>

--

## Tentative distances

Keep a **tentative** shortest distance `dist[v]` for every vertex:

- $\mathit{dist}[s] = 0$: the source costs nothing to reach from itself
- $\mathit{dist}[v] = \infty$ for every other $v$: no route known yet

As we explore, these only ever **decrease** toward the true answer.

--

## Edge relaxation: the core operation

"Relax" the edge $u \to v$ with weight $w$: **can we reach $v$ more cheaply via $u$?**

```cpp
void relax(int u, int v, int w) {     // the edge u -> v, weight w
    if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;        // a cheaper route to v
        parent[v] = u;                // remember how
    }
}
```

Every shortest-path algorithm is **relaxation, applied in some order**.

--

## Relaxation: a worked step

$\mathit{dist}[u] = 3$, $\mathit{dist}[v] = 10$, and the edge $u \to v$ has weight 4:

<div><img src="../../topics/figures/wgraphs/wg-relax-step.svg" style="height:190px" alt="
   dist[u] = 3,  dist[v] = 10,  edge u→v weight 4
   dist[u] + w = 3 + 4 = 7  <  10  →  RELAX
   dist[v] ← 7,  parent[v] ← u"></div>

Next time, if some path gives $\mathit{dist}[v] = 6$, we'd relax again to 6. `dist[v]` only falls.

--

## The invariant: dist never lies low

`dist[v]` is always the length of **some real path** $s \leadsto v$ (or $\infty$). With $\delta(v)$ the **true** shortest distance:

$$\delta(v) \le \mathit{dist}[v] \quad \text{(a real path cannot beat the best)}$$

Relaxation keeps it that way, since it writes

$$\mathit{dist}[u] + w \ge \delta(u) + w \ge \delta(v)$$

When **no edge relaxes** any more, every $\mathit{dist}[v] = \delta(v)$.

--

## One primitive, many algorithms

All shortest-path algorithms just relax edges: differing only in the **order**:

| algorithm | relaxation order | cost |
|---|---|---|
| **BFS** | by layer (unit weights) | $\Theta(V + E)$ |
| **DAG shortest paths** | topological order | $\Theta(V + E)$ |
| **Dijkstra** | nearest-first (greedy) | $O(E \log V)$ |
| **Bellman-Ford** | all edges, $V - 1$ rounds | $O(VE)$ |

--

## The order of relaxation matters

- **bad order**: the same edge must relax **many times** (Bellman-Ford: $V - 1$ full rounds)
- **right order**: process vertices **nearest-first**: each vertex is finished when its turn comes, each edge relaxes **once**

That "nearest-first" ordering **is Dijkstra**.

--

## Reconstructing the path

Relaxation records **`parent[v]`**: the edge that gave $v$ its best distance. To recover the path, follow parents back from $t$, then reverse:

```cpp
vector<int> pathTo(int t) {                   // parent[s] == -1
    vector<int> path;
    for (int v = t; v != -1; v = parent[v])   // t, parent[t], ..., s
        path.push_back(v);
    reverse(path.begin(), path.end());        // s ... t
    return path;
}
```

`dist[]` gives the cost; `parent[]` gives the route.

--

## Demo: Relaxation, visualized

<div class="algo-viz" data-algo="relax">
<pre class="viz-fallback">
   dist[0]=0  dist[1]=∞  dist[2]=∞  dist[3]=∞
   relax 0→1 (2):  0+2 < ∞   → dist[1]=2
   relax 0→2 (5):  0+5 < ∞   → dist[2]=5
   relax 0→3 (9):  0+9 < ∞   → dist[3]=9
   relax 1→3 (4):  2+4=6 < 9 → dist[3]=6  improved!
   relax 2→3 (8):  5+8=13 ≥ 6 → no change
   final: 0, 2, 5, 6
</pre>
</div>


