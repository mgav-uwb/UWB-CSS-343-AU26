<!--
  TOPIC · Coin change.
  Teaches: the fewest coins for an amount; greedy fails on coins 1, 3, 4 (3 coins against 2 at 6); the recurrence derived from the last coin; the table drawn; unreachable amounts (coins 3, 5); the C++; a practice (coins 1, 4, 5 at 8: 2 against greedy's 4).
  Needs:   the dynamic-programming method, the knapsack (the unbounded variant).
  Demos:   figures dp-coin-134, dp-coin-35 (tools/gen-dp-figures.mjs)
  Program: code/coin-change/coin.cpp
  Budget:  ~12 min, 7 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 3.
-->

### Coin change

> Dexter Kozen and Shmuel Zaks showed in 1994 how to decide, for any set of coins, whether paying with the largest coin that fits always uses the fewest coins.

<small>D. Kozen and S. Zaks, “Optimal Bounds for the Change-Making Problem,” Theoretical Computer Science 123(2), 1994</small>

--

## The problem

Coins of given values, as many of each as needed. Pay amount $a$ with the **fewest** coins.

Coins $\lbrace 1, 3, 4 \rbrace$, amount 6:

- greedy, the largest coin that fits: $4 + 1 + 1$: **3** coins
- best: $3 + 3$: **2** coins

--

## Derive it: the last coin

The last coin paid is some $c \le a$; before it, $a - c$ was paid as cheaply as possible:

$$dp[a] = 1 + \min\_{c \le a,\\ dp[a - c] \text{ defined}} dp[a - c], \qquad dp[0] = 0$$

$dp[a]$ is **undefined** when no coins sum to $a$.

--

## The table

<div><img src="../../topics/figures/dp/dp-coin-134.svg" style="height:170px" alt="
   coins 1, 3, 4: dp[0..6] = 0 1 2 1 1 2 2
   candidates for dp[6]: coin 1 from dp[5] = 2 gives 3; coin 3 from dp[3] = 1 gives 2; coin 4 from dp[2] = 2 gives 3"></div>

$dp[6] = 2$: the coin 3 after $dp[3] = 1$.

--

## Unreachable amounts

<div><img src="../../topics/figures/dp/dp-coin-35.svg" style="height:170px" alt="
   coins 3, 5: dp[0..8] = 0, -, -, 1, -, 1, 2, -, 2
   1, 2, 4 and 7 cannot be paid"></div>

With $\lbrace 3, 5 \rbrace$, amounts 1, 2, 4 and 7 cannot be paid. A candidate counts only if $a - c$ **can** be paid.

--

## Coin change, in C++

```cpp
const int NONE = -1;
int coinChange(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, NONE);
    dp[0] = 0;                                       // base: no coins needed
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && dp[a - c] != NONE &&
                (dp[a] == NONE || dp[a - c] + 1 < dp[a]))
                dp[a] = dp[a - c] + 1;               // this coin used last
    return dp[amount];                               // NONE: not payable
}
```

$\Theta(\text{amount} \times \text{coins})$ time, $\Theta(\text{amount})$ space.

--

## Your turn: coin change

Coins $\lbrace 1, 4, 5 \rbrace$. Fill $dp[0..8]$. What does greedy pay for 8, and what is best?

<details class="answer"><summary>Answer:</summary>

$dp[0..8] = 0, 1, 2, 3, 1, 1, 2, 3, 2$. Greedy pays $5 + 1 + 1 + 1$: **4** coins; best is $4 + 4$: **2**.

</details>

