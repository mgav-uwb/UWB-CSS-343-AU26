<!--
  CSS 343 · Autumn 2026 · Lecture 13, closing: recap and this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap

- **union-find**: weighting keeps every tree at most $\log\_2 n$ tall; path compression flattens it; together $O(\alpha(n))$ amortized per operation
- the **cut property**: the lightest edge across any cut is in some MST (the exchange proof)
- **Kruskal**: sort, then union-find as the cycle test: $O(E \log V)$
- **Prim**: one tree and a min-heap: $O(E \log V)$; $O(V^2)$ with an array scan (appendix)

--

## This week

- **PA2** is due **tonight, Mon Nov 16, 11:59 PM**.
- **Homework 7** (union-find, Kruskal, Prim, greedy algorithms, Huffman coding) opens Wed Nov 18. **Due Sun Nov 22, 11:59 PM.**
- **Quiz 6:** Mon Nov 23, on Lectures 13 and 14, Homework 7 and PA2

