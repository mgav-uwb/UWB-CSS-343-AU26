<!--
  TOPIC · The Θ(log n) guarantee.
  Teaches: the minimal AVL tree of height h; N(h) = N(h-1) + N(h-2) + 1 is Fibonacci; height at most about 1.44 log2 n; every operation Θ(log n) in the worst case; the price of balance; AVL against red-black trees.
  Needs:   avl insertion, the recurrences topic.
  Demos:   none
  Program: none
  Budget:  ~22 min, 11 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 6, 7.
-->

### The Θ(log n) guarantee

<small>(~22 min)</small>

--

## How tall can an AVL tree get?

Turn it around: the **fewest nodes** in an AVL tree of height **h**: call it **N(h)**.

A _minimal_ tree: a root, one subtree of height **h−1**, the other as short as the invariant allows: **h−2**.

$$N(h) = 1 + N(h{-}1) + N(h{-}2)$$

with **N(−1) = 0**, **N(0) = 1**.

--

## The minimal AVL tree

```text
 h=0   h=1     h=2         h=3
  •     •       •           •
       /       / \         / \
      •       •   •       •   •
             /           / \   \
            •           •   •   •
                       /
                      •
N:  1     2       4           7
```

Each is a root over the two smallest legal subtrees: height h−1 and h−2.

--

## That recurrence is Fibonacci: in disguise

```text
 h      :  0   1   2   3   4    5    6    7
 N(h)   :  1   2   4   7  12   20   33   54
 N(h)+1 :  2   3   5   8  13   21   34   55   ← Fibonacci!
```

**N(h) = 1 + N(h−1) + N(h−2)**, with N(0)=1, N(1)=2. The **+1** is the only thing hiding Fibonacci: the third row, **N(h)+1**, *is* Fibonacci.

--

## Fibonacci: absorbing the +1

Soak up the pesky **+1** with a shifted sequence **M(h) = N(h) + 1**:

```text
N(h) = 1 + N(h−1) + N(h−2)          N(0) = 1, N(1) = 2

M(h) = N(h) + 1
     = N(h−1) + N(h−2) + 2
     = (N(h−1) + 1) + (N(h−2) + 1)
     = M(h−1) + M(h−2)              ← pure Fibonacci

M(0) = 2 = Fib(3)    M(1) = 3 = Fib(4)
  ⇒  M(h) = Fib(h+3)
  ⇒  N(h) = Fib(h+3) − 1  ≥  φ^h    (φ = 1.618…)
```

--

## Solve for the height

An AVL tree with n nodes and height h has **n ≥ N(h) ≥ φ^h** (easy induction, using φ² = φ+1). Taking logs (base φ = 1.618):

$$h \le 1.44 \log_2 n$$

So its height is **Θ(log n)**: for **any** sequence of inserts and deletes.

--

## The height is sandwiched

Two bounds pin the height of an n-node AVL tree:

- **lower**: even perfect balance needs height ≥ **log₂ n**
- **upper**: the Fibonacci argument gives height ≤ **1.44 log₂ n**

So **log₂ n ≤ h ≤ 1.44 log₂ n**: the height is **Θ(log n)**, tight to a constant.

--

## One billion keys

Concretely, for **n = 1,000,000,000**:

- a plain BST's worst case: up to **1,000,000,000** compares
- an AVL tree: at most **1.44 · log₂ 10⁹ ≈ 43** compares

Any search, insert, or delete touches **at most ~43 nodes**: guaranteed, for any input.

--

## Every operation is Θ(log n): guaranteed

Each operation walks one path, and the path is now **≤ 1.44 log₂ n**:

| operation | plain BST (worst) | **AVL (worst)** |
| --------- | ----------------- | --------------- |
| search    | Θ(n)              | **Θ(log n)**    |
| insert    | Θ(n)              | **Θ(log n)**    |
| delete    | Θ(n)              | **Θ(log n)**    |

A random BST gives Θ(log n) **on average**. AVL gives it as a **worst-case guarantee**.

--

## The price of balance

Not free, but cheap:

- **+1 int** per node (the height)
- each insert: **one** rotation; each delete: **O(log n)** rotations
- a few extra `fix`/`bf` checks per node on the way up

You trade a little constant overhead for a hard worst-case bound.

--

## AVL vs red-black: the tradeoff

Both guarantee Θ(log n); they balance differently:

- **AVL**: stricter (≤ 1.44 log₂ n) → **shorter** trees, **faster search**, but **more rotations** per update
- **red-black**: looser (≤ 2 log₂ n) → taller, but **fewer rotations** per update

Rule of thumb: **search-heavy → AVL**; **update-heavy → red-black**.

