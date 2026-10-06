<!--
  TOPIC · Dijkstra's algorithm.
  Teaches: the greedy idea; why the nearest unsettled vertex is safe; settled and frontier vertices; the algorithm and a worked run; Dijkstra with a binary heap and lazy deletion; the cost; the O(V²) array-scan version; common bugs.
  Needs:   edge relaxation, binary heaps.
  Demos:   dijkstra (slide spec)
  Program: none
  Budget:  ~32 min, 15 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 4.
-->

### Dijkstra's algorithm

> Dijkstra published the algorithm in 1959 in a three-page paper that also gave the minimum spanning tree algorithm now credited to Prim.

<small>E. W. Dijkstra, “A Note on Two Problems in Connexion with Graphs,” Numerische Mathematik 1, 1959</small>

--

## The greedy idea

Repeatedly pick the **unsettled vertex with the smallest tentative distance**, declare it **settled** (final), and **relax its out-edges**.

```text
   settled  = shortest distance is now KNOWN
   frontier = tentative distances, still improving
```

<small>The greedy template, instantiated: **choice rule** = nearest unsettled vertex; **commitment** = the settled set.</small>

--

## Why the nearest is safe: intuition

When you settle the **nearest** unsettled vertex u, no other route to u can be shorter:

```text
   any other route must first EXIT the settled region
   through some other unsettled vertex: already as far
   as u: and then edges only ADD weight (≥ 0)
```

The correctness slides turn this into a real proof. **Nonnegativity is doing the work.**

--

## Once settled, never revisited

Because settling the nearest vertex makes its distance **final**:

- each vertex is **settled exactly once**
- stale PQ entries are **skipped**, never reprocessed
- one pass: not Bellman-Ford's V−1 rounds

Correctness of the greedy step is what **buys the speed**.

--

## Dijkstra: the algorithm

```text
dist[s] = 0;  all others ∞;  PQ = { (0, s) }
while (PQ not empty) {
    u = PQ.extractMin();          // nearest unsettled
    if (settled[u]) continue;     // stale entry: skip
    settled[u] = true;            // dist[u] is now FINAL
    for (Edge e : adj[u])         // relax out-edges
        if (!settled[e.to] && dist[u] + e.w < dist[e.to]) {
            dist[e.to] = dist[u] + e.w;
            PQ.push({ dist[e.to], e.to });
        }
}
```

--

## Settled vs frontier

```text
   settled:  { s }              dist final
   frontier: neighbors of s     tentative, in the PQ
   ∞:        everyone else       not yet discovered
```

Each iteration moves the **nearest frontier vertex** into *settled* and pushes its neighbors onto the frontier.

--

## Dijkstra: a worked example

PQ entries are **(dist, vertex)**: shown after **every** pop and push:

```text
   0→1(2)  0→2(5)  1→2(1)  1→3(7)  2→3(3)

   pop (0,0) → settle 0           PQ ∅
     relax 0→1: dist[1]=2         PQ (2,1)
     relax 0→2: dist[2]=5         PQ (2,1)(5,2)
   pop (2,1) → settle 1           PQ (5,2)
     relax 1→2: 2+1=3 < 5 ✓       PQ (3,2)(5,2) ← stale
     relax 1→3: dist[3]=9         PQ (3,2)(5,2)(9,3)
   pop (3,2) → settle 2           PQ (5,2)(9,3)
     relax 2→3: 3+3=6 < 9 ✓       PQ (5,2)(6,3)(9,3)
   pop (5,2) → 2 settled: SKIP    PQ (6,3)(9,3)
   pop (6,3) → settle 3           PQ (9,3)
   pop (9,3) → 3 settled: SKIP    PQ ∅ → done

   dist: 0 2 3 6      settle order: 0 1 2 3
```

<small>Improving a vertex **pushes a duplicate**: (5,2) goes stale the moment 1→2 finds 3 &lt; 5, (9,3) when 2→3 finds 6 &lt; 9: and stales are **skipped at pop**.</small>

--

## Practice: settle order

```text
   0→1 (4)   0→2 (1)   2→1 (2)   1→3 (3)

   from 0: which vertex settles 2nd?  what is dist[1]?
```

<details class="answer"><summary>Answer:</summary>

Settle 0 (0) → relax: 1=4, 2=1. Nearest unsettled is **2** (dist 1) → **settles 2nd**; relax 2→1: 1+2=3 &lt; 4 → **dist[1]=3**. Then settle 1 (3), then 3 (6).

</details>

--

## Your turn: the course graph

```text
   0→1(4)  0→3(6)  1→2(1)  1→3(5)   2→3(8)  0→5(20)
   3→4(2)  3→7(11) 4→5(3)  5→6(9)   4→7(7)

   from 0: which vertex settles 3rd?  what is dist[5]?
```

<details class="answer"><summary>Answer:</summary>

Settle order starts 0 (0), 1 (4), **2 (5)**: so **2 settles 3rd**. And **dist[5] = 11** via 0→3→4→5 = 6+2+3, beating the direct 0→5 = 20: a three-hop detour crushes the expensive direct edge.

</details>

--

## Demo: Dijkstra

<div class="algo-viz" data-algo="dijkstra">
<pre class="viz-fallback">
   Dijkstra on the course's weighted digraph: repeatedly
   SETTLE the nearest unsettled vertex (label now final)
   and RELAX its out-edges. accent edges = the
   shortest-paths tree.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## Finding the min: the binary heap

The bottleneck is "which unsettled vertex is nearest?": a **min-heap priority queue**:

```text
   push({dist, v})    → heap insert  (swim)   O(log V)
   extractMin()       → heap delMin  (sink)   O(log V)
```

In C++: `priority_queue<pair<long,int>, …, greater<>>`. **This is why we built heaps first.**

--

## Lazy deletion

When we relax v, we **push a new** (smaller) entry: we don't update the old one. Old entries go **stale**:

```text
   pop a vertex → already settled?  SKIP it (stale)
```

Simpler than decrease-key; the duplicates cost only a log factor.

--

## Cost: the aligned count

```text
   pushes:      ≤ E   (one per improving relaxation)
   pops:        ≤ E   (each O(log E))
   edge scans:  Σ out-deg = E
   settles:     V

   total = O( (V + E) · log V ) = O(E log V)

   log E ≤ log V² = 2·log V  : same order
```

--

## The array-scan version (O(V²))

No priority queue: just **scan all vertices** for the nearest unsettled one:

```text
   repeat V times:
       u = unsettled vertex with smallest dist   // O(V) scan
       settle u; relax its edges                  // O(deg u)
   total: O(V²)
```

Simpler; **better for dense graphs** (E ≈ V², where V² < E log V).

--

## Common Dijkstra bugs

- no **stale skip** → reprocessing old PQ entries (slow, or wrong with careless updates)
- **negative** weights → silently **wrong** answers
- lowering `dist[v]` but **not pushing** → the improvement never propagates
- settling on **push** instead of **pop** → a vertex is frozen while it could still improve

