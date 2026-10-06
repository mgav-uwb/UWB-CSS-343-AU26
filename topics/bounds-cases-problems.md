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

> David Musser's introsort (1997) keeps quicksort's average case and caps its worst case at Θ(n log n) by switching to heapsort when the recursion gets too deep; most C++ libraries implement std::sort this way.

<small>D. R. Musser, “Introspective Sorting and Selection Algorithms,” Software: Practice and Experience 27(8), 1997</small>

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
| binary search, sorted | Θ(1): the middle | Θ(log₂ n): absent |

"Binary search is O(log₂ n)" usually means: its **worst case** is in **Θ(log₂ n)**.

--

## Insertion sort: one algorithm, three cases

```cpp
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i], j = i;
        while (j > 0 && a[j - 1] > key) {   // one compare per test
            a[j] = a[j - 1];                // shift right
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
| best | already sorted | n − 1 | Θ(n) |
| worst | reverse sorted | n(n − 1)/2 | Θ(n²) |
| average | random order | n(n − 1)/4 + n − Hₙ, about n²/4 | Θ(n²) |

At n = 1000: **999**, **499,500**, about **250,000**. "Θ(n²)" holds only for the worst and average cases.

--

## Amortized cost: `push_back`

One `push_back` that triggers a regrowth copies **every** element: worst case **Θ(N)** for that call.

N pushes from empty: regrowths copy 1 + 2 + 4 + … < **2N** elements (1023 at N = 1000), plus N writes:

$$\text{total} < 3N$$

so the amortized cost per push is **Θ(1)**.

**Amortized:** the total cost of **any** sequence of n operations, divided by n. A worst-case promise about totals: no probability, unlike the average case.

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
- fast 3-sum: Θ(N² log₂ N)
- two-pointer 3-sum: Θ(N²)

1. Is Θ(N³) a property of **the problem** 3-sum, or of **the algorithm**?
2. What can be said about the problem itself?

Talk to your neighbor: 60 seconds.

--

## An algorithm is an upper bound on the problem

An algorithm that solves the problem in Θ(f) shows the **problem** can be solved in **O(f)**:

- brute force: 3-sum is in O(N³)
- sort + binary search: in O(N² log₂ N)
- two pointers: in **O(N²)**, essentially the best known

Each is a **witness**: the cost is **achievable**, never proved **necessary**. A better algorithm lowers it.

--

## A lower bound belongs to the problem

**Every** algorithm needs at least this much, so it must be **proved**:

| problem | algorithm | lower bound | status |
| --- | :-: | :-: | --- |
| comparison sorting | O(N log₂ N) | Ω(N log₂ N) | **settled** |
| 3-sum | O(N²) | Ω(N) | **gap: open** |

Upper bound meets lower bound: the problem is in **Θ**, and optimizing is finished.

--

## A lower bound you can prove: search by comparing

Search a sorted array of N by comparisons: **N + 1** answers (a position, or absent).

- a comparison algorithm is a **decision tree**: height h, at most **2ʰ** leaves
- each answer needs a leaf: 2ʰ ≥ N + 1, so **h ≥ ⌈log₂(N + 1)⌉**

Binary search's worst case ⌊log₂ N⌋ + 1 matches: **10** at N = 1000, **20** at 10⁶.

--

## Reading the documentation

| operation | the reference says | precisely |
| --- | --- | --- |
| `vector::push_back` | amortized constant | amortized Θ(1); one call Θ(N) |
| `vector::operator[]` | constant | Θ(1) every call |
| `map::find` | logarithmic | worst case Θ(log₂ N) |
| `unordered_map::find` | average constant, worst linear | average Θ(1), worst Θ(N) |
| `std::sort` | O(N log N) comparisons | worst case (C++11 on) |

--

## Reading a claim

| claim | meaning |
| --- | --- |
| "mergesort is in Θ(N log₂ N)" | every input: at least and at most c·N log₂ N |
| "quicksort's worst case is in Θ(N²)" | the worst input costs order N² |
| "sorting is in Ω(N log₂ N)" | **no** comparison sort does better |
| "3-sum is in O(N²)" | some algorithm achieves N² |

Name the **case**, the **set**, and whether the subject is an **algorithm** or a **problem**.

--

## Your turn: classify the claims

For each: **algorithm or problem? Which case? Which set?** Is it true?

1. "Linear search is in Ω(n)."
2. "Sorted-array search is in Ω(log₂ n)."
3. "`push_back` is in O(1)."
4. "Insertion sort is in Θ(n²)."

<details class="answer"><summary>Answer:</summary>

(1) worst case only (2) true: the decision tree (3) amortized only (4) worst and average only

</details>

