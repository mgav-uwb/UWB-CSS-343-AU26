<!--
  TOPIC · Deletion.
  Teaches: deleteMin; the 0-, 1- and 2-child cases; Hibbard deletion by the in-order successor; successor or predecessor; freeing every removed node.
  Needs:   bst search and insert.
  Demos:   bst-ops with delete (Summer canvas demo)
  Program: none
  Budget:  ~12 min, 7 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 8.
-->

### Deletion

> Jeffrey Eppinger's 1983 experiments showed that long runs of random insertions and Hibbard deletions leave a BST less balanced than insertions alone.

<small>J. L. Eppinger, “An Empirical Study of Insertion and Deletion in Binary Search Trees,” CACM 26(9), 1983</small>

--

## deleteMin / deleteMax (the easy case)

To delete the **minimum**: go **left** until a node has a **null left link**: that node is the min. **Free it** and splice in its **right** child, then fix `size` counts on the way up.

```cpp
Node* deleteMin(Node* t) {
    if (!t->left) {           // found the min:
        Node* r = t->right;
        delete t;             // free it (no leak)
        return r;             // splice in its right child
    }
    t->left = deleteMin(t->left);
    t->size = 1 + size(t->left) + size(t->right);
    return t;
}
```
--

## Delete: the two-child dilemma

Removing a node with **0 or 1 child** is a simple splice (parent's link → the lone child or null). But a node with **two children** leaves two links and only one slot in the parent.

> **Cases:** leaf → remove; one child → splice the child up; **two children → ???**

<small>→ try the three easy cases in the **deletion playground** (below): a leaf, an only-left, an only-right node.</small>

--

## Hibbard deletion (the two-child case)

Replace the node with its **in-order successor**: the **smallest key in its right subtree** (which has no left child). Order is preserved: no key lies between the node's key and its successor.

The idea (Hibbard, 1962): find the successor, **copy its key/value up** into the node, then **`deleteMin`** the duplicate out of the right subtree.

--

## Successor or predecessor?

The **predecessor** works just as well: the **largest key in the left subtree** (no *right* child). By symmetry it also preserves order, so the choice is free.

**Which to use?**

- picking the **same side every time** skews the shape (a long mix of random inserts + one-sided Hibbard deletes → ~**√n** *average path length*)
- **alternate** them, or take the one from the **taller** subtree, to stay balanced
- balanced trees make the choice moot

--

## Hibbard deletion: the code

```cpp
Node* erase(Node* t, const Key& key) {
    if (!t) return nullptr;
    if      (key < t->key) t->left  = erase(t->left,  key);
    else if (key > t->key) t->right = erase(t->right, key);
    else {                               // found it
        if (!t->left || !t->right) {     // 0 or 1 child
            Node* c = t->left ? t->left : t->right;
            delete t;                    // free the node
            return c;                    // splice in the lone child
        }
        Node* s = min(t->right);         // in-order successor
        t->key = s->key;  t->val = s->val;   // copy it up
        t->right = deleteMin(t->right);  // frees the duplicate
    }
    t->size = 1 + size(t->left) + size(t->right);
    return t;
}
```

Every removed node is freed exactly once: **no leaks**.

--

## Demo: delete (Hibbard)

<div class="algo-viz" data-algo="bst-ops" data-example="S,E,A,R,C,H,X,M,P,L" data-delete="1">
<pre class="viz-fallback">
  delete E (two children): Hibbard: copy the SUCCESSOR (min of the
  right subtree) into E's node, then remove the duplicate below.
        S                          S
      /   \                      /   \
     E     X          ⇒         H     X
   /   \                      /   \
  A     R                    A     R
   \   /                      \   /
    C H…                       C M…
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Press **▶** to build, then **Delete** a leaf, a one-child node, and a two-child node (e.g. `E`). **via** switches **successor ↔ predecessor**; scrub with **⏮ ◁ ▶ ▷ ⏭** (◁ steps *backward*, resurrecting the key).</small>

