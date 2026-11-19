<!--
  TOPIC · The dynamic-programming method, on Fibonacci.
  Teaches: the naive recursion and its call tree; the call count 2 fib(n+1) - 1 derived; memoization in C++ (2n - 1 calls); tabulation in C++; two variables, Theta(1) space; the four versions measured; the fib-race demo; overlapping subproblems and optimal substructure, named after the example; memoization against tabulation; dynamic programming against greedy and divide and conquer.
  Needs:   recursion, counting recurrences, divide and conquer.
  Demos:   fib-race (registry slug); figure dp-fib-tree (tools/gen-dp-figures.mjs)
  Program: code/dp-method/fib.cpp
  Budget:  ~26 min, 12 slides.
  Ported from Summer 2026 L14-dp-i.md, parts 1 and 2.
-->

### Remembering answers

> Richard Bellman named dynamic programming in the early 1950s at RAND, choosing, he wrote, a name that not even a congressman could object to.

<small>R. Bellman, *Eye of the Hurricane: An Autobiography*, World Scientific, 1984</small>

--

## Fibonacci, by the definition

$$F(0) = 0, \qquad F(1) = 1, \qquad F(n) = F(n-1) + F(n-2)$$

```cpp
// Naive Fibonacci, straight from the definition: correct, but every call
// solves its subproblems from scratch. 2 fib(n+1) - 1 calls, Theta(phi^n).
long fibNaive(int n) {
    if (n < 2) return n;                  // base cases: fib(0)=0, fib(1)=1
    return fibNaive(n - 1) + fibNaive(n - 2);   // both solved again, every time
}
```

Correct. How many calls does `fibNaive(10)` make?

--

## The calls

<div><img src="../../topics/figures/dp/dp-fib-tree.svg" style="height:270px" alt="
   fib(5) calls fib(4) and fib(3); fib(4) calls fib(3) and fib(2); ...
   15 calls for 6 distinct subproblems: fib(3) twice, fib(2) three times, fib(1) five times"></div>

`fibNaive(5)`: **15** calls, but only **6** different questions. The same subproblems are solved again and again.

--

## How many calls?

$$C(n) = C(n-1) + C(n-2) + 1, \quad C(0) = C(1) = 1$$

$$\Rightarrow\quad C(n) = 2F(n+1) - 1$$

| $n$ | calls |
| --: | --: |
| 10 | 177 |
| 30 | 2,692,537 |
| 50 | 40,730,022,147 |

$\Theta(\varphi^n)$, $\varphi \approx 1.618$: forty billion calls for fifty additions' worth of answer.

--

## Remember the answers

```cpp
// Memoized Fibonacci: the natural recursion plus a cache. Each fib(k) is
// computed once; every later request is an O(1) hit. Theta(n) time and space.
long fibMemo(int n, vector<long>& memo) {
    if (n < 2) return n;                  // base cases: fib(0)=0, fib(1)=1
    if (memo[n] != 0) return memo[n];     // remember: cache hit, subtree skipped
    memo[n] = fibMemo(n - 1, memo)        // computed at most once per n ...
            + fibMemo(n - 2, memo);
    return memo[n];                       // ... then stored for every caller
}
```

**Memoization**: the same recursion, plus a cache checked first and written last. `fibMemo(10)`: **19** calls.

--

## Fill a table instead

```cpp
// Tabulated Fibonacci: fill fib(0..n) smallest-first -- every dependency is
// already in the table when a cell needs it. Theta(n) time, Theta(n) space.
long fibTab(int n) {
    vector<long> t(n + 2);
    t[0] = 0; t[1] = 1;                   // base cases seed the table
    for (int i = 2; i <= n; i++)
        t[i] = t[i - 1] + t[i - 2];       // dependencies already filled
    return t[n];
}
```

**Tabulation**: no recursion; compute the subproblems smallest first, so every cell a step reads is already written.

--

## Keep only what is still needed

```cpp
// Two variables: each value needs only the previous TWO, so keep just those.
// Theta(n) time, Theta(1) space -- the optimization tabulation makes natural.
long fibTwoVar(int n) {
    long a = 0, b = 1;                    // invariant: a = fib(i), b = fib(i+1)
    for (int i = 0; i < n; i++) {
        long c = a + b;                   // one addition per step
        a = b; b = c;                     // slide the two-cell window right
    }
    return a;                             // after n steps, a = fib(n)
}
```

The table's cells are read only by the next two; older cells can be dropped. $\Theta(1)$ space.

--

## Four versions, measured

| version | time | space | at $n = 10$ |
| --- | --- | --- | --- |
| the definition | $\Theta(\varphi^n)$ | $\Theta(n)$ stack | 177 calls |
| memoized | $\Theta(n)$ | $\Theta(n)$ | 19 calls |
| tabulated | $\Theta(n)$ | $\Theta(n)$ | 9 additions, 11 cells |
| two variables | $\Theta(n)$ | $\Theta(1)$ | 10 additions, 2 cells |

One recurrence, four implementations.

--

## Demo: the race

<div class="algo-viz" data-algo="fib-race" data-config='{"width":900}'>
<pre class="viz-fallback">
   the same fib(10), one basic step per tick, in lockstep:
     naive:     177 calls, still expanding the tree
     memoized:   19 calls, done
     two vars:   10 additions, done
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>One step per tick: the two-variable lane finishes first, the memoized one next; the naive lane is still expanding.</small>

--

## What made it work

1. **overlapping subproblems**: the recursion asks the same questions many times, so remembering pays
2. **optimal substructure**: the answer is built from answers to smaller instances of the same problem

Both hold: **dynamic programming**. Cost: (number of distinct subproblems) × (work per subproblem).

--

## Memoization or tabulation?

| | memoization | tabulation |
| --- | --- | --- |
| direction | top-down: recursion plus a cache | bottom-up: loops over a table |
| order | found by the recursion | chosen by you |
| computes | only the subproblems reached | usually all of them |
| space savings | hard to see | easy: drop rows no longer read |

Same asymptotic cost. Memoize to get it right; tabulate for speed or space.

--

## Three paradigms

| paradigm | subproblems | each step |
| --- | --- | --- |
| divide and conquer | **independent** | solve every part |
| greedy | one remains | commit to **one** locally best choice |
| dynamic programming | **overlapping** | try **every** choice, reuse the answers |

Where greedy has a counterexample, dynamic programming tries every choice, and remembering keeps the cost polynomial.

