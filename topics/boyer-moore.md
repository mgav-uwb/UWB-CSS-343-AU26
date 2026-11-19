<!--
  TOPIC · Boyer-Moore with the bad-character rule.
  Teaches: compare right to left; the bad-character table right[c] in C++; the shift j - right[c] and its three cases, the clamp at 1; the search in C++; a worked search (EXAMPLE in HERE IS A SIMPLE EXAMPLE, 15 comparisons against brute force's 27); a practice; the demo; the cost (about n/m on typical text, Theta(nm) worst case); the substring-search family compared.
  Needs:   substring search, KMP (for the comparison).
  Demos:   string-search (registry slug); figure str-bm-clamp (tools/gen-string-figures.mjs)
  Program: code/boyer-moore/bm.cpp
  Budget:  ~14 min, 9 slides.
  Ported from Summer 2026 L16-strings-tries.md, part 4; bad-character rule only, as the AU26 chapter and Homework 10.
-->

### Boyer-Moore

> Robert Boyer and J Strother Moore published in 1977 a search that, on long patterns, examines only a fraction of the text's characters.

<small>R. S. Boyer and J S. Moore, “A Fast String Searching Algorithm,” Communications of the ACM 20(10), 1977</small>

--

## Compare from the right

- align the pattern and compare $p[m-1]$ first, moving **left**
- a mismatched text character $c$ that occurs **nowhere** in the pattern: no alignment covering it can match, so slide the pattern **past** it
- one comparison can rule out $m$ alignments

--

## The bad-character table

```cpp
vector<int> rightmost(const string& p) {
    vector<int> right(256, -1);
    for (int j = 0; j < (int)p.size(); j++)
        right[(unsigned char)p[j]] = j;
    return right;
}
```

$right[c]$: the index of the **rightmost** $c$ in the pattern, $-1$ if absent.

| `EXAMPLE` | E | X | A | M | P | L | any other |
| --- | --: | --: | --: | --: | --: | --: | --: |
| $right$ | 6 | 1 | 2 | 3 | 4 | 5 | $-1$ |

--

## The shift

A mismatch at $p[j]$ against text character $c$: slide by $j - right[c]$, so the pattern's rightmost $c$ lands under it.

- $c$ not in the pattern: $right[c] = -1$, shift $j + 1$, past $c$
- rightmost $c$ left of $j$: shift $j - right[c] > 0$
- rightmost $c$ **right** of $j$: the shift is $\le 0$; **clamp** it to 1

--

## Boyer-Moore, in C++

```cpp
int bmSearch(const string& t, const string& p) {
    int n = t.size(), m = p.size();
    vector<int> right = rightmost(p);
    int skip;
    for (int i = 0; i + m <= n; i += skip) {
        skip = 0;
        for (int j = m - 1; j >= 0; j--)           // right to left
            if (p[j] != t[i + j]) {
                skip = j - right[(unsigned char)t[i + j]];
                if (skip < 1) skip = 1;            // clamp: at least 1
                break;
            }
        if (skip == 0) return i;                   // all m matched: found
    }
    return -1;                                     // no occurrence
}
```

`skip` stays 0 only when all $m$ characters matched.

--

## A worked search

`EXAMPLE` in `HERE IS A SIMPLE EXAMPLE`:

| $i$ | compared | mismatch | $j$ | $right[c]$ | shift |
| --: | --: | --- | --: | --: | --: |
| 0 | 1 | `S` | 6 | $-1$ | 7 |
| 7 | 1 | `P` | 6 | 4 | 2 |
| 9 | 5 | `I` | 2 | $-1$ | 3 |
| 12 | 1 | `X` | 6 | 1 | 5 |
| 17 | 7 | match | | | |

15 comparisons; brute force needs 27.

--

## Your turn: Boyer-Moore

`TIME` in `A STITCH IN TIME`: the alignments, the shifts, the comparisons?

<details class="answer"><summary>Answer:</summary>

$right$: T 0, I 1, M 2, E 3. Every mismatch is at $j = 3$.

| $i$ | 0 | 3 | 7 | 11 | 12 |
| --- | --: | --: | --: | --: | --: |
| text character | `T` | `C` | `N` | `M` | match |
| shift | $3 - 0 = 3$ | $3 + 1 = 4$ | 4 | $3 - 2 = 1$ | |

**8** comparisons; brute force: 19.

</details>

--

## When it loses

<div><img src="../../topics/figures/strings/str-bm-clamp.svg" style="height:250px" alt="
   BAAAA in AAAAAAAAAA: every alignment matches four As from the right, then B fails against A
   right[A] = 4 lies right of the mismatch, so the shift 0 - 4 is clamped to 1
   six alignments, 30 comparisons"></div>

$\Theta(nm)$ in the worst case: 30 comparisons, where brute force needs 6.

--

## The family

| | worst case | typical text | extra space | text pointer |
| --- | --- | --- | --- | --- |
| brute force | $\Theta(nm)$ | about $n$ | none | backs up |
| KMP | $\Theta(n + m)$ | about $n$ | $\Theta(m)$ | never backs up |
| Boyer-Moore (bad character) | $\Theta(nm)$ | about $n/m$ | $\Theta(R)$ | backs up |

KMP for a guarantee or a stream; Boyer-Moore for speed on long patterns over a large alphabet.

