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

> John Hopcroft and Robert Tarjan received the 1986 Turing Award “for fundamental achievements in the design and analysis of algorithms and data structures,” work built on depth-first search.

<small>ACM Turing Award citation, 1986</small>

--

## The search problem

Given a start vertex, **visit every vertex reachable** from it: exactly once.

The challenge vs a tree: graphs have **cycles** and **multiple paths**, so we must remember **who we've visited**.

Without a `visited[]` set, a search goes around a cycle **forever**.

--

## DFS: go deep, then backtrack

**Depth-first search** follows one path as far as it can, then **backtracks** and tries the next.

- from 0: dive to a neighbor, then *its* neighbor, …
- at a dead end (every neighbor visited): back up one step, try the next

It's **pre-order tree traversal**, generalized to graphs: the recursion IS the backtracking.

--

## DFS: recursive

```cpp
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

The directed diamond, lists ascending: $0 \to [1, 2]$, $1 \to [3]$, $2 \to [3]$, $3 \to []$

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-dfs-trace.svg" style="height:350px" alt="
   0 → 1        adj:  0 → [1,2]   1 → [3]
   ↓   ↓              2 → [3]     3 → []
   2 → 3
   dfs(0): visit 0 → dfs(1): visit 1 → dfs(3): visit 3
           back to 1 (done) → back to 0
           → dfs(2): visit 2 → 3 already seen, SKIP
   visit order: 0  1  3  2">
<div style="text-align:left; font-size:0.85em">

Visit order **0 1 3 2**

<span style="color:#7c5cff">purple</span>: being visited<br>
<span style="color:#8a93a6">grey</span>: on the stack<br>
<span style="color:#0a7d4d">green</span>: finished

</div>
</div>

--

## Your turn: order matters

Same diamond, but vertex 0 stores its list as `[2, 1]`. What is the DFS visit order now?

<div><img src="../../topics/figures/graphs/gr-dfs-turn.svg" style="height:170px" alt="
   0 → [2,1]   1 → [3]   2 → [3]   3 → []"></div>

<details class="answer"><summary>Answer:</summary>

Dive $0 \to 2 \to 3$, backtrack, then 1 (its edge to 3 is skipped): order **0 2 3 1**. The **set** of visited vertices never changes; the **order** depends on how each adjacency list is stored.

</details>

--

## DFS visits exactly the reachable set

**Claim:** `dfs(s)` marks $v$ $\iff$ a path $s \rightsquigarrow v$ exists.

<div style="font-size:0.85em">

- ($\Rightarrow$) DFS only moves along edges out of marked vertices: every mark is genuinely reached
- ($\Leftarrow$) suppose a reachable $w$ is missed. On a path $s \rightsquigarrow w$, let $q$ be the **first** missed vertex and $p$ the vertex before it ($p$ was visited). `dfs(p)` scanned **every** out-edge of $p$, including $p \to q$, so $q$ was visited. Contradiction. ∎

</div>

<img src="../../topics/figures/graphs/gr-dfs-reach.svg" style="height:80px; margin:4px auto" alt="
   s ⇝ p → q ⇝ w:  p visited, q the first missed vertex">

--

## DFS cost: cashing in the handshake lemma

Each vertex is visited once, and its **whole list** is scanned once:

$$
\begin{aligned}
\text{work} &= \sum\_{v} \bigl(1 + \deg(v)\bigr) = V + \sum\_{v} \deg(v) \\\\
&= V + 2E \qquad \text{(handshake lemma)} \\\\
&= \Theta(V + E)
\end{aligned}
$$

Linear in the size of the graph, and optimal: any search must at least **look** at every vertex and edge.

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

```cpp
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

A path of $10^6$ vertices needs $10^6$ stack frames: a **stack overflow**.

The **iterative** version keeps the stack on the **heap**: no such limit. Prefer it for very deep graphs.

--

## Connected components

Restart DFS from every **unvisited** vertex; each restart discovers one **component**:

```cpp
int countComponents(Graph& g) {
    vector<bool> seen(g.V, false);
    int count = 0;
    for (int v = 0; v < g.V; v++)
        if (!seen[v]) { count++; dfs(g, v, seen); }   // marks v's component
    return count;
}
```

<div><img src="../../topics/figures/graphs/gr-components.svg" style="height:160px" alt="
   0–1, 1–2, 0–2 | 3–4 | 5–6, 6–7: restarts at 0, 3, 5 → 3 components"></div>

--

## DFS in action: is t reachable?

```cpp
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

