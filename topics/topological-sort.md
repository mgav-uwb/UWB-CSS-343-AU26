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

<small>(~38 min)</small>

--

## Directed acyclic graphs (DAGs)

A **DAG** is a directed graph with **no cycles**:

```text
   0 → 1 → 3       "must come before" relationships
   0 → 2 → 3       (no way to loop back)
```

DAGs model **dependencies**: course prerequisites, build order, spreadsheet formulas, package installs.

--

## Topological order

A **topological order** lists the vertices so that **every edge points forward** (u before v for each u → v).

```text
   0 → 1 → 3,  0 → 2 → 3
   valid orders:  0 1 2 3   or   0 2 1 3
```

The course DAG, lined up in topological order: **edges all point right**:

<div id="topo-line" style="max-width:860px;margin:0 auto"></div>

--

## A cycle kills it

```text
   a cycle  a → b → … → a  demands:
      a before b,  b before …,  … before a
  : no linear order can satisfy that
```

So: topological order exists **⟹** the graph is a DAG.

The converse (every DAG **has** one) needs an algorithm. First, a lemma.

--

## Lemma: every DAG has a source

A **source** = a vertex with in-degree 0. Proof it exists:

```text
   start anywhere; while the current vertex has ANY
   incoming edge, step BACKWARD along one:
        … → u → v      (v current → step to u)

   if you could always step, after V steps you'd have
   listed V+1 vertices → one REPEATS → a cycle. ✗ DAG!
```

So the walk gets stuck: at a vertex with **no incoming edge**. ∎

--

## Kahn's algorithm

Repeatedly output a **source**, delete it, repeat:

```text
   compute in-degree of every vertex
   queue all vertices with in-degree 0
   repeat: dequeue u → OUTPUT u
           for each edge u → v: in-degree(v)--
                if v hits 0 → enqueue v
```

Output order = a topological order. Θ(V + E).

--

## Why Kahn works

- a DAG **always has a source** (the lemma): no early stall
- deleting a vertex → still a DAG → **induction** to the end
- u → v is deleted only when u is **output** → u before v ✓
- a cycle waits on itself → output stops **short** (< V)

--

## Kahn: a worked run

```text
   0 → 1  0 → 2  1 → 3  2 → 3    in-deg: 0:0 1:1 2:1 3:2

   queue [0]                 (only source: 0)
   out 0 → dec 1, 2 → both hit 0 → queue [1,2]
   out 1 → dec 3 → 3:1
   out 2 → dec 3 → 3:0 → queue [3]
   out 3
   order: 0 1 2 3   ✓  (all 4 output → no cycle)
```

--

## Your turn: Kahn on the course DAG

```text
   0 → 1, 3, 5   2 → 3         4 → 5, 7
   1 → 2, 3      3 → 4, 7      5 → 6

   in-degrees?  first three vertices output?
```

<details class="answer"><summary>Answer:</summary>

In-degrees: 0:0 · 1:1 · 2:1 · 3:3 · 4:1 · 5:2 · 6:1 · 7:2. Only source: 0. Output 0 frees 1; output 1 frees 2 (and drops 3 to 2): **0, 1, 2**: and the full run continues 3, 4, 5, 6, 7.

</details>

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

```text
   dfs(u): … recurse into all of u's neighbors …
           on FINISHING u, push u onto a stack
   answer = pop the stack (reverse finish order)
```

A vertex finishes only **after** everything reachable from it → it belongs **before** all of that.

--

## DFS post-order: worked

```text
   0 → 1  0 → 2  1 → 3  2 → 3

   dfs(0) → dfs(1) → dfs(3): 3 finishes   (post #1)
            1 finishes                    (post #2)
            dfs(2): 3 seen → 2 finishes   (post #3)
            0 finishes                    (post #4)

   post-order: 3 1 2 0
   REVERSE →   0 2 1 3   ✓ a topological order
```

--

## Proof: why reverse post-order works

```text
   claim: in a DAG, for EVERY edge u → v,
          v finishes BEFORE u

   when dfs(u) examines the edge u → v, v is either
   1. unvisited    → dfs(v) runs INSIDE dfs(u)
                     → v finishes first            ✓
   2. finished     → v already done                ✓
   3. on the stack → v is an ancestor: v ⇝ u exists,
                     plus u → v  ⇒ a CYCLE: not a DAG ✗
```

Reverse finish order ⇒ u before v, for every edge. ∎

--

## Many valid orders

Independent tasks can go in **either** order:

```text
   0 → 1  0 → 2  1 → 3  2 → 3
   Kahn:              0 1 2 3
   reverse post-order: 0 2 1 3    : both valid
```

Unless the DAG is a single chain, the topological order is **not unique**.

--

## Kahn vs DFS post-order

| | Kahn (BFS-like) | DFS post-order |
|---|---|---|
| frontier | queue of sources | recursion / stack |
| detects a cycle | output stops short | back edge |
| feel | "peel off ready tasks" | "finish deep, reverse" |

Both **Θ(V + E)**, both detect cycles: pick by taste.

--

## Applications of topological sort

- **build systems** (Make, compilers): compile in dependency order
- **course prerequisites**: a valid class schedule
- **spreadsheets**: recompute cells in formula order
- **package managers**: install dependencies first
- **task scheduling** with precedence constraints

