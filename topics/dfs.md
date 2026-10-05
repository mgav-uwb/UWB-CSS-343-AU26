<!--
  TOPIC · Depth-first search.
  Teaches: the search problem; DFS recursive and iterative; DFS visits exactly the reachable set; the Θ(V + E) cost by the handshake lemma; recursion depth; connected components; reachability.
  Needs:   graph representations, recursion.
  Demos:   graph-dfs (slide spec)
  Program: none
  Budget:  ~34 min, 13 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 2.
-->

### Depth-first search

<small>(~34 min)</small>

--

## The search problem

Given a start vertex, **visit every vertex reachable** from it: exactly once.

The challenge vs a tree: graphs have **cycles** and **multiple paths**, so we must remember **who we've visited**.

```text
   without a visited[] set → infinite loop around a cycle
```

--

## DFS: go deep, then backtrack

**Depth-first search** follows one path as far as it can, then **backtracks** and tries the next.

```text
   from 0: dive to a neighbor, then ITS neighbor, …
   dead end (or all visited) → back up one, try the next
```

It's **pre-order tree traversal**, generalized to graphs: the recursion IS the backtracking.

--

## DFS: recursive

```text
void dfs(Graph& g, int u, vector<bool>& seen) {
    seen[u] = true;                 // visit u
    for (int v : g.adj[u])          // each neighbor
        if (!seen[v])
            dfs(g, v, seen);        // recurse (backtrack on return)
}
```

Mark, then recurse into each unvisited neighbor. The **call stack** does the backtracking.

--

## DFS: a worked trace

```text
   0 → 1        adj:  0 → [1,2]   1 → [3]
   ↓   ↓              2 → [3]     3 → []
   2 → 3

   dfs(0): visit 0 → dfs(1): visit 1 → dfs(3): visit 3
           back to 1 (done) → back to 0
           → dfs(2): visit 2 → 3 already seen, SKIP
   visit order: 0  1  3  2
```

--

## Your turn: order matters

Same diamond, but vertex 0 stores its list as `[2, 1]`:

```text
   0 → [2,1]   1 → [3]   2 → [3]   3 → []

   what is the DFS visit order now?
```

<details class="answer"><summary>Answer:</summary>

Answer: dive 0 → 2 → 3, backtrack, then 1 (its edge to 3 is skipped): order **0 2 3 1**. The **set** of visited vertices never changes; the **order** depends on how each adjacency list is stored.

</details>

--

## DFS visits exactly the reachable set

```text
   claim: dfs(s) marks v  ⟺  a path s ⇝ v exists

   (⇒) DFS only ever moves along edges out of marked
       vertices: every mark is genuinely reached
   (⇐) suppose some reachable w is missed. On a path
       s ⇝ w, let q be the FIRST missed vertex, and
       p the vertex before it (p was visited).
       dfs(p) scanned every out-edge of p: including
       p → q  →  q got visited. Contradiction. ∎
```

--

## DFS cost: cashing in the handshake lemma

Each vertex is visited once, and its **whole list** is scanned once:

```text
   work = Σ over v of ( 1  +  deg(v) )
        = Σ 1    +    Σ deg(v)
        =  V     +    2·E            ← handshake lemma
        = Θ(V + E)
```

Linear in the size of the graph: optimal: you must at least **look** at every vertex and edge.

--

## Demo: DFS

<div class="algo-viz" data-algo="graph-dfs">
<pre class="viz-fallback">
   DFS on the course DAG: dive along tree edges (bold),
   mark each vertex, BACK UP at a dead end. the second row
   shows the RECURSION STACK growing on the dive and
   shrinking as calls return.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## DFS: iterative (explicit stack)

```text
void dfs(Graph& g, int s) {
    stack<int> st; st.push(s);
    vector<bool> seen(g.V, false);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (seen[u]) continue;
        seen[u] = true;             // visit u
        for (int v : g.adj[u])
            if (!seen[v]) st.push(v);
    }
}
```

Same idea, an **explicit stack** instead of recursion.

--

## Recursion depth: a caveat

Recursive DFS uses the **call stack**: its depth = the longest path explored.

```text
   a 1,000,000-vertex path → 1,000,000 stack frames → 💥
```

The **iterative** version keeps the stack on the **heap**: no such limit. Prefer it for very deep graphs.

--

## Connected components

Restart DFS from every **unvisited** vertex; each restart discovers one **component**:

```text
   for v in 0..V-1:
       if not seen[v]:
           componentCount++
           dfs(v)         // labels this whole component
```

Counts components; labels which vertices are mutually reachable.

--

## DFS in action: is t reachable?

```text
bool reach(Graph& g, int s, int t, vector<bool>& seen) {
    if (s == t) return true;
    seen[s] = true;
    for (int v : g.adj[s])
        if (!seen[v] && reach(g, v, t, seen))
            return true;
    return false;
}
```

A tiny tweak to DFS answers "is there a path from s to t?"

