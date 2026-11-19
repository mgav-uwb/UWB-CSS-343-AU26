<!--
  CSS 343 · Autumn 2026 · Lecture 18, closing: recap, this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: table shapes

| shape | today | the choice | fill order |
| --- | --- | --- | --- |
| 1-D | coin change, LIS | the last coin; the previous element | left to right |
| 2-D grid | cheapest path, counting paths | from above or from the left | row by row |
| interval | matrix-chain order | the last split | by range length |

The choice decides the recurrence; the recurrence decides the order.

--

## Recap: reading back, and space

- traceback: from the answer, step to the choice that explains each cell, then reverse
- the walk needs the whole table; the value needs only the rows still read
- one-row knapsack: backward for 0/1, forward for unbounded
- Hirschberg: the solution in linear space, by divide and conquer

--

## This week

- **Homework 9** (knapsack table and items, edit distance, one-row knapsack, matrix chain): due **Sun Dec 6, 11:59 PM**
- **Quiz 8**, Mon Dec 7: Lectures 17 and 18 and Homework 9
- **PA3**: due **Wed Dec 9, 11:59 PM**
