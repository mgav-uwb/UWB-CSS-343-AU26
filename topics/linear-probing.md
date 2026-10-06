<!--
  TOPIC · Open addressing: linear probing.
  Teaches: probing for an empty slot; insert and search; the probing invariant; why deletion breaks searches and the two fixes (re-insert the cluster, tombstones); chaining against probing.
  Needs:   hashing basics.
  Demos:   hash-probe, hash-delete (slide specs)
  Program: none
  Budget:  ~20 min, 12 slides.
  Ported from Summer 2026 L07-hashing.md, parts 4.
-->

### Open addressing: linear probing

> Donald Knuth's first analysis of an algorithm, written in 1962 and 1963, was of linear probing; he has said it shaped the rest of his career.

<small>D. E. Knuth, “Notes on 'Open' Addressing,” 1963</small>

--

## No lists: probe for a slot

Keep **every key in the array itself**. On a collision, **probe** for another open slot by a fixed rule: the simplest is **linear probing**:

```text
   h(k), h(k)+1, h(k)+2, …   (all mod M)
```

Walk forward until an **empty slot**; the key lives where the walk ends.

--

## Linear probing: insert

```text
   M = 11,  h(k) = k mod 11.   insert 14, 25, 36:
   h(14)=3 → slot 3 (empty)              place 14
   h(25)=3 → 3 taken (14) → 4 (empty)    place 25
   h(36)=3 → 3, 4 taken → 5 (empty)      place 36

   [ _ _ _ 14 25 36 _ _ _ _ _ ]
     0 1 2  3  4  5
```

14, 25, 36 differ by exactly **11**: keys a multiple of `M` apart *always* share a home slot. They line up in a **cluster** at 3, 4, 5.

--

## The probing invariant

> From `h(k)` to where `k` actually sits, every slot is **occupied**: **no hole inside a cluster**.

- **insert** maintains it: `k` fills the *first* empty slot of its run
- so **search** may stop at the first empty slot: a hole *proves* absence
- and **deletion** had better not punch a hole… (two slides)

--

## Linear probing: search

```text
   search(k):
     i = h(k)
     while table[i] is occupied:
        if table[i] == k: return FOUND
        i = (i + 1) mod M           // next slot
     return NOT FOUND               // empty ⇒ not present
```

The invariant makes the miss rule sound: **an empty slot proves `k` is absent**.

--

## Worked: search hit vs miss

```text
   [ _ _ _ 14 25 36 _ _ _ _ _ ]   (the cluster)
     0 1 2  3  4  5

   search 36: h=3 → 14≠36 → 25≠36 → 36 ✓   (3 probes, HIT)
   search 47: h=3 → 14 → 25 → 36 → slot 6
              EMPTY → NOT FOUND              (4 probes, MISS)
```

A **hit** stops on the key; a **miss** pays the **whole cluster** plus the empty slot.

--

## Practice: where does it land?

`M = 7`, `h(k) = k mod 7`, linear probing. Table currently:

```text
   [ _ 8 15 _ _ _ 20 ]     insert 22?
     0 1  2 3 4 5  6
```

<details class="answer"><summary>Answer:</summary>

h(22) = 22 mod 7 = 1 → slot 1 holds 8 → probe 2 (holds 15) → probe 3 (empty) → 22 goes in slot 3. Two collisions, then it lands.

</details>

--

## Demo: linear probing

<div class="algo-viz" data-algo="hash-probe">
<pre class="viz-fallback">
   M = 11 (fixed), h(k) = k mod 11: keys 2, 8, 14, 20
   (build 2..20:6 → slots 2, 8, 3, 9).
   Insert: compute the home slot (marked h), probe forward
   past occupied cells to the first empty one.
   Search: same walk; an empty slot means NOT FOUND.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The `h` marker is the **home slot**; on a collision the probe walks forward to the first empty cell. Try **insert 25** (home 3 is taken: watch it displace), then **search 25**: it pays the same probes. This table is **fixed-size**: fill all 11 slots and it refuses the next key.</small>

--

## The deletion problem

Delete 14 by **emptying its slot**: and you punch a **hole in the cluster**:

```text
   [ _ _ _ 14 25 36 _ … ]      naive delete 14:
     0 1 2  3  4  5            [ _ _ _ _ 25 36 _ … ]

   search 25: h(25) = 3 → slot 3 EMPTY → "not found"  ✗
```

25 is **still in the table**: but the hole broke its probe path. The invariant, violated.

--

## Deletion: two fixes

1. **Tombstone:** mark the slot "deleted": searches **walk through** it, inserts may **reuse** it. Simple; tombstones accumulate until the table is rebuilt (a resize).
2. **Re-insert the cluster** (Sedgewick): empty the slot, then take every key **after the hole** in the cluster and insert it again: the run is rebuilt hole-free.

```text
   delete 14:  [ _ _ _ _ 25 36 _ ]  → re-insert 25, 36
               [ _ _ _ 25 36 _ _ ]  ✓ invariant restored
```

--

## Demo: delete without breaking the cluster

<div class="algo-viz" data-algo="hash-delete">
<pre class="viz-fallback">
   the cluster from the slides (build 14..36:11):
   14, 25, 36 → slots 3, 4, 5.
   Delete 14: the slot empties, then every key after the
   hole (25, 36) is RE-INSERTED so no probe path breaks.
   Then Search 25: still found.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Delete 14** and watch the repair: the hole opens, then **25 and 36 re-insert** to close the run. Then **Search 25**: still reachable. Compare with the chaining demo's delete: one unlink vs a cluster rebuild.</small>

--

## Chaining vs probing: the ledger

|              | separate chaining     | linear probing            |
| ------------ | --------------------- | ------------------------- |
| colliders go | into the **chain**    | into **other slots**      |
| memory       | pointer per node      | **just the array**        |
| cache        | pointer-chasing, poor | adjacent probes, **great**|
| delete       | **unlink, trivial**   | tombstone / re-insert     |
| full table   | never (α can pass 1)  | hard stop at α = 1        |

Open addressing often **wins in practice** at low α: the cache is that important.

