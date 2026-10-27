<!--
  TOPIC · Asymptotic notation: O, Ω, Θ as sets of functions.
  Teaches: O(g), Ω(g), Θ(g) defined as sets; membership f ∈ O(g) proved by
           exhibiting witness constants c and n0, non-membership by
           contradiction; witnesses are not unique; Θ = O ∩ Ω; the
           polynomial theorem; f = O(g) as one-way shorthand; order of growth
           as Θ membership; sum and product rules as set facts; the strict
           hierarchy; the limit test; log bases are interchangeable;
           exponentials beat polynomials; ranking functions; common mistakes;
           practice proofs.
  Needs:   the cost-model topic (tilde, order of growth); the faster-3sum
           topic (sum and product rules, informally).
  Demos:   none.
  Figures: an-big-o, an-theta (tools/gen-analysis-figures.mjs).
  Program: none.
  Budget:  ~38 min, 27 slides.
  Math:    marked runs before KaTeX. No \, \; \{ in math (use \lbrace,
           \rbrace); on a line with two or more subscripts, write every one
           as \_ so marked does not pair them into <em>.
  Matches: textbook/foundations/foundation-asymptotic-notation.html
-->

### Asymptotic notation: $O$, $\Omega$, $\Theta$ as sets

> Paul Bachmann introduced the $O$ notation in 1894; Donald Knuth proposed $\Omega$ and $\Theta$ with their present meanings in 1976.

<small>D. E. Knuth, “Big Omicron and Big Omega and Big Theta,” SIGACT News, 1976</small>

--

## "Order of growth $N^3$" was informal

So far: "**about** $N^3/6$", "**order of growth** $N^3$", "grows **like** $N^2$".

To state guarantees we need a definition that

- ignores constant factors (the machine)
- ignores small $n$ (start-up behavior)
- turns "grows like" into a **true or false question**

--

## The key idea: a set of functions

$\boldsymbol{O(g)}$ is a **set**: all the functions that grow no faster than $g$, up to a constant factor.

For any function $f$, exactly one holds:

$$f \in O(g) \qquad \text{or} \qquad f \notin O(g)$$

Membership is **proved by exhibiting constants**, or disproved by showing none can exist.

--

## Definition: Big-O

$$O(g(n)) = \lbrace f(n) : \exists c, n_0 > 0 \text{ such that}$$

$$0 \le f(n) \le c \cdot g(n) \text{ for all } n \ge n_0 \rbrace$$

Read: $f$ is in $O(g)$ if **some constant multiple of** $\boldsymbol{g}$ stays **above** $\boldsymbol{f}$ from **some point** $\boldsymbol{n\_0}$ **on**.

- $\boldsymbol{c}$ absorbs constant factors
- $\boldsymbol{n\_0}$ discards small inputs

--

## The picture

<div><img src="../../topics/figures/complexity/an-big-o.svg" style="height:360px" alt="
   f(n) = 2n^2 + 8n + 5 and c g(n) = 3n^2, n = 0 .. 20:
   f is above 3n^2 until n0 = 9, below it from n0 on (shaded)"></div>

Past $\boldsymbol{n\_0}$, the curve $\boldsymbol{c \cdot g(n)}$ stays above $\boldsymbol{f(n)}$. Left of $n\_0$, anything goes.

--

## Proving membership

**Claim:** $2n^2 + 8n + 5 \in O(n^2)$.

**Witnesses.** For $n \ge 1$, each lower term is at most a multiple of $n^2$: $8n \le 8n^2$ and $5 \le 5n^2$. So

$$2n^2 + 8n + 5 \le 2n^2 + 8n^2 + 5n^2 = 15n^2$$

With $\boldsymbol{c = 15}$, $\boldsymbol{n\_0 = 1}$ the definition holds, so the function **is a member**. ∎

--

## Witnesses are not unique

For $2n^2 + 8n + 5 \le c \cdot n^2$, several pairs work:

| $c$ | smallest $n\_0$ | why |
| :-: | :-: | --- |
| 15 | 1 | term-by-term bound |
| 3 | 9 | $n^2 - 8n - 5 \ge 0$ from $n = 9$ on |
| 2.5 | 17 | $0.5n^2 \ge 8n + 5$ from $n = 17$ on |
| 2 | none | $8n + 5 \le 0$ never holds |

A smaller $c$ needs a later $n\_0$; any $c$ **above the leading coefficient 2** works.

--

## Proving non-membership

**Claim:** $6n^3 \notin O(n^2)$.

**Proof.** Suppose some $c, n\_0 > 0$ had $6n^3 \le c \cdot n^2$ for all $n \ge n\_0$. Divide by $n^2$:

$$n \le \frac{c}{6} \quad \text{for all } n \ge n_0$$

But $c/6$ is a fixed number and $n$ grows without bound: **contradiction**. No witnesses exist. ∎

--

## $O(g)$ is an upper bound, not a tight one

All of these are members of $\boldsymbol{O(n^2)}$:

$$5n \in O(n^2)$$

$$n \log\_2 n \in O(n^2) \qquad 3n^2 + 100n \in O(n^2)$$

The sets are **nested**: $O(n) \subset O(n \log\_2 n) \subset O(n^2) \subset O(n^3)$.

Saying an algorithm's cost is in $O(n^2)$ says it is **at most** about $n^2$; it could be linear.

--

## Definition: Big-Omega

$$\Omega(g(n)) = \lbrace f(n) : \exists c, n_0 > 0 \text{ such that}$$

$$0 \le c \cdot g(n) \le f(n) \text{ for all } n \ge n_0 \rbrace$$

$f$ is in $\Omega(g)$ if **some constant multiple of** $\boldsymbol{g}$ stays **below** $\boldsymbol{f}$ from $n\_0$ on: $f$ grows **at least as fast** as $g$.

**Example:** $2n^2 + 8n + 5 \in \Omega(n^2)$ with $\boldsymbol{c = 2}$, $\boldsymbol{n\_0 = 1}$: the leading term alone is enough.

--

## Definition: Big-Theta

$$\Theta(g(n)) = \lbrace f(n) : \exists c\_1, c\_2, n\_0 > 0 \text{ such that}$$

$$0 \le c\_1 g(n) \le f(n) \le c\_2 g(n) \text{ for all } n \ge n\_0 \rbrace$$

$f$ is **squeezed** between two constant multiples of $g$: the **tight** bound.

--

## The sandwich

<div><img src="../../topics/figures/complexity/an-theta.svg" style="height:360px" alt="
   f(n) = 2n^2 + 8n + 5 between 2n^2 and 3n^2, n = 0 .. 20:
   below 3n^2 from n = 9, above 2n^2 from n = 1, squeezed from n0 = 9 on"></div>

Past $n\_0$: $\boldsymbol{c\_1 \cdot g(n) \le f(n) \le c\_2 \cdot g(n)}$.

--

## Proving $\Theta$ membership

**Claim:** $\frac{1}{2}n^2 - 3n \in \Theta(n^2)$.

Need $c\_1 n^2 \le \frac{1}{2}n^2 - 3n \le c\_2 n^2$. Divide by $n^2$:

$$c\_1 \le \frac{1}{2} - \frac{3}{n} \le c\_2$$

- right side: holds for all $n \ge 1$ with $\boldsymbol{c\_2 = \frac{1}{2}}$
- left side: at $n = 7$ the middle is $\frac{1}{14}$, and it only grows, so $\boldsymbol{c\_1 = \frac{1}{14}}$

$\boldsymbol{c\_1 = \frac{1}{14}}$, $\boldsymbol{c\_2 = \frac{1}{2}}$, $\boldsymbol{n\_0 = 7}$. ∎

--

## A $\Theta$ proof, line by line

**Claim:** $3n^2 - 5n + 2 \in \Theta(n^2)$. Find $c\_1, c\_2, n\_0$ with $c\_1 n^2 \le 3n^2 - 5n + 2 \le c\_2 n^2$ for all $n \ge n\_0$.

1. **Upper.** For $n \ge 1$, $-5n + 2 \le -3 < 0$, so $3n^2 - 5n + 2 \le 3n^2$. Take $\boldsymbol{c\_2 = 3}$.
2. **Lower.** Try $c\_1 = 2$: need $3n^2 - 5n + 2 \ge 2n^2$, that is $n^2 - 5n + 2 \ge 0$.
3. The roots of $n^2 - 5n + 2$ are $(5 \pm \sqrt{17})/2$, about 0.44 and **4.56**, so it holds for every $n \ge 5$.
4. **Witnesses:** $c\_1 = 2$, $c\_2 = 3$, $n\_0 = 5$. Check $n = 5$: $2 \cdot 25 = 50 \le 52 \le 75 = 3 \cdot 25$. ∎

--

## Theorem: $\Theta = O \cap \Omega$

$$\Theta(g) = O(g) \cap \Omega(g)$$

$\boldsymbol{\subseteq}$: the right inequality of $\Theta$ is the $O$ condition; the left is the $\Omega$ condition.

$\boldsymbol{\supseteq}$: take $f \in O(g)$ with witnesses $(c\_2, a)$ and $f \in \Omega(g)$ with $(c\_1, b)$. Then $\boldsymbol{c\_1, c\_2}$ and $\boldsymbol{n\_0 = \max(a, b)}$ witness $\Theta$.

A tight bound is **an upper bound and a lower bound for the same** $\boldsymbol{g}$.

--

## Theorem: polynomials

If $p(n) = a\_k n^k + \cdots + a\_1 n + a\_0$ with $\boldsymbol{a\_k > 0}$, then $\boldsymbol{p \in \Theta(n^k)}$.

**Proof idea.** Let $A = \lvert a\_0 \rvert + \cdots + \lvert a\_{k-1} \rvert$.

- **upper:** for $n \ge 1$ every $n^i \le n^k$, so $p(n) \le (a\_k + A) n^k$
- **lower:** $p(n) \ge a\_k n^k - A n^{k-1} \ge (a\_k/2) n^k$ once $n \ge 2A/a\_k$

$\boldsymbol{c\_1 = a\_k/2}$, $\boldsymbol{c\_2 = a\_k + A}$, $\boldsymbol{n\_0 = \max(1, 2A/a\_k)}$. ∎

--

## $\in$ or $=$ ?

The precise statement is **membership**: $n \in O(n^2)$.

The common shorthand $\boldsymbol{n = O(n^2)}$ means the same thing, but it is **not an equation**:

- read **left to right only**: never "$O(n^2) = n$"
- **not transitive as an equality**: $n = O(n^2)$ and $n^2 = O(n^2)$, yet $n \ne n^2$

Inside a formula, a set stands for **some member**: $2n^2 + 3n + 1 = 2n^2 + \Theta(n)$, where $\Theta(n)$ stands for $3n + 1$.

--

## Order of growth, precisely

"The cost has order of growth $g$" means $\boldsymbol{\text{cost} \in \Theta(g)}$:

| count | membership |
| --- | --- |
| $\binom{N}{3} = N(N - 1)(N - 2)/6$ | $\in \Theta(N^3)$ |
| fast 3-sum's array accesses | $\in \Theta(N^2 \log\_2 N)$ |
| mergesort's buffer, $4N$ bytes | $\in \Theta(N)$ |

**Tilde is stronger:** $f \sim g$ implies $f \in \Theta(g)$, but not the reverse. $2N^3 \in \Theta(N^3)$, yet $2N^3 \not\sim N^3$.

--

## Sum and product rules, as set facts

If $\boldsymbol{f\_1 \in O(g\_1)}$ and $\boldsymbol{f\_2 \in O(g\_2)}$, then

- **sum:** $f\_1 + f\_2 \in O(\max(g\_1, g\_2))$
- **product:** $f\_1 \cdot f\_2 \in O(g\_1 \cdot g\_2)$

**Proof of the sum rule.** With witnesses $(c\_1, a)$ and $(c\_2, b)$, for $n \ge \max(a, b)$:

$$f\_1 + f\_2 \le c\_1 g\_1 + c\_2 g\_2 \le (c\_1 + c\_2) \cdot \max(g\_1, g\_2) \qquad \blacksquare$$

The same rules hold for $\Theta$.

--

## The hierarchy

Each function is in $\boldsymbol{O}$ of the next, but **not in** $\boldsymbol{\Omega}$ of it:

<div style="font-size:0.88em">

$$1 \quad \log\_2 n \quad \sqrt{n} \quad n \quad n \log\_2 n \quad n^2 \quad n^3 \quad 2^n \quad n!$$

</div>

**Limit test:** if $f(n)/g(n) \to 0$, then $f \in O(g)$ and $f \notin \Omega(g)$.

- $\log\_2 n / n^e \to 0$ for every $e > 0$: a log loses to any positive power
- $n^k / 2^n \to 0$ for every $k$: any polynomial loses to $2^n$

--

## The limit test

If the limit of $f(n)/g(n)$ as $n \to \infty$ **exists**, it settles the comparison:

| limit of $f/g$ | conclusion |
| --- | --- |
| $0$ | $f \in O(g)$, $f \notin \Omega(g)$: $g$ grows strictly faster |
| a constant $L > 0$ | $f \in \Theta(g)$ |
| $\infty$ | $f \in \Omega(g)$, $f \notin O(g)$: $f$ grows strictly faster |

**Example:** $(3n^2 - 5n + 2)/n^2 = 3 - 5/n + 2/n^2 \to 3,$ so the function is in $\Theta(n^2)$ with no witnesses to hunt for.

--

## Logarithm bases do not matter

For bases $a, b > 1$: $$\log\_a n = \frac{1}{\log\_b a} \cdot \log\_b n$$

A **positive constant** factor, so it serves as $c\_1$ and $c\_2$. Example: $\log\_2 n$ is about $\boldsymbol{1.443 \ln n}$.

$O(\log\_2 n)$, $O(\ln n)$, $O(\log\_{10} n)$ are **the same set**: write $O(\log n)$.

--

## Exponentials beat every polynomial

**Claim:** for every fixed $k$, $2^n \notin O(n^k)$.

**Proof.** If $2^n \le c \cdot n^k$ for all $n \ge n\_0$, take $\log\_2$:

$$n \le \log\_2 c + k \log\_2 n$$

$n - k \log\_2 n$ is unbounded: **contradiction**. ∎

Crossovers: $2^n \ge n^2$ from $n = 4$, $\ge n^3$ from 10, $\ge n^{10}$ from 59.

--

## Rank these functions

Order by growth, slowest first; mark any two in the same $\Theta$:

$$n^2 \quad \sqrt{n} \quad n \log\_2 n \quad 2^{\log\_2 n}$$
$$\frac{n^2}{\log\_2 n} \quad (\log\_2 n)^2 \quad n^{1.5} \quad \log\_2(n!)$$

<details class="answer"><summary>Answer:</summary>

$$(\log\_2 n)^2 \prec \sqrt{n} \prec 2^{\log\_2 n} \prec \lbrace n \log\_2 n, \quad \log\_2(n!) \rbrace$$
$$\prec n^{1.5} \prec n^2 / \log\_2 n \prec n^2$$

</details>

--

## Common mistakes

- **Constants that depend on** $\boldsymbol{n}$. "$n^2 \le c \cdot n$ with $c = n$" proves nothing.
- **Checking a few values.** The inequality must hold for **every** $n \ge n\_0$.
- **Reading** $\boldsymbol{O}$ **as "the running time".** $O$ is only an upper bound; $5n \in O(n^3)$ is true.
- **Writing lower bounds with** $\boldsymbol{O}$. "At least $n$" is $\Omega(n).$

--

## Try it

With a neighbor: **member or not?** Give witnesses or a contradiction.

1. $(n + 1)^2 \in \Theta(n^2)$?
2. $\log\_2(n^2) \in O(\log\_2 n)$?
3. $2^{2n} \in O(2^n)$?

<details class="answer"><summary>Answer:</summary>

(1) Yes: $n^2 \le (n + 1)^2 \le 4n^2$ for $n \ge 1$. (2) Yes: $\log\_2(n^2) = 2 \log\_2 n$, so $c = 2$. (3) No: $2^{2n}/2^n = 2^n$ exceeds every constant $c$.

</details>

--

## Your turn: two proofs

1. Prove $\boldsymbol{5n^3 + 2n \in \Theta(n^3)}$: give $c\_1$, $c\_2$ and $n\_0$.
2. Prove $\boldsymbol{n^2 \notin O(n \log\_2 n)}$.

<details class="answer"><summary>Answer:</summary>

**(1)** For $n \ge 1$: $5n^3 \le 5n^3 + 2n \le 5n^3 + 2n^3 = 7n^3$, so $c\_1 = 5, c\_2 = 7, n\_0 = 1.$ **(2)** Suppose $n^2 \le c \cdot n \log\_2 n$ for all $n \ge n\_0$. Dividing by $n \log\_2 n$ gives $n / \log\_2 n \le c$, but $n / \log\_2 n$ grows without bound: contradiction.

</details>

