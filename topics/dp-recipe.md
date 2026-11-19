<!--
  TOPIC · The dynamic-programming recipe.
  Teaches: the five questions (subproblem, recurrence, base cases, order, answer) on Fibonacci, rod cutting and LCS; states, transitions and cost; value against solution; the common table shapes; common mistakes.
  Needs:   the dynamic-programming method, rod cutting, longest common subsequence.
  Demos:   none
  Program: none
  Budget:  ~14 min, 7 slides.
  Ported from Summer 2026 L14-dp-i.md, part 4.
-->

### The recipe

> “An optimal policy has the property that whatever the initial state and initial decision are, the remaining decisions must constitute an optimal policy with regard to the state resulting from the first decision.”

<small>R. Bellman, *Dynamic Programming*, Princeton University Press, 1957</small>

--

## Five questions

1. **subproblem**: what exactly does `dp[...]` mean?
2. **recurrence**: how is it built from smaller subproblems? Ask what the **last** (or first) decision is.
3. **base cases**: the smallest subproblems, answered directly
4. **order**: fill so every cell is ready before it is read
5. **answer**: which cell, and how to recover the solution behind it

--

## Today's three

| | Fibonacci | rod cutting | LCS |
| --- | --- | --- | --- |
| subproblem | $F(i)$ | `best[len]` | `L[i][j]`, two prefixes |
| recurrence | $F(i-1) + F(i-2)$ | max over first piece | diagonal + 1, or max |
| base | $F(0), F(1)$ | `best[0]` | row 0, column 0 |
| order | $i$ up | `len` up | row by row |
| answer | $F(n)$ | `best[n]`, `cut[]` | `L[m][n]`, the walk |

--

## States, transitions, cost

| | states | work per state | time | space |
| --- | --: | --- | --- | --- |
| Fibonacci | $n$ | $O(1)$ | $\Theta(n)$ | $\Theta(1)$ with two variables |
| rod cutting | $n$ | $O(n)$: every first piece | $\Theta(n^2)$ | $\Theta(n)$ |
| LCS | $mn$ | $O(1)$ | $\Theta(mn)$ | $\Theta(mn)$, or two rows for the length |

Time = states × work per state. No recurrence to solve.

--

## Value or solution?

- the table's cells hold optimal **values**
- the **choices** behind them come from a walk back from the answer cell: record the winning choice (`cut[]`) or recompute it (LCS)
- only the value needed: keep the rows still read
- the solution needed: keep the **whole** table

Decide which you need before choosing the space.

--

## Table shapes

| shape | subproblem | examples |
| --- | --- | --- |
| 1-D over a prefix or a size | `dp[i]` | Fibonacci, rod cutting, longest increasing subsequence |
| 2-D over two prefixes, or a prefix and a capacity | `dp[i][j]` | LCS, edit distance, 0/1 knapsack |
| intervals | `dp[i][j]` over `a[i..j]` | matrix-chain order, optimal BSTs |

A new problem that looks like one of these suggests its subproblem.

--

## Common mistakes

- a **vague subproblem**: the recurrence will not close
- **filling out of order**: reading a cell before it is written
- **off by one at the edges**: table index $i$ against string index $i - 1$
- **dynamic programming without overlap**: the cache never hits; it is just slower recursion

