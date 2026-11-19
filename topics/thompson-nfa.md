<!--
  TOPIC · Thompson's construction, in Sedgewick's encoding.
  Teaches: one gadget per operation; one state per character of the wrapped regex (the numbering Homework 10 uses); (A*B) drawn with the reason for every epsilon-edge; buildNFA in C++ in three parts (setup, parentheses and bars with a stack, stars and fall-through); the scan of (A*B|AC)D with its stack; the whole machine; a practice ((AB|C)*); the nfa-build demo; linear size.
  Needs:   regular expressions, finite automata, stacks.
  Demos:   nfa-build (registry slug); figures str-re-gadgets, str-nfa-astarb-wrapped, str-re-nfa-big, str-nfa-abc-star (tools/gen-string-figures.mjs)
  Program: code/regex/nfa.cpp (buildNFA is Homework 10's given code)
  Budget:  ~24 min, 11 slides.
  Ported from Summer 2026 L17-regex-automata.md, part 3.
-->

### Thompson's construction

> Ken Thompson's 1968 search compiled each regular expression into IBM 7094 machine code that ran the automaton directly; he used it in the QED text editor.

<small>K. Thompson, “Regular Expression Search Algorithm,” Communications of the ACM 11(6), 1968</small>

--

## One gadget per operation

<div><img src="../../topics/figures/strings/str-re-gadgets.svg" style="height:430px" alt="
   concatenation (ABC): letters chained by match edges
   union (A|B): the ( forks to both branches (0->1, 0->3); the | jumps to the ) (2->4)
   closure (A*): skip the operand (1->2) and repeat it (2->1)
   purple: the states reachable before reading anything"></div>

--

## One state per character

- wrap the regex: `"(" + pattern + ")"`, so a top-level `|` or `*` has parentheses to attach to
- state $i$ **is** `re[i]`; state $m$, one past the end, **accepts**
- a letter state $i$ has one match edge, to $i + 1$
- `(`, `)`, `|`, `*` have only ε-edges

The slides and Homework 10 number states in the **wrapped** regex: `A*B` is `(A*B)`, states 0 to 5.

--

## (A\*B), edge by edge

<div><img src="../../topics/figures/strings/str-nfa-astarb-wrapped.svg" style="height:150px" alt="
   (A*B): states 0 to 5; epsilon-edges 0->1, 1->2, 2->1, 2->3, 4->5; match 1 -A-> 2, 3 -B-> 4"></div>

| ε-edge | why |
| --- | --- |
| 0→1, 2→3, 4→5 | fall through `(`, `*`, `)` |
| 1→2 | skip the A: the star allows zero |
| 2→1 | repeat the A |

--

## The machine, in C++

```cpp
struct NFA {
    string re;                                  // "(" + pattern + ")"
    int m;                                      // re.size(); state m accepts
    vector<vector<int>> eps;                    // eps[u]: e-edges out of u
};

NFA buildNFA(const string& pattern) {
    NFA nfa;
    nfa.re = "(" + pattern + ")";
    nfa.m = nfa.re.size();
    nfa.eps.assign(nfa.m + 1, vector<int>());
    const string& re = nfa.re;
    int m = nfa.m;
    vector<int> ops;                            // positions of ( and |
```

The ε-edges are a directed graph in adjacency lists; the match edges need no storage.

--

## The scan: parentheses and bars

```cpp
    for (int i = 0; i < m; i++) {
        int lp = i;                             // start of the atom ending at i
        if (re[i] == '(' || re[i] == '|') ops.push_back(i);
        else if (re[i] == ')') {
            int orPos = ops.back(); ops.pop_back();
            if (re[orPos] == '|') {             // wire the alternation
                lp = ops.back(); ops.pop_back();
                nfa.eps[lp].push_back(orPos + 1);
                nfa.eps[orPos].push_back(i);
            } else {
                lp = orPos;
            }
        }
```

At `)`: a `|` on the stack gets its fork `(`→ after the `|`, and its jump `|`→`)`.

--

## The scan: stars and fall-through

```cpp
        if (i < m - 1 && re[i + 1] == '*') {    // closure around lp..i
            nfa.eps[lp].push_back(i + 1);
            nfa.eps[i + 1].push_back(lp);
        }
        if (re[i] == '(' || re[i] == '*' || re[i] == ')')
            nfa.eps[i].push_back(i + 1);        // fall through a metacharacter
    }
    return nfa;
}
```

The star is seen **one step early**: at the end of its operand, `lp..i`.

--

## The scan of (A\*B|AC)D

| $i$ | `re[i]` | stack after | ε-edges added |
| --: | :-: | --- | --- |
| 0, 1 | `(` `(` | 0, then 0 1 | 0→1, 1→2 |
| 2 | `A` | 0 1 | 2→3, 3→2 (a `*` follows) |
| 3 | `*` | 0 1 | 3→4 |
| 4 | `B` | 0 1 | |
| 5 | `\|` | 0 1 5 | |
| 6, 7 | `A` `C` | 0 1 5 | |
| 8 | `)` | 0 | 1→6, 5→8, 8→9 |
| 9 | `D` | 0 | |
| 10 | `)` | (empty) | 10→11 |

--

## The whole machine

<div><img src="../../topics/figures/strings/str-re-nfa-big.svg" style="height:190px" alt="
   ((A*B|AC)D): states 0 to 11, 11 accepting
   epsilon-edges 0->1, 1->2, 1->6, 2->3, 3->2, 3->4, 5->8, 8->9, 10->11
   match edges 2 -A-> 3, 4 -B-> 5, 6 -A-> 7, 7 -C-> 8, 9 -D-> 10"></div>

12 states, 9 ε-edges, 5 match edges.

--

## Your turn: build one

List the ε-edges of the NFA for `(AB|C)*`, wrapped as `((AB|C)*)`.

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/strings/str-nfa-abc-star.svg" style="height:190px" alt="
   ((AB|C)*): states 0 to 9
   epsilon-edges 0->1, 1->2, 1->5, 1->7, 4->6, 6->7, 7->1, 7->8, 8->9
   match edges 2 -A-> 3, 3 -B-> 4, 5 -C-> 6"></div>

0→1, 1→2; at the `)` (6): 1→5 and 4→6, and the star after it: 1→7, 7→1; falls 6→7, 7→8, 8→9.

</details>

--

## Demo: building the NFA

<div class="algo-viz" data-algo="nfa-build" data-config='{"width":900,"height":250}'>
<pre class="viz-fallback">
   the scan of (A*B|AC)D, wrapped: one character per step, the stack beside it,
   each epsilon-edge drawn as it is added; 12 states, 9 epsilon-edges at the end
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Build `(A*B|AC)D`, then `(AB|C)*` to check the practice.</small>

--

## Linear size

- states: $m + 1$ for a wrapped regex of $m$ characters
- ε-edges: at most 3 per `*`, 2 per `|`, 1 per parenthesis, so at most $3m$
- one scan, constant work per character: $\Theta(m)$ time and space

