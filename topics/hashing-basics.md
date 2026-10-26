<!--
  TOPIC · Hash tables and hash functions.
  Teaches: computing an index instead of comparing keys; the hash function and the hash table; collisions are unavoidable (the birthday bound); chaining and probing in one sentence each; good hash functions; modular hashing with a prime M; hashing strings by Horner's rule; hash code then compress; the uniform hashing assumption.
  Needs:   the asymptotic notation topic.
  Demos:   none; figures hs-bet, hs-table, hs-two-ways (tools/gen-hash-figures.mjs)
  Program: none
  Budget:  ~24 min, 14 slides.
  Ported from Summer 2026 L07-hashing.md, parts 1, 2.
-->

### Hash tables and hash functions

> In a room of 23 people, the chance that two share a birthday is just over 50%; with 70 people it is 99.9%.

<small>The birthday problem; R. von Mises, 1939</small>

--

## A different bet

Trees **compare** keys; hashing **computes** where the key lives:

<div><img src="../../topics/figures/hashing/hs-bet.svg" style="height:200px" alt="
   trees:    is k &lt; node? go left/right…   Θ(log n)
   hashing:  index = h(k); table[index]    Θ(1) ??"></div>

The price: **collisions**, and the loss of **order** (no min / max / range). Managing that price is the whole lecture.

--

## The dream: an array indexed by key

If keys were integers $0, \dots, M-1$, we'd just use an **array**:

```cpp
a[key] = value;          // insert: one array write
return a[key];           // search: one array read
```

Direct addressing is perfect: but only if keys are **small integers**. Real keys are strings, big numbers, objects; a universe **astronomically larger** than any array.

--

## The hash function

A **hash function** maps any key to an array index in $[0, M)$:

$$h : \text{keys} \to \lbrace 0, 1, \dots, M-1 \rbrace$$

```cpp
int index = h(key);
table[index] = key;      // insert
```

Compute the index, jump straight there. No comparisons, no tree walk.

--

## A hash table

$M = 10$, $h(k) = k \bmod 10$:

<div><img src="../../topics/figures/hashing/hs-table.svg" style="height:300px" alt="
   M = 10,  h(k) = k mod 10
   insert 25 → slot 5      table:
   insert 33 → slot 3      [ _ _ _ 33 _ 25 _ 47 _ _ ]
   insert 47 → slot 7        0 1 2 3  4 5  6 7  8 9"></div>

An **array of size $M$** + a **hash function** = a hash table. Search 47: compute $h(47) = 7$, look at slot 7. Done.

--

## Collisions are unavoidable

Two different keys can hash to the **same** slot: $h(25) = h(35) = 5$.

- **pigeonhole:** the key universe is bigger than M → some keys **must** share a slot
- **birthday paradox:** collisions arrive far earlier than intuition says: with M = 365 slots, **23 keys** suffice for a 50% collision

**So the entire game of hashing is handling collisions**: not avoiding them.

--

## Why √M keys already collide

Insert $n$ keys; each must **miss** all earlier ones:

$$
\begin{aligned}
P(\text{no collision}) &= \left(1 - \frac{1}{M}\right)\left(1 - \frac{2}{M}\right) \cdots \left(1 - \frac{n-1}{M}\right) \\\\
&\approx \exp\left(-\frac{1 + 2 + \cdots + (n-1)}{M}\right) \\\\
&= \exp\left(-\frac{n(n-1)}{2M}\right)
\end{aligned}
$$

using $1 - x \approx e^{-x}$. This drops to ½ when $n \approx 1.18 \sqrt{M}$. For $M = 365$: $n \approx 23$. ✓

--

## Two ways to resolve collisions

<div><img src="../../topics/figures/hashing/hs-two-ways.svg" style="height:158px" alt="
   separate chaining          open addressing
   (a list per slot)          (probe for another slot)
   [3]→33                     [ _ _ _ 33 _ 25 35 47 _ _ ]
   [5]→25→35                    35 collided at 5, probed to 6
   [7]→47"></div>

The two answers are **chaining** and **open addressing**. Both are only as good as the hash function feeding them, so hash functions come first.

--

## What makes a hash function good

1. **deterministic**: same key → same index
2. **uniform**: spreads keys evenly over `[0, M)`
3. **fast**: $O(1)$ to compute
4. **uses the whole key**: every bit matters

**Uniform** is the property that governs performance.

--

## Modular hashing: and why M is prime

For integer keys, the workhorse:

$$h(k) = k \bmod M$$

For example, $M = 97$ gives $h(12345) = 26$.

- **$M$ prime** mixes **all** the bits of $k$
- $M = 2^p$ uses only the **low $p$ bits**: any pattern in the keys (even IDs, addresses) clumps
- powers of 10: same trap with low **digits**

--

## Hashing strings

Treat a string as a big number in base $R$ (e.g. 31), via **Horner's method**:

```cpp
// Horner's method: fold a string into one index, base R = 31.
int hash(const std::string& s, int M) {
    const long R = 31;
    long h = 0;
    for (unsigned char c : s)    // a byte, 0..255
        h = (R * h + c) % M;     // reduce each step; no overflow
    return (int)h;
}
```

One pass, $O(\text{length})$: every character counts.

--

## Worked: hashing a string

`hash("CAT")` with $R = 31$, $M = 100$, ASCII C = 67, A = 65, T = 84, starting at $h = 0$:

$$
\begin{aligned}
\texttt{C}: \quad h &= (31 \cdot 0 + 67) \bmod 100 = 67 \\\\
\texttt{A}: \quad h &= (31 \cdot 67 + 65) \bmod 100 = 2142 \bmod 100 = 42 \\\\
\texttt{T}: \quad h &= (31 \cdot 42 + 84) \bmod 100 = 1386 \bmod 100 = 86
\end{aligned}
$$

Slot 86, in one left-to-right pass; the mod at each step prevents overflow.

--

## hashCode, then compress

In practice, two steps:

1. **hashCode**: the object produces an integer (Java `hashCode()`, C++ `std::hash<T>`)
2. **compress**: reduce that integer to $[0, M)$ with $\bmod M$

```java
int index = (key.hashCode() & 0x7fffffff) % M;      // Java: clear the sign bit
```

```cpp
size_t index = std::hash<std::string>()(key) % M;   // C++: already unsigned
```

--

## The uniform hashing assumption

All of hashing's $O(1)$ analysis rests on one idealization:

> **Uniform hashing:** each key is equally likely to hash to any of the M slots, independently.

A good hash makes this *approximately* true. A bad one clumps keys: and performance collapses to $O(n)$.

