<!--
  TOPIC · Traceback and space-saving.
  Teaches: every traceback in one pattern (start at the answer, step to the choice that explains the cell, reverse); stored choices against recomputed ones, drawn on an LCS table with stored arrows; what the traceback costs in space; keeping only the rows still read; std::swap; edit distance in two rows in C++; the one-row knapsack and why it sweeps backward (forward is the unbounded knapsack), counted on one item; value against solution; Hirschberg's divide and conquer for the solution in linear space; a practice choosing the table.
  Needs:   LCS, knapsack, edit distance, rod cutting.
  Demos:   figure dp-tb-help (tools/gen-dp-figures.mjs)
  Program: code/space-saving/rolling.cpp
  Budget:  ~26 min, 12 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 4, and the Traceback and Space-Saving chapter.
-->

### Traceback and space

> Dan Hirschberg showed in 1975 that a longest common subsequence, not just its length, can be found in space proportional to the strings' length.

<small>D. S. Hirschberg, “A Linear Space Algorithm for Computing Maximal Common Subsequences,” Communications of the ACM 18(6), 1975</small>

--

## Every traceback

1. start at the **answer** cell
2. step to the cell whose choice **explains** this one's value
3. stop at a base case
4. **reverse** the steps: they come out last first

| DP | a step goes to |
| --- | --- |
| rod cutting | `len - cut[len]` |
| LCS | diagonal on a match, else the larger of up and left |
| knapsack | the row above, at $w$ or $w - \text{weight}$ |
| edit distance | a neighbour exactly one less, or the free diagonal |

--

## Store the choice, or recompute it

<div><img src="../../topics/figures/dp/dp-tb-help.svg" style="height:215px" alt="
   LCS of HEAP and HELP with the arrow each cell stores (diagonal, up or left)
   the walk follows the arrows from the corner: HEP"></div>

- **store** an arrow per cell (`cut[]`, this table): the walk follows it
- **recompute** from the neighbours: no extra memory

--

## What the walk costs

The walk visits $O(m + n)$ cells, but it can visit **any** row. So it needs the **whole** table:

| | time | space |
| --- | --- | --- |
| fill | $\Theta(mn)$ | $\Theta(mn)$ |
| walk back | $O(m + n)$ | the same table |

Two 30,000-line files: about 900 million cells.

--

## Keep only the rows still read

Row $i$ of LCS, edit distance and knapsack reads only row $i - 1$. For the **value** alone, keep two rows and swap them:

- LCS and edit distance: $\Theta(\min(m, n))$ space
- knapsack: $\Theta(W)$
- Fibonacci: two variables

The walk back is then impossible: the rows it needs are gone.

--

## [`std::swap`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<utility>`: exchange two values.

```cpp
swap(prev, cur);                              // now the previous row
```

- afterwards `prev` holds `cur`'s old contents and `cur` holds `prev`'s
- two `vector`s swap their internal pointers: $O(1)$, whatever their length
- both arguments are variables of the same type

--

## Two rows, in C++

```cpp
int editDistanceValue(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<int> prev(n + 1), cur(n + 1);
    for (int j = 0; j <= n; j++) prev[j] = j;         // row 0: insert all of b
    for (int i = 1; i <= m; i++) {
        cur[0] = i;                                   // column 0: delete all
        for (int j = 1; j <= n; j++)
            cur[j] = (a[i-1] == b[j-1])
                       ? prev[j-1]                    // match: free diagonal
                       : 1 + min({prev[j],            // delete
                                  cur[j-1],           // insert
                                  prev[j-1]});        // replace
        swap(prev, cur);                              // now the previous row
    }
    return prev[n];                                   // the last computed row
}
```

kitten to sitting: **3**, in two rows of 8.

--

## One row for the knapsack

```cpp
int knapsackOneRow(const vector<int>& value, const vector<int>& weight, int W) {
    vector<int> K(W + 1, 0);                      // row 0: no items
    for (int i = 0; i < (int)value.size(); i++)
        for (int w = W; w >= weight[i]; w--)      // BACKWARD: each item once
            K[w] = max(K[w], value[i] + K[w - weight[i]]);
    return K[W];
}
```

The take reads $K[w - \text{weight}]$, to the **left**. Sweeping **right to left**, that cell still holds the **previous** row: item $i$ is not in it yet.

--

## Forward is the unbounded knapsack

One item, value 7, weight 3; $W = 9$:

| sweep | $K[0..9]$ after the item | $K[9]$ |
| --- | --- | --: |
| backward | 0 0 0 7 7 7 7 7 7 7 | **7**: one copy |
| forward | 0 0 0 7 7 7 14 14 14 21 | **21**: three copies |

Forward, $K[w - 3]$ may already include the item, so it is taken again: that is the **unbounded** knapsack.

--

## Value or solution?

| you need | keep | space |
| --- | --- | --- |
| the optimal **value** | the rows still read | $\Theta(n)$ or $\Theta(W)$ |
| the **solution**, by the walk | the whole table | $\Theta(mn)$ or $\Theta(nW)$ |
| the **solution**, in little space | Hirschberg (LCS, edit distance) | $\Theta(\min(m, n))$ |

Decide which before choosing the table.

--

## Hirschberg: both

LCS or edit distance, with the solution, in $\Theta(\min(m, n))$ space:

1. split $A$ at its middle row
2. a **forward** and a **backward** rolling-row pass score each column of that row
3. the best column is where an optimal path crosses it: split $B$ there
4. recurse on both halves

$\Theta(mn)$ time, about twice one fill.

--

## Your turn: which table?

1. the edit distance of two 1 GB DNA strings
2. the edit script between two 2,000-line files
3. how many lines changed between two 30,000-line files
4. the edit script for the files in 3

<details class="answer"><summary>Answer:</summary>

1. two rows: the value only
2. the whole table (4 million cells) and the walk
3. two rows: PA3's `--stat`
4. trim the common ends; then the table, or Hirschberg

</details>

