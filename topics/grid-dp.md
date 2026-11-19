<!--
  TOPIC · Grid DP.
  Teaches: the cheapest right/down path through a grid of costs; the recurrence derived from the last step; the edges; the table drawn; std::max and std::min; the C++; a practice grid; counting paths with a sum instead of a min (C(m+n-2, m-1)); blocked cells count 0; the C++ for counting; the grid-dp demo.
  Needs:   the dynamic-programming method; LCS (a two-index table).
  Demos:   grid-dp (registry slug); figures dp-grid-min, dp-grid-wall (tools/gen-dp-figures.mjs)
  Program: code/grid-dp/grid.cpp
  Budget:  ~22 min, 11 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 3.
-->

### Grid DP

> Blaise Pascal's *Traité du triangle arithmétique* of 1665 builds each number of his triangle as the sum of the two above it: the recurrence that counts paths across a grid.

<small>B. Pascal, *Traité du triangle arithmétique*, 1665</small>

--

## The cheapest path

A grid of costs; walk from the top-left cell to the bottom-right, moving only **right** or **down**. The cost of a path is the sum of the cells it visits, **both ends included**.

| | | |
| --: | --: | --: |
| 1 | 3 | 1 |
| 1 | 5 | 1 |
| 4 | 2 | 1 |

What is the cheapest path?

--

## Derive it: the last step

The last step into cell $(i, j)$ came from **above** or from the **left**. Whichever it was, the path up to it should be the cheapest one there:

$$dp[i][j] = \text{cost}[i][j] + \min(dp[i-1][j],\\ dp[i][j-1])$$

- $dp[0][0] = \text{cost}[0][0]$
- the top row has only a left neighbour; the left column only an upper one

--

## The table

<div><img src="../../topics/figures/dp/dp-grid-min.svg" style="height:230px" alt="
   cost: 1 3 1 / 1 5 1 / 4 2 1
   dp:   1 4 5 / 2 7 6 / 6 8 7
   the cheapest path, right, right, down, down, shaded in both: 7"></div>

Row by row: each cell adds its cost to the cheaper of up and left. The corner holds **7**.

--

## [`std::max`, `std::min`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<algorithm>`: the larger, or the smaller, of values of the **same type**.

| call | gives | cost |
| --- | --- | --: |
| `max(a, b)`, `min(a, b)` | the larger, the smaller | $O(1)$ |
| `max({a, b, c})` | the largest in a list | $O(k)$ |

`min(1, 2L)` does not compile: `int` and `long` differ.

--

## The cheapest path, in C++

```cpp
int minCostPath(const vector<vector<int>>& cost) {
    int m = cost.size(), n = cost[0].size();
    vector<vector<int>> dp(m, vector<int>(n));
    dp[0][0] = cost[0][0];                             // origin: no predecessor
    for (int j = 1; j < n; j++)
        dp[0][j] = cost[0][j] + dp[0][j-1];            // top edge: left only
    for (int i = 1; i < m; i++)
        dp[i][0] = cost[i][0] + dp[i-1][0];            // left edge: up only
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = cost[i][j] + min(dp[i-1][j],    // interior: choose
                                        dp[i][j-1]);
    return dp[m-1][n-1];
}
```

$\Theta(mn)$ time and space; one row is enough for the value alone.

--

## Your turn: a grid

Costs, row by row: `2 1 3` / `4 2 1` / `1 5 2`. Fill the table. What does the cheapest path cost, and does stepping to the cheaper neighbour find it?

<details class="answer"><summary>Answer:</summary>

$dp$: `2 3 6` / `6 5 6` / `7 10 8`.

**8**: right, down, right, down (2, 1, 2, 1, 2). Here greedy finds it; on the lecture's grid it pays 9 against 7.

</details>

--

## Counting paths

Same cells, same order, a **sum** instead of a min:

$$\text{paths}[i][j] = \text{paths}[i-1][j] + \text{paths}[i][j-1], \qquad \text{paths}[0][0] = 1$$

| | | |
| --: | --: | --: |
| 1 | 1 | 1 |
| 1 | 2 | 3 |
| 1 | 3 | **6** |

A path across an $m \times n$ grid is $m - 1$ downs among $m + n - 2$ steps: $\binom{m+n-2}{m-1}$. $3 \times 3$: $\binom{4}{2} = 6$; $4 \times 5$: $\binom{7}{3} = 35$.

--

## Blocked cells

A blocked cell holds **0** paths, so no path passes through it:

<div><img src="../../topics/figures/dp/dp-grid-wall.svg" style="height:220px" alt="
   3 x 3 with the centre blocked:
   1 1 1
   1 0 1
   1 1 2   two paths: around the top and around the left"></div>

The centre removes four of the six paths.

--

## Counting paths, in C++

```cpp
long long countPaths(const vector<vector<bool>>& blocked) {
    int m = blocked.size(), n = blocked[0].size();
    vector<vector<long long>> dp(m, vector<long long>(n, 0));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++) {
            if (blocked[i][j]) continue;               // stays 0
            if (i == 0 && j == 0) { dp[0][0] = 1; continue; }
            dp[i][j] = (i ? dp[i-1][j] : 0) + (j ? dp[i][j-1] : 0);
        }
    return dp[m-1][n-1];
}
```

The edges need no special loop: a missing neighbour contributes 0.

--

## Demo: grid DP

<div class="algo-viz" data-algo="grid-dp" data-config='{"width":900}'>
<pre class="viz-fallback">
   1 3 1 / 1 5 1 / 4 2 1: cheapest path 7 (cell + min(up, left))
   count paths: up + left; a 3 x 3 grid has 6, with the centre blocked 2
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Cheapest path** takes `min(up, left)`, **Count paths** takes `up + left`: the same table in the same order.</small>

