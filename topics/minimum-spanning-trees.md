<!--
  TOPIC · Minimum spanning trees and the cut property.
  Teaches: spanning trees and their three facts; the MST problem and the running graph; uses (network design, clustering, the traveling-salesman bound); uniqueness; the cut property with the exchange proof, run on the running graph; the cycle property; the two algorithms as two choices of cut.
  Needs:   trees, weighted graphs, the greedy method.
  Demos:   none; figures mst-course, mst-running, mst-tied, mst-cut, mst-exchange, mst-cycle (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~20 min, 10 slides.
  Ported from Summer 2026 L11-mst-union-find.md, part 2.
-->

### Minimum spanning trees

> Nicos Christofides showed in 1976 that a minimum spanning tree, plus a minimum-weight matching on its odd-degree vertices, gives a traveling-salesman tour at most 1.5 times the shortest, when distances obey the triangle inequality.

<small>N. Christofides, “Worst-Case Analysis of a New Heuristic for the Travelling Salesman Problem,” Report 388, GSIA, Carnegie Mellon University, 1976</small>

--

## Spanning trees

A **spanning tree** of a connected undirected graph: a set of its edges that connects all $V$ vertices with **no cycle**.

- exactly $V - 1$ edges
- exactly **one path** between any two vertices
- remove an edge: disconnected; add an edge: exactly **one** cycle

Any two of *connected*, *acyclic*, *$V - 1$ edges* imply the third.

--

## The MST problem

A spanning tree of least total weight: a **minimum spanning tree (MST)**.

<div><img src="../../topics/figures/wgraphs/wg-mst-course.svg" style="height:260px" alt="
   0-1 (4)  0-3 (6)  0-5 (20)  1-2 (1)  1-3 (5)  2-3 (8)
   3-4 (2)  3-7 (11) 4-5 (3)   4-7 (7)  5-6 (9)"></div>

The course graph, undirected. **Which 7 of the 11 edges?**

--

## Its minimum spanning tree

<div><img src="../../topics/figures/wgraphs/wg-mst-running.svg" style="height:300px" alt="
   MST (thick): 1-2 (1), 3-4 (2), 4-5 (3), 0-1 (4), 1-3 (5), 4-7 (7), 5-6 (9)
   left out:    0-3 (6), 2-3 (8), 3-7 (11), 0-5 (20)"></div>

$1 + 2 + 3 + 4 + 5 + 7 + 9 = 31$. The weights are **distinct**, so this is the **only** MST.

--

## Uses

- **network design**: cable, pipes, roads, the wiring on a chip, at least total length
- **clustering**: delete the $k - 1$ heaviest MST edges and $k$ clusters remain (single-linkage)
- **a bound on a hard problem**: the **traveling-salesman problem (TSP)** wants the cheapest tour through every vertex. A tour minus one edge is a spanning tree, so **every tour weighs at least the MST**.

--

## Is the MST unique?

- all weights **distinct**: exactly one MST
- **ties**: possibly several, all of the **same** total weight

<div><img src="../../topics/figures/wgraphs/wg-mst-tied.svg" style="height:290px" alt="
   the four-cycle a-b, b-c, c-d, d-a, every weight 1
   the cut {a, b} is crossed by b-c and d-a, tied at 1
   any 3 of the 4 edges: a spanning tree of weight 3, so 4 MSTs"></div>

--

## The cut property

A **cut** splits the vertices in two; an edge **crosses** it if its ends are on different sides.

> A lightest edge crossing a cut is in some MST.

<div><img src="../../topics/figures/wgraphs/wg-mst-cut.svg" style="height:275px" alt="
   S = {0, 1, 2}  against  {3, 4, 5, 6, 7}
   crossing: 1-3 (5), 0-3 (6), 2-3 (8), 0-5 (20)
   the lightest, 1-3 (5), is in the MST"></div>

--

## The exchange proof

Let $e$ be a lightest edge crossing the cut, and $T$ an MST that does not use it.

1. adding $e$ to $T$ closes exactly one cycle
2. that cycle crosses the cut at $e$, so it crosses back at another edge $f$, with $w(f) \ge w(e)$
3. removing $f$ leaves a spanning tree: connected, $V - 1$ edges
4. its weight is $w(T) - w(f) + w(e) \le w(T)$, so it is an MST, and it contains $e$ ∎

--

## The exchange, run

<div><img src="../../topics/figures/wgraphs/wg-mst-exchange.svg" style="height:265px" alt="
   T leaves out e = 1-3 and uses f = 0-5 (20): weight 46
   T + e: the cycle 1-0-5-4-3-1 crosses the cut at e and at f
   T - f + e: weight 46 - 20 + 5 = 31"></div>

The cut {0, 1, 2}. $T$ uses $f$ = 0–5 (20) in place of $e$ = 1–3 (5); the swap saves 15.

--

## The cycle property

> The heaviest edge on a cycle is in no MST (distinct weights).

<div><img src="../../topics/figures/wgraphs/wg-mst-cycle.svg" style="height:220px" alt="
   the cycle 0-1-3: 0-1 (4), 1-3 (5), 0-3 (6)
   its heaviest edge, 0-3, is in no MST"></div>

Cut property: **take**. Cycle property: **skip**.

--

## Greedy, made safe

Both algorithms add one **safe** edge at a time: the lightest edge across some cut.

| | the cut | the edge it takes |
| - | ------- | ----------------- |
| **Kruskal** | a component against the rest | the lightest edge joining two components |
| **Prim** | the tree against the rest | the lightest edge leaving the tree |

Same theorem, two choices of cut.

