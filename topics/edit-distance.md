<!--
  TOPIC · Edit distance.
  Teaches: the problem (kitten to sitting: 3); the recurrence derived from the last operation; why a match takes the diagonal (neighbours differ by at most 1); base row and column; the table and its four kinds of cell drawn; two cells by hand; the table in C++; the edit-distance demo; the edit script read back; several optimal scripts (ab to ba); edit distance against LCS; the metric axioms; weighted edits; uses.
  Needs:   longest common subsequence, knapsack (std::max and std::min).
  Demos:   edit-distance (registry slug); figures dp-ed-table, dp-ed-cases, dp-ed-ab, dp-ed-weighted (tools/gen-dp-figures.mjs)
  Program: code/edit-distance/edit.cpp
  Budget:  ~40 min, 16 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 2.
-->

### Edit distance

> Vladimir Levenshtein defined the distance in 1965 while studying codes that correct bits deleted or inserted in transmission.

<small>V. I. Levenshtein, “Binary Codes Capable of Correcting Deletions, Insertions, and Reversals,” Soviet Physics Doklady 10(8), 1966</small>

--

## The problem

The fewest single-character **edits** that turn string $a$ into string $b$:

- **insert** a character
- **delete** a character
- **replace** one character by another

`kitten` → `sitting`: replace k by s, replace e by i, insert g: **3**. No two edits will do.

--

## Derive it: the last operation

An optimal script turning $a[0..i)$ into $b[0..j)$ ends with one of:

- **delete** $a[i-1]$: then turn $a[0..i-1)$ into $b[0..j)$
- **insert** $b[j-1]$: then $a[0..i)$ into $b[0..j-1)$
- **replace** $a[i-1]$ by $b[j-1]$, or keep it **free** if they are equal: then $a[0..i-1)$ into $b[0..j-1)$

$$D[i][j] = \begin{cases} D[i-1][j-1] & \text{equal} \\\\ 1 + \min(D[i-1][j],\\ D[i][j-1],\\ D[i-1][j-1]) & \text{else} \end{cases}$$

--

## Why a match takes the diagonal

On a match the code takes $D[i-1][j-1]$ with **no** min. It can never lose:

- one more character changes the distance by at most 1, so neighbouring cells differ by **at most 1**
- so $D[i-1][j-1] \le D[i-1][j] + 1$ and $D[i-1][j-1] \le D[i][j-1] + 1$

The free diagonal is at least as good as either other option.

--

## Base cases

- $D[i][0] = i$: turning $i$ characters into nothing takes $i$ deletes
- $D[0][j] = j$: turning nothing into $j$ characters takes $j$ inserts

The first row and column count, unlike LCS's zeros.

--

## The table

<div><img src="../../topics/figures/dp/dp-ed-table.svg" style="height:360px" alt="
        -  s  i  t  t  i  n  g
    -   0  1  2  3  4  5  6  7
    k   1  1  2  3  4  5  6  7
    i   2  2  1  2  3  4  5  6
    t   3  3  2  1  2  3  4  5
    t   4  4  3  2  1  2  3  4
    e   5  5  4  3  2  2  3  4
    n   6  6  5  4  3  3  2  3
   D[6][7] = 3; the green path is one optimal script"></div>

--

## Four kinds of cell

<div><img src="../../topics/figures/dp/dp-ed-cases.svg" style="height:380px" alt="
   a match: copy the diagonal
   a replace: 1 + the diagonal
   a delete: 1 + the cell above
   an insert: 1 + the cell to the left"></div>

--

## Two cells by hand

`k` → `s`, and k ≠ s:

$$D[1][1] = 1 + \min(D[0][1], D[1][0], D[0][0]) = 1 + \min(1, 1, 0) = 1$$

`ki` → `s`, and i ≠ s:

$$D[2][1] = 1 + \min(D[1][1], D[2][0], D[1][0]) = 1 + \min(1, 2, 1) = 2$$

The first is one replace; the second, a replace and a delete.

--

## The table, in C++

```cpp
int editDistance(const string& a, const string& b, vector<vector<int>>& D) {
    int m = a.size(), n = b.size();
    D.assign(m + 1, vector<int>(n + 1, 0));
    for (int i = 0; i <= m; i++) D[i][0] = i;         // base: delete all of a
    for (int j = 0; j <= n; j++) D[0][j] = j;         // base: insert all of b
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a[i-1] == b[j-1])
                D[i][j] = D[i-1][j-1];                // match: free diagonal
            else
                D[i][j] = 1 + min({D[i-1][j],         // delete a[i-1]
                                   D[i][j-1],         // insert b[j-1]
                                   D[i-1][j-1]});     // replace a[i-1]->b[j-1]
    return D[m][n];
}
```

LCS's loops with a min of three: $\Theta(mn)$.

--

## Demo: edit distance

<div class="algo-viz" data-algo="edit-distance" data-config='{"width":900,"height":210}'>
<pre class="viz-fallback">
   kitten to sitting: a match copies the diagonal; otherwise 1 + min(up, left, diagonal)
   the bottom-right is 3; the walk back reads the script: 2 replaces and 1 insert
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Then try `MONDAY SUNDAY` (2) and your own pairs.</small>

--

## The edit script

From $D[m][n]$ to $(0, 0)$, step to a neighbour that **explains** the value; reverse:

| step | when | operation |
| --- | --- | --- |
| up-left | equal characters, same value | match (free) |
| up-left | value one more | replace |
| up | value one more | delete from $a$ |
| left | value one more | insert from $b$ |

`kitten` → `sitting`: replace k, match i t t, replace e, match n, insert g.

--

## More than one optimal script

<div><img src="../../topics/figures/dp/dp-ed-ab.svg" style="height:160px" alt="
   ab to ba, distance 2, three optimal walks:
   replace a by b and b by a
   insert b, match a, delete b
   delete a, match b, insert a"></div>

When two neighbours both explain a cell, both walks are optimal. A grader should check a script's **cost**, not its exact steps.

--

## Edit distance and LCS

| | LCS | edit distance |
| --- | --- | --- |
| goal | **most** characters kept | **fewest** edits |
| match | diagonal + 1 | diagonal, free |
| mismatch | $\max$(up, left) | $1 + \min$(up, left, diagonal) |

With insert and delete only, the distance is exactly $m + n - 2\\,\text{LCS}$. Replace can only help: kitten to sitting is $3 \le 6 + 7 - 2 \cdot 4 = 5$.

--

## A metric

With unit costs, for all strings $x, y, z$:

- $d(x, x) = 0$, and $d(x, y) > 0$ when $x \ne y$
- $d(x, y) = d(y, x)$: every edit can be undone by one edit
- $d(x, z) \le d(x, y) + d(y, z)$: run the two scripts one after the other

So strings with edit distance form a metric space: nearest-neighbour search and clustering apply.

--

## Weighted edits

<div><img src="../../topics/figures/dp/dp-ed-weighted.svg" style="height:300px" alt="
   kitten to sitting with a replace costing 2:
   the table's values change; the cheapest script now deletes and inserts"></div>

Each operation's cost in place of the 1s: the same table. Needleman and Wunsch's protein alignment is this, with a cost per pair of letters.

--

## Where it is used

- spelling correction and "did you mean": the nearest dictionary words
- record linkage: matching names typed differently
- DNA and protein alignment, with weighted edits
- version control and merge tools, alongside LCS

