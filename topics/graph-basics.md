<!--
  TOPIC · Graphs: vocabulary and counting.
  Teaches: vertices and edges; undirected and directed graphs; degree, path, cycle, connected; the handshake lemma; the maximum number of edges; trees as the sparsest connected graphs.
  Needs:   nothing beyond sets.
  Demos:   none
  Program: none
  Budget:  ~17 min, 8 slides.
  Ported from Summer 2026 L08-graphs-bfs-dfs.md, parts 1.
-->

### Graphs: vocabulary and counting

> J. J. Sylvester coined the word “graph” in 1878, by analogy with the diagrams chemists drew of molecules.

<small>J. J. Sylvester, “Chemistry and Algebra,” Nature 17, 1878</small>

--

## What is a graph?

A **graph** $G = (V, E)$: a set of **vertices** $V$ and a set of **edges** $E$ connecting pairs of them.

<div style="display:flex; align-items:center; justify-content:center; gap:36px">
<img src="../../topics/figures/graphs/gr-ug4.svg" style="height:180px" alt="
   0 -- 1       V = { 0, 1, 2, 3 }
   |  / |       E = { 0–1, 0–2, 1–2, 1–3 }
   | /  |
   2    3       4 vertices, 4 edges, a cycle 0–1–2–0">
<div style="text-align:left">

$V = \lbrace 0, 1, 2, 3 \rbrace$

$E = \lbrace 0\text{–}1, 0\text{–}2, 1\text{–}2, 1\text{–}3 \rbrace$

4 vertices, 4 edges

</div>
</div>

The most general structure we've seen: and the data model for maps, social networks, the web, dependencies, circuits…

--

## Undirected vs directed

<div><img src="../../topics/figures/graphs/gr-directions.svg" style="height:170px" alt="
   undirected:  0 -- 1     edge goes both ways
   directed:    0 --> 1    edge has a direction"></div>

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

<div style="display:flex; align-items:center; justify-content:center; gap:36px">
<img src="../../topics/figures/graphs/gr-degrees.svg" style="height:165px" alt="
   our graph: degrees 2, 3, 2, 1 → sum 8 = 2·4 ✓">
<div style="text-align:left">

$$\sum\_{v \in V} \deg(v) = 2E$$

here: $2 + 3 + 2 + 1 = 8 = 2 \cdot 4$ ✓

</div>
</div>

In a **digraph**: $\sum \text{in-deg} = \sum \text{out-deg} = E$.

<small>Remember this: it drives the $\Theta(V + E)$ proofs for DFS and BFS.</small>

--

## How many edges can there be?

Simple undirected graph (no self-loops, no repeats):

$$0 \le E \le \binom{V}{2} = \frac{V(V-1)}{2} = \Theta(V^2) \qquad \text{(every pair)}$$

- **sparse**: $E = O(V)$: roads, social networks, the web
- **dense**: $E = \Theta(V^2)$: an all-pairs mesh

Real graphs are almost always **sparse**: that fact will pick our representation.

--

## Trees are the sparsest graphs

A **tree** = a connected **undirected** graph with **no cycles**:

- every tree on $V$ vertices has **exactly $V - 1$** edges
- two of connected, acyclic, $E = V - 1$ force the third
- one more edge makes a cycle; one fewer disconnects it

All our tree structures were special-case graphs; graphs remove the restrictions.

--

## Undirected matters

<div><img src="../../topics/figures/graphs/gr-shadow.svg" style="height:200px" alt="
   the directed diamond 1→2, 1→3, 2→4, 3→4: no directed cycle;
   drop the directions: the cycle 1–2–4–3–1"></div>

The directed diamond $1 \to 2$, $1 \to 3$, $2 \to 4$, $3 \to 4$ is connected with **no directed cycle**, yet it is **not** a tree: two paths reach 4, and $E = V$.

Acyclic *digraphs* are **DAGs**: a strictly bigger family than trees.

