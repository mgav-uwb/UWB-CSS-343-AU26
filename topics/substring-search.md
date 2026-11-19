<!--
  TOPIC · Substring search: the problem and brute force.
  Teaches: the problem (text of n, pattern of m, the first occurrence); brute force in C++; its worst case Theta(nm) counted on A..AB; why it is fast on ordinary text; what it wastes (the text pointer backs up).
  Needs:   arrays and strings; asymptotic notation.
  Demos:   figure str-ss-example (tools/gen-string-figures.mjs)
  Program: code/substring-search/brute.cpp
  Budget:  ~8 min, 5 slides.
  Ported from Summer 2026 L16-strings-tries.md, part 3.
-->

### Substring search

> Alfred Aho and Margaret Corasick published in 1975 a matcher for many patterns at once, written for a bibliographic search; it became the Unix `fgrep`.

<small>A. V. Aho and M. J. Corasick, “Efficient String Matching: An Aid to Bibliographic Search,” Communications of the ACM 18(6), 1975</small>

--

## The problem

Given a **text** $t$ of $n$ characters and a **pattern** $p$ of $m \le n$, find the first index $i$ with $t[i..i+m-1] = p$, or $-1$.

<div><img src="../../topics/figures/strings/str-ss-example.svg" style="height:110px" alt="
   text ABABABCABABABCAB (n = 16), pattern ABABC (m = 5): first match at index 2"></div>

Used in every editor's find, `grep`, virus scanners, DNA search. $n$ is often huge and $m$ small.

--

## Brute force

```cpp
int bruteSearch(const string& t, const string& p) {
    int n = t.size(), m = p.size();
    for (int i = 0; i <= n - m; i++) {     // each start position
        int j = 0;
        while (j < m && t[i + j] == p[j]) j++;   // compare left to right
        if (j == m) return i;              // all m matched: found at i
    }
    return -1;                             // no occurrence
}
```

Try every alignment; on a mismatch, slide by **one** and start over at $p[0]$.

--

## The worst case

Text $\mathtt{A}^{n-1}\mathtt{B}$, pattern $\mathtt{A}^{m-1}\mathtt{B}$: every alignment matches $m - 1$ characters before failing.

$$(n - m + 1) \cdot m \text{ comparisons} = \Theta(nm)$$

$n = 1{,}001$, $m = 100$: **90,200** comparisons for a 1,001-character text.

--

## What brute force wastes

At alignment $i$, a mismatch after $j$ matches **backs up**: the next alignment re-reads $t[i+1..i+j]$, characters the scan has already seen.

- the matched characters are known: they **are** $p[0..j-1]$
- so the alignments worth trying next can be read off the **pattern** alone, before the search starts

That table is Knuth-Morris-Pratt.

