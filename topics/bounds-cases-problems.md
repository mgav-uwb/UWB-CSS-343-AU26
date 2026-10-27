<!--
  TOPIC · Bounds, cases, and problems.
  Teaches: case (which input) and bound (which set) are independent choices;
           a cost that varies with the input has no single Θ in n, only O and
           Ω; an algorithm's cost is an upper bound on the problem; a lower
           bound belongs to the problem and must be proved; tight problems
           versus open gaps; insertion sort's three cases counted; amortized
           cost (push_back), not an average; the
           decision-tree lower bound for searching a sorted array; reading
           library documentation; classifying claims.
  Needs:   the asymptotic-notation topic; the memory topic (grid BFS numbers);
           the faster-3sum topic.
  Demos:   none.
  Program: none (numbers from topics/code/memory/bfs_grid.cpp).
  Budget:  ~16 min, 14 slides.
-->

### Bounds, cases, and problems

> David Musser's introsort (1997) keeps quicksort's average case and caps its worst case at $\Theta(n \log n)$ by switching to heapsort when the recursion gets too deep; most C++ libraries implement std::sort this way.

<small>D. R. Musser, “Introspective Sorting and Selection Algorithms,” Software: Practice and Experience 27(8), 1997</small>

--

## Case and bound are separate choices

Two independent questions:

- **which input?** best case, worst case, average case
- **which set?** $O$, $\Omega$, $\Theta$

Any bound can describe any case. "The worst case is in $\Theta(n)$" makes **one choice of each**.

--

## Example: searching

Cost counted in comparisons, as a function of $n$:

| | best case | worst case |
| --- | :-: | :-: |
| linear search | $\Theta(1)$: first element | $\Theta(n)$: absent |
| binary search, sorted | $\Theta(1)$: the middle | $\Theta(\log\_2 n)$: absent |

"Binary search is $O(\log\_2 n)$" usually means: its **worst case** is in $\boldsymbol{\Theta(\log\_2 n)}$.

--

## Insertion sort: one algorithm, three cases

```cpp
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i], j = i;
        while (j > 0 && a[j - 1] > key) { // a compare per test
            a[j] = a[j - 1];              // shift right
            j--;
        }
        a[j] = key;
    }
}
```

**Cost model:** compares of `a[j - 1] > key`. Each element walks left past every larger element before it.

--

## Insertion sort: counting each case

| case | input | compares | set |
| --- | --- | :-: | :-: |
| best | already sorted | $n - 1$ | $\Theta(n)$ |
| worst | reverse sorted | $n(n - 1)/2$ | $\Theta(n^2)$ |
| average | random order | $n(n - 1)/4 + n - H\_n \approx n^2/4$ | $\Theta(n^2)$ |

At $n = 1000$: **999**, **499,500**, about **250,000**. "$\Theta(n^2)$" holds only for the worst and average cases.

--

## Amortized cost: `push_back`

One `push_back` that triggers a regrowth copies **every** element: worst case $\boldsymbol{\Theta(N)}$ for that call.

$N$ pushes from empty: regrowths copy $1 + 2 + 4 + \cdots < 2N$ elements (1023 at $N = 1000$), plus $N$ writes, **fewer than** $\boldsymbol{3N}$ in all: the amortized cost per push is $\boldsymbol{\Theta(1)}$.

**Amortized:** the total cost of **any** sequence of $n$ operations, divided by $n$. A worst-case promise about totals: no probability, unlike the average case.

--

## When there is no single $\Theta$

Grid BFS again, with a structure that stores only the $\boldsymbol{R}$ **cells reached**: memory $\in \Theta(R)$. As a function of $\boldsymbol{n}$:

| maze | $R$ | memory |
| --- | :-: | :-: |
| start walled in | 1 | $\Theta(1)$ |
| one-wide corridor | about $2n$ | $\Theta(n)$ |
| open grid | about $n^2$ | $\Theta(n^2)$ |

Over **all** mazes the cost is in $\boldsymbol{O(n^2)}$ and in $\boldsymbol{\Omega(1)}$, and in no single $\Theta(g(n))$.

--

## Whose property is a bound?

Every $\Theta$ so far belongs to **one algorithm**:

- brute-force 3-sum: $\Theta(N^3)$
- fast 3-sum: $\Theta(N^2 \log\_2 N)$
- two-pointer 3-sum: $\Theta(N^2)$

1. Is $\Theta(N^3)$ a property of **the problem** 3-sum, or of **the algorithm**?
2. What can be said about the problem itself?

Talk to your neighbor: 60 seconds.

--

## An algorithm is an upper bound on the problem

An algorithm that solves the problem in $\Theta(f)$ shows the **problem** can be solved in $\boldsymbol{O(f)}$:

- brute force: 3-sum is in $O(N^3)$
- sort + binary search: in $O(N^2 \log\_2 N)$
- two pointers: in $\boldsymbol{O(N^2)}$, essentially the best known

Each is a **witness**: the cost is **achievable**, never proved **necessary**. A better algorithm lowers it.

--

## A lower bound belongs to the problem

**Every** algorithm needs at least this much, so it must be **proved**:

| problem | algorithm | lower bound | status |
| --- | :-: | :-: | --- |
| comparison sorting | $O(N \log\_2 N)$ | $\Omega(N \log\_2 N)$ | **settled** |
| 3-sum | $O(N^2)$ | $\Omega(N)$ | **gap: open** |

Upper bound meets lower bound: the problem is in $\boldsymbol{\Theta}$, and optimizing is finished.

--

## A lower bound you can prove: search by comparing

Search a sorted array of $N$ by comparisons: $\boldsymbol{N + 1}$ answers (a position, or absent).

- a comparison algorithm is a **decision tree**: height $h$, at most $\boldsymbol{2^h}$ leaves
- each answer needs a leaf: $2^h \ge N + 1$, so $\boldsymbol{h \ge \lceil \log\_2(N + 1) \rceil}$

Binary search's worst case $\lfloor \log\_2 N \rfloor + 1$ matches: **10** at $N = 1000$, **20** at $10^6$.

--

## Reading the documentation

| operation | the reference says | precisely |
| --- | --- | --- |
| `vector::push_back` | amortized constant | amortized $\Theta(1)$; one call $\Theta(N)$ |
| `vector::operator[]` | constant | $\Theta(1)$ every call |
| `map::find` | logarithmic | worst case $\Theta(\log\_2 N)$ |
| `unordered_map::find` | average constant, worst linear | average $\Theta(1)$, worst $\Theta(N)$ |
| `std::sort` | $O(N \log N)$ comparisons | worst case (C++11 on) |

--

## Reading a claim

| claim | meaning |
| --- | --- |
| "mergesort is in $\Theta(N \log\_2 N)$" | every input: at least and at most $c \cdot N \log\_2 N$ |
| "quicksort's worst case is in $\Theta(N^2)$" | the worst input costs order $N^2$ |
| "sorting is in $\Omega(N \log\_2 N)$" | **no** comparison sort does better |
| "3-sum is in $O(N^2)$" | some algorithm achieves $N^2$ |

Name the **case**, the **set**, and whether the subject is an **algorithm** or a **problem**.

--

## Your turn: four claims

For each: **algorithm or problem? Which case? Which set?** True?

1. "Linear search is in $\Omega(n)$."
2. "Sorted-array search is in $\Omega(\log\_2 n)$."
3. "`push_back` is in $O(1)$."
4. "Insertion sort is in $\Theta(n^2)$."

<details class="answer"><summary>Answer:</summary>

1. worst case only
2. true: the decision tree
3. amortized only
4. worst and average only

</details>

