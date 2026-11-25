<!--
  TOPIC · Rod cutting.
  Teaches: the problem (prices 1 5 8 9, n = 4); the ratio greedy fails (9 against 10); the recurrence derived from the choice of the first piece; the recursion tree demo (naive against memoized); the plain recursion's 2^n calls, derived; the table filled by hand; the table in C++ with the winning cut recorded, the FIRST winner kept on a tie; the traceback in C++; the rodcut demo; a practice with ties (2 4 7 8: best 9, pieces 1 + 3); the cost.
  Needs:   the dynamic-programming method.
  Demos:   rodcut-tree, rodcut (registry slugs)
  Program: code/rod-cutting/rod.cpp
  Budget:  ~28 min, 12 slides.
  Ported from Summer 2026 L14-dp-i.md, part 2.
-->

### Rod cutting

> Rod cutting opens the dynamic-programming chapter of Cormen, Leiserson, Rivest and Stein, with the prices 1, 5, 8, 9, 10, 17, 17, 20, 24 and 30 for lengths 1 to 10.

<small>T. H. Cormen et al., *Introduction to Algorithms*, 3rd ed., §15.1, MIT Press, 2009</small>

--

## The problem

A rod of length $n$; a piece of length $i$ sells for `price[i]`. Cut it to earn the most.

| length $i$ | 1 | 2 | 3 | 4 |
| --- | --: | --: | --: | --: |
| `price[i]` | 1 | 5 | 8 | 9 |

$n = 4$: the whole rod earns 9; two pieces of 2 earn **10**.

A rod of length $n$ has $n - 1$ places to cut: $2^{n-1}$ cuttings.

--

## Greedy fails

Take the best **value per unit length** first:

| $i$ | 1 | 2 | 3 | 4 |
| --- | --: | --: | --: | --: |
| `price[i] / i` | 1.00 | 2.50 | **2.67** | 2.25 |

Greedy takes a 3 (8), then the leftover 1 (1): **9**. The optimum, 2 + 2, earns **10**.

--

## Derive it: the first piece

Some piece comes first. Its length $i$ is one of $1, \ldots, n$; we do not know which, so **try each**:

- the first piece earns `price[i]`
- what is left is a rod of length $n - i$, and it should be cut **as well as possible**

$$\text{best}[n] = \max\_{1 \le i \le n} \big( \text{price}[i] + \text{best}[n - i] \big), \qquad \text{best}[0] = 0$$

--

## Demo: the recursion

<div class="algo-viz" data-algo="rodcut-tree" data-config='{"width":900,"height":230}'>
<pre class="viz-fallback">
   node = the length still to cut, edge = the piece taken (and its price)
     naive     16 nodes: cut(2) solved twice, cut(1) four times
     memoized  11 nodes stay lit; the repeated subtrees grey out
     the green path is the answer: 2 then 2, value 10
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Run **Naive**, then **Memoized**: the same walk, with the repeated subtrees greyed out.</small>

--

## The recursion without memory

The plain recursion tries every first piece and solves each rest from scratch:

$$C(n) = 1 + \sum\_{k=0}^{n-1} C(k), \quad C(0) = 1 \qquad\Rightarrow\qquad C(n) = 2^n$$

$n = 4$: **16** calls; $n = 8$: 256; $n = 30$: over a billion. Only $n + 1$ different subproblems.

--

## Fill the table by hand

| len | candidates $\text{price}[i] + \text{best}[\text{len} - i]$ | best | cut |
| --: | --- | --: | --: |
| 0 | | 0 | |
| 1 | $1 + 0$ | 1 | 1 |
| 2 | $1 + 1,\\ 5 + 0$ | 5 | 2 |
| 3 | $1 + 5,\\ 5 + 1,\\ 8 + 0$ | 8 | 3 |
| 4 | $1 + 8,\\ \mathbf{5 + 5},\\ 8 + 1,\\ 9 + 0$ | **10** | 2 |

Every candidate reads a **smaller** `best[]` cell, already filled.

--

## The table, in C++

```cpp
// price[i] = price of a piece of length i (price[0] unused); returns the
// best revenue for length n and sets cut[len] = the winning first cut.
int rodCut(const vector<int>& price, int n, vector<int>& cut) {
    vector<int> best(n + 1, 0);           // n + 1 zeros; best[0] = 0: empty rod
    cut.assign(n + 1, 0);                 // resize cut to n + 1 elements, all 0
    for (int len = 1; len <= n; len++) {  // each length, smallest first
        int m = -1;                       // best so far; any real cut beats it
        for (int i = 1; i <= len; i++)    // try every first cut
            if (price[i] + best[len - i] > m) {   // strict >: ties keep first i
                m = price[i] + best[len - i];     // piece i + best of the rest
                cut[len] = i;             // remember the choice that won
            }
        best[len] = m;                    // reuses smaller best[] -- the overlap
    }
    return best[n];                       // the whole rod's best revenue
}
```

`price[0]` is unused. On a tie the test `>` keeps the **first** winning `i`.

--

## Which pieces?

```cpp
// Traceback: repeatedly take the recorded first cut until nothing is left.
vector<int> pieces(const vector<int>& cut, int n) {   // cut: filled by rodCut
    vector<int> out;                      // empty; the pieces, in cut order
    while (n > 0) {                       // until the rod is used up
        out.push_back(cut[n]);            // append the winning first cut at n
        n -= cut[n];                      // cut it off, continue on the rest
    }
    return out;                           // the pieces of an optimal cut
}
```

`cut[4] = 2`, then `cut[2] = 2`: pieces **2 + 2**, value 10.

--

## Demo: rod cutting

<div class="algo-viz" data-algo="rodcut" data-config='{"width":900}'>
<pre class="viz-fallback">
   prices 1 5 8 9, rod n = 4, one frame per candidate:
     best[4] = max(1+8, 5+5, 8+1, 9+0) = 10, cut[4] = 2
     10 candidates = 4 x 5 / 2
   traceback: cut[4] = 2, cut[2] = 2: pieces 2 + 2
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Three rows: **price** (given), **best** (filled), **cut** (the winning first piece). The traceback reads only `cut`.</small>

--

## Worksheet: rod cutting

Prices `2 4 7 8` for lengths 1 to 4. Fill `best[1..4]` and `cut[1..4]`, keeping the **first** winner on a tie. What pieces does the traceback give?

<details class="answer"><summary>Answer:</summary>

| len | candidates | best | cut |
| --: | --- | --: | --: |
| 1 | $2$ | 2 | 1 |
| 2 | $\mathbf{2 + 2},\\ 4$ | 4 | 1 |
| 3 | $2 + 4,\\ 4 + 2,\\ \mathbf{7}$ | 7 | 3 |
| 4 | $\mathbf{2 + 7},\\ 4 + 4,\\ 7 + 2,\\ 8$ | 9 | 1 |

Pieces **1 + 3**, value 9.

</details>

--

## The cost

$$\sum\_{\text{len}=1}^{n} \text{len} = \frac{n(n+1)}{2} \text{ candidates} = \Theta(n^2) \text{ time}, \qquad \Theta(n) \text{ space}$$

| $n$ | plain recursion | table candidates |
| --: | --: | --: |
| 4 | 16 | 10 |
| 10 | 1,024 | 55 |
| 20 | 1,048,576 | 210 |

