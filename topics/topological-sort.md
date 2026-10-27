<!--
  TOPIC · Topological sort.
  Teaches: DAGs; topological order; a cycle rules it out; every DAG has a source; Kahn's algorithm and why it works; topological sort by DFS reverse post-order and its proof; many valid orders; Kahn against DFS; applications.
  Needs:   DFS numbering and edge types.
  Demos:   graph-topo (slide spec); the topo-line figure
  Program: none
  Budget:  ~38 min, 17 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 4.
-->

### Topological sort

> Stuart Feldman wrote make at Bell Labs in 1976. It rebuilds files in a topological order of their dependency graph.

<small>S. I. Feldman, “Make: A Program for Maintaining Computer Programs,” Software: Practice and Experience 9, 1979</small>

--

## Directed acyclic graphs (DAGs)

A **DAG** is a directed graph with **no cycles**:

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-topo-dag.svg" style="height:220px" alt="
   0 → 1 → 3       must come before relationships
   0 → 2 → 3       (no way to loop back)">
<div style="text-align:left; max-width:380px">

"must come before" relationships, with no way to loop back

</div>
</div>

DAGs model **dependencies**: course prerequisites, build order, spreadsheet formulas, package installs.

--

## Topological order

A **topological order** lists the vertices so that **every edge points forward**: $u$ before $v$ for each $u \to v$.

<div><img src="../../topics/figures/graphs/gr-topo-orders.svg" style="height:150px" alt="
   0 → 1 → 3,  0 → 2 → 3
   valid orders:  0 1 2 3   or   0 2 1 3"></div>

<div><img src="../../topics/figures/graphs/gr-topo-line.svg" style="height:170px" alt="
   the course DAG on a line in the order 0 1 2 3 4 5 6 7: every edge an arc pointing right"></div>

--

## A cycle kills it

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-topo-cycle.svg" style="height:260px" alt="
   a cycle  a → b → … → a  demands:
      a before b,  b before …,  … before a
   : no linear order can satisfy that">
<div style="text-align:left; max-width:420px">

A cycle $a \to b \to \cdots \to a$ demands $a$ before $b$, $b$ before $\cdots$, $\cdots$ before $a$: no order satisfies that.

</div>
</div>

So: topological order exists $\Rightarrow$ the graph is a DAG.

The converse (every DAG **has** one) needs an algorithm. First, a lemma.

--

## Lemma: every DAG has a source

A **source** = a vertex with in-degree 0. Proof it exists:

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-topo-source.svg" style="height:230px" alt="
   start anywhere; while the current vertex has ANY
   incoming edge, step BACKWARD along one:
        … → u → v      (v current → step to u)">
<div style="text-align:left; max-width:480px; font-size:0.8em">

Start anywhere; step **backward** along an incoming edge while one exists.

Never stuck? After $V$ steps, $V + 1$ vertices listed: one **repeats**, a cycle.

So the walk stops at a vertex with **no incoming edge**. ∎

</div>
</div>

--

## Kahn's algorithm

Repeatedly output a **source**, delete it, repeat:

```cpp
vector<int> kahn(const Graph& g) {
    vector<int> indeg(g.V, 0), order;
    for (int u = 0; u < g.V; u++)
        for (int v : g.adj[u]) indeg[v]++;
    queue<int> q;
    for (int u = 0; u < g.V; u++)
        if (indeg[u] == 0) q.push(u);       // the sources
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);                 // output u
        for (int v : g.adj[u])
            if (--indeg[v] == 0) q.push(v); // v's last prerequisite is out
    }
    return order;                           // fewer than V: a cycle
}
```

Output order = a topological order, in $\Theta(V + E)$.

--

## Why Kahn works

- a DAG **always has a source** (the lemma): no early stall
- deleting a vertex leaves a DAG: **induction** to the end
- $u \to v$ is deleted only when $u$ is **output**, so $u$ comes before $v$ ✓
- a cycle waits on itself: output stops **short**, fewer than $V$ vertices

--

## Kahn: a worked run

<div><img src="../../topics/figures/graphs/gr-kahn-run.svg" style="height:425px" alt="
   0 → 1  0 → 2  1 → 3  2 → 3    in-deg: 0:0 1:1 2:1 3:2
   queue [0]                 (only source: 0)
   out 0 → dec 1, 2 → both hit 0 → queue [1,2]
   out 1 → dec 3 → 3:1
   out 2 → dec 3 → 3:0 → queue [3]
   out 3
   order: 0 1 2 3   ✓  (all 4 output → no cycle)"></div>

