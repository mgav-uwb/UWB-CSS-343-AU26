<!--
  TOPIC · Clustering, better probes, and resizing.
  Teaches: primary clustering; quadratic probing and double hashing; choosing a probe sequence; the ideal cost of a probe; load-factor thresholds; resizing by rehashing; the cost of hashing; hashing against balanced BSTs; std::map against std::unordered_map.
  Needs:   linear probing, separate chaining.
  Demos:   probe-race, hash-resize (slide specs); figures hs-cluster, hs-quad-66, hs-double (tools/gen-hash-figures.mjs)
  Program: none
  Budget:  ~22 min, 14 slides.
  Ported from Summer 2026 L07-hashing.md, parts 5, 6, 7.
-->

### Clustering, better probes, and resizing

> Python's dict grows its table when it becomes two-thirds full.

<small>CPython source, Objects/dictobject.c</small>

--

## Primary clustering

A cluster **grows faster the longer it is**:

<div><img src="../../topics/figures/hashing/hs-cluster.svg" style="height:300px" alt="
   cluster of length L  (slots s … s+L−1)
   a new key homed ANYWHERE in those L slots
   or in the free slot at either end
   extends the run  →  length L+1"></div>

Growth probability ≈ **(L+2)/M**: the rich get richer; runs also **merge**.

--

## Quadratic probing

Probe at increasing **squared** offsets:

$$\bigl(h(k) + i^2\bigr) \bmod M, \quad i = 1, 2, 3, \dots$$

22, 33, 44, 55 (all at slot 0) are in; insert 66:

<div><img src="../../topics/figures/hashing/hs-quad-66.svg" style="height:110px" alt="
   [ 22 33 _ _ 44 66 _ _ _ 55 _ ]
   insert 66: h = 0 taken; 0 + 1 = 1 taken; 0 + 4 = 4 taken;
   0 + 9 = 9 taken; (0 + 16) mod 11 = 5: place 66"></div>

Colliders **leave the neighborhood** instead of extending a run. (Catch: it may miss free slots; keep $\alpha$ < ½ and $M$ prime.)

--

## Double hashing

Use a **second hash function** for the step size:

$$\bigl(h(k) + i \cdot h\_2(k)\bigr) \bmod M$$

For example $h\_2(k) = 7 - (k \bmod 7)$, which is never 0.

Colliding keys get **different strides** → even same-home keys part ways → effectively **no clustering**.

--

## Double hashing: worked

$M = 11$ (prime), $h(x) = x \bmod 11$, $h\_2(x) = 7 - (x \bmod 7)$:

<div><img src="../../topics/figures/hashing/hs-double.svg" style="height:410px" alt="
   89 → 89 mod 11 = 1                   [ _ 89 _ _ _ _ _ _ _ _ _ ]
   18 → 18 mod 11 = 7                   [ _ 89 _ _ _ _ _ 18 _ _ _ ]
   40 → 40 mod 11 = 7 taken;
         h2(40) = 7 − (40 mod 7) = 2   (7 + 2) mod 11 = 9  → slot 9
   29 → 29 mod 11 = 7 taken;
         h2(29) = 7 − (29 mod 7) = 6   (7 + 6) mod 11 = 2  → slot 2"></div>


--

## Which probe sequence?

| method        | step        | clustering            |
| ------------- | ----------- | --------------------- |
| **linear**    | $+1$        | primary (worst)       |
| **quadratic** | $+i^2$      | secondary             |
| **double**    | $+i \cdot h\_2(k)$ | ~none (best)  |

Yet real libraries mostly use **linear** probing: with a strong hash and **low $\alpha$**, its cache behavior beats the others' better distribution.

--

## Demo: The probe family, racing

<div class="algo-viz" data-algo="probe-race">
<pre class="viz-fallback">
   The same five keys: 3, 14, 25, 36, 47, all homing to slot 3
   at M = 11: into three fixed tables:
   linear:    3, 4, 5, 6, 7   (a wall: primary clustering)
   quadratic: 3, 4, 7, 1, 8   (scattered, but one shared path)
   double:    each key strides by h2(k): they part ways
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## What does a probe cost, ideally?

