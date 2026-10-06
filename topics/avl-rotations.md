<!--
  TOPIC · Rotations.
  Teaches: right and left rotations: the picture and the code; rotations preserve the BST order; the middle subtree moves; the four imbalance shapes (LL, RR, LR, RL).
  Needs:   avl balance.
  Demos:   avl-rotate, avl-cases (Summer canvas demos)
  Program: none
  Budget:  ~20 min, 10 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 3.
-->

### Rotations

> Rotations first appeared in the 1962 AVL paper. Every balanced BST since, including red-black trees, splay trees and treaps, restores its shape with the same two moves.

<small>G. M. Adelson-Velsky and E. M. Landis, Doklady Akademii Nauk SSSR 146, 1962</small>

--

## A rotation rebalances: without breaking order

A **rotation** re-hangs a parent/child pair. It:

- changes the two nodes' **heights** (fixing balance)
- **preserves the in-order** sequence → still a valid BST

It is the _only_ structural move AVL needs.

--

## Right rotation: the picture

```text
      y                 x
     / \              /   \
    x   C     →      A     y
   / \                    / \
  A   B                  B   C
```

`B` (keys between x and y) moves from x's right to y's left. `x` rises, `y` sinks.

--

## Right rotation: the code

```cpp
Node* rotateRight(Node* y) {
    Node* x = y->left;
    y->left = x->right;      // B re-hangs under y
    x->right = y;
    fix(y); fix(x);          // y is now lower → fix it first
    return x;                // x is the new subtree root
}
```

Three pointer writes, two height updates: all **O(1)**.

--

## Left rotation: the mirror

```text
    x                     y
   / \                  /   \
  A   y       →        x     C
     / \              / \
    B   C            A   B
```

```cpp
Node* rotateLeft(Node* x) {
    Node* y = x->right;
    x->right = y->left;      // B re-hangs under x
    y->left = x;
    fix(x); fix(y);
    return y;
}
```

--

## Order is preserved

In-order of both trees is the same: **A · x · B · y · C**.

```text
   y            x
  / \          / \
 x   C   ≡    A   y      in-order:  A x B y C
/ \              / \
A  B            B  C
```

Rotations move _structure_, never _order_: so search still works after any rotation.

--

## The middle subtree re-hangs

Right-rotate at **50** (child **30** rises). **B = `40(35,45)`**: the keys *between* 30 and 50: is the one subtree that **changes parent**:

```text
       50                        30
      /  \                      /   \
    30    75        →         20     50
   /  \                      /      /  \
  20   40                   10    40    75
 /    /  \                        /  \
10  35  45                       35  45
```

Only **B** re-hangs (30's right → 50's left): the single line **`y->left = x->right`**; the whole subtree follows one pointer, in-order unchanged.

--

## Demo: rotate a subtree

<div class="algo-viz" data-algo="avl-rotate">
<pre class="viz-fallback">
   RIGHT rotation about y (the LL case):        mirror = LEFT rotation
         y                     x
        / \                  / \
       x   C      ⇒         A   y          subtrees keep their order:
      / \                      / \         A ≤ x ≤ B ≤ y ≤ C
     A   B                    B   C        (in-order is unchanged)
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Click any node**, then **rotate**: only that subtree reshapes; the **in-order strip** never changes. The **orange** nodes are **B: the middle subtree that re-hangs** to the other node (the only parent change). Auto: node 50 is picked; right-rotate to watch `40(35,45)` swing from 30 to 50, everything else fixed.</small>

--

## The four imbalance shapes

When a node `z` goes to **bf ±2**, the direction of the two steps below it names the case:

| case   | the two steps     | fix                           |
| ------ | ----------------- | ----------------------------- |
| **LL** | left, then left   | one **right** rotation        |
| **RR** | right, then right | one **left** rotation         |
| **LR** | left, then right  | **double** (left, then right) |
| **RL** | right, then left  | **double** (right, then left) |

Straight (LL/RR) → one rotation. Kinked (LR/RL) → two.

--

## Demo: the four styles

<div class="algo-viz" data-algo="avl-cases">
<pre class="viz-fallback">
   LL → right rotation        RR → left rotation
   LR → left, then right      RL → right, then left
   (straight leans = 1 rotation · kinks = 2)

[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Read the case from the **bf**s: the **±2 node**'s bf picks the **taller child** (edge 1); that child's bf picks edge 2. **Same** direction = **LL/RR → one** rotation; **opposite** = **LR/RL → two** (it pauses between them).</small>

