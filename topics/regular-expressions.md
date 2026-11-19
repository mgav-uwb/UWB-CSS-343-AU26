<!--
  TOPIC · Regular expressions.
  Teaches: a regex names a set of strings, its language; matching a whole text is membership; the three operations and parentheses; precedence; reading regexes; two practices; the shorthand and how it reduces to the three operations; regexes in practice; why AⁿBⁿ is not regular (pigeonhole on a finite machine's states).
  Needs:   strings; sets.
  Demos:   none
  Program: code/regex/nfa.cpp (every membership claim checked against std::regex_match)
  Budget:  ~20 min, 10 slides.
  Ported from Summer 2026 L17-regex-automata.md, part 1.
-->

### Regular expressions

> Doug McIlroy asked for a tool to search files for a pattern; the next morning Ken Thompson had `grep`, the search command of the `ed` editor made into a program.

<small>B. W. Kernighan, *UNIX: A History and a Memoir*, Kindle Direct Publishing, 2019</small>

--

## A pattern names a set of strings

- an **alphabet**: the characters, here A, B, C, D
- a **regular expression** $R$ describes a set of strings, its **language** $L(R)$
- $R$ **matches** a text when the whole text is in $L(R)$

`A*B` describes $\{\mathtt{B}, \mathtt{AB}, \mathtt{AAB}, \ldots\}$: it matches `AAB`, not `AABA`.

--

## Three operations

| operation | written | language |
| --- | --- | --- |
| concatenation | `AB` | a string from `A`, then one from `B` |
| union | `A\|B` | a string from either |
| closure | `A*` | zero or more strings from `A`, one after another |

Parentheses group: `(AB)*` is $\{\varepsilon, \mathtt{AB}, \mathtt{ABAB}, \ldots\}$, where $\varepsilon$ is the empty string.

--

## Precedence

`*` binds tightest, then concatenation, then `|`: `AB*|C` means `(A(B*))|C`.

| regex | matches | does not match |
| --- | --- | --- |
| `AB*` | `A`, `AB`, `ABB` | `ABAB` |
| `(AB)*` | (empty), `AB`, `ABAB` | `A`, `ABB` |
| `A\|BC` | `A`, `BC` | `AC` |

--

## Reading a regex

| regex | its language |
| --- | --- |
| `A*B` | any number of A, then one B |
| `(A\|B)*B` | strings of A and B that end in B |
| `(A*B\|AC)D` | `A*B` or `AC`, then D: `BD`, `AAABD`, `ACD` |

The third is the running example of the next two topics.

--

## Your turn: what matches?

Which of `BD`, `ABD`, `AACD`, `D` does `(A*B|AC)D` match?

<details class="answer"><summary>Answer:</summary>

- `BD`: yes, `A*B` with no A
- `ABD`: yes, one A
- `AACD`: no; `AC` allows one A only
- `D`: no; both branches need at least one character

</details>

--

## Your turn: write one

Over the alphabet A, B: every string that **contains** `AB`.

<details class="answer"><summary>Answer:</summary>

`(A|B)*AB(A|B)*`: anything, then `AB`, then anything. Matches `AB`, `BBAAB`, `ABBB`; not `BBBA`.

</details>

--

## Shorthand

| shorthand | means | with the three operations |
| --- | --- | --- |
| `A+` | one or more | `AA*` |
| `A?` | zero or one | `(A\|ε)` |
| `[A-D]` | one of a range | `(A\|B\|C\|D)` |
| `.` | any one character | a union of the whole alphabet |

None adds power. The course's NFA builder takes letters, concatenation, `*`, `( )` and one `|` per group.

--

## Regular expressions in use

`[A-Za-z_][A-Za-z0-9_]*`: a C++ identifier, a letter or underscore, then letters, digits and underscores.

- `grep` and every editor's search
- a compiler's **lexer** splits source code into tokens with one pattern per kind of token
- validating input: dates, postal codes, log lines

--

## What a regex cannot describe

$\{\mathtt{A}^n\mathtt{B}^n : n \ge 0\}$, equal numbers of A and B, is **not** regular.

- a matcher with finitely many states $k$ reads $\mathtt{A}^0, \mathtt{A}^1, \ldots, \mathtt{A}^k$: $k + 1$ prefixes, so two of them, $\mathtt{A}^i$ and $\mathtt{A}^j$ with $i \ne j$, end in the **same state**
- from there it reads $\mathtt{B}^i$ and gives the same verdict to $\mathtt{A}^i\mathtt{B}^i$ and $\mathtt{A}^j\mathtt{B}^i$: wrong for one of them

Balanced parentheses fail the same way: counting needs unbounded memory.

