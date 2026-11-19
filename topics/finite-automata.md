<!--
  TOPIC · Finite automata.
  Teaches: a DFA (states, start, accepting states, one edge per state and character); running one on 110; a practice; the dfa demo; nondeterminism and epsilon-edges, acceptance by some path, shown on (A*B) in the wrapped numbering; DFA against NFA.
  Needs:   regular expressions.
  Demos:   dfa (registry slug); figures str-re-dfa-ends0, str-nfa-astarb-wrapped (tools/gen-string-figures.mjs)
  Program: code/regex/nfa.cpp
  Budget:  ~14 min, 7 slides.
  Ported from Summer 2026 L17-regex-automata.md, part 2.
-->

### Finite automata

> Michael Rabin and Dana Scott defined nondeterministic finite automata in 1959 and showed that each can be made deterministic; the paper won them the 1976 Turing Award.

<small>M. O. Rabin and D. Scott, “Finite Automata and Their Decision Problems,” IBM Journal of Research and Development 3(2), 1959</small>

--

## A deterministic finite automaton

- finitely many **states**, one of them the **start**
- some states **accept** (double circle)
- exactly **one** edge out of each state for each character

<div><img src="../../topics/figures/strings/str-re-dfa-ends0.svg" style="height:105px" alt="
   two states: A (start) and B (accepting)
   A on 1 stays at A, A on 0 goes to B; B on 0 stays at B, B on 1 goes back to A"></div>

This one accepts the binary strings that end in 0.

--

## Running it

Follow one edge per character; **accept** if the last state accepts. `110`: $A \xrightarrow{1} A \xrightarrow{1} A \xrightarrow{0} B$, accept.

- one table lookup per character: $\Theta(n)$ for a text of $n$ characters
- memory: the current state, whatever the length of the text

--

## Your turn: run the DFA

Run it on `0110`, on `111`, and on the empty string.

<details class="answer"><summary>Answer:</summary>

- `0110`: $A \to B \to A \to A \to B$: accept
- `111`: $A \to A \to A \to A$: reject
- empty: the machine stays at $A$: reject

</details>

--

## Demo: a DFA

<div class="algo-viz" data-algo="dfa" data-config='{"width":900,"height":230}'>
<pre class="viz-fallback">
   the ends-in-0 DFA on 110: A -1-> A -1-> A -0-> B, accept
   presets: 0110 (accept), 111 (reject), and machines for ends in B, an even number of A's, contains AB
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Run `110`, then the preset that contains `AB`: one state is a **trap** that no edge leaves.</small>

--

## Nondeterminism

An **NFA** may have several edges for one character, and **ε-edges** taken without reading. It accepts if **some** path reads the whole text and ends in an accepting state.

<div><img src="../../topics/figures/strings/str-nfa-astarb-wrapped.svg" style="height:150px" alt="
   the NFA for (A*B), states 0 to 5, 5 accepting
   epsilon-edges 0->1, 1->2, 2->1, 2->3, 4->5; match edges 1 -A-> 2, 3 -B-> 4"></div>

The NFA of `A*B`, built from the wrapped regex `(A*B)`: from state 2 the machine may go back for another A, or on to the B.

--

## DFA or NFA?

| | DFA | NFA |
| --- | --- | --- |
| edges per state and character | exactly one | any number, plus ε-edges |
| run | one state, $\Theta(n)$ | a **set** of states |
| built from a regex | possibly exponential size | linear size, directly |

Both recognize the same languages. Matching builds the NFA and simulates it.

