<!--
  TOPIC · Representing a graph.
  Teaches: the adjacency matrix; the adjacency list; space and time of each; a graph interface in C++; the course graph.
  Needs:   graph basics.
  Demos:   graph-tour (slide spec)
  Program: none
  Budget:  ~14 min, 6 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 1.
-->

### Representing a graph

> In 2011 Facebook had 721 million active users and 69 billion friendships. An adjacency matrix would have held about 5 × 10<sup>17</sup> entries, fewer than one in three million of them nonzero.

<small>J. Ugander et al., “The Anatomy of the Facebook Social Graph,” arXiv:1111.4503, 2011</small>

--

## Adjacency matrix

`a[u][v] = 1` if there's an edge `u–v`, else 0:

```text
        0 1 2 3
     0 [0 1 1 0]      edge 0–1? → a[0][1] = 1
     1 [1 0 1 1]      Θ(1) lookup
     2 [1 1 0 0]
     3 [0 1 0 0]      space: Θ(V²)
```

**Edge query O(1)**, but **Θ(V²) space**: wasteful for sparse graphs.

--

## Adjacency list

One list of neighbors per vertex:

```text
   0 → [1, 2]        space: Θ(V + E)
   1 → [0, 2, 3]     iterate 1's neighbors: O(deg(1))
   2 → [0, 1]        edge query 0–2: scan 0's list
   3 → [1]
```

**Θ(V + E) space** and **fast neighbor iteration**: the default.

--

## Matrix vs list

| | matrix | list |
|---|---|---|
| space | Θ(V²) | **Θ(V + E)** |
| edge query u–v | **O(1)** | O(deg u) |
| iterate neighbors | O(V) | **O(deg u)** |
| best for | **dense** | **sparse** |

Real graphs are sparse → **adjacency list** by default. <small>(A third form (a plain list of edges) returns for Kruskal's minimum spanning tree algorithm.)</small>

--

## Graph ADT in C++

```text
struct Graph {
    int V;                          // number of vertices
    vector<vector<int>> adj;        // adj[u] = u's neighbors

    Graph(int n) : V(n), adj(n) {}
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);        // omit for a digraph
    }
};
```

--

## The course graph

```text
   0 → 1, 3, 5   2 → 3         4 → 5, 7      6 → -
   1 → 2, 3      3 → 4, 7      5 → 6         7 → -
```

<div class="algo-viz" data-algo="graph-tour">
<pre class="viz-fallback">
   V = 8, E = 11, no directed cycle: a DAG.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


