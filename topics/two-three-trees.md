<!--
  TOPIC · 2-3 trees.
  Teaches: balance by fatter nodes instead of rotations; 2-nodes and 3-nodes; perfect balance; search; insertion always in a leaf, split and promote, cascading splits, the root split; deletion by borrowing and merging.
  Needs:   avl balance (for contrast), bst search and insert.
  Demos:   tt-insert (slide spec)
  Program: none
  Budget:  ~26 min, 23 slides.
  Ported from Summer 2026 L05-2-3-b-trees.md, parts 1, 2.
-->

### 2-3 trees

> John Hopcroft invented 2-3 trees in 1970 but did not publish them; they first appeared in print in a 1974 textbook.

<small>Aho, Hopcroft and Ullman, The Design and Analysis of Computer Algorithms, 1974</small>

--

## Recap: balance by rotation

The AVL tree kept a **binary** tree balanced:

- one invariant: balance factor **∈ {−1, 0, +1}**
- restored after each op by **rotations**
- result: height **≤ 1.44 log₂ n**: a **guarantee**

It works: but rotations are fiddly: LL/RR/LR/RL on insert, and delete can **cascade** rotations up the path.

--

## A different idea: fatter nodes

What if a node could hold **more than one key**: and have **more than two children**?

Then we can absorb new keys **into** a node instead of growing a lopsided path. Balance becomes a property we get "for free" instead of one we repair.

That is the **2-3 tree**.

--

## 2-3 nodes

Every node is one of two kinds:

```text
   2-node (1 key)          3-node (2 keys)
       [ b ]                 [ a | c ]
       /   \                /    |    \
    < b     > b          < a  a..c    > c
```

- **2-node**: 1 key, 2 children (an ordinary BST node)
- **3-node**: 2 keys `a < c`, **3 children**: less than `a`, between `a` and `c`, greater than `c`

--

## The invariant: perfect balance

> **A 2-3 tree keeps *every* leaf at the *same* depth: always.**

No "±1 slack" like AVL. Perfect balance, maintained on every insert, with **no rotations**.

Height is therefore between **log₃ n** (all 3-nodes) and **log₂ n** (all 2-nodes) → **Θ(log n)**, guaranteed.

--

## Search is just "pick a door"

```text
                  [ 50 ]
           /                \
     [ 20 | 35 ]        [ 70 | 85 ]
    /    |     \       /    |     \
 [10] [25|30] [40|45][60|65][75|80][90|95]
```

Search **65**: `65 > 50` → right → `[70|85]`; `65 < 70` → left → leaf `[60|65]` → found.

Three levels, three "pick a door" decisions. Search cost = one comparison group per level = **Θ(height) = Θ(log n)**.

--

## 2-3 vs. a plain BST

Why a 2-3 tree, when a BST already searches in Θ(height)?

- a 2-3 node may hold **two** keys → **fewer levels**
- but the win isn't raw comparisons (you may test 2 keys per node)
- the win is that **balance is automatic**: and *keeping* it is simple

--

## Why balance comes for free

Preview of the trick: a 2-3 tree **grows at the root, not the leaves**.

- a BST adds a new **leaf** → one side can get deeper → imbalance
- a 2-3 tree pushes growth **upward** (via splits) → every leaf rises together

So the "same depth" invariant is preserved by *construction*, not repaired.

--

## Insertions always land in a leaf

Search down for the key as usual; it isn't there, so you stop at a **leaf**. Insert **there**: but never as a new deeper leaf (that would break "all leaves same depth"). Instead, **absorb** the key into the leaf node.

Two cases: the leaf is a **2-node** or a **3-node**.

--

## Case 1: into a 2-node: just grow it

The leaf has room. A 2-node becomes a 3-node. **No height change.**

```text
 insert 15 into [10]        →     [10 | 15]
```

Done. The tree stayed perfectly balanced because nothing moved.

--

## Case 2: into a 3-node: it overflows

A 3-node is full. Adding a key makes a temporary **4-node** (3 keys): not allowed. **Split** it:

```text
 insert 40 into [30|50]  →  temp [30|40|50]

        promote the MIDDLE (40) up
                 [40]
                /    \
             [30]    [50]
```

The middle key **moves up to the parent**; the node splits into two 2-nodes.

--

## …and the split can cascade

The promoted key joins the **parent**. If the parent was a 3-node, **it** overflows and splits too: promoting up again. This can ripple to the root.

**If the root splits, the promoted key becomes a *new root*.** That is the *only* way a 2-3 tree gets taller: and it adds a level at the **top**, so **all leaves stay at the same depth**.

