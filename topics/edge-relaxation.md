<!--
  TOPIC · Edge relaxation.
  Teaches: tentative distances; relaxing an edge; the invariant that dist never lies low; one primitive behind several algorithms; the order of relaxation matters; reconstructing a path from edgeTo.
  Needs:   shortest paths.
  Demos:   relax (slide spec)
  Program: none
  Budget:  ~16 min, 9 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 3.
-->

### Edge relaxation

<small>(~16 min)</small>

--

## Tentative distances

Keep a **tentative** shortest distance `dist[v]` for every vertex:

```text
   dist[s] = 0            (source: zero cost to itself)
   dist[v] = ∞            (everyone else: unknown so far)
```

As we explore, these only ever **decrease** toward the true answer.

--

## Edge relaxation: the core operation

"Relax" edge `u → v` with weight `w`: **can we reach v more cheaply via u?**

```text
   if (dist[u] + w < dist[v]) {
       dist[v] = dist[u] + w;      // found a cheaper route
       parent[v] = u;              // remember how
   }
```

Every shortest-path algorithm is **relaxation, applied in some order**.

--

## Relaxation: a worked step

```text
   dist[u] = 3,  dist[v] = 10,  edge u→v weight 4

   dist[u] + w = 3 + 4 = 7  <  10  →  RELAX
   dist[v] ← 7,  parent[v] ← u
```

Next time, if some path gives `dist[v] = 6`, we'd relax again to 6. `dist[v]` only falls.

--

## The invariant: dist never lies low

`dist[v]` is always the length of **some real path** s → v (or ∞):

```text
   δ(v) = the TRUE shortest distance

   δ(v)  ≤  dist[v]        a real path can't beat the best
   and relaxation keeps it that way:
   dist[u] + w  ≥  δ(u) + w  ≥  δ(v)
```

When **no edge relaxes** any more, every `dist[v] = δ(v)`.

--

## One primitive, many algorithms

All shortest-path algorithms just relax edges: differing only in the **order**:

| algorithm | relaxation order | cost |
|---|---|---|
| **BFS** | by layer (unit weights) | Θ(V+E) |
| **DAG-SP** | topological order | Θ(V+E) |
| **Dijkstra** | nearest-first (greedy) | O(E log V) |
| **Bellman-Ford** | all edges, V−1 rounds | O(V·E) |

--

## The order of relaxation matters

- **bad order** → the same edge must relax **many times** (Bellman-Ford: V−1 full rounds)
- **right order** → process vertices **nearest-first**: each vertex is finished when its turn comes, each edge relaxes **once**

That "nearest-first" ordering **is Dijkstra**.

--

## Reconstructing the path

Relaxation records **`parent[v]`**: the edge that gave v its best distance. To recover the path, follow parents back:

```text
   t → parent[t] → parent[parent[t]] → … → s
   reverse it → the shortest path s … t
```

`dist[]` gives the cost; `parent[]` gives the route.

--

## Demo: Relaxation, visualized

<div class="algo-viz" data-algo="relax">
<pre class="viz-fallback">
   dist[0]=0  dist[1]=∞  dist[2]=∞  dist[3]=∞
   relax 0→1 (2):  0+2 < ∞   → dist[1]=2
   relax 0→2 (5):  0+5 < ∞   → dist[2]=5
   relax 0→3 (9):  0+9 < ∞   → dist[3]=9
   relax 1→3 (4):  2+4=6 < 9 → dist[3]=6  improved!
   relax 2→3 (8):  5+8=13 ≥ 6 → no change
   final: 0, 2, 5, 6
</pre>
</div>