All 4 output: no cycle.

--

## Your turn: Kahn on the course DAG

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-course.svg" style="height:220px" alt="
   0 → 1, 3, 5   2 → 3         4 → 5, 7
   1 → 2, 3      3 → 4, 7      5 → 6">
<div style="text-align:left; max-width:600px; font-size:0.9em">

In-degrees? First three vertices output?

<details class="answer"><summary>Answer:</summary>

In-degrees of 0 to 7: 0, 1, 1, 3, 1, 2, 1, 2. Output 0 frees 1; output 1 frees 2: **0, 1, 2**. A queue continues 3, 4, 5, 7, 6 (the demo, smallest ready vertex first: 3, 4, 5, 6, 7). Both are topological orders.

</details>

</div>
</div>

--

## Demo: topological sort

<div class="algo-viz" data-algo="graph-topo">
<pre class="viz-fallback">
   Kahn's algorithm: repeatedly remove a vertex with
   in-degree 0, output it, decrement its neighbors.
   add edge "6 2" and rebuild → a cycle → stuck vertices.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## Cycle detection: two free detectors

A digraph has a topological order **iff** it has no cycle. Both methods report cycles:

- **Kahn**: fewer than V vertices come out; the leftovers contain the cycle
- **DFS**: an edge to a vertex **still on the recursion stack** = a back edge = a cycle

--

## Topological sort via DFS

Run DFS; record each vertex's **post-order** (finish time); the answer is the **reverse** of post-order.

```cpp
void dfs(const Graph& g, int u, vector<bool>& seen, vector<int>& finished) {
    seen[u] = true;
    for (int v : g.adj[u])
        if (!seen[v]) dfs(g, v, seen, finished);
    finished.push_back(u);                  // u finishes: post-order
}
vector<int> topoOrder(const Graph& g) {
    vector<bool> seen(g.V, false);  vector<int> finished;
    for (int u = 0; u < g.V; u++)
        if (!seen[u]) dfs(g, u, seen, finished);
    reverse(finished.begin(), finished.end());
    return finished;                        // reverse post-order
}
```

A vertex finishes only **after** everything reachable from it, so it belongs **before** all of that.

--

## DFS post-order: worked

The diamond $0 \to 1$, $0 \to 2$, $1 \to 3$, $2 \to 3$, from 0:

<div><img src="../../topics/figures/graphs/gr-topo-post.svg" style="height:360px" alt="
   dfs(0) → dfs(1) → dfs(3): 3 finishes   (post #1)
            1 finishes                    (post #2)
            dfs(2): 3 seen → 2 finishes   (post #3)
            0 finishes                    (post #4)
   post-order: 3 1 2 0
   REVERSE →   0 2 1 3   ✓ a topological order"></div>

--

## Proof: why reverse post-order works

**Claim:** in a DAG, for **every** edge $u \to v$, $v$ finishes **before** $u$. When `dfs(u)` examines $u \to v$:

<div><img src="../../topics/figures/graphs/gr-topo-cases.svg" style="height:220px" alt="
   1. unvisited    → dfs(v) runs INSIDE dfs(u) → v finishes first
   2. finished     → v already done
   3. on the stack → v is an ancestor: v ⇝ u exists, plus u → v ⇒ a CYCLE: not a DAG"></div>

Reverse finish order $\Rightarrow$ $u$ before $v$, for every edge. ∎

--

## Many valid orders

Independent tasks can go in **either** order:

<div><img src="../../topics/figures/graphs/gr-topo-two.svg" style="height:190px" alt="
   0 → 1  0 → 2  1 → 3  2 → 3
   Kahn:              0 1 2 3
   reverse post-order: 0 2 1 3    : both valid"></div>

Unless the DAG is a single chain, the topological order is **not unique**.

--

## Kahn vs DFS post-order

| | Kahn (BFS-like) | DFS post-order |
|---|---|---|
| frontier | queue of sources | recursion / stack |
| detects a cycle | output stops short | back edge |
| feel | "peel off ready tasks" | "finish deep, reverse" |

Both $\boldsymbol{\Theta(V + E)}$, both detect cycles: pick by taste.

--

## Applications of topological sort

- **build systems** (Make, compilers): compile in dependency order
- **course prerequisites**: a valid class schedule
- **spreadsheets**: recompute cells in formula order
- **package managers**: install dependencies first
- **task scheduling** with precedence constraints

