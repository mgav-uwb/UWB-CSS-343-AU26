<!--
  TOPIC · From NFA to DFA, and Kleene's theorem.
  Teaches: the subset construction (each DFA state a set of NFA states, the simulation precomputed), on (A|B)*B; minimizing to two states; the exponential blowup (the k-th character from the end), with the proof that no DFA does better; Kleene's theorem; which machine to use.
  Needs:   NFA simulation.
  Demos:   none on the slides (the registry's nfa2dfa, two stacked panels, does not fit one); figures str-re-dfa-abstarb, str-re-dfa-min (tools/gen-string-figures.mjs)
  Program: code/regex/nfa.cpp (subset construction counts)
  Budget:  ~12 min, 6 slides.
  Ported from Summer 2026 L17-regex-automata.md, part 4.
-->

### From NFA to DFA

> Stephen Kleene introduced regular expressions in 1951 and proved that they describe exactly the languages finite automata recognize.

<small>S. C. Kleene, “Representation of Events in Nerve Nets and Finite Automata,” in *Automata Studies*, Princeton University Press, 1956</small>

--

## The subset construction

The simulation's sets are finite in number: make **each set a DFA state**, and precompute its edges.

<div><img src="../../topics/figures/strings/str-re-dfa-abstarb.svg" style="height:230px" alt="
   the DFA for (A|B)*B from its 10-state NFA: three states, each a set of NFA states
   D0 = {0,1,2,4,6,7} (start); D1 = {1,2,3,4,5,6,7}; D2 = {1,2,4,5,6,7,8,9} accepting
   every state goes to D1 on A and to D2 on B"></div>

`(A|B)*B`: a 10-state NFA, a 3-state DFA. A state accepts if its set holds $m$.

--

## Minimizing

$D_0$ and $D_1$ behave identically: both go to $D_1$ on A, to $D_2$ on B, and neither accepts. Merge them:

<div><img src="../../topics/figures/strings/str-re-dfa-min.svg" style="height:140px" alt="
   two states: q0 (start, the input so far does not end in B) and q1 (accepting, ends in B)
   A leads to q0, B to q1, from either state"></div>

Two states: "does not end in B" and "ends in B". The minimal DFA of a language is unique.

--

## The blowup

The $k$-th character from the end is A: `(A|B)*A`, then $k - 1$ copies of `(A|B)`.

| $k$ | 1 | 2 | 3 | 4 | 5 |
| --- | --: | --: | --: | --: | --: |
| NFA states | 10 | 15 | 20 | 25 | 30 |
| DFA states (subset construction) | 3 | 5 | 9 | 17 | 33 |

No DFA has fewer than $2^k$ states: two different $k$-letter strings differ somewhere; append letters until that position is $k$-th from the end, and one is accepted, the other not. So they end in different states.

--

## Kleene's theorem

Regular expressions, NFAs and DFAs describe **the same** languages: the **regular** languages.

- regex → NFA: Thompson's construction, linear size
- NFA → DFA: the subset construction, up to $2^m$ states
- DFA → regex: state elimination (not covered here)

$\{\mathtt{A}^n\mathtt{B}^n\}$ is not regular, so no regex, NFA or DFA recognizes it.

--

## Which machine?

| | build | match a text of $n$ |
| --- | --- | --- |
| NFA simulation | $\Theta(m)$ | $O(nm \log m)$ |
| DFA | up to $2^m$ states | $\Theta(n)$ |
| DFA built lazily, as text arrives | only the states reached | $\Theta(n)$ plus the states built |

GNU grep and RE2 build the DFA lazily: only the states the text reaches.

