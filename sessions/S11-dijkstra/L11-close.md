<!--
  CSS 343 · Autumn 2026 · Lecture 11, closing: recap and this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap

- a **greedy** algorithm commits to the locally best choice; it needs a proof
- **relaxation**: if dist[u] + w < dist[v], improve dist[v] and set edgeTo[v] = u
- **Dijkstra** settles the nearest unsettled vertex: Θ((V + E) log V) with a binary heap
- the proof needs **nonnegative** weights; Bellman-Ford handles negative ones

--

## This week

- **Homework 6** is out today. **Due Sun Nov 8, 11:59 PM.**
- **Midterm:** Mon Nov 9, in class, on paper, the full 120 minutes; covers Lectures 1 to 11. One hand-written sheet of notes, one side.
- **PA2** is due **Mon Nov 16, 11:59 PM**.

