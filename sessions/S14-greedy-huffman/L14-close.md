<!--
  CSS 343 · Autumn 2026 · Lecture 14, closing: recap and this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: greedy

- commit to the locally best choice; never reconsider
- correct when the problem has the **greedy-choice property** and **optimal substructure**
- prove it with an **exchange** or a **matching bound**; break it with a **counterexample**
- one room: **earliest finish**; fewest rooms: **start order**, the depth bound
- the **0/1 knapsack** defeats every fixed order; the **fractional** one is greedy

--

## Recap: Huffman

- prefix-free code = tree, symbols at leaves; cost $= \sum\_s f\_s \cdot d\_s$
- merge the **two lightest** trees, $n - 1$ times, with a min-heap: $O(n \log n)$
- **optimal**: Lemma 1 (an exchange), Lemma 2 (substructure), induction
- loses to a **text that disagrees** with its frequencies, and to the **table**

--

## This week

- **Homework 7** (union-find, Kruskal, Prim, activity selection, Huffman). **Due Sun Nov 22, 11:59 PM.**
- **Quiz 6:** Mon Nov 23, on Lectures 13 and 14, Homework 7 and PA2
- **PA3** (dynamic programming): design due **Mon Nov 30**, code due **Wed Dec 9**

