<!--
  TOPIC · The Θ(log n) guarantee.
  Teaches: the minimal AVL tree of height h; N(h) = N(h-1) + N(h-2) + 1 is Fibonacci; height at most about 1.44 log2 n; every operation Θ(log n) in the worst case; the price of balance; AVL against red-black trees.
  Needs:   avl insertion, the recurrences topic.
  Demos:   none
  Program: none
  Budget:  ~22 min, 11 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 6, 7.
-->

### The $\Theta(\log n)$ guarantee

> The sparsest AVL trees are Fibonacci trees, and their height never exceeds about $1.44 \log\_2 n$.

<small>D. E. Knuth, The Art of Computer Programming, Volume 3, §6.2.3</small>

--

## How tall can an AVL tree get?

Turn it around: the **fewest nodes** in an AVL tree of height $h$: call it $N(h)$.

A _minimal_ tree: a root, one subtree of height $h - 1$, the other as short as the invariant allows: $h - 2$.

$$N(h) = 1 + N(h-1) + N(h-2)$$

with $N(-1) = 0$ and $N(0) = 1$.

--

## The minimal AVL tree

<div><img src="../../topics/figures/avl/av-minimal.svg" style="height:285px" alt="
 h=0   h=1     h=2         h=3
  •     •       •           •
       /       / \         / \
      •       •   •       •   •
             /           / \   \
            •           •   •   •
                       /
                      •
N:  1     2       4           7
"></div>

Each is a root over the two smallest legal subtrees, of heights $h - 1$ and $h - 2$.

--

## That recurrence is Fibonacci: in disguise

| $h$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| $N(h)$ | 1 | 2 | 4 | 7 | 12 | 20 | 33 | 54 |
| $N(h) + 1$ | **2** | **3** | **5** | **8** | **13** | **21** | **34** | **55** |

$N(h) = 1 + N(h-1) + N(h-2)$, with $N(0) = 1$ and $N(1) = 2$. The $+1$ is the only thing hiding Fibonacci: the third row, $N(h) + 1$, *is* Fibonacci.

--

## Fibonacci: absorbing the +1

Soak up the pesky $+1$ with a shifted sequence $M(h) = N(h) + 1$:

$$
\begin{aligned}
M(h) &= N(h) + 1 = \bigl(1 + N(h-1) + N(h-2)\bigr) + 1 \\\\
&= \bigl(N(h-1) + 1\bigr) + \bigl(N(h-2) + 1\bigr) \\\\
&= M(h-1) + M(h-2) \qquad \text{pure Fibonacci}
\end{aligned}
$$

With $M(0) = 2 = F\_3$ and $M(1) = 3 = F\_4$, the Fibonacci numbers $1, 1, 2, 3, 5, \ldots$ shifted by 3:

$$M(h) = F\_{h+3}, \qquad N(h) = F\_{h+3} - 1 \ge \varphi^h, \qquad \varphi = 1.618\ldots$$

--

## Solve for the height

An AVL tree with $n$ nodes and height $h$ has $n \ge N(h) \ge \varphi^h$ (an easy induction, using $\varphi^2 = \varphi + 1$). Taking logs base $\varphi = 1.618$:

$$h \le \log\_\varphi n = \frac{\log\_2 n}{\log\_2 \varphi} \approx 1.44 \log\_2 n$$

So its height is $\Theta(\log n)$: for **any** sequence of inserts and deletes.

--

## The height is sandwiched

Two bounds pin the height of an $n$-node AVL tree:

- **lower**: even perfect balance needs $h \ge \lfloor \log\_2 n \rfloor$
- **upper**: the Fibonacci argument gives $h \le 1.44 \log\_2 n$

So $\lfloor \log\_2 n \rfloor \le h \le 1.44 \log\_2 n$: the height is $\Theta(\log n)$, tight to a constant.

--

## One billion keys

Concretely, for $n = 10^9$ keys:

- a plain BST's worst case: up to **1,000,000,000** compares
- an AVL tree: at most $1.44 \log\_2 10^9 \approx 43$ compares

Any search, insert, or delete touches **at most about 43 nodes**: guaranteed, for any input.

--

## A guaranteed $\Theta(\log n)$

Each operation walks one path, of length at most $1.44 \log\_2 n$:

| operation | plain BST (worst) | **AVL (worst)** |
| --------- | ----------------- | --------------- |
| search    | $\Theta(n)$       | $\boldsymbol{\Theta(\log n)}$ |
| insert    | $\Theta(n)$       | $\boldsymbol{\Theta(\log n)}$ |
| delete    | $\Theta(n)$       | $\boldsymbol{\Theta(\log n)}$ |

A random BST gives $\Theta(\log n)$ **on average**. AVL gives it as a **worst-case guarantee**.

--

## The price of balance

Not free, but cheap:

- **+1 int** per node (the height)
- each insert: **one** rotation; each delete: $O(\log n)$ rotations
- a few extra `fix`/`bf` checks per node on the way up

You trade a little constant overhead for a hard worst-case bound.

--

## AVL vs red-black: the tradeoff

Both guarantee $\Theta(\log n)$; they balance differently:

- **AVL**: stricter, $h \le 1.44 \log\_2 n$ → **shorter** trees, **faster search**, but **more rotations** per update
- **red-black**: looser, $h \le 2 \log\_2 n$ → taller, but **fewer rotations** per update

Rule of thumb: **search-heavy → AVL**; **update-heavy → red-black**.

