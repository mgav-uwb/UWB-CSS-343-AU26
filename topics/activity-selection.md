<!--
  TOPIC · Proving a greedy rule: activity selection.
  Teaches: the greedy method recalled; the greedy algorithms met so far and what proved them; the greedy-choice property and optimal substructure stated precisely; the exchange argument as a proof template; activity selection: the problem, three plausible rules and the instances that break them, earliest finish first, its C++, its exchange proof, the exchange carried out on the five requests, the optimal substructure that finishes the proof; a ten-request practice.
  Needs:   the greedy method (making change), sorting.
  Demos:   figures gm-five, is-shortest, is-earliest, is-conflicts, gm-select5, is-ten (tools/gen-greedy-figures.mjs)
  Program: code/activity-selection/activities.cpp
  Budget:  ~26 min, 15 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, parts 1 and 2.
-->

### Proving a greedy rule

> “Program testing can be used to show the presence of bugs, but never to show their absence!”

<small>E. W. Dijkstra, “Notes on Structured Programming,” EWD249, 1970</small>

--

## Greedy, recalled

Three moves, repeated until the problem is solved:

1. take the locally **best** choice, by a fixed rule
2. **commit** to it: it is never undone
3. **shrink** the problem by that choice

Largest coin first is **optimal** for $\lbrace 25, 10, 5, 1 \rbrace$ and **wrong** for $\lbrace 1, 3, 4 \rbrace$: $6 = 4 + 1 + 1$, three coins, against $3 + 3$. Same rule, different problem: every greedy rule **owes a proof**.

--

## Greedy algorithms so far

| algorithm | the greedy choice | proved safe by |
| --- | --- | --- |
| **Dijkstra** | settle the **nearest** unsettled vertex | the boundary chain, weights $\ge 0$ |
| **Prim** | add the **lightest** edge leaving the tree | the cut property |
| **Kruskal** | add the **cheapest** edge that closes no cycle | the cut property |

Each proof shows one thing: the greedy choice is **safe**, some optimal answer contains it.

--

## The two ingredients

A greedy rule is correct when the problem has both:

- **greedy-choice property**: some optimal solution **contains** the greedy choice
- **optimal substructure**: what is left is a **smaller instance**, and its optimum plus the choice is optimal

Dynamic programming needs only the second. The first is **rare**, and it is what needs proving.

--

## The exchange argument

The standard proof of the greedy-choice property:

1. let $g$ be the greedy choice, and $O$ any optimal solution **without** $g$
2. find an element of $O$ to **swap** for $g$
3. show the result is still **feasible** and **no worse** than $O$

Then an optimal solution **with** $g$ exists, so committing to $g$ is safe.

<small>It shows the greedy answer is **an** optimum, not **the** optimum; and “no worse” is all it needs.</small>

--

## Activity selection

One room. Requests are **half-open** intervals $[s, f)$: one ending at 5 and one starting at 5 do **not** conflict. Host **as many requests as possible**.

<div><img src="../../topics/figures/greedy/gm-five.svg" style="height:200px" alt="
   t     1  2  3  4  5  6  7  8  9  10 11
   a     [===========)                       [1,5)
   b        [===========)                    [2,6)
   c           [===========)                 [3,7)
   d                       [=====)           [7,9)
   e                          [========)     [8,11)"></div>

Which request would you commit to first?

--

## Three plausible rules

Each sounds reasonable. Find an instance that **defeats** each one:

- **shortest first**: the shortest request that fits
- **earliest start**: the request that starts first
- **fewest conflicts**: the request that overlaps the fewest others

--

## Two rules, broken

<div><img src="../../topics/figures/greedy/is-shortest.svg" style="height:135px" alt="
   A [0,6)  B [5,7)  C [6,12)
   shortest first takes B, which overlaps A and C: 1 request; A and C fit together: 2"></div>

<div><img src="../../topics/figures/greedy/is-earliest.svg" style="height:160px" alt="
   P [0,10)  Q [1,2)  R [3,4)  S [5,6)
   earliest start takes P, which overlaps the rest: 1 request; Q, R, S fit together: 3"></div>

Shortest first keeps **1** where **2** fit. Earliest start keeps **1** where **3** fit.

--

## Fewest conflicts fails