Idealize: every probe lands on an **occupied slot with probability $\alpha$**, independently. Then a **miss** probes until the first empty slot:

$$E[\text{probes}] = 1 + \alpha + \alpha^2 + \alpha^3 + \cdots = \frac{1}{1-\alpha}$$

A geometric series: the cost curve is $1/(1-\alpha)$:

| $\alpha$ | 0.25 | 0.5 | 0.75 | 0.9 |
| -------- | ---- | --- | ---- | --- |
| probes   | 1.3  | 2   | 4    | 10  |

--

## Load-factor thresholds

Rule-of-thumb ceilings before resizing:

| scheme            | keep $\alpha \le$     |
| ----------------- | ------------------- |
| separate chaining | ~1 (even a bit more)|
| double hashing    | ~0.7                |
| linear probing    | **~0.5**            |

The more a scheme clusters, the **lower** the $\alpha$ it tolerates. Crossing the ceiling → **resize**.

--

## Resizing (rehashing)

Past the threshold, **double $M$** and re-insert every key:

```cpp
// the last line of insert(k):
if (2 * n >= M) resize(2 * M);             // load factor reached 1/2

void LinearProbing::resize(int newM) {
    std::vector<int> old = table;
    table.assign(newM, EMPTY);             // a fresh, empty array
    M = newM;
    n = 0;
    for (int k : old)
        if (k != EMPTY) insert(k);         // rehash: a new home
}
```

Each key gets a **new** $h(k) \bmod M$: you can't copy slots. A resize is $\Theta(n)$, but doubling makes it **amortized $O(1)$** per insert.

--

## Demo: resize & rehash

<div class="algo-viz" data-algo="hash-resize">
<pre class="viz-fallback">
   M = 8, keys 6, 10, 14 (build 6..14:4; α = 0.375 -
   6 and 14 collide at slot 6). Insert one more key:
   α reaches ½ → the table DOUBLES to M = 16 and every key
   is rehashed to a new h(k) mod 16: watch them re-scatter.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Insert any key: $\alpha$ crosses **½**, the table **doubles**, and every key **rehashes**: watch 6 and 14 split apart (they collided at $M = 8$, they don't at $M = 16$). One Θ(n) rebuild, then $\alpha$ is back at ¼.</small>

--

## The cost of hashing

Under uniform hashing, with a bounded load factor:

| operation                | expected | worst case |
| ------------------------ | -------- | ---------- |
| search / insert / delete | $\boldsymbol{\Theta(1)}$ | $\boldsymbol{\Theta(n)}$ |

The worst case (every key in one bucket/cluster) needs a **bad hash or an adversary**: it doesn't happen by chance with a good hash.

--

## Hashing vs balanced BST

|                                       | hash table   | balanced BST   |
| ------------------------------------- | ------------ | -------------- |
| search / insert / delete              | $\boldsymbol{\Theta(1)}$ **avg** | $\Theta(\log\_2 n)$ |
| worst case                            | $\Theta(n)$ | $\boldsymbol{\Theta(\log\_2 n)}$ |
| **ordered ops** (min/max/floor/range) | **no**       | **yes**        |
| iterate in sorted order               | no           | yes            |

Hashing wins on raw speed. The BST wins on **order**: and on a **guaranteed** worst case.

--

## C++: `map` vs `unordered_map`

|           | `std::map`         | `std::unordered_map` |
| --------- | ------------------ | -------------------- |
| structure | **red-black tree** | **hash table**       |
| lookup    | $\Theta(\log\_2 n)$ | $\Theta(1)$ avg |
| iteration | **sorted**         | arbitrary order      |
| needs     | `operator<`        | `std::hash` + `==`   |

Same interface, opposite engines. Python's `dict`, Java's `HashMap` = hash tables; `std::map`, Java's `TreeMap` = trees. **Pick by whether you need order.**

