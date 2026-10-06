<!--
  TOPIC · Ordered operations.
  Teaches: min and max, floor and ceiling, select and rank with the size field, range queries as a pruned in-order walk; where order matters.
  Needs:   bst search and insert.
  Demos:   bst-ordered (Summer canvas demo)
  Program: none
  Budget:  ~12 min, 8 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 7, 10.
-->

### Ordered operations

> In the GCC, Clang and Microsoft C++ standard libraries, std::map and std::set are red-black trees, which is how they support lower_bound and in-order iteration.

<small>libstdc++, libc++ and Microsoft STL source</small>

--

## Ordered operations: more than a set

Beyond get/put: the **ordered API**, each in Θ(height):

- **min / max**: leftmost / rightmost node
- **floor(k) / ceiling(k)**: largest key ≤ k / smallest key ≥ k
- **select(i) / rank(k)**: key of rank i / # keys < k (uses `size`)
- **range**: `keys(lo, hi)`: the keys in `[lo, hi]`, in order

--

## min / max, floor / ceiling

- **min / max**: follow `left` / `right` links to the end.
- **floor(k)** = largest key ≤ k.
- **ceiling(k)** = smallest key ≥ k.

```cpp
Node* floor(Node* t, const Key& k) {   // largest key ≤ k
    if (!t) return nullptr;
    if (k == t->key) return t;
    if (k < t->key)  return floor(t->left, k);
    Node* r = floor(t->right, k);      // closer on right?
    return r ? r : t;                  // else: this node
}
```

`ceiling` mirrors it (swap left/right and ≤/≥).

--

## Demo: min / max / floor / ceiling

<div class="algo-viz" data-algo="bst-ordered">
<pre class="viz-fallback">
              50
            /    \
          30      70
         /  \    /  \
       20   40  60   80         min = 20 (walk left links to the end)
           /      \    \        max = 90 (walk right links to the end)
          35      65    90      floor(45) = 40 · ceiling(45) = 50
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Try **min / max**, or enter a key for **floor / ceiling**: the path and answer light up.</small>

--

## select / rank: the count field earns its keep

With **`size`** on every node, both are Θ(height):

```cpp
Key select(Node* t, int i) {             // key of rank i
    int s = size(t->left);
    if (i < s) return select(t->left, i);
    if (i > s) return select(t->right, i - s - 1);
    return t->key;                       // i == s → this node
}
int rank(Node* t, const Key& k) {        // # keys < k
    if (!t)          return 0;
    if (k < t->key)  return rank(t->left, k);
    if (k == t->key) return size(t->left);
    return size(t->left) + 1 + rank(t->right, k);  // k > key
}
```

`select` and `rank` are **inverses**.

--

## Demo: select / rank

<div class="algo-viz" data-algo="bst-ordered">
<pre class="viz-fallback">
              50 (10)                   select(3) = 40   rank(60) = 5
            /       \                  (0-based rank; the size counts
          30 (4)     70 (5)             steer the descent: go left if
         /   \      /    \              i < size(left), else right)
       20    40    60     80           sorted: 20 30 35 40 50 60 65 70 80 90
            /        \      \           ranks:  0  1  2  3  4  5  6  7  8  9
           35        65      90
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Enter a rank for **select(i)** or a key for **rank(k)**: the subtree counts pick the direction.</small>

--

## Range queries: keys(lo, hi)

An **in-order** traversal, pruned: recurse into a side only if it could hold in-range keys.

```cpp
void keys(Node* t, Queue& q, Key lo, Key hi) {
    if (!t) return;
    if (lo < t->key)  keys(t->left,  q, lo, hi);
    if (lo <= t->key && t->key <= hi) q.enqueue(t->key);
    if (t->key < hi)  keys(t->right, q, lo, hi);
}
```

Returns `[lo, hi]` **in sorted order**, in time **height + output size**.

--

## Where BSTs earn their keep

A **BST / ordered map** shines where you need **order** (a hash table can't):

- **autocomplete** → **range** search
- **nearest key** (≥ / ≤) → **floor / ceiling**
- **leaderboards** → **rank / select**
- **date / price ranges** → **range** query
- **`std::map` / `std::set`** = balanced BSTs

