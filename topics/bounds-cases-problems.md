<!--
  TOPIC · Bounds, cases, and problems.
  Teaches: case (which input) and bound (which set) are independent choices;
           a cost that varies with the input has no single Θ in n, only O and
           Ω; an algorithm's cost is an upper bound on the problem; a lower
           bound belongs to the problem and must be proved; tight problems
           versus open gaps.
  Needs:   the asymptotic-notation topic; the memory topic (grid BFS numbers);
           the faster-3sum topic.
  Demos:   none.
  Program: none (numbers from topics/code/memory/bfs_grid.cpp).
  Budget:  ~18 min, 8 slides.
-->

### Bounds, cases, and problems

<small>(~18 min)</small>

--

## Case and bound are separate choices

Two independent questions:

- **which input?** best case, worst case, average case
- **which set?** O, Ω, Θ

Any bound can describe any case. "The worst case is in Θ(n)" makes **one choice of each**.

--

## Example: searching

Cost counted in comparisons, as a function of n:

| | best case | worst case |
| --- | :-: | :-: |
| linear search | Θ(1): first element | Θ(n): absent |
| binary search, sorted | Θ(1): the middle | Θ(lg n): absent |

"Binary search is O(lg n)" usually means: its **worst case** is in **Θ(lg n)**.

--

## When there is no single Θ

Grid BFS again, with a structure that stores only the **R cells reached**: memory ∈ Θ(R). As a function of **n**:

| maze | R | memory |
| --- | :-: | :-: |
| start walled in | 1 | Θ(1) |
| one-wide corridor | about 2n | Θ(n) |
| open grid | about n² | Θ(n²) |

Over **all** mazes the cost is in **O(n²)** and in **Ω(1)**, and in no single Θ(g(n)).

--

## Whose property is a bound?

Every Θ so far belongs to **one algorithm**:

- brute-force 3-sum: Θ(N³)
- fast 3-sum: Θ(N² lg N)
- two-pointer 3-sum: Θ(N²)

1. Is Θ(N³) a property of **the problem** 3-sum, or of **the algorithm**?
2. What can be said about the problem itself?

Talk to your neighbor: 60 seconds.

--

## An algorithm is an upper bound on the problem

An algorithm that solves the problem in Θ(f) shows the **problem** can be solved in **O(f)**:

- brute force: 3-sum is in O(N³)
- sort + binary search: in O(N² lg N)
- two pointers: in **O(N²)**, essentially the best known

Each is a **witness**: the cost is **achievable**, never proved **necessary**. A better algorithm lowers it.

--

## A lower bound belongs to the problem

**Every** algorithm needs at least this much, so it must be **proved**:

| problem | algorithm | lower bound | status |
| --- | :-: | :-: | --- |
| comparison sorting | O(N lg N) | Ω(N lg N) | **settled** |
| 3-sum | O(N²) | Ω(N) | **gap: open** |

Upper bound meets lower bound: the problem is in **Θ**, and optimizing is finished.

--

## Reading a claim

| claim | meaning |
| --- | --- |
| "mergesort is in Θ(N lg N)" | every input: at least and at most c·N lg N |
| "quicksort's worst case is in Θ(N²)" | the worst input costs order N² |
| "sorting is in Ω(N lg N)" | **no** comparison sort does better |
| "3-sum is in O(N²)" | some algorithm achieves N² |

Name the **case**, the **set**, and whether the subject is an **algorithm** or a **problem**.

