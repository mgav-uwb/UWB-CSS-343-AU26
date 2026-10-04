<!--
  TOPIC · Separate chaining.
  Teaches: a list per slot; insert, search and delete; the load factor and the expected chain length; what happens when M is fixed and n grows; resizing.
  Needs:   hashing basics.
  Demos:   hash-chain, hash-chain-resize (slide specs)
  Program: none
  Budget:  ~16 min, 9 slides.
  Ported from Summer 2026 L07-hashing.md, parts 3.
-->

### Separate chaining

<small>(~16 min)</small>

--

## A list per slot

Each array slot heads a **linked list** (a *chain*) of all keys that hash there:

```text
   M = 5,  h(k) = k mod 5,  keys 12, 17, 22, 5:

   [0] → 5                    5 mod 5 = 0
   [1]
   [2] → 12 → 17 → 22         all ≡ 2 (mod 5)
   [3]
   [4]
```

Colliders simply **join the same bucket's chain**. No key is ever turned away: the array never "fills up."

--

## Chaining: the operations

```text
   search(k):  i = h(k); walk the chain at table[i]
   insert(k):  i = h(k); scan for a duplicate, then
               link k into the chain: O(1) once there
   delete(k):  i = h(k); find k in the chain, UNLINK it
```

Each is: **one hash** + **a walk of one short chain**. The other `M−1` buckets are never touched.

--

## Chaining: a worked insert

`M = 5`, `h(k) = k mod 5`. Insert 12, 22, 5, 17:

```text
   12 → 12%5 = 2      [2] → 12
   22 → 22%5 = 2      [2] → 12 → 22        (collision: join)
    5 →  5%5 = 0      [0] → 5
   17 → 17%5 = 2      [2] → 12 → 22 → 17   (chain length 3)
```

Colliders just extend the chain: no probing, no displacement, nothing else moves.

--

## Load factor: and the expected chain

```text
   load factor   α = n / M      (keys per slot)
```

Under uniform hashing each key picks its bucket independently, so

```text
   E[chain length]  =  n · (1/M)  =  α
```

- a **miss** walks a whole chain: ≈ **α** compares
- a **hit** stops partway: ≈ **1 + α/2** compares

Keep **α = O(1)** → every operation is **O(1)** expected.

--

## Chaining: your turn

`M = 7`, `h(k) = k mod 7`, holding the **odd keys 1..21**:

```text
   [0] → 7 → 21    [1] → 1 → 15    [2] → 9
   [3] → 3 → 17    [4] → 11        [5] → 5 → 19
   [6] → 13
```

**Insert 50.** Which bucket, how many compares, and what does the chain look like?

<small>h(50) = 50 mod 7 = 1 → walk bucket 1: 1 ≠ 50, 15 ≠ 50 (2 compares) → link 50: [1] → 1 → 15 → 50. Chain length 3; every other bucket untouched.</small> <!-- .element: class="fragment" -->

--

## Demo: separate chaining

<div class="algo-viz" data-algo="hash-chain">
<pre class="viz-fallback">
   M = 7, h(k) = k mod 7: the odd keys 1..21 (build 1..21:2):
   [0]→7→21  [1]→1→15  [2]→9  [3]→3→17  [4]→11  [5]→5→19  [6]→13
   Insert / Search / Delete a key: hash to the home bucket,
   walk ONLY that chain; delete just unlinks a node.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The chains **hang below** their buckets. **Search** walks one chain and never touches the other six. **Delete** unlinks one node: nothing else moves. Insert a few colliders (29, 36, 43 all hash to 1…) and watch one chain grow; that's α at work.</small>

--

## Demo: Flood it: watch the promise break

<div class="algo-viz" data-algo="hash-chain" data-example="1..70">
<pre class="viz-fallback">
   Same table, M frozen at 7: but now 70 keys (build 1..70):
   every bucket holds a 10-chain, α = 70/7 = 10, and a search
   near the chain's end pays 1 + 10 compares.
[ interactive demo: open this deck on the course site ]
</pre>
</div>


--

## Demo: The move: resize

<div class="algo-viz" data-algo="hash-chain-resize">
<pre class="viz-fallback">
   The same flood, but the table doubles M at α = 1 and rehashes
   every key: the chains shorten mid-build: M: 7 → 14 → … → 112,
   final α = 0.63, longest chain ~2.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>The same flood: but the table **doubles M and rehashes everything at α = 1**. Run the flood preset and watch the chains **shorten mid-build**. THIS is the actor behind "expected Θ(1)".</small>

