<!--
  TOPIC · Prim with an array: O(V²) for dense graphs.
  Teaches: best[v], the lightest edge from the tree to each outside vertex; each round scans for the minimum; O(V²), and when it beats the heap's O(E log V).
  Needs:   Prim's algorithm.
  Demos:   none
  Program: code/mst/mst.cpp (the slide's code, compiled and run on the course graph's matrix)
  Budget:  ~3 min, 1 slide. Lecture 13 mounts it as an appendix after the close.
-->

### Appendix: Prim with an array

> In 1957, the year of Prim's paper, H. Loberman and A. Weinberger published procedures for connecting terminals with the least total wire length.

<small>H. Loberman and A. Weinberger, “Formal Procedures for Connecting Terminals with a Minimum Total Wire Length,” JACM 4(4), 1957</small>

--

## Prim with an array: $O(V^2)$

<small>`best[v]`: the lightest edge from the tree to outside vertex $v$. Each round **scans** for the minimum.</small>

```cpp [6-8]
long primArray(const vector<vector<int>>& w, int s) {  // w[u][v], INF: none
    int n = w.size();
    vector<int> best(n, INF);  vector<bool> inTree(n, false);
    best[s] = 0;  long total = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;                           // the nearest outside vertex
        for (int v = 0; v < n; v++)
            if (!inTree[v] && (u == -1 || best[v] < best[u])) u = v;
        if (best[u] == INF) break;            // the rest is unreachable
        inTree[u] = true;  total += best[u];
        for (int v = 0; v < n; v++)           // cheaper ways in through u
            if (!inTree[v] && w[u][v] < best[v]) best[v] = w[u][v];
    }
    return total;
}
```

<small>$n$ rounds of $O(n)$ scans: $O(V^2)$, better than $O(E \log V)$ when $E$ is near $V^2$.</small>

