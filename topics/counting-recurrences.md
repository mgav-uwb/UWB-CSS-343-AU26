<!--
TOPIC · Counting what a recursive function does.
  Teaches: reading a recurrence off the code; solving it by unrolling; three
           recurrences (one call on n-1, one call on half, two calls on n-1)
           and their counts.
  Needs:   the recursion topic (length, bsearch) and the counting-loops topic.
  Demos:   none.
  Program: topics/code/recursion/recursion.cpp (probe and move counts)
  Budget:  ~11 min, 8 slides.
-->

### Counting recursion

> Édouard Lucas published the Tower of Hanoi in 1883 with a legend of 64 golden disks; moving them all takes $2^{64} - 1$ moves.

<small>É. Lucas (as N. Claus de Siam), La Tour d'Hanoï, 1883</small>

--

## From code to recurrence

```cpp
int length(const Node* p) {
    if (p == nullptr) return 0;
    return 1 + length(p->next);
}
```

Let $T(n)$ be the number of **calls** for a list of $n$ nodes.

$$
\begin{aligned}
T(0) &= 1 && \text{the call that sees } \texttt{nullptr} \\\\
T(n) &= 1 + T(n - 1) && \text{this call, plus the rest of the list}
\end{aligned}
$$

A **recurrence** defines a count in terms of the count for a smaller input.

--

## Solve it by unrolling

$$
\begin{aligned}
T(n) &= 1 + T(n - 1) \\\\
&= 1 + 1 + T(n - 2) \\\\
&= 1 + 1 + 1 + T(n - 3) \\\\
&\enspace \vdots \\\\
&= n + T(0) \\\\
&= n + 1
\end{aligned}
$$

Replace $T$ by its own definition until the base case appears.

--

## Binary search, counted

Worst-case **probes** of `a[mid]`, for $n = 2^k - 1$ keys.

One probe leaves a half of $2^{k-1} - 1$ keys:

$$
\begin{aligned}
T(2^k - 1) &= 1 + T(2^{k-1} - 1) \\\\
&= 1 + 1 + T(2^{k-2} - 1) \\\\
&\enspace \vdots \\\\
&= k + T(0) \\\\
&= k
\end{aligned}
$$

That is $k = \log\_2(n + 1)$ probes.

--

## Binary search: the numbers

Worst case over every present and absent key, measured:

| $n$ | Worst-case probes |
| ---: | ---: |
| 15 | 4 |
| 16 | 5 |
| 1000 | 10 |
| 1,000,000 | 20 |

For any $n$: $\lfloor \log\_2 n \rfloor + 1$.

<small>Code: <a href="../../topics/code/recursion/recursion.cpp">recursion.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Towers of Hanoi

```cpp
void hanoi(int n, char from, char to, char via) {
    if (n == 0) return;
    hanoi(n - 1, from, via, to);
    moves++;
    hanoi(n - 1, via, to, from);
}
```

Let $T(n)$ be the number of moves:

$$
\begin{aligned}
T(0) &= 0 \\\\
T(n) &= 1 + 2T(n - 1)
\end{aligned}
$$

--

## Unrolling Hanoi

$$
\begin{aligned}
T(n) &= 1 + 2T(n - 1) \\\\
&= 1 + 2 + 4T(n - 2) \\\\
&= 1 + 2 + 4 + 8T(n - 3) \\\\
&\enspace \vdots \\\\
&= 1 + 2 + 4 + \cdots + 2^{n-1} + 2^nT(0) \\\\
&= 2^n - 1
\end{aligned}
$$

- $n = 10$: **1,023** moves
- $n = 20$: **1,048,575** moves

--

## Three recurrences

| Function | $T(n)$ | Count | $n = 20$ |
| --- | --- | ---: | ---: |
| `length` | $1 + T(n - 1)$ | $n + 1$ | 21 |
| `bsearch` | $1 + T(n/2)$ | $\lfloor \log\_2 n \rfloor + 1$ | 5 |
| `hanoi` | $1 + 2T(n - 1)$ | $2^n - 1$ | 1,048,575 |

How many recursive calls, and how large an input each receives, decide the count.

