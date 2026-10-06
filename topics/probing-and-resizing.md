<!--
  TOPIC · Clustering, better probes, and resizing.
  Teaches: primary clustering; quadratic probing and double hashing; choosing a probe sequence; the ideal cost of a probe; load-factor thresholds; resizing by rehashing; the cost of hashing; hashing against balanced BSTs; std::map against std::unordered_map.
  Needs:   linear probing, separate chaining.
  Demos:   probe-race, hash-resize (slide specs); the double-hashing state stack
  Program: none
  Budget:  ~22 min, 14 slides.
  Ported from Summer 2026 L07-hashing.md, parts 5, 6, 7.
-->

### Clustering, better probes, and resizing

> Python's dict grows its table when it becomes two-thirds full.

<small>CPython source, Objects/dictobject.c</small>

--

## Primary clustering snowballs

A cluster doesn't just slow its own keys: it **grows faster the longer it is**:

```text
   cluster of length L  (slots s … s+L−1)

   a new key homed ANYWHERE in those L slots
  : or in the free slot at either end -
   extends the run  →  length L+1
```

Growth probability ≈ **(L+2)/M**: the rich get richer. Long runs also **merge** into longer ones.

--

## Quadratic probing

Probe at increasing **squared** offsets:

```text
   ( h(k) + i² ) mod M       i = 1, 2, 3, …
   → offsets 1, 4, 9, 16, …
```

Jumps spread the probes out → colliding keys **leave the neighborhood** instead of extending it. (Trade-off: can't always reach every slot: keep **α < ½** and M prime.)

--

## Double hashing

Use a **second hash function** for the step size:

```text
   ( h(k) + i · h2(k) ) mod M
   e.g.  h2(k) = 7 − (k mod 7)     (never 0!)
```

Colliding keys get **different strides** → even same-home keys part ways → effectively **no clustering**.

--

## Double hashing: worked

`M = 11` (prime), `h(x) = x mod 11`, `h2(x) = 7 − (x mod 7)`:

<div id="double-worked" style="max-width:620px;margin:0 auto;text-align:left"></div>


--

## Which probe sequence?

| method        | step        | clustering            |
| ------------- | ----------- | --------------------- |
| **linear**    | `+1`        | primary (worst)       |
| **quadratic** | `+i²`       | secondary             |
| **double**    | `+i·h2(k)`  | ~none (best)          |

Yet real libraries mostly use **linear** probing: with a strong hash and **low α**, its cache behavior beats the others' better distribution.

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

Idealize: every probe lands on an **occupied slot with probability α**, independently. Then a **miss** probes until the first empty slot:

```text
   E[probes] = 1 + α + α² + α³ + ⋯ = 1/(1−α)
```

A geometric series: the cost curve is **1/(1−α)**:

```text
   α:        0.25   0.5    0.75   0.9
   probes:   1.3    2      4      10
```

--

## Load-factor thresholds

Rule-of-thumb ceilings before resizing:

| scheme            | keep α ≤            |
| ----------------- | ------------------- |
| separate chaining | ~1 (even a bit more)|
| double hashing    | ~0.7                |
| linear probing    | **~0.5**            |

The more a scheme clusters, the **lower** the α it tolerates. Crossing the ceiling → **resize**.

--

## Resizing (rehashing)

When α crosses the threshold, **grow the table** and re-insert everything:

```text
   if (2 * n >= M) {              // α reached ½
       M = 2 * M;                 // double the array
       rehash EVERY key into the new table
   }
```

Each key gets a **new** `h(k) mod M`: you can't copy slots. A resize is Θ(n), but doubling makes it **amortized O(1)** per insert.

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

<small>Insert any key: α crosses **½**, the table **doubles**, and every key **rehashes**: watch 6 and 14 split apart (they collided at M = 8, they don't at M = 16). One Θ(n) rebuild, then α is back at ¼.</small>

--

## The cost of hashing

Under uniform hashing, with a bounded load factor:

| operation                | expected | worst case |
| ------------------------ | -------- | ---------- |
| search / insert / delete | **Θ(1)** | **Θ(n)**   |

The worst case (every key in one bucket/cluster) needs a **bad hash or an adversary**: it doesn't happen by chance with a good hash.

--

## Hashing vs balanced BST

|                                       | hash table   | balanced BST   |
| ------------------------------------- | ------------ | -------------- |
| search / insert / delete              | **Θ(1)** avg | Θ(log n)       |
| worst case                            | Θ(n)         | **Θ(log n)**   |
| **ordered ops** (min/max/floor/range) | **no**       | **yes**        |
| iterate in sorted order               | no           | yes            |

Hashing wins on raw speed. The BST wins on **order**: and on a **guaranteed** worst case.

--

## C++: `map` vs `unordered_map`

|           | `std::map`         | `std::unordered_map` |
| --------- | ------------------ | -------------------- |
| structure | **red-black tree** | **hash table**       |
| lookup    | Θ(log n)           | Θ(1) avg             |
| iteration | **sorted**         | arbitrary order      |
| needs     | `operator<`        | `std::hash` + `==`   |

Same interface, opposite engines. Python's `dict`, Java's `HashMap` = hash tables; `std::map`, Java's `TreeMap` = trees. **Pick by whether you need order.**

