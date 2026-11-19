<!--
  TOPIC · The 0/1 knapsack.
  Teaches: the problem (items A to D, W = 5); greedy by value per weight fails (P, Q, R at W = 6); 2^n subsets against (n + 1)(W + 1) cells; the recurrence derived from the last item (take or skip); its correctness by exchange; one cell worked; the table and its four kinds of cell drawn; a practice cell; std::max; the table in C++ with 0-based item vectors (row i reads value[i-1]); the knapsack demo; the walk back, std::reverse and its C++; a tie keeps the skip (W = 7: B and C, not A and D); the unbounded variant; the cost and why Theta(nW) is pseudo-polynomial.
  Needs:   the dynamic-programming method, rod cutting, longest common subsequence; Lecture 14's greedy knapsack.
  Demos:   knapsack (registry slug); figures dp-knap-table, dp-knap-cases (tools/gen-dp-figures.mjs)
  Program: code/knapsack/knapsack.cpp
  Budget:  ~42 min, 19 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 1.
-->

### The 0/1 knapsack

> Richard Karp's 1972 list of twenty-one NP-complete problems includes the knapsack problem.

<small>R. M. Karp, “Reducibility Among Combinatorial Problems,” in *Complexity of Computer Computations*, Plenum, 1972</small>

--

## The problem

Items with a **value** and a **weight**; a knapsack holds weight at most $W$. Take each item **whole or not at all**, for the most value.

| item | A | B | C | D |
| --- | --: | --: | --: | --: |
| value | 3 | 4 | 5 | 6 |
| weight | 2 | 3 | 4 | 5 |

$W = 5$: which items?

--

## Greedy fails, again

| item | P | Q | R |
| --- | --: | --: | --: |
| value | 5 | 3 | 3 |
| weight | 4 | 3 | 3 |
| value / weight | **1.25** | 1.00 | 1.00 |

$W = 6$: greedy takes P and nothing else fits: **5**. Q and R: **6**.

--

## Every subset, or a table

- every subset: $2^n$; $n = 40$ items is about $10^{12}$ subsets
- a table of $(n + 1)(W + 1)$ cells: $n = 40$, $W = 1000$ is about 40,000 cells

The table wins when $W$ is modest. The end of this topic says what "modest" means.

--

## Derive it: the last item

The last item, item $i$, is either **skipped** or **taken**:

- skip: the first $i - 1$ items, same capacity $w$
- take (if it fits): its value, plus the first $i - 1$ items within $w - \text{weight}$

$$K[i][w] = \max\big(K[i-1][w],\\ \text{value}\_i + K[i-1][w - \text{weight}\_i]\big)$$

$$K[0][w] = 0$$

$K[i][w]$: the best value of the **first $i$ items** within capacity $w$.

--

## Why take-or-skip is correct

Let $S$ be an optimal packing of items $1..i$ within $w$.

- item $i \notin S$: $S$ packs items $1..i-1$ within $w$, so its value is at most $K[i-1][w]$
- item $i \in S$: removing it leaves a packing of $1..i-1$ within $w - \text{weight}\_i$; if that rest were not optimal, a better rest would improve $S$

So every optimum is one of the two options, and the max finds it.

--

## One cell

$K[2][5]$: items A and B, capacity 5. B is worth 4 and weighs 3.

$$\begin{aligned} \text{skip B: } & K[1][5] = 3 \\\\ \text{take B: } & 4 + K[1][5 - 3] = 4 + K[1][2] = 4 + 3 = 7 \\\\ K[2][5] &= \max(3, 7) = 7 \end{aligned}$$

--

## The table

<div><img src="../../topics/figures/dp/dp-knap-table.svg" style="height:230px" alt="
   w:       0 1 2 3 4 5
   none:    0 0 0 0 0 0
   + A:     0 0 3 3 3 3
   + B:     0 0 3 4 4 7
   + C:     0 0 3 4 5 7
   + D:     0 0 3 4 5 7
   K[4][5] = 7; the walk back takes B and A"></div>

