<!--
  TOPIC · Graphs: vocabulary and counting.
  Teaches: vertices and edges; undirected and directed graphs; degree, path, cycle, connected; the handshake lemma; the maximum number of edges; trees as the sparsest connected graphs.
  Needs:   nothing beyond sets.
  Demos:   none
  Program: none
  Budget:  ~16 min, 7 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 1.
-->

### Graphs: vocabulary and counting

<small>(~16 min)</small>

--

## What is a graph?

A **graph** `G = (V, E)`: a set of **vertices** V and a set of **edges** E connecting pairs of them.

```text
   0 -- 1       V = { 0, 1, 2, 3 }
   |  / |       E = { 0–1, 0–2, 1–2, 1–3 }
   | /  |
   2    3       4 vertices, 4 edges, a cycle 0–1–2–0
```

The most general structure we've seen: and the data model for maps, social networks, the web, dependencies, circuits…

--

## Undirected vs directed

```text
   undirected:  0 -- 1     edge goes both ways
   directed:    0 --> 1    edge has a direction
```

- **undirected**: friendship, roads (two-way)
- **directed (digraph)**: web links, task order, one-way streets

--

## Vocabulary

- **adjacent**: two vertices joined by an edge
- **degree**: number of edges at a vertex (in-/out-degree for digraphs)
- **path**: a sequence of edges from one vertex to another
- **cycle**: a path that returns to its start
- **connected**: a path exists between every pair

--

## The handshake lemma

Each edge has exactly **2 endpoints**, so summing all degrees counts every edge **exactly twice**:

```text
   Σ deg(v) = 2·E

   our graph: degrees 2, 3, 2, 1 → sum 8 = 2·4 ✓
```

In a **digraph**: Σ in-deg = Σ out-deg = E. <br><small>Remember this: it drives the Θ(V + E) proofs for DFS and BFS.</small>

--

## How many edges can there be?

Simple undirected graph (no self-loops, no repeats):

```text
   0  ≤  E  ≤  V(V−1)/2 = Θ(V²)      (every pair)
```

- **sparse**: E = O(V): roads, social networks, the web
- **dense**: E = Θ(V²): an all-pairs mesh

Real graphs are almost always **sparse**: that fact will pick our representation.

--

## Trees are the sparsest graphs

A **tree** = a connected **undirected** graph with **no cycles**:

- every tree on V vertices has **exactly V − 1** edges
- two of {connected, acyclic, E = V−1} force the third
- +1 edge → a cycle · −1 edge → disconnected

<small>**Undirected matters.** The directed diamond `1→2, 1→3, 2→4, 3→4` is connected with **no directed cycle**: yet it is **not** a tree: two paths reach 4, and E = V. Acyclic *digraphs* are **DAGs**, a strictly bigger family.</small>

All our tree structures were special-case graphs; graphs remove the restrictions.

