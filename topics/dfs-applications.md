<!--
  TOPIC · DFS numbering and edge types.
  Teaches: discovery and finish times (pre-order and post-order numbers); the parenthesis property; the four edge types in a digraph (tree, back, forward, cross) decided by the color of the far end; a digraph has a cycle iff DFS finds a back edge; cycle detection with three colors; the undirected case.
  Needs:   DFS.
  Demos:   graph-dfs (slide spec, with a cyclic example)
  Program: none
  Budget:  ~25 min, 11 slides.
  The tree/back slide is ported from Summer 2026 L08-graphs-bfs-dfs.md, part 2; the rest is new for Autumn 2026.
  Every number on these slides was computed by a script (neighbors in increasing order).
-->

### DFS numbering and edge types

<small>(~25 min)</small>

--

## A clock for DFS

Give DFS one counter. Stamp each vertex **twice**: when its call starts and when it returns.

```cpp
int clock = 0;
void dfs(const Graph& g, int u) {
    color[u] = GRAY;  pre[u] = ++clock;     // discovered: on the stack
    for (int v : g.adj[u])
        if (color[v] == WHITE) dfs(g, v);
    color[u] = BLACK; post[u] = ++clock;    // finished: off the stack
}
// restart at every WHITE vertex, in index order, until none is left
```

**white** = not yet discovered · **gray** = on the recursion stack · **black** = finished

--

## Worked: one DFS, two numbers per vertex

Edges `0→1, 0→2, 1→2, 2→0, 3→1, 3→4, 4→5, 5→3`, neighbors in increasing order, starts at 0 then 3:

```text
   vertex      0     1     2     3     4     5
   pre         1     2     3     7     8     9
   post        6     5     4    12    11    10

   intervals:  0 [1 ......................... 6]   3 [7 ................. 12]
               1    [2 .............. 5]           4    [8 ........ 11]
               2       [3 ..... 4]                 5       [9 . 10]
```

--

## The parenthesis property

For any two vertices u and v, the intervals **[pre, post]** are either **nested** or **disjoint**, never overlapping:

- nested, `[pre[u] ... [pre[v] ... post[v]] ... post[u]]`: v is a **descendant** of u in the DFS forest
- disjoint: neither is an ancestor of the other

Why: the calls form a stack. If v is discovered while u is gray, v's call starts and returns **inside** u's call.

--

## Four kinds of edges

When DFS examines an edge **u → v**, the color of **v** decides its type:

| v is | type | meaning |
| --- | --- | --- |
| white | **tree** | DFS recurses into v |
| gray | **back** | v is an ancestor still on the stack |
| black, pre[u] < pre[v] | **forward** | a finished descendant of u |
| black, pre[v] < pre[u] | **cross** | finished earlier, elsewhere |

In the example: tree `0→1, 1→2, 3→4, 4→5` · back `2→0, 5→3` · forward `0→2` · cross `3→1`.

--

## Tree edges vs back edges

DFS classifies every edge it examines:

- **tree edge**: leads to an **unvisited** vertex (we recurse) → forms the DFS tree
- **back edge**: leads to a vertex **still on the recursion stack** (an ancestor) → a **cycle!**

```text
   tree edge:  0 → 1 (new)      back edge: 2 → 0 (ancestor)
```

--

## Theorem: a cycle exists if and only if DFS finds a back edge

**Back edge ⇒ cycle.** v is an ancestor of u: tree edges lead from v down to u, and u → v closes the loop.

**Cycle ⇒ back edge.** Let v be the **first** cycle vertex DFS discovers, u its predecessor on the cycle. When v turns gray, the rest of the cycle is white and reachable from v, so u is discovered **inside** v's call. When u examines u → v, v is still gray: a back edge.

--

## Cycle detection with three colors

```cpp
// true if some cycle is reachable from u
bool hasCycleFrom(const Graph& g, int u, vector<int>& color) {
    color[u] = GRAY;
    for (int v : g.adj[u]) {
        if (color[v] == GRAY) return true;                      // back edge
        if (color[v] == WHITE && hasCycleFrom(g, v, color)) return true;
    }
    color[u] = BLACK;
    return false;
}
```

Two colors are **not** enough: with a single visited flag, the forward edge `0→2` and the cross edge `3→1` look exactly like a back edge.

--

## Demo: watch DFS find the back edges

<div class="algo-viz" data-algo="graph-dfs" data-example="0 1, 0 2, 1 2, 2 0, 3 1, 3 4, 4 5, 5 3">
<pre class="viz-fallback">
DFS from 0 on 0→1, 0→2, 1→2, 2→0, 3→1, 3→4, 4→5, 5→3:
  2→0 finds 0 on the stack: back edge, a cycle (0 1 2)
DFS from 3 later:  5→3 finds 3 on the stack: back edge, a cycle (3 4 5)
</pre>
</div>


--

## Undirected graphs: only two kinds

In an undirected graph, every non-tree edge is a **back** edge; forward and cross edges cannot occur.

But each edge appears **twice** in the adjacency list: the edge back to the vertex we just came from is the **tree edge seen from below**, not a cycle.

```cpp
for (int v : g.adj[u]) {
    if (v == parent) continue;          // the tree edge we arrived by
    if (visited[v]) return true;        // any other visited neighbor: a cycle
    ...
}
```

--

## Your turn: classify the edges

Edges `0→1, 0→4, 1→2, 2→3, 3→1, 4→3, 4→5, 5→0`, neighbors in increasing order, DFS from 0.

Give pre and post for every vertex, then the type of each edge.

<small>pre/post: 0 [1,12] · 1 [2,7] · 2 [3,6] · 3 [4,5] · 4 [8,11] · 5 [9,10]. Tree 0→1, 1→2, 2→3, 0→4, 4→5 · back 3→1, 5→0 · cross 4→3 · no forward edges. Two back edges: two cycles found.</small> <!-- .element: class="fragment" -->