Row by row; each cell is the larger of **skip** (straight up) and **take** (up, then left by the item's weight, plus its value).

--

## Four kinds of cell

<div><img src="../../topics/figures/dp/dp-knap-cases.svg" style="height:200px" alt="
   the item does not fit: copy the cell above
   take wins: value + the cell up and left by the weight
   skip wins: the cell above
   a tie: the two are equal"></div>

--

## Your turn: one cell

$K[3][4]$: items A, B and C, capacity 4. C is worth 5 and weighs 4. Skip, take, and the cell?

<details class="answer"><summary>Answer:</summary>

skip: $K[2][4] = 4$ (B alone: A and B weigh 5) · take: $5 + K[2][0] = 5$ · $K[3][4] = 5$

</details>

--

## [`std::max`, `std::min`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<algorithm>`: the larger, or the smaller, of values of the **same type**.

| call | gives | cost |
| --- | --- | --: |
| `max(a, b)`, `min(a, b)` | the larger, the smaller | $O(1)$ |
| `min({a, b, c})` | the smallest in a list | $O(k)$ |

Knapsack takes the `max` of skip and take; edit distance takes the `min` of three. `max(1, 2L)` does not compile.

--

## The table, in C++

```cpp
int knapsack(const vector<int>& value, const vector<int>& weight, int W,
             vector<vector<int>>& K) {
    int n = value.size();
    K.assign(n + 1, vector<int>(W + 1, 0));       // row 0: no items, value 0
    for (int i = 1; i <= n; i++)
        for (int w = 0; w <= W; w++) {
            K[i][w] = K[i - 1][w];                // skip item i - 1
            if (weight[i - 1] <= w)               // it fits: try taking it
                K[i][w] = max(K[i][w],
                              value[i - 1] + K[i - 1][w - weight[i - 1]]);
        }
    return K[n][W];
}
```

The vectors are 0-based, so row $i$ reads item $i - 1$: `value[i - 1]`, `weight[i - 1]`.

--

## Demo: knapsack

<div class="algo-viz" data-algo="knapsack" data-config='{"width":900,"height":210}'>
<pre class="viz-fallback">
   items A 3/2, B 4/3, C 5/4, D 6/5; W = 5
   each cell: max(skip = above, take = value + the cell up and left by the weight)
   the walk back marks the items taken: A and B, value 7
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Fill $W = 5$, then change $W$: 9 takes A, B, C (12); 12 takes B, C, D (15, A drops out); 14 takes all four (18).</small>

--

## Which items?

Walk back from $K[n][W]$, one row at a time:

- $K[i][w] \ne K[i-1][w]$: taking item $i - 1$ made this value; take it, and $w \mathrel{-}= \text{weight}\_{i-1}$
- otherwise: skip it, same $w$

$W = 5$: row D equals row C (skip D); row C equals row B (skip C); row B differs (take B, $w = 2$); row A differs (take A).

--

## [`std::reverse`](../../textbook/foundations/foundation-stl-primer.html#algorithms)

`<algorithm>`: reverse a range **in place**.

```cpp
reverse(taken.begin(), taken.end());          // in item order
```

- the walk meets the items **last first**; one `reverse` puts them in order
- $O(n)$: $n/2$ swaps, no extra memory

--

## The walk back, in C++

```cpp
vector<int> takenItems(const vector<int>& weight, int W,
                       const vector<vector<int>>& K) {
    vector<int> taken;
    int w = W;
    for (int i = (int)weight.size(); i >= 1; i--)
        if (K[i][w] != K[i - 1][w]) {             // taking item i - 1 made it
            taken.push_back(i - 1);
            w -= weight[i - 1];
        }
    reverse(taken.begin(), taken.end());          // in item order
    return taken;
}
```

$O(n)$: one step per row.

--

## Your turn: a tie

$W = 7$. A and D weigh 7 and are worth 9; so are B and C. Which pair does the walk report?

<details class="answer"><summary>Answer:</summary>

**B and C.** $K[4][7]$: skip D gives $K[3][7] = 9$, take D gives $6 + K[3][2] = 9$; the tie keeps the skip, so $K[4][7] = K[3][7]$ and the walk skips D. Then C is taken ($5 + K[2][3] = 9 > K[2][7] = 7$), and B ($K[2][3] = 4 \ne K[1][3] = 3$).

</details>

--

## Variants

| variant | rule | the take reads |
| --- | --- | --- |
| 0/1 | each item at most once | the row **above**: $K[i-1][w - \text{weight}]$ |
| unbounded | any number of copies | the **same** row: $K[i][w - \text{weight}]$ |
| bounded | at most $c\_i$ copies | a loop over the count |

Coin change, the fewest coins for an amount, is the unbounded knapsack with a min.

--

## The cost, and pseudo-polynomial time

$$(n + 1)(W + 1) \text{ cells} \times O(1) = \Theta(nW)$$

$W$ is a **number**. Written in binary it takes $b = \lceil \log\_2 (W + 1) \rceil$ bits, and $W$ can be as large as $2^b - 1$:

| bits of $W$ | 10 | 20 | 40 |
| --- | --: | --: | --: |
| columns, up to | 1,023 | 1,048,575 | $\approx 1.1 \times 10^{12}$ |

$\Theta(nW) = \Theta(n \cdot 2^b)$: exponential in the input's **length**: **pseudo-polynomial**.

