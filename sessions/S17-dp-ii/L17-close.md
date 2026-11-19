<!--
  CSS 343 · Autumn 2026 · Lecture 17, closing: recap, this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: two more tables

| | knapsack | edit distance |
| --- | --- | --- |
| cell | $K[i][w]$: first $i$ items, capacity $w$ | $D[i][j]$: two prefixes |
| choice | take or skip the last item | the last operation |
| combine | $\max$ | $1 + \min$, or the free diagonal |
| edges | row and column 0 are 0 | row and column count |
| cost | $\Theta(nW)$, pseudo-polynomial | $\Theta(mn)$ |
| walk back | a cell unlike the one above: taken | a neighbour that explains the cell |

--

## This week

- **Homework 9** (knapsack table and items, edit distance, one-row knapsack, matrix chain): due **Sun Dec 6, 11:59 PM**
- **Quiz 8**, Mon Dec 7: Lectures 17 and 18 and Homework 9
- **PA3**: due **Wed Dec 9, 11:59 PM**
