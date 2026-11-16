<!--
  TOPIC · Why Huffman is optimal.
  Teaches: Lemma 1 (the two rarest symbols can be the deepest siblings), proved by an exchange with visible algebra; the swap drawn before and after on p:1 q:2 r:4 s:6; Lemma 2 (merging two siblings lowers the cost by exactly their frequencies), drawn on the CLRS tree; the induction that combines them.
  Needs:   Huffman's algorithm, the exchange argument (activity selection), prefix-free codes (fullness).
  Demos:   figures hf-exchange, hf-lemma2 (tools/gen-greedy-figures.mjs)
  Program: none (both figures' costs are asserted by the generator)
  Budget:  ~9 min, 5 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 3.
-->

### Why Huffman is optimal

> “It was the most singular moment of my life. There was the absolute lightning of sudden realization.”

<small>David Huffman, quoted in G. Stix, “Profile: David A. Huffman,” Scientific American, September 1991</small>

--

## Lemma 1: rarest deepest

Some optimal tree has the two **rarest** symbols, $x$ and $y$, as **sibling leaves at maximum depth**.

**Proof.** An optimal tree is full: its deepest internal node has two leaves, $a$ and $b$. Swap $x$ with $a$:

$$\begin{aligned} \Delta &= (f\_x d\_a + f\_a d\_x) - (f\_x d\_x + f\_a d\_a) \\\\ &= (f\_a - f\_x)(d\_x - d\_a) \le 0 \end{aligned}$$

$f\_a \ge f\_x$ ($x$ is rarest), $d\_x \le d\_a$ ($a$ is deepest). Then swap $y$ with $b$.

--

## The swap, drawn

<div><img src="../../topics/figures/greedy/hf-exchange.svg" style="height:300px" alt="
   before: root → p:1, (r:4, (s:6, q:2))      p at depth 1, s at depth 3
           1·1 + 4·2 + 6·3 + 2·3 = 33
   swap p ↔ s:  Δ = (6 − 1)(1 − 3) = −10
   after:  root → s:6, (r:4, (p:1, q:2))      p and q are the deepest siblings
           6·1 + 4·2 + 1·3 + 2·3 = 23"></div>

The rarest symbol, $p$, moves into the deepest leaf: the cost falls by $10$. The tree on the right is Huffman's tree for these weights, cost **23**.

--

## Lemma 2: merge the pair

Replace sibling leaves $x, y$ by one leaf $z$, $f\_z = f\_x + f\_y$, giving $T'$:

$$\text{cost}(T) = \text{cost}(T') + f\_x + f\_y$$

<div><img src="../../topics/figures/greedy/hf-lemma2.svg" style="height:235px" alt="
   T:  the CLRS tree, a and b siblings at depth 4, cost 224
   T': a, b replaced by z:14 at depth 3, cost 210 = 224 − 14"></div>

Every $x$ or $y$ pays one bit more in $T$ than $z$ does in $T'$.

--

## The induction

- **Lemma 1**: some optimal tree makes Huffman's **first merge**
- **Lemma 2**: after that merge, every tree's cost differs by the **constant** $f\_x + f\_y$, so the best tree is the best tree for the $n - 1$ symbols with $z$ in place of $x, y$
- that is a Huffman instance with one symbol fewer: by **induction**, Huffman's tree is optimal

The same shape as earliest finish: the greedy choice is **safe**, and the rest is the **same problem**.

