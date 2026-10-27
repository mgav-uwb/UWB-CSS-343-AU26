<!--
  TOPIC · The greedy method.
  Teaches: what a greedy algorithm is; making change with US coins; the same rule failing for coins {1, 3, 4}; when greedy is safe; when it fails.
  Needs:   nothing.
  Demos:   none; figure wg-coins (tools/gen-wgraph-figures.mjs)
  Program: none
  Budget:  ~10 min, 6 slides.
  Ported from Summer 2026 L09-graphs-dijkstra.md, parts 1.
-->

### The greedy method

> Jack Edmonds's 1971 paper “Matroids and the Greedy Algorithm” characterized exactly the structures on which the greedy method is always optimal.

<small>J. Edmonds, Mathematical Programming 1, 1971</small>

--

## What is a greedy algorithm?

At each step, take the choice that looks **best right now**: commit, and **never reconsider**.

1. take the locally **best** choice available
2. **commit** to it: it is never undone
3. **shrink** the problem, and repeat until it is solved

No backtracking, no lookahead: **fast**. The catch: the locally best choice is not always globally best.

--

## Making change, greedily

Make **41¢** from **US coins** {25, 10, 5, 1} with the **fewest** coins: take the **largest coin that fits**, repeat.

```cpp
// coins sorted largest first: {25, 10, 5, 1}
int greedyChange(const vector<int>& coins, int amount) {
    int count = 0;
    for (int c : coins)
        while (c <= amount) {         // the largest coin that still fits
            amount -= c;              // commit: never undone
            count++;
        }
    return count;
}
```

$41 = 25 + 10 + 5 + 1$: **4 coins**. For US coins this rule is **provably optimal, always**.

--

## The SAME rule fails: coins {1, 3, 4}

Make **6**:

$$\text{greedy: } 6 = 4 + 1 + 1 \quad \text{(3 coins)}$$

$$\text{optimal: } 6 = 3 + 3 \quad \text{(2 coins)}$$

Same rule, different denominations: **wrong**. Greedy is a **strategy**, not a guarantee: every greedy algorithm needs a **proof**.

--

## When is greedy safe?

Two ingredients: both needed, both **proved per problem**:

- **greedy-choice property**: some optimal solution **contains** the locally-best choice (committing is safe)
- **optimal substructure**: after committing, what's left is a **smaller instance** of the same problem

**Here:** Dijkstra, greedy choice = *settle the __nearest__ unsettled vertex*. Proof at the end.

--

## When greedy fails

Coins {1, 3, 4}: $\mathit{best}[n]$ = the fewest coins making $n$, and $\mathit{best}[0] = 0$. The **last** coin is a 1, 3 or 4:

$$\mathit{best}[n] = 1 + \min(\mathit{best}[n-1], \mathit{best}[n-3], \mathit{best}[n-4])$$

<div><img src="../../topics/figures/wgraphs/wg-coins.svg" style="height:175px" alt="
   best[0] = 0
   best[n] = 1 + min( best[n−1], best[n−3], best[n−4] )
   n      0   1   2   3   4   5   6
   best   0   1   2   1   1   2   2    best[6] = 2: 3+3"></div>

Solve **every subproblem once**, build up: **dynamic programming**. Slower than greedy, needs no license.

