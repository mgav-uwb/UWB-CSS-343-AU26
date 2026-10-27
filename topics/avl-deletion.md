<!--
  TOPIC · AVL deletion.
  Teaches: delete as in a BST, then rebalance on the way up; deletion can rotate at every level of the path; the same case analysis.
  Needs:   avl insertion, bst deletion.
  Demos:   avl-del (Summer canvas demo)
  Program: none
  Budget:  ~12 min, 7 slides.
  Ported from Summer 2026 L04-avl-trees.md, parts 5.
-->

### AVL deletion

> An AVL insertion needs at most one single or double rotation; a deletion may need one at every level on the way up.

<small>D. E. Knuth, The Art of Computer Programming, Volume 3, §6.2.3</small>

--

## Delete like a BST: then rebalance up

Deletion starts exactly like BST deletion:

- **0 or 1 child** → splice the node out
- **2 children** → copy the **in-order successor** up, delete it from the right subtree

…then, on the way back up, **`fix` heights and `rebalance`** each node: same four-case tool as insert.

--

## The catch: deletion can rotate at _every_ level

Insertion needs **one** rotation. Deletion is different:

- a delete **shortens** a subtree by 1
- rebalancing there can shorten the _parent_: which may now violate
- so a rotation may be needed at **each** node up the path

Still $O(\log n)$ rotations total (the path is $O(\log n)$ tall), but not just one.

--

## Which rotation?

Left at $+2$: the left child's balance factor picks the fix.

<div><img src="../../topics/figures/avl/av-del-cases.svg" style="height:350px" alt="
- left-heavy, left child bf ≥ 0 → right rotation (LL)
- left-heavy, left child bf < 0 → double (LR)
- right-heavy, mirror → left / double (RL)
"></div>

Same code as insertion; right-heavy is the mirror.

--

## Deletion: the code

```cpp
Node* erase(Node* t, const Key& k) {
    if (!t) return nullptr;
    if      (k < t->key) t->left  = erase(t->left,  k);
    else if (k > t->key) t->right = erase(t->right, k);
    else {                               // found it
        if (!t->left || !t->right) {     // 0 or 1 child
            Node* c = t->left ? t->left : t->right;
            delete t;  return c;
        }
        Node* s = minNode(t->right);     // successor
        t->key = s->key;  t->val = s->val;
        t->right = erase(t->right, s->key);
    }
    return rebalance(t);                 // fix + rotate up
}
```

--

## Worked: a delete that rotates

Delete **1**: the right side is now too tall, $\mathrm{bf}(3) = -2$:

<div><img src="../../topics/figures/avl/av-del.svg" style="height:220px" alt="
     3            3 (bf −2)        4
    / \            \              / \
   1   4    →        4      →     3   5
        \            \
         5            5
"></div>

Removing 1 leaves 3 right-heavy (RR) → one **rotateLeft(3)** restores it.

--

## Demo: deletion, all cases

<div class="algo-viz" data-algo="avl-del">
<pre class="viz-fallback">
  the five cases (pick one):
   leaf         · just remove it
   one child    · splice it out
   two children · copy the successor up, remove its node
   + rotation   · a bf ±2 on the path → one rotation
   + cascade    · a delete can rotate at MORE THAN ONE level

[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Pick a case: **leaf · one child · two children · + rotation · + cascade**. Each animates **descend → remove → recompute bf up the path**, pausing at any **bf ±2** so you can predict the rotation. Unlike insert, a delete can rotate at **several levels** (the cascade).</small>

