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
  Program: none.
  Budget:  ~38 min, 27 slides.
  Math:    marked runs before KaTeX. No \, \; \{ in math (use \lbrace,
           \rbrace); on a line with two or more subscripts, write every one
           as \_ so marked does not pair them into <em>.
  Matches: textbook/foundations/foundation-asymptotic-notation.html
-->

### Asymptotic notation: O, Ω, Θ as sets

<small>(~38 min)</small>

--

## "Order of growth N³" was informal

So far: "**about** N³/6", "**order of growth** N³", "grows **like** N²".

To state guarantees we need a definition that

- ignores constant factors (the machine)
- ignores small n (start-up behavior)
- turns "grows like" into a **true or false question**

--

## The key idea: a set of functions

**O(g)** is a **set**: all the functions that grow no faster than g, up to a constant factor.

For any function f, exactly one holds:

$$f \in O(g) \qquad \text{or} \qquad f \notin O(g)$$

Membership is **proved by exhibiting constants**, or disproved by showing none can exist.

--

## Definition: Big-O

$$O(g(n)) = \lbrace f(n) : \exists c, n_0 > 0 \text{ such that}$$

$$0 \le f(n) \le c \cdot g(n) \text{ for all } n \ge n_0 \rbrace$$

Read: f is in O(g) if **some constant multiple of g** stays **above f** from **some point n₀ on**.

- **c** absorbs constant factors
- **n₀** discards small inputs

--

## The picture

<img src="../../topics/figures/big-o-bound.svg" style="width:58%">

Past **n₀**, the curve **c·g(n)** stays above **f(n)**. Left of n₀, anything goes.

--

## Proving membership

**Claim:** 2n² + 8n + 5 ∈ O(n²).

**Witnesses.** For n ≥ 1, each lower term is at most a multiple of n²: 8n ≤ 8n² and 5 ≤ 5n². So

$$2n^2 + 8n + 5 \le 2n^2 + 8n^2 + 5n^2 = 15n^2$$

With **c = 15, n₀ = 1** the definition holds, so the function **is a member**. ∎

--

## Witnesses are not unique

For 2n² + 8n + 5 ≤ c·n², several pairs work:

| c | smallest n₀ | why |
| :-: | :-: | --- |
| 15 | 1 | term-by-term bound |
| 3 | 9 | n² − 8n − 5 ≥ 0 from n = 9 on |
| 2.5 | 17 | 0.5n² ≥ 8n + 5 from n = 17 on |
| 2 | none | 8n + 5 ≤ 0 never holds |

A smaller c needs a later n₀; any c **above the leading coefficient 2** works.

--

## Proving non-membership

**Claim:** 6n³ ∉ O(n²).

**Proof.** Suppose some c, n₀ > 0 had 6n³ ≤ c·n² for all n ≥ n₀. Divide by n²:

$$n \le \frac{c}{6} \quad \text{for all } n \ge n_0$$

But c/6 is a fixed number and n grows without bound: **contradiction**. No witnesses exist. ∎

--

## O(g) is an upper bound, not a tight one

All of these are members of **O(n²)**:

$$5n \in O(n^2)$$

$$n \log\_2 n \in O(n^2) \qquad 3n^2 + 100n \in O(n^2)$$

The sets are **nested**: O(n) ⊂ O(n log₂ n) ⊂ O(n²) ⊂ O(n³).

Saying an algorithm's cost is in O(n²) says it is **at most** about n²; it could be linear.

--

## Definition: Big-Omega

$$\Omega(g(n)) = \lbrace f(n) : \exists c, n_0 > 0 \text{ such that}$$

$$0 \le c \cdot g(n) \le f(n) \text{ for all } n \ge n_0 \rbrace$$

f is in Ω(g) if **some constant multiple of g** stays **below f** from n₀ on: f grows **at least as fast** as g.

**Example:** 2n² + 8n + 5 ∈ Ω(n²) with **c = 2, n₀ = 1**: the leading term alone is enough.

--

## Definition: Big-Theta

$$\Theta(g(n)) = \lbrace f(n) : \exists c\_1, c\_2, n\_0 > 0 \text{ such that}$$

$$0 \le c\_1 g(n) \le f(n) \le c\_2 g(n) \text{ for all } n \ge n\_0 \rbrace$$

f is **squeezed** between two constant multiples of g: the **tight** bound.

--

## The sandwich

<img src="../../topics/figures/theta-sandwich.svg" style="width:58%">

Past n₀: **c₁·g(n) ≤ f(n) ≤ c₂·g(n)**.

--

## Proving Θ membership

**Claim:** ½n² − 3n ∈ Θ(n²).

Need c₁n² ≤ ½n² − 3n ≤ c₂n². Divide by n²:

$$c\_1 \le \frac{1}{2} - \frac{3}{n} \le c\_2$$

- right side: holds for all n ≥ 1 with **c₂ = ½**
- left side: at n = 7 the middle is 1/14, and it only grows, so **c₁ = 1/14**

**c₁ = 1/14, c₂ = ½, n₀ = 7.** ∎

--

## A Θ proof, line by line

**Claim:** 3n² − 5n + 2 ∈ Θ(n²). Find c₁, c₂, n₀ with c₁n² ≤ 3n² − 5n + 2 ≤ c₂n² for all n ≥ n₀.

1. **Upper.** For n ≥ 1, −5n + 2 ≤ −3 < 0, so 3n² − 5n + 2 ≤ 3n². Take **c₂ = 3**.
2. **Lower.** Try c₁ = 2: need 3n² − 5n + 2 ≥ 2n², that is n² − 5n + 2 ≥ 0.
3. The roots of n² − 5n + 2 are (5 ± √17)/2, about 0.44 and **4.56**, so it holds for every n ≥ 5.
4. **Witnesses:** c₁ = 2, c₂ = 3, n₀ = 5. Check n = 5: 2·25 = 50 ≤ 52 ≤ 75 = 3·25. ∎

--

## Theorem: Θ = O ∩ Ω

$$\Theta(g) = O(g) \cap \Omega(g)$$

**⊆:** the right inequality of Θ is the O condition; the left is the Ω condition.

**⊇:** take f ∈ O(g) with witnesses (c₂, a) and f ∈ Ω(g) with (c₁, b). Then **c₁, c₂** and **n₀ = max(a, b)** witness Θ.

A tight bound is **an upper bound and a lower bound for the same g**.

--

## Theorem: polynomials

If p(n) = aₖnᵏ + … + a₁n + a₀ with **aₖ > 0**, then **p ∈ Θ(nᵏ)**.

**Proof idea.** Let A = |a₀| + … + |aₖ₋₁|.

- **upper:** for n ≥ 1 every nⁱ ≤ nᵏ, so p(n) ≤ (aₖ + A)nᵏ
- **lower:** p(n) ≥ aₖnᵏ − Anᵏ⁻¹ ≥ (aₖ/2)nᵏ once n ≥ 2A/aₖ

**c₁ = aₖ/2, c₂ = aₖ + A, n₀ = max(1, 2A/aₖ).** ∎

--

## ∈ or = ?

The precise statement is **membership**: n ∈ O(n²).

The common shorthand **n = O(n²)** means the same thing, but it is **not an equation**:

- read **left to right only**: never "O(n²) = n"
- **not transitive as an equality**: n = O(n²) and n² = O(n²), yet n ≠ n²

Inside a formula, a set stands for **some member**: 2n² + 3n + 1 = 2n² + Θ(n), where Θ(n) stands for 3n + 1.

--

## Order of growth, precisely

"The cost has order of growth g" means **cost ∈ Θ(g)**:

| count | membership |
| --- | --- |
| C(N, 3) = N(N − 1)(N − 2)/6 | ∈ Θ(N³) |
| fast 3-sum's array accesses | ∈ Θ(N² log₂ N) |
| mergesort's buffer, 4N bytes | ∈ Θ(N) |

**Tilde is stronger:** f ~ g implies f ∈ Θ(g), but not the reverse. 2N³ ∈ Θ(N³), yet 2N³ is not ~ N³.

--

## Sum and product rules, as set facts

If **f₁ ∈ O(g₁)** and **f₂ ∈ O(g₂)**, then

- **sum:** f₁ + f₂ ∈ O(max(g₁, g₂))
- **product:** f₁ · f₂ ∈ O(g₁ · g₂)

**Proof of the sum rule.** With witnesses (c₁, a) and (c₂, b), for n ≥ max(a, b):

f₁ + f₂ ≤ c₁g₁ + c₂g₂ ≤ (c₁ + c₂) · max(g₁, g₂). ∎

The same rules hold for Θ.

--

## The hierarchy

Each function is in **O** of the next, but **not in Ω** of it:

<div style="font-size:0.88em">

$$1 \quad \log\_2 n \quad \sqrt{n} \quad n \quad n \log\_2 n \quad n^2 \quad n^3 \quad 2^n \quad n!$$

</div>

**Limit test:** if f(n)/g(n) → 0, then f ∈ O(g) and f ∉ Ω(g).

- log₂ n / nᵉ → 0 for every e > 0: a log loses to any positive power
- nᵏ / 2ⁿ → 0 for every k: any polynomial loses to 2ⁿ

--

## The limit test

If the limit of f(n)/g(n) as n → ∞ **exists**, it settles the comparison:

| limit of f/g | conclusion |
| --- | --- |
| 0 | f ∈ O(g), f ∉ Ω(g): g grows strictly faster |
| a constant L > 0 | f ∈ Θ(g) |
| ∞ | f ∈ Ω(g), f ∉ O(g): f grows strictly faster |

**Example:** (3n² − 5n + 2)/n² = 3 − 5/n + 2/n² → 3, so the function is in Θ(n²) with no witnesses to hunt for.

--

## Logarithm bases do not matter

For bases a, b > 1: $$\log\_a n = \frac{1}{\log\_b a} \cdot \log\_b n$$

A **positive constant** factor, so it serves as c₁ and c₂. Example: log₂ n is about **1.443 · ln n**.

O(log₂ n), O(ln n), O(log₁₀ n) are **the same set**: write O(log n).

--

## Exponentials beat every polynomial

**Claim:** for every fixed k, 2ⁿ ∉ O(nᵏ).

**Proof.** If 2ⁿ ≤ c·nᵏ for all n ≥ n₀, take log₂:

$$n \le \log\_2 c + k \log\_2 n$$

n − k log₂ n is unbounded: **contradiction**. ∎

Crossovers: 2ⁿ ≥ n² from n = 4, ≥ n³ from 10, ≥ n¹⁰ from 59.

--

## Rank these functions

Order by growth, slowest first; mark any two in the same Θ:

$$n^2 \quad \sqrt{n} \quad n \log\_2 n \quad 2^{\log\_2 n}$$
$$\frac{n^2}{\log\_2 n} \quad (\log\_2 n)^2 \quad n^{1.5} \quad \log\_2(n!)$$

<details class="answer"><summary>Answer:</summary>

$$(\log\_2 n)^2 \prec \sqrt{n} \prec 2^{\log\_2 n} \prec \lbrace n \log\_2 n, \quad \log\_2(n!) \rbrace$$
$$\prec n^{1.5} \prec n^2 / \log\_2 n \prec n^2$$

</details>

--

## Common mistakes

- **Constants that depend on n.** "n² ≤ c·n with c = n" proves nothing.
- **Checking a few values.** The inequality must hold for **every** n ≥ n₀.
- **Reading O as "the running time".** O is only an upper bound; 5n ∈ O(n³) is true.
- **Writing lower bounds with O.** "At least n" is Ω(n).

--

## Try it

With a neighbor: **member or not?** Give witnesses or a contradiction.

1. (n + 1)² ∈ Θ(n²)?
2. log₂(n²) ∈ O(log₂ n)?
3. 2²ⁿ ∈ O(2ⁿ)?

<details class="answer"><summary>Answer:</summary>

(1) Yes: n² ≤ (n + 1)² ≤ 4n² for n ≥ 1. (2) Yes: log₂(n²) = 2 log₂ n, so c = 2. (3) No: 2²ⁿ/2ⁿ = 2ⁿ exceeds every constant c.

</details>

--

## Your turn: two proofs

1. Prove **5n³ + 2n ∈ Θ(n³)**: give c₁, c₂ and n₀.
2. Prove **n² ∉ O(n log₂ n)**.

<details class="answer"><summary>Answer:</summary>

**(1)** For n ≥ 1: 5n³ ≤ 5n³ + 2n ≤ 5n³ + 2n³ = 7n³, so c₁ = 5, c₂ = 7, n₀ = 1. **(2)** Suppose n² ≤ c·n log₂ n for all n ≥ n₀. Dividing by n log₂ n gives n / log₂ n ≤ c, but n / log₂ n grows without bound: contradiction.

</details>

