<!--
  TOPIC · Knuth-Morris-Pratt.
  Teaches: the insight (after a partial match, the pattern itself says where to resume); borders and fail[j] (0-based, inclusive: AABAA gives 0 1 0 1 2); why skipping is safe; the search in C++ (j = fail[j-1] on a mismatch); a worked search where a shorter border rescues; counting comparisons (one per fall-back plus one per text character, at most 2n); building fail[] by matching the pattern against itself, in C++; a practice; the demo; every match with j = fail[m-1]; the cost.
  Needs:   substring search.
  Demos:   kmp-fail (slide spec kmp-fail-lecture in topics/demos.js), string-search (registry slug); figures str-kmp-insight, str-kmp-borders, str-kmp-rescue (tools/gen-string-figures.mjs)
  Program: code/kmp/kmp.cpp
  Budget:  ~26 min, 14 slides.
  Ported from Summer 2026 L16-strings-tries.md, part 4; the failure-function form of the AU26 chapter and Homework 10, not Sedgewick's DFA.
-->

### Knuth-Morris-Pratt

> James Morris devised the method for a text editor; Donald Knuth found it independently from automata theory; with Vaughan Pratt they published it in 1977.

<small>D. E. Knuth, J. H. Morris and V. R. Pratt, “Fast Pattern Matching in Strings,” SIAM Journal on Computing 6(2), 1977</small>

--

## The insight

<div><img src="../../topics/figures/strings/str-kmp-insight.svg" style="height:150px" alt="
   ABABC against ABABABC: ABAB matches, then P[4] = C fails against A
   AB is a prefix of the pattern and a suffix of the matched ABAB:
   slide the pattern by two and resume at P[2], the text pointer unmoved"></div>

After matching `ABAB`, the text's last two characters are `AB`, which is also how the pattern **starts**. Resume with 2 characters already matched.

--

## Borders and fail[ ]

A **border** of a string is a proper prefix that is also a suffix: `ABAB` has borders `AB` and the empty string.

$$fail[j] = \text{the length of the longest border of } p[0..j]$$

| $j$ | 0 | 1 | 2 | 3 | 4 |
| --- | --: | --: | --: | --: | --: |
| $p[j]$ | A | A | B | A | A |
| $fail[j]$ | 0 | 1 | 0 | 1 | 2 |

--

## Why skipping is safe

After $j$ matches, the text ends in $p[0..j-1]$. An occurrence starting $s$ characters later would need $p[0..j-1-s]$ to be a suffix **and** a prefix of $p[0..j-1]$: a border.

- the longest border, $fail[j-1]$, gives the **nearest** alignment that can still match
- every alignment between is skipped **without** missing an occurrence

--

## The search, in C++

```cpp
int kmpSearch(const string& t, const string& p) {
    vector<int> fail = failureFn(p);
    int j = 0;                             // characters matched so far
    for (int i = 0; i < (int)t.size(); i++) {
        while (j > 0 && t[i] != p[j]) j = fail[j - 1];  // fall back
        if (t[i] == p[j]) j++;             // extend the partial match
        if (j == (int)p.size()) return i - j + 1;       // a full match
    }
    return -1;                             // no occurrence
}
```

`i` only moves forward. On a mismatch, $j$ falls back through the borders until $t[i]$ extends one, or $j = 0$.

--

## A shorter border rescues

<div><img src="../../topics/figures/strings/str-kmp-rescue.svg" style="height:200px" alt="
   AABAAB in AABAAABAAB: AABAA matched, then text[5] = A against p[5] = B
   fall back to fail[4] = 2 (AA): p[2] = B against A fails again
   fall back to fail[1] = 1 (A): p[1] = A matches; the scan goes on and finds index 4"></div>

$fail$ of `AABAAB` is `0 1 0 1 2 3`. At `text[5]`: $j = 5 \to 2 \to 1$, then a match.

--

## Counting comparisons

Each text character costs **one comparison per fall-back, plus one**.

- $j$ rises by at most 1 per text character, so at most $n$ times in all
- each fall-back lowers $j$, so there are at most $n$ fall-backs
- at most $2n$ comparisons for the scan: $\Theta(n)$

`ABABC` in `ABABABCABABABCAB`, to the first match: **8** (brute force: 11).

--

## Building fail[ ]

Match the pattern **against itself**: $k$ is the current border length.

```cpp
vector<int> failureFn(const string& p) {
    int m = p.size();
    vector<int> fail(m, 0);
    int k = 0;                             // the current border's length
    for (int j = 1; j < m; j++) {
        while (k > 0 && p[j] != p[k]) k = fail[k - 1];  // a shorter border
        if (p[j] == p[k]) k++;             // extend the border
        fail[j] = k;
    }
    return fail;
}
```

The same loop as the search, with $p$ as the text. $\Theta(m)$.

--

## Your turn: fail[ ]

Build $fail$ for `ABAABA`. Where does $k$ fall back?

<details class="answer"><summary>Answer:</summary>

| $j$ | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --: | --: | --: | --: | --: | --: |
| $p[j]$ | A | B | A | A | B | A |
| $fail[j]$ | 0 | 0 | 1 | 1 | 2 | 3 |

At $j = 3$: $k = 1$ and $p[3] = $ A $\ne p[1] = $ B, so $k = fail[0] = 0$; then $p[3] = p[0]$ gives $k = 1$.

</details>

--

## Demo: building fail[ ]

<div class="algo-viz" data-algo="kmp-fail-lecture" data-config='{"width":900}'>
<pre class="viz-fallback">
   fail[] of ABAABA, built by matching the pattern against itself:
   j = 1: B vs A, k = 0 · j = 2: A = A, k = 1 · j = 3: A vs B, k = fail[0] = 0, then A = A, k = 1
   j = 4: B = B, k = 2 · j = 5: A = A, k = 3          fail = 0 0 1 1 2 3
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Step through `ABAABA`, then the preset `AABAAABAAAABAAAB`, whose fall-backs chain.</small>

--

## Demo: KMP against brute force

<div class="algo-viz" data-algo="string-search" data-config='{"width":900}'>
<pre class="viz-fallback">
   the same text scanned by brute force and KMP side by side, one comparison per tick:
   ABABC in ABABABCABABABCAB: both find 2 and 9; brute force re-reads the text after
   each partial match, KMP's text pointer only moves right
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Run **BF vs KMP** on the default, then on the preset `A^40B / A^6B`, where brute force backs up at every alignment.</small>

--

## Every match

After a full match, continue with $j = fail[m-1]$: the longest border of the whole pattern is already matched.

`ABA` in `ABABABA`: matches at **0, 2, 4**, the last two overlapping the one before.

Resetting to $j = 0$ would miss the overlaps.

--

## The cost

| | brute force | KMP |
| --- | --- | --- |
| preprocessing | none | $\Theta(m)$ time, $\Theta(m)$ space |
| scan, worst case | $\Theta(nm)$ | $\Theta(n)$, at most $2n$ comparisons |
| text pointer | backs up | **never** backs up |

`AAAAB` in $\mathtt{A}^{20}\mathtt{B}$: 85 comparisons against 37.

