<!--
  CSS 343 · Autumn 2026 · Lecture 16, closing: recap, this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: dynamic programming

- recursion that **remembers**: each distinct subproblem solved once
- needs **overlapping subproblems** and **optimal substructure**
- memoize (top-down) or tabulate (bottom-up): the same table
- derive the recurrence from a **choice**: the first piece, the last characters
- cost = states × work per state: Fibonacci $\Theta(n)$, rod cutting $\Theta(n^2)$, LCS $\Theta(mn)$

--

## This week

- **Homework 8** (merge with inversion count, mergesort, Lomuto partition, quickselect, rod cutting, LCS length): due **Sun Nov 29, 11:59 PM**
- **Quiz 7**, Mon Nov 30: Lectures 15 and 16 and Homework 8
- **PA3 design**: due **Mon Nov 30, 11:59 PM**; today's LCS table is its core
