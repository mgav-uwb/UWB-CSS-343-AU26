<!--
  TOPIC · The binary search tree: search and insert.
  Teaches: the BST as an ordered symbol table; the ordering invariant; the node with a size count; search as a guided descent; insert at a null link, resetting links and counts on the way up.
  Needs:   tree basics, tree traversals.
  Demos:   bst-ops (Summer canvas demo)
  Program: none
  Budget:  ~18 min, 9 slides.
  Ported from Summer 2026 L03-trees-bst.md, parts 5, 6.
-->

### The binary search tree: search and insert

> Binary search trees were described independently around 1960 by P. F. Windley, by A. D. Booth and A. J. T. Colin, and by T. N. Hibbard.

<small>D. E. Knuth, The Art of Computer Programming, Volume 3, §6.2.2</small>

--

## Definition: a key/value map

A BST is an **ordered symbol table**: a **map** of **(key → value)** pairs, looked up **by key**.

- **keys** are **unique** and **comparable**: we order by the key
- the **value** just rides along with its key
- keeping keys ordered is what buys fast search + the ordered ops (this Part)

--

## The BST ordering

At **every** node: all keys in its **left** subtree are **smaller**, all keys in its **right** subtree are **larger**: a recursive invariant, **not merely "sorted"**.

<img src="../../topics/figures/trees/fig-02-anatomy-bst.jpeg" alt="Anatomy of a BST: each node's key exceeds every key in its left subtree and is below every key in its right subtree; a value rides along" style="height:196px">

So search is a **guided descent** (compare, go left or right), and in-order visits the keys **sorted**.

--

## Representation: the node carries a count

Sedgewick's node adds a **subtree size** (node count) to support the ordered operations:

```cpp
struct Node {
    Key   key;
    Value val;
    Node* left;
    Node* right;
    int   size;     // # nodes in the subtree rooted here
};
int size(Node* x){ return x ? x->size : 0; }   // null-safe
```

The **same keys** can form **many different BSTs**: the shape depends on insertion order.

--

## The BST class

```cpp
class BST {
    struct Node { Key key; Value val; Node *left, *right; int size; };
    Node* root = nullptr;        // + private recursive helpers
public:
    Value* get(const Key& k);                    // search
    void   put(const Key& k, const Value& v);    // insert / update
    Key    min(), max();   int size();
    Key    floor(const Key& k), ceiling(const Key& k);
    Key    select(int i);  int rank(const Key& k);
    void   deleteMin(), erase(const Key& k);     // delete
    vector<Key> keys(const Key& lo, const Key& hi);   // range
};
```

Each method is a short recursion, written out below.

--

## Search (get): hit, miss, and the path

Search defines a **path** from the root (compare, go left or right) ending in a **hit** (a node with the key) or a **miss** (falling off a **null link**):

```cpp
Value* get(Node* t, const Key& key) {
    if (!t) return nullptr;             // miss (null link)
    if (key == t->key) return &t->val;  // hit
    if (key < t->key) return get(t->left, key);
    else              return get(t->right, key);
}
```
--

## Insert (put): grow at a null link

A search for a missing key ends at a **null link**: put a new node there. On the way **back up**, reset each parent's link and **update the size counts**.

```cpp
Node* put(Node* t, const Key& key, const Value& val) {
    if (!t) return new Node{key, val, nullptr, nullptr, 1};  // grow here
    if (key < t->key) t->left = put(t->left, key, val);
    else if (key > t->key) t->right = put(t->right, key, val);
    else t->val = val;                          // equal key: update
    t->size = 1 + size(t->left) + size(t->right);   // recount up
    return t;
}
```
--

## Down vs up: the recursion has two halves

- **on the way down**: compare the key, move left or right (the *search*)
- **on the way up**: reset each parent's child link, recompute each `size`

Elementary BSTs only add the one new link at the bottom: but the same up-the-path scheme is what **balanced trees rewire** to stay short.

--

## Demo: build a BST

<div class="algo-viz" data-algo="bst-ops" data-example="S,E,A,R,C,H,E,X,A,M,P,L,E">
<pre class="viz-fallback">
  insert S E A R C H E X A M P L E (repeats update the value → 10 nodes):
              S
            /   \
           E     X
         /   \
        A     R
         \   /
          C H
             \
              M
             / \
            L   P
 
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Press **▶** to build: repeats (`E`, `A`) **update the value, no new node** → **10 nodes, 13 inserts**. Scrub with **⏮ ◁ ▶ ▷ ⏭**; the strip's **⚙ menu** edits / shuffles / sorts the sequence; click a **+**, an **edge**, or a **node**.</small>

