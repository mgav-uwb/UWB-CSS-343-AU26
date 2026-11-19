<!--
  CSS 343 · Autumn 2026 · Lecture 20, closing: recap, the course, this week.
  Session logistics only.
-->

### Wrap

<small>(~5 min)</small>

--

## Recap: pattern to machine

| step | construction | cost |
| --- | --- | --- |
| regex → NFA | Thompson: a state per character | $\Theta(m)$ |
| run the NFA | a set of states: advance, then close | $O(nm \log m)$ |
| NFA → DFA | the subset construction | up to $2^m$ states |
| run the DFA | one edge per character | $\Theta(n)$ |

Not regular: anything that must count without bound, such as $\mathtt{A}^n\mathtt{B}^n$.

--

## The course

| thread | lectures |
| --- | --- |
| analysis | running time, memory, asymptotic notation, recurrences |
| trees | search trees, balanced trees, B-trees, heaps |
| hashing | hash tables |
| graphs | traversal, topological sort, shortest paths, spanning trees |
| design methods | greedy, divide and conquer, dynamic programming |
| strings | tries, substring search, regular expressions and automata |

--

## This week

- **Homework 10** (trie insert and longest prefix, KMP, Boyer-Moore, ε-closure and NFA simulation): due **Fri Dec 11, 11:59 PM**, no late tokens
- **Final exam**: **Wed Dec 16, 1:15–3:15 PM**, in this room; comprehensive, on paper, with questions on PA3
- one sheet of notes, written by hand, **both sides**
