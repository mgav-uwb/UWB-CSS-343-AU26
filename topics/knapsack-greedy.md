<!--
  TOPIC · Where greed fails: the knapsack.
  Teaches: the 0/1 knapsack problem stated; greedy by value per weight failing (160 against 220); a second instance on which every fixed order that won the first one loses; why no fixed order can work (the greedy-choice property fails); the fractional knapsack, where the same rule is optimal (240), and the exchange that proves it; the prove-it-or-break-it checklist.
  Needs:   activity selection (the two ingredients, the exchange argument).
  Demos:   figures gm-knap, gm-frac (tools/gen-greedy-figures.mjs)
  Program: none (every number checked by brute force in gen-greedy-figures.mjs)
  Budget:  ~12 min, 8 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 2.
-->

### Where greed fails: the knapsack

> George Dantzig observed in 1957 that packing items in order of value per unit of weight solves the knapsack problem when items may be split, and only bounds the answer when they may not.

<small>G. B. Dantzig, “Discrete-Variable Extremum Problems,” Operations Research 5(2), 1957</small>

--

## The 0/1 knapsack problem

A bag holds at most $W$ kilos. Item $i$ has value $v\_i$ and weight $w\_i$. Choose a **subset** $S$ of the items:

$$\text{maximize } \sum\_{i \in S} v\_i \quad \text{subject to } \sum\_{i \in S} w\_i \le W$$

- each item is **all or nothing**: take it (1) or leave it (0), hence “0/1”
- $n$ items give $2^n$ subsets to choose from

--

## Greedy by value per kilo

| item | value | weight | value/weight |
| --- | --: | --: | --: |
| A | 60 | 10 | 6 |
| B | 100 | 20 | 5 |
| C | 120 | 30 | 4 |

<div><img src="../../topics/figures/greedy/gm-knap.svg" style="height:145px" alt="
   W = 50
   by value/weight:  A (10 kg) + B (20 kg) = 30 kg, value 160; C (30 kg) no longer fits; 20 kg unused
   the optimum:      B (20 kg) + C (30 kg) = 50 kg, value 220"></div>

$W = 50$. Greedy takes A, then B, and **C no longer fits**: 160. **B + C** is worth 220.

--

## Another rule, then?

Heaviest first, or most valuable first, take C, then B: **220**.

A second instance, $W = 10$: X (value 10, weight 10), Y (6, 5), Z (6, 5). What does each rule pack?

<details class="answer"><summary>Answer:</summary>

| rule | first, best 220 | second, best 12 |
| --- | --: | --: |
| most valuable or heaviest first | 220 | **10**: X alone |
| best ratio or lightest first | **160** | 12: Y and Z |

</details>

--

## No fixed order works

- for any order you propose, an instance can be built to defeat it
- on instance 1, **no** optimal packing contains A, the densest item: the **greedy-choice property fails**
- the problem still has **optimal substructure**
- the fix tries **every** choice and reuses the answers to subproblems: **dynamic programming**

--

## Fractional knapsack

Items may now be **split**: take any fraction $0 \le x\_i \le 1$ of item $i$.

<div><img src="../../topics/figures/greedy/gm-frac.svg" style="height:80px" alt="
   fractional, by value/weight: A (10 kg, 60) + B (20 kg, 100) + 20 of C's 30 kg (80) = 50 kg, value 240"></div>

By value/weight: A, B, then $20/30$ of C: $60 + 100 + 80 = 240$. The **same rule** is now **optimal**.

--

## Why splitting is safe

Suppose a packing holds some of item $j$ while item $i$, with a **better** ratio, is not all in. Move $\varepsilon$ kilos from $j$ to $i$:

$$\Delta = \varepsilon \cdot \frac{v\_i}{w\_i} - \varepsilon \cdot \frac{v\_j}{w\_j} \ge 0$$

Same weight, no less value: an **exchange argument**, so filling by ratio is optimal.

With whole items there is **no** $\varepsilon$: a swap must move whole items, and their weights need not match.

--

## Prove it, or break it

For any proposed greedy rule:

- **break it**: hunt for a small counterexample; the coins took one line, the knapsack three items
- **prove it**: an exchange argument, then optimal substructure
- or **match a bound**, as for the rooms
- warning sign: an early choice **uses up** a resource a better combination needed

