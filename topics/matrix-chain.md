<!--
  TOPIC · Interval DP: matrix-chain order.
  Teaches: why the order of a chain of matrix products matters (4,500 against 27,000); the Catalan number of orders; the recurrence derived from the last multiplication; filling by range length; one cell worked; the table for p = 4 10 3 12 5 (360, ((A1A2)(A3A4))); the C++; reading the order back from s; a practice (p = 2 6 3 4: 60); Theta(n^3); other interval DPs.
  Needs:   the dynamic-programming method, grid DP.
  Demos:   none (the tables are computed by code/matrix-chain/mc.cpp)
  Program: code/matrix-chain/mc.cpp
  Budget:  ~26 min, 12 slides.
  Ported from Summer 2026 L15-dp-ii.md, part 3, and the Matrix-Chain Multiplication chapter.
-->

### Interval DP

> Sadashiva Godbole published the dynamic program that orders a chain of matrix products in 1973.

<small>S. S. Godbole, “On Efficient Computation of Matrix Chain Products,” IEEE Transactions on Computers C-22(9), 1973</small>

--

## The order matters

Multiplying a $p \times q$ matrix by a $q \times r$ one takes $pqr$ scalar multiplications. Three matrices: $A$ is $10 \times 30$, $B$ is $30 \times 5$, $C$ is $5 \times 60$.

| order | work |
| --- | --: |
| $(AB)C$ | $10 \cdot 30 \cdot 5 + 10 \cdot 5 \cdot 60 = 4{,}500$ |
| $A(BC)$ | $30 \cdot 5 \cdot 60 + 10 \cdot 30 \cdot 60 = 27{,}000$ |

The same product, six times the work.

--

## How many orders?

$n$ matrices can be parenthesized in $C\_{n-1}$ ways, a Catalan number:

| $n$ | 3 | 4 | 10 | 20 |
| --- | --: | --: | --: | --: |
| orders | 2 | 5 | 4,862 | 1,767,263,190 |

Exponential, about $4^n$: trying them all is out.

--

## Derive it: the last multiplication

The chain $A\_i \cdots A\_j$, with $A\_k$ of size $p\_{k-1} \times p\_k$. Its **last** multiplication joins $A\_i \cdots A\_k$ to $A\_{k+1} \cdots A\_j$ for some split $k$; each side should be multiplied as cheaply as possible:

$$m[i][j] = \min\_{i \le k \lt j} \big( m[i][k] + m[k+1][j] + p\_{i-1}\\, p\_k\\, p\_j \big), \qquad m[i][i] = 0$$

The last product multiplies a $p\_{i-1} \times p\_k$ result by a $p\_k \times p\_j$ one.

--

## Fill by range length

$m[i][j]$ reads $m[i][k]$ and $m[k+1][j]$: **shorter** ranges. So fill by length:

- length 1: $m[i][i] = 0$, a single matrix
- length 2, then 3, and so on, up to the whole chain $m[1][n]$

In the table, that is one diagonal at a time.

--

## One cell

$p = 4, 10, 3, 12, 5$: $A\_1$ is $4 \times 10$, $A\_2$ $10 \times 3$, $A\_3$ $3 \times 12$, $A\_4$ $12 \times 5$.

$m[1][3]$, split $k = 1$: $\\; m[1][1] + m[2][3] + 4 \cdot 10 \cdot 12 = 0 + 360 + 480 = 840$

split $k = 2$: $\\; m[1][2] + m[3][3] + 4 \cdot 3 \cdot 12 = 120 + 0 + 144 = \mathbf{264}$

$m[1][3] = 264$, with the split $s[1][3] = 2$: $(A\_1 A\_2) A\_3$.

--

## The table

| $m$ | $j = 1$ | 2 | 3 | 4 |
| --- | --: | --: | --: | --: |
| $i = 1$ | 0 | 120 | 264 | **360** |
| 2 | | 0 | 360 | 330 |
| 3 | | | 0 | 180 |
| 4 | | | | 0 |

| $s$ | $j = 2$ | 3 | 4 |
| --- | --: | --: | --: |
| $i = 1$ | 1 | 2 | **2** |
| 2 | 2 | 2 | 2 |
| 3 | | | 3 |

--

## The table, in C++

```cpp
int matrixChain(const vector<int>& p,
                vector<vector<int>>& m, vector<vector<int>>& s) {
    int n = (int)p.size() - 1;
    m.assign(n + 2, vector<int>(n + 2, 0));   // base case: m[i][i] = 0
    s.assign(n + 2, vector<int>(n + 2, 0));
    for (int L = 2; L <= n; L++)              // range length, shortest first
        for (int i = 1; i + L - 1 <= n; i++) {
            int j = i + L - 1;
            m[i][j] = INT_MAX;
            for (int k = i; k < j; k++) {     // every outermost split
                int c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
                if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; }
            }
        }
    return m[1][n];
}
```

--

## Reading the order back

$s[i][j]$ names the **last** multiplication of $A\_i \cdots A\_j$. Recurse on both sides:

- $s[1][4] = 2$: $(A\_1 A\_2)(A\_3 A\_4)$
- $s[1][2] = 1$ and $s[3][4] = 3$: each side is a single product

$((A\_1 A\_2)(A\_3 A\_4))$ costs $120 + 180 + 60 = 360$: the two products, then $4 \cdot 3 \cdot 5$ to join them.

--

## Your turn: a chain

$p = 2, 6, 3, 4$: $A\_1$ is $2 \times 6$, $A\_2$ $6 \times 3$, $A\_3$ $3 \times 4$. The cheapest order, and its cost?

<details class="answer"><summary>Answer:</summary>

$m[1][2] = 36$, $m[2][3] = 72$; $m[1][3] = \min(0 + 72 + 2 \cdot 6 \cdot 4,\\ 36 + 0 + 2 \cdot 3 \cdot 4) = \min(120, 60) = $ **60**: $(A\_1 A\_2) A\_3$.

</details>

--

## The cost

$$\underbrace{\Theta(n^2)}\_{\text{ranges}} \times \underbrace{O(n)}\_{\text{splits each}} = \Theta(n^3) \text{ time}, \qquad \Theta(n^2) \text{ space}$$

$n = 20$: about 1,300 split candidates against 1.8 billion orders.

--

## Interval DP elsewhere

The state is a range; the choice is a split or a root inside it:

| problem | the choice in $[i, j]$ |
| --- | --- |
| matrix-chain order | the last multiplication $k$ |
| optimal binary search tree | the root $r$; frequent keys end near it |
| polygon triangulation | the third corner of the triangle on edge $(i, j)$ |

All $\Theta(n^3)$, all filled by range length.

