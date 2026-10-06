<!--
  TOPIC · Hash tables and hash functions.
  Teaches: computing an index instead of comparing keys; the hash function and the hash table; collisions are unavoidable (the birthday bound); chaining and probing in one sentence each; good hash functions; modular hashing with a prime M; hashing strings by Horner's rule; hash code then compress; the uniform hashing assumption.
  Needs:   the asymptotic notation topic.
  Demos:   none
  Program: none
  Budget:  ~24 min, 14 slides.
  Ported from Summer 2026 L07-hashing.md, parts 1, 2.
-->

### Hash tables and hash functions

> In a room of 23 people, the chance that two share a birthday is just over 50%; with 70 people it is 99.9%.

<small>The birthday problem; R. von Mises, 1939</small>

--

## A different bet

Every search so far **compares** keys: Θ(log n) at best (balanced trees).

Here: **compute** where the key lives.

```text
   trees:    is k < node? go left/right…   Θ(log n)
   hashing:  index = h(k); table[index]    Θ(1) ??
```

The price: **collisions**, and the loss of **order** (no min / max / range). Managing that price is the whole lecture.

--

## The dream: an array indexed by key

If keys were integers `0 … M−1`, we'd just use an **array**:

```text
   a[key] = value;        // insert
   return a[key];         // search: Θ(1)!
```

Direct addressing is perfect: but only if keys are **small integers**. Real keys are strings, big numbers, objects; a universe **astronomically larger** than any array.

--

## The hash function

A **hash function** maps any key to an array index in `[0, M)`:

```text
   h : keys  →  { 0, 1, …, M−1 }

   index = h(key);
   table[index] ← key       // insert
```

Compute the index, jump straight there. No comparisons, no tree walk.

--

## A hash table

```text
   M = 10,  h(k) = k mod 10

   insert 25 → slot 5      table:
   insert 33 → slot 3      [ _ _ _ 33 _ 25 _ 47 _ _ ]
   insert 47 → slot 7        0 1 2 3  4 5  6 7  8 9
```

An **array of size M** + a **hash function** = a hash table. Search `47`: compute `h(47) = 7`, look at slot 7. Done.

--

## Collisions are unavoidable

Two different keys can hash to the **same** slot: `h(25) = h(35) = 5`.

- **pigeonhole:** the key universe is bigger than M → some keys **must** share a slot
- **birthday paradox:** collisions arrive far earlier than intuition says: with M = 365 slots, **23 keys** suffice for a 50% collision

**So the entire game of hashing is handling collisions**: not avoiding them.

--

## Why √M keys already collide

Insert keys one by one; each new key must **miss** all previous ones:

```text
   P(no collision after n keys)
     = (1 − 1/M)(1 − 2/M) ⋯ (1 − (n−1)/M)
     ≈ exp( −(1 + 2 + ⋯ + (n−1)) / M )     [1−x ≈ e^−x]
     = exp( −n(n−1) / 2M )
```

This drops to ½ when `n ≈ 1.18 √M`. For `M = 365`: `n ≈ 23`. ✓

--

## Two ways to resolve collisions

```text
   separate chaining          open addressing
   (a list per slot)          (probe for another slot)

   [3]→33                     [ _ _ _ 33 _ 25 35 47 _ _ ]
   [5]→25→35                    35 collided at 5, probed to 6
   [7]→47
```

The two answers are **chaining** and **open addressing**. Both are only as good as the hash function feeding them, so hash functions come first.

--

## What makes a hash function good

1. **deterministic**: same key → same index
2. **uniform**: spreads keys evenly over `[0, M)`
3. **fast**: O(1) to compute
4. **uses the whole key**: every bit matters

**Uniform** is the property that governs performance.

--

## Modular hashing: and why M is prime

For integer keys, the workhorse:

```text
   h(k) = k mod M            M = 97:  h(12345) = 26
```

- **M prime** mixes **all** the bits of `k`
- `M = 2^p` uses only the **low p bits**: any pattern in the keys (even IDs, addresses) clumps
- powers of 10: same trap with low **digits**

--

## Hashing strings

Treat a string as a big number in base R (e.g. 31), via **Horner's method**:

```text
int hash(const string& s, int M) {
    long h = 0;
    for (char c : s)
        h = (R * h + c) % M;      // R = 31
    return (int)h;
}
```

Every character affects the result; one pass, O(len).

--

## Worked: hashing a string

`hash("CAT")` with `R = 31`, `M = 100`, ASCII C=67 A=65 T=84:

```text
   h = 0
   'C': h = (31·0  + 67)  % 100 = 67
   'A': h = (31·67 + 65)  % 100 = (2077+65)%100 = 42
   'T': h = (31·42 + 84)  % 100 = (1302+84)%100 = 86
   → slot 86
```

One left-to-right pass; the mod at each step prevents overflow.

--

## hashCode, then compress

In practice, two steps:

1. **hashCode**: the object produces an integer (Java `hashCode()`, C++ `std::hash<T>`)
2. **compress**: reduce that integer to `[0, M)` with `mod M`

```text
   index = (obj.hashCode() & 0x7fffffff) % M;   // mask the sign
```

--

## The uniform hashing assumption

All of hashing's O(1) analysis rests on one idealization:

> **Uniform hashing:** each key is equally likely to hash to any of the M slots, independently.

A good hash makes this *approximately* true. A bad one clumps keys: and performance collapses to O(n).

