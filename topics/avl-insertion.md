<!--
  TOPIC · AVL insertion.
  Teaches: insert as in a BST, then rebalance on the way up; the four cases and their rotations; one rotation fixes an insertion; choosing the case from balance factors; a worked trace inserting 1 to 7.
  Needs:   avl rotations.
  Demos:   avl-insert (slide spec)
  Program: none
  Budget:  ~24 min, 11 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 4.
-->

### AVL insertion

> Insert the keys 1, 2, …, 2<sup>k</sup> − 1 in order and a plain BST becomes a path; an AVL tree becomes a perfectly balanced tree.

<small>Checked for k = 1 to 11 with the course's AVL code</small>

--

## Insert like a BST, then fix on the way up

1. **insert** the new key at a leaf (ordinary BST insert)
2. returning up the path, **`fix`** each node's height
3. at the **first** node whose **bf becomes ±2**, apply **one** rotation

That single rotation restores the height the subtree had _before_ the insert → the whole tree is balanced again.

--

## LL: a single right rotation

`z` is left-heavy and its left child leans left too. Insert **1** into `3 ← 2`:

```text
    3 (bf +2)             2
   /                     / \
  2          →          1   3
 /
1
```

One **rotateRight(3)**: and `2` becomes the root of a balanced subtree.

--

## RR: a single left rotation

`z` is right-heavy and its right child leans right. Insert **3** into `1 → 2`:

```text
  1 (bf −2)              2
   \                    / \
    2         →        1   3
     \
      3
```

One **rotateLeft(1)**: the sorted-ascending case, now self-correcting.

--

## LR: a double rotation

`z` is left-heavy but its left child leans **right** (a kink). Insert **2** into `3 ← 1`:

```text
    3            3            2
   /            /            / \
  1     →      2      →     1   3
   \          /
    2        1
```

**rotateLeft(1)** straightens it into LL, then **rotateRight(3)** finishes.

--

## RL: a double rotation

`z` is right-heavy but its right child leans **left**. Insert **2** into `1 → 3`:

```text
  1            1                2
   \            \              / \
    3     →      2      →     1   3
   /              \
  2                3
```

**rotateRight(3)** straightens into RR, then **rotateLeft(1)** finishes.

--

## Why exactly one rotation is enough

One insert adds **at most 1** to any subtree height, so the lowest violating node is off by exactly 1 too much.

- the rotation there **lowers that subtree's height by 1**
- back to its pre-insert height → every ancestor is balanced again

So insertion needs **at most one** (single or double) rotation.

--

## `rebalance`: pick the case from balance factors

```cpp
Node* rebalance(Node* t) {
    fix(t);
    if (bf(t) > 1) {                 // left-heavy (LL or LR)
        if (bf(t->left) < 0)         // LR → straighten first
            t->left = rotateLeft(t->left);
        return rotateRight(t);
    }
    if (bf(t) < -1) {                // right-heavy (RR or RL)
        if (bf(t->right) > 0)        // RL → straighten first
            t->right = rotateRight(t->right);
        return rotateLeft(t);
    }
    return t;                        // |bf| ≤ 1 → balanced
}
```

--

## Insertion: the whole thing

```cpp
Node* insert(Node* t, const Key& k, const Value& v) {
    if (!t) return new Node{k, v};       // leaf, height 0
    if      (k < t->key) t->left  = insert(t->left,  k, v);
    else if (k > t->key) t->right = insert(t->right, k, v);
    else { t->val = v; return t; }       // duplicate → update
    return rebalance(t);                 // fix + rotate up
}
```

Same shape as the BST insert, plus **`rebalance`** on the way up.

--

## Worked trace: insert 1…7 in order

Sorted input: a **height-6 path** in a plain BST. The AVL rotates as it goes:

```text
 after 1,2,3     after 4,5         after 6,7
   2               2                  4
  / \             / \                / \
 1   3           1   4              2   6
                    / \            / \ / \
                   3   5          1  3 5  7
```

Seven worst-case inserts → **height 2**, never a path.

--

## Demo: AVL insertion

<div class="algo-viz" data-algo="avl-insert" data-example="80,40,120,20,60,100,140,10,30,50,70,90,110,130,150,15,25,35,45,55,65,75,85,95,105,115,145,155">
<pre class="viz-fallback">
  insert 160: descend → PLAIN-insert the leaf → recompute bf up →
  node 140 hits bf −2 → ONE rotation (left) → balanced again.
  every node shows its bf; only the path changes.
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Auto-runs **insert 160**: descend → **plain-insert** the leaf → recompute **bf** up the path: it **pauses** at bf −2 (node **140**) so you can **predict the rotation**, then **▶ continue** rotates it. Every node shows its bf; only the path changes. (Full sandbox with all ops: the **Demos** page.)</small>

