<!--
  TOPIC · Balance and the AVL invariant.
  Teaches: sorted input makes a BST a path; what balanced means; the AVL invariant (balance factor -1, 0 or +1 at every node); the node stores its height; only the insertion path can become unbalanced.
  Needs:   bst search and insert, bst analysis.
  Demos:   avl-vs-bst (slide spec), avl-path (Summer canvas demo)
  Program: none
  Budget:  ~22 min, 13 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 1, 2.
-->

### Balance and the AVL invariant

> Georgy Adelson-Velsky, the A in AVL, was one of the developers of Kaissa, which won the first World Computer Chess Championship in 1974.

<small>World Computer Chess Championship, Stockholm, 1974</small>

--

## Recap: cost is the height

For a BST, every BST operation walks **one root-to-leaf path**, so

- search / insert / delete are all **Θ(height)**
- a binary tree's height ranges from **log₂ n** (balanced) to **n − 1** (a path)

The whole game is: **keep the height small**.

--

## The worst case: sorted input

Insert **1, 2, 3, 4, 5** into a plain BST: each key is the largest so far, so it hangs off the right, forming a path:

```text
   1
    \
     2
      \
       3          height = n − 1
        \         search / insert = Θ(n)
         4
          \
           5
```

A sorted (or reverse-sorted) sequence (common in practice) reduces a BST to a linked list.

--

## Demo: plain BST vs AVL

<div class="algo-viz" data-algo="avl-vs-bst">
<pre class="viz-fallback">
  SAME keys 1..16, inserted in order:
  plain BST → a path                AVL → rebalances as it goes
   1                                        8
    \                                    /     \
     2                                  4       12
      \                               / \     /  \
       3                             2   6   10    14
        \                           / \ / \  / \   / \
         4  … height 15            1  3 5 7 9 11 13  15…16
            (= n−1)                height 4 = log2 16 (bound ≤ 1.44·log2 n ≈ 5.8)
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Keys 1…16 into both: press **⏩**. The **plain BST** grows a path (height **15**); the **AVL** stays flat (height **4**).</small>

--

## What would "balanced" even mean?

Ideally: **perfectly balanced**: every leaf at depth ⌊log₂ n⌋. But keeping a tree _perfectly_ balanced on each insert costs too much (you'd rebuild large chunks).

The AVL idea: **relax** perfect balance just enough that

- it's **cheap** to restore on each insert, yet
- the height stays **Θ(log n)**

--

## What "AVL" means

**AVL** = **A**delson-**V**elsky & **L**andis (1962), the two mathematicians who invented it: the **first self-balancing BST**.

> **The AVL invariant.** Every node stays **balanced**: its two subtrees' heights differ by **at most 1**.

The **balance factor** is the lean: **bf(x) = height(left) − height(right)**: the invariant is **bf ∈ {−1, 0, +1}**.

--

## Balance factor, by picture

```text
   bf = 0        bf = +1        bf = +2  ✗
     •             •               •
    / \           /               /
   •   •         •               •
                                 /
                                •
```

- heights within **1** → balanced (`−1, 0, +1`)
- a difference of **2** → we must fix it (a rotation)

Height convention: **height(null) = −1**, a leaf has height **0**.

--

## Perfectly balanced vs balanced

- **perfectly balanced**: all leaves at depth ≈ log₂ n; beautiful, but too rigid to maintain per insert
- **balanced (AVL)**: subtree heights differ by ≤ 1 at every node; a little slack → cheap to maintain

AVL is **not** perfectly balanced: just **balanced**, which is _close enough_ that height stays **Θ(log n)**.

--

## The node carries its height

```cpp
struct Node {
    Key   key;   Value val;
    Node* left  = nullptr;
    Node* right = nullptr;
    int   height = 0;        // leaf = 0, null = -1
};

int height(Node* t){ return t ? t->height : -1; }
int bf(Node* t){ return height(t->left) - height(t->right); }
void fix(Node* t){ t->height = 1 + max(height(t->left),
                                       height(t->right)); }
```

--

## Reading a tree: the balance factors

```text
      8   bf = +1
     / \
    4   9    bf 0, 0
   / \
  2   6    bf 0, 0
```

Left subtree of 8 has height 1, right has height 0 → **bf(8) = +1** (still legal). Every other node is 0.

--

## Where can a violation appear?

An insert or delete changes heights **only along its root-to-leaf path**. So:

- only nodes **on that path** can reach bf ±2
- we check and fix **on the way back up**: nowhere else

That is why **one upward pass** is enough.

--

## Demo: only the path is touched

<div class="algo-viz" data-algo="avl-path" data-example="8,4,12,2,6,10,14,1,3,5,7,9,11,15">
<pre class="viz-fallback">
              8
           /     \
          4       12          insert(16): plain-insert the leaf,
        /  \     /  \         then recompute bf up the path.
       2    6   10   14       A node hits bf ±2 (the imbalance) -
      / \  / \  / \    \      only PATH nodes change; off-path
     1  3 5  7 9 11    15     bf stay 0. (The fix: rotations.)

[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Every node shows its **bf**. **Insert** does a **plain insert** (the leaf appears), then recomputes bf **up the path**: a node **hits bf ±2** (red), and it can *only* be **on the path** (off-path **bf stay 0**). The demo **pauses** on that imbalance; a **rotation** fixes it.</small>

--

## The plan

1. **insert / delete** like an ordinary BST
2. update **heights** on the way back up
3. wherever a node's **bf hits ±2**, apply a **rotation** to restore it

The one new tool is the **rotation**.

