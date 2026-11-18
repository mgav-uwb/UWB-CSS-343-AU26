<!--
  TOPIC · Codes and prefix-free codes.
  Teaches: alphabet, code, codeword, encoding and decoding; the cost of a code on a text; the compression problem on the a..f frequencies (a fixed 3-bit code spends 300 bits, 135 of them on f); variable-length codes, a first try at 265 bits; why variable-length codes can be ambiguous; prefix-free codes as binary trees with symbols at the leaves; cost as the sum of frequency times depth; fullness.
  Needs:   tree basics.
  Demos:   figures pc-ambig, pc-fixed (tools/gen-greedy-figures.mjs)
  Program: none
  Budget:  ~11 min, 8 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 3.
-->

### Codes and prefix-free codes

> Alfred Vail sized the dots and dashes of Morse code by counting the letters in a printer's type case, so the commonest letter, e, got the shortest codeword: a single dot.

<small>J. Gleick, *The Information*, 2011</small>

--

## What a code is

Text is stored as **bits**. A **code** gives each symbol of the **alphabet** a **codeword**:

| symbol | a | b | c | d | e | f |
| --- | --- | --- | --- | --- | --- | --- |
| codeword | `000` | `001` | `010` | `011` | `100` | `101` |

**Encode** “cab”: look up, concatenate: `010000001`. **Decode**: cut into 3s.

**Cost** on a text: $\sum\_s f\_s \cdot \lvert \text{codeword}(s) \rvert$ bits, with $f\_s$ the count of $s$.

--

## The compression problem

**Given** each symbol's count $f\_s$, **find** a decodable code of least cost $\sum\_s f\_s \cdot \lvert \text{codeword}(s) \rvert$.

The fixed code, $\lceil \log\_2 6 \rceil = 3$ bits per symbol, on a text of 100:

| symbol | a | b | c | d | e | f |
| --- | --: | --: | --: | --: | --: | --: |
| count | 5 | 9 | 12 | 13 | 16 | 45 |
| bits | 15 | 27 | 36 | 39 | 48 | **135** |

300 bits; $f$, 45% of the text, spends **135** of them.

--

## Variable-length codes

**Short** codewords for **frequent** symbols, **long** ones for rare symbols. A first try: $f$ gets one bit, every other symbol four.

| symbol | a | b | c | d | e | f |
| --- | --- | --- | --- | --- | --- | --- |
| count | 5 | 9 | 12 | 13 | 16 | 45 |
| codeword | `1000` | `1001` | `1010` | `1011` | `1100` | `0` |

$45 \cdot 1 + 55 \cdot 4 = 265$ bits, against **300**: $f$ saves 90, the other 55 symbols pay 55.

To decode: a `0` is $f$; a `1` starts a four-bit codeword.

--

## Ambiguous codes

With $a = 0$, $b = 1$, $c = 01$, what do the bits `01` say?

<div><img src="../../topics/figures/greedy/pc-ambig.svg" style="height:185px" alt="
   a = 0, b = 1, c = 01
   01 read as a, b: &quot;ab&quot;
   01 read as c:    &quot;c&quot;"></div>

$a$'s `0` is a **prefix** of $c$'s `01`: where does a codeword end? Morse code pauses between letters.

--

## Prefix-free codes

**Prefix-free**: no codeword is a prefix of another. It is a tree with the symbols at the **leaves**, and a codeword spells the path, left 0, right 1:

<div><img src="../../topics/figures/greedy/pc-fixed.svg" style="height:235px" alt="
   the fixed 3-bit code as a tree:
   0 → 00 → a=000, b=001;  01 → c=010, d=011
   1 → 10 → e=100, f=101;  11 unused
   every symbol at depth 3: 300 bits"></div>

Decoding stops at the **first leaf** it reaches.

--

## Cost is depth

A symbol's codeword length **is** its depth $d\_s$ in the tree:

$$\text{cost}(T) = \sum\_s f\_s \cdot d\_s$$

- the fixed code: every $d\_s = 3$, cost 300
- the question: **which tree** with leaves $a \ldots f$ has the **smallest** cost?
- a rare symbol can afford to be deep; a frequent one should be shallow

--

## Your turn: prefix-free?

Which codes are prefix-free? Which could be made shorter?

1. $\lbrace 0, 10, 110, 111 \rbrace$
2. $\lbrace 0, 01, 11 \rbrace$
3. $\lbrace 00, 01, 10 \rbrace$

<details class="answer"><summary>Answer:</summary>

1. Prefix-free, and **full**: every internal node has two children.
2. **Not** prefix-free: `0` is a prefix of `01`.
3. Prefix-free, but node `1` has **one** child: replace `10` by `1` and every use of that symbol saves a bit. A tree with a one-child node is never optimal; an optimal tree is **full**.

</details>

