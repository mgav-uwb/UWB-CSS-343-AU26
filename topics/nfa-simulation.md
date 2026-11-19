<!--
  TOPIC · Simulating the NFA.
  Teaches: why guessing (backtracking) fails; tracking the set of every reachable state, and the invariant; the epsilon-closure as a graph search with a seen-set; std::set (an intro slide, per the STL rule); closure in C++; one step (advance, then close) and matches in C++; a worked run (AAABD on ((A*B|AC)D)); a practice (ABD); the nfa-sim demo; the cost O(nm log m); backtracking engines, ReDoS, and which engines simulate.
  Needs:   Thompson's construction, graph search (DFS).
  Demos:   nfa-sim (registry slug); figure str-nfa-big-start (tools/gen-string-figures.mjs)
  Program: code/regex/nfa.cpp
  Budget:  ~24 min, 12 slides.
  Ported from Summer 2026 L17-regex-automata.md, part 4.
-->

### Simulating the NFA

> In 2007 Russ Cox timed the pattern a?ⁿaⁿ against aⁿ: at n = 29, Perl took over sixty seconds; Thompson's 1968 method, twenty microseconds.

<small>R. Cox, “Regular Expression Matching Can Be Simple And Fast,” swtch.com, January 2007</small>

--

## Guessing fails

A **backtracking** matcher follows one path; at a dead end it backs up and tries the next choice.

- `AACD` on `((A*B|AC)D)`: `A*B` with two A's, then one, then none, then `AC`: four attempts, all failing
- $k$ independent choices: up to $2^k$ paths, each tried in turn

Perl, Python, Java and JavaScript match this way: exponential time in the worst case.

--

## Follow every path at once

Keep the **set** of states some path can be in:

1. start: the states reachable from 0 by ε-edges alone
2. per character $c$: advance each active state that reads $c$; add what ε-edges reach
3. accept if state $m$ is in the final set

**Invariant**: after $k$ characters, the set holds exactly the states that some path reading them reaches.

--

## The $\varepsilon$-closure

The states reachable from a set by ε-edges alone: a **graph search** over the ε-edges.

<div><img src="../../topics/figures/strings/str-nfa-big-start.svg" style="height:190px" alt="
   ((A*B|AC)D) with the start set {0, 1, 2, 3, 4, 6} drawn purple"></div>

From $\{0\}$: $\{0, 1, 2, 3, 4, 6\}$. Armed: 2 (an A of `A*B`), 4 (its B), 6 (the A of `AC`).

--

## [`std::set`](../../textbook/foundations/foundation-stl-primer.html#map)

`<set>`: distinct keys, **sorted**, in a red-black tree; every call is $O(\log n)$.

```cpp
set<int> seen = s;
```

| call | does |
| --- | --- |
| `seen.insert(v)` | add `v`; no effect if present |
| `seen.insert(v).second` | `true` if `v` was **new** |
| `seen.count(v)` | 1 if `v` is in, else 0 |
| `for (int u : seen)` | visit the keys in increasing order |

--

## The closure, in C++

```cpp
set<int> closure(const NFA& nfa, const set<int>& s) {
    set<int> seen = s;
    vector<int> stack(s.begin(), s.end());
    while (!stack.empty()) {
        int u = stack.back(); stack.pop_back();
        for (int v : nfa.eps[u])
            if (seen.insert(v).second) stack.push_back(v);   // first visit
    }
    return seen;
}
```

A depth-first search, seeded with **every** state of `s`.

--

## One character at a time

```cpp
bool matches(const NFA& nfa, const string& text) {
    set<int> pc = closure(nfa, {0});              // states reachable on ""
    for (char c : text) {
        set<int> next;
        for (int u : pc)                          // advance every letter state
            if (consumes(nfa, u, c)) next.insert(u + 1);
        pc = closure(nfa, next);                  // then close over e-edges
    }
    return pc.count(nfa.m) > 0;                   // the accept state is active?
}
```

`consumes(nfa, u, c)`: state $u$ is the letter $c$. Homework 10 gives it.

--

## AAABD, step by step

| read | advance to | then close | |
| :-: | --- | --- | --- |
| | | $\{0, 1, 2, 3, 4, 6\}$ | start |
| A | $\{3, 7\}$ | $\{2, 3, 4, 7\}$ | both branches alive |
| A | $\{3\}$ | $\{2, 3, 4\}$ | `AC` is dead |
| A | $\{3\}$ | $\{2, 3, 4\}$ | |
| B | $\{5\}$ | $\{5, 8, 9\}$ | |
| D | $\{10\}$ | $\{10, 11\}$ | 11 = $m$: **accept** |

--

## Your turn: simulate

Run `((A*B|AC)D)` on `ABD`, then on `AAC`.

<details class="answer"><summary>Answer:</summary>

| | start | A | B | D |
| --- | --- | --- | --- | --- |
| `ABD` | $\{0,1,2,3,4,6\}$ | $\{2,3,4,7\}$ | $\{5,8,9\}$ | $\{10,11\}$: accept |

`AAC`: after `AA`, $\{2, 3, 4\}$; no state reads C: $\{\}$, reject.

</details>

--

## Demo: the simulation

<div class="algo-viz" data-algo="nfa-sim" data-config='{"width":900,"height":250}'>
<pre class="viz-fallback">
   ((A*B|AC)D) on AAABD: the active set after each character, purple
   {0,1,2,3,4,6} -A-> {2,3,4,7} -A-> {2,3,4} -A-> {2,3,4} -B-> {5,8,9} -D-> {10,11}: accept
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Match `AAABD`, then `AAC`, then `A^9BD`: the set never grows past a few states.</small>

--

## The cost

Per character: the active set has at most $m + 1$ states, and each ε-edge is followed at most once in a closure.

- $O(m)$ set operations per character, $O(\log m)$ each
- $O(nm \log m)$ for a text of $n$ characters, $\Theta(nm)$ with an array of flags in place of the `set`
- **no** backtracking, on any input

--

## Engines and ReDoS

On July 2, 2019, one regular expression in a firewall rule held Cloudflare's servers at 100% CPU for 27 minutes: a backtracking engine on an unlucky input.

| engine | method | worst case |
| --- | --- | --- |
| Perl, Python, Java, JavaScript | backtracking | exponential |
| grep, RE2, Go, Rust | automata | linear in $n$ |

Backtracking engines keep **backreferences**, such as `(A*)B\1`, which no automaton can match.

