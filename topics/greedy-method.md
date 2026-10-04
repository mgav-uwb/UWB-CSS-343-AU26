<!--
  TOPIC · The greedy method.
  Teaches: what a greedy algorithm is; making change with US coins; the same rule failing for coins {1, 3, 4}; when greedy is safe; when it fails.
  Needs:   nothing.
  Demos:   none
  Program: none
  Budget:  ~10 min, 6 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 1.
-->

### The greedy method

<small>(~10 min)</small>

--

## What is a greedy algorithm?

At each step, take the choice that looks **best right now**: commit, and **never reconsider**.

```text
   greedy(problem):
       while not solved:
           x = the locally BEST choice available
           commit to x               // never undone
           shrink the problem
```

No backtracking, no lookahead: **fast**. The catch: locally best ≠ globally best.

--

## Greedy that works: making change

Make **41¢** with **US coins** {25, 10, 5, 1}: **fewest** coins:

```text
   rule: take the LARGEST coin that fits; repeat

   41¢ → 25 + 10 + 5 + 1  =  4 coins   ✓ optimal
```

For US denominations, this greedy rule is **provably optimal: always**.

--

## The SAME rule fails: coins {1, 3, 4}

```text
   make 6:
   greedy:   4 + 1 + 1  =  3 coins
   optimal:  3 + 3      =  2 coins    ✗ greedy loses!
```

Same rule, different denominations → **wrong**. Greedy is a **strategy**, not a guarantee: every greedy algorithm needs a **proof**.

--

## When is greedy safe?

Two ingredients: both needed, both **proved per problem**:

- **greedy-choice property**: some optimal solution **contains** the locally-best choice (committing is safe)
- **optimal substructure**: after committing, what's left is a **smaller instance** of the same problem

**Here:** Dijkstra, greedy choice = *settle the __nearest__ unsettled vertex*. Proof at the end.

--

## When greedy fails

`{1, 3, 4}` making n: solved **exactly**, in three lines:

```text
   best[0] = 0
   best[n] = 1 + min( best[n−1], best[n−3], best[n−4] )

   n      0   1   2   3   4   5   6
   best   0   1   2   1   1   2   2    best[6] = 2: 3+3 ✓
```

Solve **every subproblem once**, build up: **dynamic programming**. Slower than greedy, needs no license.

