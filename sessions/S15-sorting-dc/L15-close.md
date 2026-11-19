<!--
  CSS 343 · Autumn 2026 · Lecture 15, closing: recap, this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: divide and conquer

- divide, conquer, combine; a base case stops the recursion
- $T(n) = a\\,T(n/b) + f(n)$: the level costs form a **geometric series**
- shrinking: the root wins; flat: times $\log n$; growing: the leaves win
- balanced splits make $\log n$ levels; skewed splits make $n$

--

## Recap: sorting and selection

| | time | extra memory | stable |
| --- | --- | --- | --- |
| mergesort | $\Theta(n \log n)$ always | $\Theta(n)$ | yes |
| quicksort | $\Theta(n \log n)$ expected, $\Theta(n^2)$ worst | $\Theta(\log n)$ expected | no |
| quickselect | $\Theta(n)$ expected | $\Theta(\log n)$ expected | |

Every comparison sort needs $\lceil \log\_2 n! \rceil = \Omega(n \log n)$ comparisons; counting and radix sort do not compare.

--

## Which sort?

- a few dozen keys: insertion sort
- in general: introsort, `std::sort`
- stability, or a guarantee on every input: mergesort, `std::stable_sort`
- small integer keys or fixed-width keys: counting or radix sort
- one rank, not the whole order: quickselect, `std::nth_element`

--

## This week

- **Homework 8** (merge with inversion count, mergesort, Lomuto partition, quickselect, rod cutting, LCS length): due **Sun Nov 29, 11:59 PM**
- **Quiz 7**, Mon Nov 30: Lectures 15 and 16 and Homework 8
- **PA3 design**: due **Mon Nov 30, 11:59 PM**
