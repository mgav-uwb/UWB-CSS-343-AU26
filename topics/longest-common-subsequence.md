<!--
  TOPIC · Longest common subsequence.
  Teaches: subsequences and the problem (AGCAT, GAC: 2); subsequence against substring; brute force; the table of prefixes and the question how to extend it; last characters equal and last characters differ, each worked on AGCAT and GAC (different last characters can each be in an LCS, matched earlier; never to each other); dropped, not lost (an earlier match is counted already, a later one at the cell that reaches it); the recurrence with its table directions; why pairing a match is safe (an exchange); the lcs-tree demo; the table drawn and its four kinds of cell; std::max; the table in C++; the lcs demo; reading an LCS back (the traceback, in words); the table's invariants; a practice (ABCB, BDCB: 3); the cost and the two-row length; where LCS is used.
  Needs:   the dynamic-programming method, rod cutting.
  Demos:   lcs-tree (registry slug), lcs-lecture (the registry's LCS on AGCAT and GAC, slide spec in topics/demos.js); figures dp-lcs-table, dp-lcs-cases, dp-lcs-abcb (tools/gen-dp-figures.mjs)
  Program: code/lcs/lcs.cpp
  Budget:  ~40 min, 21 slides.
  Ported from Summer 2026 L14-dp-i.md, part 3.
-->

### Longest common subsequence

> Saul Needleman and Christian Wunsch published a dynamic program for aligning two protein sequences in 1970, the start of sequence alignment in biology.

<small>S. B. Needleman and C. D. Wunsch, Journal of Molecular Biology 48(3), 1970</small>

--

## The problem

A **subsequence** keeps the order of a string's characters but may skip some.

- `AC`, `GCT` and `AGCAT` are subsequences of `AGCAT`
- the **longest common subsequence** (LCS) of two strings is a longest string that is a subsequence of both

`AGCAT` and `GAC`: `AC`, `GC` and `GA` all have length **2**; nothing longer is common.

--

## Subsequence, not substring

| | `AGCAT` | must be contiguous? |
| --- | --- | --- |
| substring | `GCA` | yes |
| subsequence | `ACT` | no: skips allowed |

LCS allows gaps, which is what makes it measure similarity: a diff should not break a match because one line was inserted between two others.

--

## Brute force

Try every subsequence of `A` and test it against `B`:

- `A` with $m$ characters has $2^m$ subsequences
- each test scans `B`: $O(n)$

$O(n \cdot 2^m)$: for two 30-character strings, about $3 \times 10^{10}$ steps.

--

## A table of prefixes

Let's build a table: cell $L[i][j]$ is the length of the LCS of the first $i$ characters of `A` and the first $j$ of `B`.

| $i$ | $j$ | prefixes | an LCS | $L[i][j]$ |
| --: | --: | --- | --- | --: |
| 5 | 3 | `AGCAT`, `GAC` | `AC` | 2 |
| 4 | 2 | `AGCA`, `GA` | `GA` | 2 |
| 3 | 1 | `AGC`, `G` | `G` | 1 |
| 0 | 3 | empty, `GAC` | empty | 0 |

The answer is $L[m][n]$. **How do we extend it**: knowing the cells for shorter prefixes, what is $L[i][j]$?

--

## Last characters equal

Extend by looking at the **last** characters. `AGCA` and `GA` both end in `A`.

- pair the two `A`s: they end an LCS
- before them: an LCS of `AGC` and `G`, which is `G`

LCS = `G` then `A` = `GA`, so

$$L[4][2] = L[3][1] + 1 = 1 + 1 = 2$$

--

## Last characters differ

`AGCA` ends in `A`, `GAC` in `C`. Each can be **in** an LCS:

| LCS | uses the last | matched to | so it fits in |
| --- | --- | --- | --- |
| `GA` | `A` of `AGCA` | an **earlier** `A` of `GAC` | $L[4][2]$: drop `C` |
| `AC` | `C` of `GAC` | an **earlier** `C` of `AGCA` | $L[3][3]$: drop `A` |

They never match **each other** (`A` ≠ `C`), so every LCS leaves at least one of them out:

$$L[4][3] = \max(L[3][3],\\ L[4][2]) = \max(2, 2) = 2$$

--

## Dropped, not lost

Dropping a last character at one cell does not throw it away. If it is matched at all, it is matched to

- an **earlier** character of the other string: counted already, in the smaller cell
- a **later** character, past this prefix: counted at the cell that reaches it

`AGC` and `GA` end in `C` and `A`. The `C` matches the `C` of `GAC`, one column **later**: at $L[3][3]$ the last characters are equal, and it counts there, $L[2][2] + 1 = 2$.

--

## The recurrence

$$L[i][j] = \begin{cases} 0 & i = 0 \text{ or } j = 0 \\\\ L[i-1][j-1] + 1 & A[i-1] = B[j-1] \\\\ \max(L[i-1][j],\\ L[i][j-1]) & \text{otherwise} \end{cases}$$

| cell | in the table | drops |
| --- | --- | --- |
| $L[i-1][j-1]$ | **up-left** | both last characters |
| $L[i-1][j]$ | **up** | `A`'s last character |
| $L[i][j-1]$ | **left** | `B`'s last character |

Character $i$ of `A` is `A[i-1]`: strings count from 0.

--

## Why pairing a match is safe

`BAA` and `BA` end in `A`. The LCS `BA` may use the **middle** `A` of `BAA`; matching the **last** `A` instead still gives `BA`.

In general, if both prefixes end in `c`, any LCS

- uses at least one last `c`: else appending `c` makes it longer
- if it uses only one, rematch its final `c` to the other: same length

So some LCS ends with the pair:

$$L[i][j] = L[i-1][j-1] + 1$$

--

## Demo: the recursion

<div class="algo-viz" data-algo="lcs-tree" data-config='{"width":900,"height":230}'>
<pre class="viz-fallback">
   AGCAT against GAC as a recursion; a node is a prefix pair (i, j)
     a match: +1, one child          a mismatch: two children
     naive 27 nodes; memoized 19 visited, 16 distinct pairs
   at most (5 + 1)(3 + 1) = 24 pairs: the table
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The **green chain** is the traceback; its diagonal steps spell **AC**.</small>

--

## The table

<div><img src="../../topics/figures/dp/dp-lcs-table.svg" style="height:330px" alt="
          -  G  A  C
     -    0  0  0  0
     A    0  0  1  1
     G    0  1  1  1
     C    0  1  1  2
     A    0  1  2  2
     T    0  1  2  2
   L[5][3] = 2; the traceback spells AC"></div>

Row by row: each cell reads **up**, **left** and **up-left**, all filled already. The answer is the bottom-right cell.

--

## Four kinds of cell

<div><img src="../../topics/figures/dp/dp-lcs-cases.svg" style="height:200px" alt="
   a match: up-left + 1
   a mismatch where up is larger, where left is larger, and a tie"></div>

A match takes the diagonal plus 1; a mismatch takes the larger of up and left.

--

## [`std::max`, `std::min`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<algorithm>`: the larger, or the smaller, of two values of the **same type**.

```cpp
L[i][j] = max(L[i - 1][j], L[i][j - 1]);   // drop one: up / left
```

| call | gives | cost |
| --- | --- | --: |
| `max(a, b)` | the larger of `a` and `b` | $O(1)$ |
| `min(a, b)` | the smaller | $O(1)$ |
| `max({a, b, c})` | the largest in a list | $O(k)$ |

`max(1, 2L)` does not compile: `int` and `long` differ.

--

## The table, in C++

```cpp
// LCS table: L[i][j] = LCS length of A's first i chars and B's first j.
// Fill row by row -- up, left, and diagonal are ready when a cell needs them.
// Theta(mn) time and space.
int lcsLength(const string& A, const string& B, vector<vector<int>>& L) {
    int m = A.size(), n = B.size();         // the two lengths
    L.assign(m + 1, vector<int>(n + 1, 0)); // m + 1 rows of n + 1 zeros
    for (int i = 1; i <= m; i++)            // row 0 stays 0: A's empty prefix
        for (int j = 1; j <= n; j++)        // col 0 stays 0: B's empty prefix
            if (A[i - 1] == B[j - 1])       // the prefixes' last chars match?
                L[i][j] = L[i - 1][j - 1] + 1;             // match: diagonal + 1
            else                            // the last chars differ
                L[i][j] = max(L[i - 1][j], L[i][j - 1]);   // drop one: up / left
    return L[m][n];                         // bottom-right = the answer
}
```

The recurrence, line for line: $\Theta(mn)$ time and space.

--

## Demo: LCS

<div class="algo-viz" data-algo="lcs-lecture" data-config='{"width":900,"height":220}'>
<pre class="viz-fallback">
   LCS of AGCAT and GAC: fill the (m + 1) x (n + 1) table cell by cell;
   a match takes the diagonal + 1, otherwise the larger of up and left;
   then the traceback from the bottom-right spells an LCS: AC
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Then type your own pair: `SUNDAY SATURDAY` has an LCS of length 5.</small>

--

## Reading an LCS back

The table holds lengths. To recover a subsequence, walk from `L[m][n]` toward `L[0][0]`:

- characters equal: it is in the LCS; step **diagonally**
- otherwise: step to the **larger** of up and left
- the characters collected, reversed, spell an LCS

$O(m + n)$ steps, but it needs the **whole** table. Lecture 18 and PA3 build on this walk.

--

## Sanity checks

In a correct table:

- values **never decrease** going right or down: a longer prefix cannot lose common characters
- neighbours differ by **at most 1**: one more character adds at most one
- the bottom-right is the largest value

A table that breaks one of these has a bug.

--

## Worksheet: fill the table

`A = ABCB`, `B = BDCB`. Fill the table. What is the LCS length, and one LCS?

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/dp/dp-lcs-abcb.svg" style="height:250px" alt="
          -  B  D  C  B
     -    0  0  0  0  0
     A    0  0  0  0  0
     B    0  1  1  1  1
     C    0  1  1  2  2
     B    0  1  1  2  3
   length 3: BCB"></div>

Length **3**: `BCB`.

</details>

--

## The cost

$$(m + 1)(n + 1) \text{ cells} \times O(1) = \Theta(mn) \text{ time and space}$$

- the **length** alone needs only the previous row: two rows, $\Theta(\min(m, n))$ space
- the **subsequence** needs the whole table for the walk back

Two 30,000-line files: a full table of about 900 million cells, or two rows of 30,001.

--

## Where LCS is used

- **diff** and version control: the longest common sequence of lines (PA3)
- **sequence alignment**: DNA and protein similarity
- **spelling correction**: closeness of strings, with edit distance (Lecture 17)
- plagiarism detection, merge tools

