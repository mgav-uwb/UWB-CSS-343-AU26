<!--
  TOPIC · Kruskal's algorithm.
  Teaches: cheapest edge first, skip cycles; union-find as the cycle test; the code; the full run on the course graph with its two skips and early stop; why each added edge is safe (the component cut); a disconnected graph gives a spanning forest; the cost; std::sort (a slide of its own, before the first code that uses it).
  Needs:   union-find, minimum spanning trees (the cut and cycle properties), sorting.
  Demos:   kruskal (slide spec); figures kruskal-sorted, kruskal-run-a, kruskal-run-b, kruskal-forest (tools/gen-wgraph-figures.mjs)
  Program: code/mst/mst.cpp (the slide's code, compiled and run on the course graph)
  Budget:  ~23 min, 10 slides.
  Ported from Summer 2026 L11-mst-union-find.md, part 3.
-->

### Kruskal's algorithm

> David Karger, Philip Klein and Robert Tarjan found in 1995 a randomized algorithm that computes a minimum spanning tree in expected time linear in the number of edges.

<small>D. R. Karger, P. N. Klein and R. E. Tarjan, “A Randomized Linear-Time Algorithm to Find Minimum Spanning Trees,” JACM 42(2), 1995</small>

--

## Cheapest edge first

Sort the edges by weight. Take each one **unless it closes a cycle**. Stop at $V - 1$ edges.

<div><img src="../../topics/figures/wgraphs/wg-kruskal-sorted.svg" style="height:100px" alt="
   by weight: 1-2 (1), 3-4 (2), 4-5 (3), 0-1 (4), 1-3 (5), 0-3 (6),
              4-7 (7), 2-3 (8), 5-6 (9), 3-7 (11), 0-5 (20)
   added: 1-2 3-4 4-5 0-1 1-3 4-7 5-6   skipped: 0-3 2-3   never examined: 3-7 0-5"></div>

- an edge closes a cycle **iff** its ends are **already connected**
- "already connected?" is union-find's `connected`

--

## [`std::sort`](../../textbook/foundations/foundation-stl-primer.html#sort)

```cpp
bool lighter(const Edge& a, const Edge& b) { return a.w < b.w; }
```

```cpp
sort(edges.begin(), edges.end(), lighter);  // cheapest first
```

- `<algorithm>`: sorts `[begin, end)` in place, $O(E \log\_2 E)$ comparisons
- `lighter(a, b)`: must `a` go **before** `b`? **Strict**: `<`, never `<=`
- equal weights come out in **any** order; `stable_sort` keeps input order

--

## Kruskal: the code

```cpp [9-12]
struct Edge { int u, v, w; };
bool lighter(const Edge& a, const Edge& b) { return a.w < b.w; }

vector<Edge> kruskal(int V, vector<Edge> edges) {
    sort(edges.begin(), edges.end(), lighter);  // cheapest first
    UF uf(V);
    vector<Edge> mst;
    for (const Edge& e : edges) {
        if (uf.connected(e.u, e.v)) continue;   // a cycle: skip it
        mst.push_back(e);                       // safe: take it
        uf.unite(e.u, e.v);
        if ((int)mst.size() == V - 1) break;    // the tree is complete
    }
    return mst;
}
```

The input is an **edge list**: Kruskal never needs adjacency lists.

--

## Kruskal's run (1)

<div><img src="../../topics/figures/wgraphs/wg-kruskal-run-a.svg" style="height:480px" alt="
   1-2 (1)  add, total 1
   3-4 (2)  add, total 3
   4-5 (3)  add, total 6       {3, 4, 5}
   0-1 (4)  add, total 10      {0, 1, 2}
   1-3 (5)  add, total 15      merges the two pieces
   0-3 (6)  SKIP: 0 and 3 already connected (cycle 0-1-3)"></div>

--

## Kruskal's run (2)

<div><img src="../../topics/figures/wgraphs/wg-kruskal-run-b.svg" style="height:260px" alt="
   4-7 (7)  add, total 22
   2-3 (8)  SKIP: cycle 2-1-3
   5-6 (9)  add, total 31     7 edges: stop"></div>

Seven edges, weight **31**: the tree is complete, so 3–7 (11) and 0–5 (20) are **never examined**.

--

## Practice: add or skip?

After 1–2, 3–4, 4–5 and 0–1, the components are {0, 1, 2}, {3, 4, 5}, {6} and {7}. Next come **1–3 (5)**, then **0–3 (6)**. Add or skip?

<details class="answer"><summary>Answer:</summary>

**1–3: add.** 1 is in {0, 1, 2} and 3 in {3, 4, 5}: different sets, so `unite` merges them into {0, 1, 2, 3, 4, 5}. **0–3: skip.** Now both ends are in that set: it would close the cycle 0–1–3–0.

</details>

--

## Why Kruskal's edges are safe

Kruskal adds $e = u\text{–}v$. The cut: $u$'s component $C$ just before, against the rest.

- an edge **lighter** than $e$ was examined **earlier**
- after that, its ends were in **one** component (it was added, or skipped because they already were)
- components only merge, so it does **not** cross the cut

So $e$ is a lightest crossing edge: safe by the **cut property**. ∎

--

## A spanning forest

<div><img src="../../topics/figures/wgraphs/wg-kruskal-forest.svg" style="height:340px" alt="
   0-1 (1) add, total 1
   1-2 (2) add, total 3
   3-4 (3) add, total 6
   0-2 (4) skip, a cycle
   3 edges, fewer than V - 1 = 4: a minimum spanning forest of weight 6"></div>

The edges run out after $V - c$ additions, for $c$ components: one MST **per component**.

--

## Demo: Kruskal

<div class="algo-viz" data-algo="kruskal" data-config='{"width":960,"layout":"row","cols":[580,380],"height":300,"labels":["the graph: accent edges = the MST so far","the union-find forest: same root, so skip"],"chrome":{"costsInline":true}}'>
<pre class="viz-fallback">
   edges cheapest-first: ADD an edge if its ends have
   different union-find roots, SKIP it if they share one
   (a cycle). the right panel is that union-find forest,
   merging as edges are added. MST weight 31.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

--

## Kruskal: the cost

| step | cost |
| ---- | ---- |
| sort the $E$ edges | $O(E \log E)$ |
| at most $E$ `connected` and $V - 1$ `unite` | $O(E \cdot \alpha(V))$ |
| **total** | $O(E \log E) = O(E \log V)$ |

$E \le V^2$, so $\log E \le 2 \log V$. The **sort** dominates: with edges already sorted, the rest is nearly linear.

