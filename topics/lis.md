<!--
  TOPIC · The longest increasing subsequence.
  Teaches: the problem (3 1 4 1 5 9 2 6: 4); why "the best of the first i" does not close and "the longest ending at i" does; the recurrence; the table drawn; the C++ with from[] for the read-back; reading a subsequence back; a practice (10 9 2 5 3 7 101 18: 4); the O(n log n) method, named.
  Needs:   the dynamic-programming method, the recipe (choosing the subproblem).
  Demos:   figures dp-lis, dp-lis-ex (tools/gen-dp-figures.mjs)
  Program: code/lis/lis.cpp
  Budget:  ~16 min, 8 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 3.
-->

### The longest increasing subsequence

> Patience sorting, named after a game of solitaire, finds the length of a longest increasing subsequence in O(n log n) time.

<small>D. Aldous and P. Diaconis, “Longest Increasing Subsequences: From Patience Sorting to the Baik–Deift–Johansson Theorem,” Bulletin of the AMS 36(4), 1999</small>

--

## The problem

A longest **strictly increasing** subsequence of an array:

`3 1 4 1 5 9 2 6`: `3 4 5 9`, `1 4 5 9` and `1 4 5 6` all have length **4**.

A subsequence keeps the order and may skip; "strictly" means equal values do not count as increasing.

--

## The first subproblem fails

Try $dp[i]$ = the LIS of the first $i$ elements. To extend it by $a[i]$, we need to know **the last element** of that subsequence, and $dp[i]$ does not say.

`3 1 4 1`: the LIS of the prefix is 2 (`3 4` or `1 4`); whether 2 extends it depends on which one.

--

## The subproblem that closes

$dp[i]$ = the length of the longest increasing subsequence **ending at** $i$:

$$dp[i] = 1 + \max\_{j \lt i,\\ a[j] \lt a[i]} dp[j] \quad (\text{or } 1 \text{ if there is no such } j)$$

The answer is $\max\_i dp[i]$: the longest may end anywhere.

--

## The table

<div><img src="../../topics/figures/dp/dp-lis.svg" style="height:170px" alt="
   a:  3 1 4 1 5 9 2 6
   dp: 1 1 2 1 3 4 2 4
   the longest end at 9 and at 6: length 4"></div>

$\max dp = 4$, ending at 9 or at 6.

--

## The LIS, in C++

```cpp
int lis(const vector<int>& a, vector<int>& dp, vector<int>& from) {
    int n = a.size(), best = 0;
    dp.assign(n, 1); from.assign(n, -1);            // from[i]: predecessor index
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++)
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) { // strict: increasing
                dp[i] = dp[j] + 1;                  // extend the run ending at j
                from[i] = j;
            }
        best = max(best, dp[i]);                    // answer lives anywhere
    }
    return best;                                    // 0 on an empty array
}
```

$\Theta(n^2)$ time, $\Theta(n)$ space.

--

## Reading it back

Start at an index with the largest $dp$, follow `from[]` to $-1$, and reverse:

`3 1 4 1 5 9 2 6`: the 9 (index 5) ← the 5 ← the 4 ← the 3: **3 4 5 9**.

--

## Your turn: an LIS

`10 9 2 5 3 7 101 18`: fill $dp$ and give one longest increasing subsequence.

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/dp/dp-lis-ex.svg" style="height:160px" alt="
   a:  10 9 2 5 3 7 101 18
   dp:  1 1 1 2 2 3 4   4
   length 4: 2 5 7 101 (or 2 3 7 18, ...)"></div>

Length **4**: `2 5 7 101`, or `2 3 7 18`.

</details>