<div><img src="../../topics/figures/greedy/is-conflicts.svg" style="height:330px" alt="
   A[0,4) B[1,6) C[2,6) D[3,6) E[4,7) M[6,12) F[10,16) S[13,18) R[15,19) Q[14,20) P[16,20)
   conflicts: A 3, B 4, C 4, D 4, E 4, M 2, F 4, S 4, R 4, Q 4, P 3"></div>

$M$ conflicts with only 2 others, so the rule takes it first, and ends with **3** requests. $A, E, F, P$ is **4**.

--

## Earliest finish first

Sort by finish: $a(5)$, $b(6)$, $c(7)$, $d(9)$, $e(11)$. Take a request when it starts **at or after** the finish of the last one taken.

<div><img src="../../topics/figures/greedy/gm-select5.svg" style="height:190px" alt="
   a [1,5)   take: room free at 5
   b [2,6)   skip: starts 2 < 5
   c [3,7)   skip: starts 3 < 5
   d [7,9)   take: starts 7 ≥ 5
   e [8,11)  skip: starts 8 < 9"></div>

**2** requests, $a$ and $d$. A skipped request is never looked at again.

--

## Earliest finish, in C++

```cpp
bool finishesFirst(const Request& a, const Request& b) {
    return a.finish < b.finish;
}

vector<Request> selectRequests(vector<Request> reqs) {    // a copy: sorted here
    sort(reqs.begin(), reqs.end(), finishesFirst);
    vector<Request> taken;
    int roomFreeAt = INT_MIN;                // nothing taken yet
    for (const Request& r : reqs) {
        if (r.start >= roomFreeAt) {         // compatible with all taken
            taken.push_back(r);              // commit: never undone
            roomFreeAt = r.finish;
        }
    }
    return taken;
}
```

`Request` holds a name and $[s, f)$. The sort costs $O(n \log n)$; the pass $O(n)$.

--

## Earliest finish is safe

Let $g$ finish **earliest** of all requests. Let $O$ be any optimal schedule, in time order, and $o$ its first request.

$$\begin{aligned} f(g) &\le f(o) && g \text{ finishes earliest} \\\\ s(x) &\ge f(o) \ge f(g) && \text{for every later } x \text{ in } O \end{aligned}$$

Swap $o$ for $g$: every later request still starts after $g$ ends, so the schedule is **feasible**, and it has the **same size**. Some optimal schedule **contains** $g$.

--

## The exchange on the five

The optimal schedules that **leave out** $a$, with their first request swapped for $a$:

| $O$ | first $o$ | $f(o) \ge f(a) = 5$ | after the swap | size |
| --- | --- | --- | --- | --- |
| $\lbrace b, d \rbrace$ | $b = [2, 6)$ | $6 \ge 5$ | $\lbrace a, d \rbrace$ | $2 \to 2$ |
| $\lbrace b, e \rbrace$ | $b = [2, 6)$ | $6 \ge 5$ | $\lbrace a, e \rbrace$ | $2 \to 2$ |
| $\lbrace c, d \rbrace$ | $c = [3, 7)$ | $7 \ge 5$ | $\lbrace a, d \rbrace$ | $2 \to 2$ |
| $\lbrace c, e \rbrace$ | $c = [3, 7)$ | $7 \ge 5$ | $\lbrace a, e \rbrace$ | $2 \to 2$ |

Every swap is legal and loses nothing. Six schedules are optimal; greedy returns one of them.

--

## Optimal substructure

After taking $a$, what is left is the requests starting at or after $5$: $d = [7, 9)$ and $e = [8, 11)$.

- another activity-selection instance, **smaller**
- greedy solves it the same way: $d$, then $e$ conflicts
- by induction on $n$: greedy's count, $1 + 1 = 2$, is the optimum

Both ingredients hold: earliest finish is correct on **every** input.

--

## Your turn: ten requests

<div><img src="../../topics/figures/greedy/is-ten.svg" style="height:260px" alt="
   a [1,4)  b [3,5)  c [0,6)  d [4,7)  e [7,9)
   f [5,9)  g [6,10) h [8,11) i [8,12) j [11,13)"></div>

Run earliest finish first. Which requests does it take?

<details class="answer"><summary>Answer:</summary>

$a$, then $d$ ($4 \ge 4$), $e$ ($7 \ge 7$) and $j$ ($11 \ge 9$): **four**. Also optimal: $a, d, h, j$.

</details>