--

## Split: where the three pieces go

A full leaf `[a|c]` plus a new key `b` (temp `[a|b|c]`) splits cleanly:

```text
       temp [ a | b | c ]
                 ↓
              [ b ]          b promotes
             /     \
          [a]      [c]       a, c become two 2-nodes
```

The **middle** key always promotes; the smaller and larger stay as leaves. In-order order is untouched.

--

## The root split: the tree grows up

```text
  promote reaches a full ROOT [p|q], new middle m:

       temp [ p | m | q ]          [ m ]     ← NEW root
                          →       /     \
                               [p]      [q]     +1 level
```

A new root appears and **every** leaf is one level deeper: all still level. This is the **only** way the height grows.

--

## A worked insertion sequence

Insert **50, 30, 70, 10, 20** into an empty 2-3 tree:

```text
 50 → [50]
 30 → [30|50]
 70 → [30|50|70]  split → [50] over [30] [70]
 10 → into [30] → [10|30]
 20 → [10|20|30]  split → promote 20 → root [20|50]
```

The root fills, then splits: the tree gains its second level at the top.

--

## Practice: you try

Insert **65** into:

```text
        [ 40 ]
       /      \
   [20|30]   [60|70]
```

<details class="answer"><summary>Answer:</summary>

65 > 40 → leaf `[60|70]` is full → temp `[60|65|70]` → **split**, promote **65** → root becomes `[40|65]`, leaves `[20|30] [60] [70]`. Every leaf still at depth 1. ✓

</details>

--

## Demo: 2-3 insert

<div class="algo-viz" data-algo="tt-insert">
<pre class="viz-fallback">
  insert into a full leaf → temporary 4-node → promote the
  middle key up → split into two 2-nodes → (repeat up if the
  parent overflows; a root split adds a level at the TOP).
  every leaf stays at the same depth.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Watch a **full leaf split**: the **middle key promotes** up, the node becomes two 2-nodes, every leaf stays level. Full sandbox on the **Demos** page.</small>

--

## Cost: Θ(log n), no rotations

- **height**: between `log₃ n` and `log₂ n`
- **search / insert**: `Θ(log n)`: a constant amount of work per level
- **splits per insert**: at most one per level, usually far fewer

A guaranteed-balanced search tree, and we never wrote a rotation.

--

## Delete: is it really that complicated?

Short answer: **not conceptually**: it's the mirror image of insert. **Merge and demote** instead of split and promote. The extra cases are real, but there's no new idea. Let's actually do it.

--

## Step 1: always remove from a leaf

Search down for the key. Two cases:

- it's in a **leaf** → remove it directly
- it's **internal** → swap with the **in-order predecessor** (rightmost key of its left subtree: always a leaf), remove *that* copy instead

Either way, removal always happens at a leaf: same discipline as insert's "always land in a leaf." <small>(Hibbard deletion used the *successor*; this is its mirror; both are valid.)</small>

--

## Underflow: BORROW from a sibling

Removing a key can leave a node with **0 keys**. If a sibling has **2 keys** (can spare one), rotate a key through the parent:

```text
 before:        [ 30 ]      delete 10: [10] underflows
                /      \     (0 keys); right sibling has
            [10]     [40|50] 2 keys, can lend one
 after (borrow through the parent):
                [ 40 ]
               /      \
           [30]      [50]
```

30 drops down to fill the gap; 40 rises to replace it: done in one step.

--

## Otherwise: MERGE with a sibling

If every sibling is at the minimum (1 key), merge instead: pull the parent's key down:

```text
 before:      [ 20 | 50 ]    delete 10: [10] underflows;
             /     |     \    [30] has only 1 key too -
         [10]   [30]    [60]  no one can lend. MERGE.
 after (merge [ ] + 20 + [30], parent shrinks):
             [ 50 ]
            /      \
       [20|30]    [60]
```

The parent **loses** a key: which may underflow **it** too, cascading up. If the **root** empties, its child becomes the new root: the tree **shrinks** a level.

--

## Demo: 2-3 delete

<div class="algo-viz" data-algo="tt-insert">
<pre class="viz-fallback">
  delete → find the key (swap to a leaf if internal) →
  remove it → if the leaf underflows, BORROW from a
  richer sibling through the parent, or MERGE with a
  sibling (pulling the parent's key down): cascading up.
  a merge that empties the root shrinks the tree by one level.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Same box as the insert demo: it has a **Delete** button too. Delete a leaf key (borrow), then delete enough neighbors to force a **merge**.</small>

