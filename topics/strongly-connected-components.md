<!--
  TOPIC · Strongly connected components.
  Teaches: mutual reachability; strongly connected components as the classes of an equivalence relation; the component graph is a DAG; Kosaraju's two-pass algorithm (DFS on G for reverse post-order, then DFS on the transpose in that order); why the order matters; Θ(V + E) cost; uses.
  Needs:   DFS numbering and edge types, topological sort.
  Demos:   scc (registry demo, slide spec in demos.js)
  Program: none
  Budget:  ~21 min, 11 slides.
  New for Autumn 2026; follows textbook/graphs/algo-strongly-connected-components.html (same pass order).
  Every number on these slides was computed by a script (neighbors in increasing order).
-->

### Strongly connected components

> S. Rao Kosaraju found the two-pass algorithm in 1978 but did not publish it; Micha Sharir published it independently in 1981.

<small>M. Sharir, Computers & Mathematics with Applications 7, 1981</small>

--

## Strongly connected

In a digraph, $u$ and $v$ are **strongly connected** if there is a path $u \rightsquigarrow v$ **and** a path $v \rightsquigarrow u$.

This is an **equivalence relation**:

- reflexive: $u \rightsquigarrow u$ by the empty path
- symmetric: by definition
- transitive: $u \rightsquigarrow v \rightsquigarrow w$ and $w \rightsquigarrow v \rightsquigarrow u$

So it splits the vertices into classes: the **strongly connected components** (SCCs).

--

## Example: three components

Edges $0 \to 1$, $0 \to 2$, $1 \to 6$, $2 \to 4$, $3 \to 6$, $3 \to 7$, $4 \to 2$, $5 \to 3$, $6 \to 0$, $7 \to 1$, $7 \to 5$:

<div><img src="../../topics/figures/graphs/gr-scc-example.svg" style="height:230px" alt="
   { 3, 5, 7 }  ──3→6, 7→1──▶  { 0, 1, 6 }  ──0→2──▶  { 2, 4 }
   inside each:   3→7→5→3       0→1→6→0       2→4→2"></div>

The **component graph** (one node per SCC, an edge if any edge crosses) is always a **DAG**.

--

## One DFS is not enough

DFS from 3 reaches **every** vertex: it finds what is reachable, not what is **mutually** reachable.

DFS from 2 stays inside $\lbrace 2, 4 \rbrace$: starting in a **sink** component, the search cannot leak out.

**Idea:** start the searches in sink components first, peeling them off one at a time.

--

## Kosaraju's algorithm

1. Run DFS on $G$ (restart at every unvisited vertex); record the **reverse post-order**: vertices by finish time, latest first.
2. Build the **transpose** $G^{T}$: every edge reversed.
3. Run DFS on $G^{T}$, taking start vertices in the order from step 1. Each restart marks **exactly one SCC**.

```cpp
for (int s : reversePostOrder)              // from the DFS on G
    if (comp[s] == -1) { dfsMark(transpose, s, count); count++; }
```

--

## Kosaraju, pass 1

DFS on $G$ from 0, then restart at 3; the pills are post numbers:

<div><img src="../../topics/figures/graphs/gr-scc-pass1.svg" style="height:300px" alt="
   vertex   0   1   2   3   4   5   6   7
   post    10   5   9  16   8  14   4  15
   reverse post-order:  3  7  5  0  2  4  1  6"></div>

--

## Kosaraju, pass 2

DFS on $G^{T}$, start vertices in reverse post-order $3, 7, 5, 0, 2, 4, 1, 6$:

<div><img src="../../topics/figures/graphs/gr-scc-pass2.svg" style="height:260px" alt="
   start 3:  3, 5, 7        → SCC { 3, 5, 7 }
   start 0:  0, 6, 1        → SCC { 0, 1, 6 }
   start 2:  2, 4           → SCC { 2, 4 }
   (7, 5, 4, 1, 6 are already marked when their turn comes)"></div>

--

## Demo: Kosaraju, both passes

<div class="algo-viz" data-algo="scc">
<pre class="viz-fallback">
pass 1 (DFS on G):  finish order 6 1 4 2 0 5 7 3
transpose, then pass 2 in reverse post-order 3 7 5 0 2 4 1 6:
  start 3 → A = {3, 5, 7} · start 0 → B = {0, 1, 6} · start 2 → C = {2, 4}
component DAG: A → B → C
</pre>
</div>

--

## Why it works

**Claim.** If an edge leads from component $C$ to another component $D$, $C$'s largest finish time beats $D$'s.

- DFS enters $C$ first: it reaches all of $D$ before $C$'s first vertex finishes.
- DFS enters $D$ first: it cannot reach $C$ (the component graph is a DAG), so $D$ finishes before $C$ starts.

So the latest finisher sits in a **sink** component of $G^{T}$.

--

## Cost and uses

**Cost:** two DFS passes plus building $G^{T}$: $\boldsymbol{\Theta(V + E)}$ time, $\Theta(V + E)$ space.

Uses:

- **dependency cycles:** in a build or a spreadsheet, each SCC larger than one vertex is a set of items that depend on each other
- **condensing** a graph to its component DAG, then running DAG algorithms on it
- **web and social graphs:** the strongly connected core of the network

--

## Your turn: find the components

Edges $0 \to 1$, $1 \to 0$, $1 \to 2$, $2 \to 3$, $3 \to 4$, $4 \to 2$, $4 \to 5$; neighbors ascending. Run pass 1 (post numbers), then pass 2 on the transpose. How many SCCs?

<details class="answer"><summary>Answer:</summary>

<div style="display:flex; align-items:center; justify-content:center; gap:30px">
<img src="../../topics/figures/graphs/gr-scc-turn.svg" style="height:170px" alt="
   post: 0:12, 1:11, 2:10, 3:9, 4:8, 5:7 · reverse post-order 0 1 2 3 4 5
   pass 2 on Gᵀ: start 0 → {0, 1}; start 2 → {2, 3, 4}; start 5 → {5}">
<div style="text-align:left; max-width:380px; font-size:0.9em">

Reverse post-order 0 1 2 3 4 5; pass 2 starts at 0, 2 and 5: **three** SCCs, the path $\lbrace 0, 1 \rbrace \to \lbrace 2, 3, 4 \rbrace \to \lbrace 5 \rbrace$.

</div>
</div>

</details>

