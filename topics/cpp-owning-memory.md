<!--
TOPIC · Owning heap memory in C++.
  Teaches: stack and heap lifetime; a node chain; the destructor; what the
           compiler-generated copy does to a class that owns memory; the Rule
           of Three; deep copy; copy assignment; checking for leaks.
  Needs:   the passing-arguments topic (const reference).
  Demos:   none.
  Program: topics/code/cpp-owning-memory/intlist.cpp, shallow.cpp
  Budget:  ~17 min, 11 slides.
-->

### Owning memory

<small>(~17 min)</small>

--

## Stack and heap

- a **local variable** lives in its function's stack frame and is gone at `return`
- **`new`** allocates on the heap; the object lives until **`delete`**

```cpp
int* makeA() { int x = 7; return &x; }
int* makeB() { return new int(7); }
```

**Which function has a bug?**

<small>`makeA` returns the address of a variable that no longer exists. `makeB` is correct, and its caller must `delete` the result.</small> <!-- .element: class="fragment" -->

--

## A node and a chain

```cpp
struct Node {
    int   key;
    Node* next;
};

void pushFront(int key) { head = new Node(key, head); }
```

After pushing 8, then 5, then 3:

```text
head
 │
 ▼
[3 | •]──►[5 | •]──►[8 | null]
```

--

## Every new needs one delete

```cpp [3-5]
~IntList() {
    while (head != nullptr) {
        Node* doomed = head;
        head = head->next;
        delete doomed;
    }
}
```

The order matters: read `head->next` **before** deleting the node that holds it.

--

## Predict: copying a list

`ShallowList` has that destructor and **no** copy constructor.

```cpp
ShallowList a;              // 3 -> 5 -> 8
ShallowList b = a;          // the compiler writes this copy
b.setFirst(99);
a.print();                  // ?
```

<small>Output: `99 -> 5 -> 8`. The default copy duplicated the head **pointer**, so `a` and `b` share one chain.</small> <!-- .element: class="fragment" -->

--

## Two owners, one chain

```text
a.head ──┐
         ▼
        [99 | •]──►[5 | •]──►[8 | null]
         ▲
b.head ──┘
```

At the end of the scope **both destructors run**.

- the first deletes the three nodes
- the second deletes the same three nodes again

A double delete is undefined behavior. The program usually aborts.

--

## The Rule of Three

A class that needs **one** of these needs **all three**:

| Member | Runs when | Must |
| --- | --- | --- |
| destructor | the object goes out of scope | free what the object owns |
| copy constructor | `IntList b = a;` | build an independent copy |
| copy assignment | `c = a;` | free the old contents, then copy |

Needing a destructor is the sign: the class **owns** heap memory.

--

## Copy constructor

```cpp [4]
IntList(const IntList& other) {
    Node* tail = nullptr;
    for (const Node* p = other.head; p != nullptr; p = p->next) {
        Node* n = new Node(p->key, nullptr);
        if (tail == nullptr) head = n;
        else                 tail->next = n;
        tail = n;
    }
}
```

One `new` per node of `other`: the copy owns its own chain.

--

## Copy assignment

```cpp [2-4]
IntList& operator=(const IntList& other) {
    if (this != &other) {       // 1. self-assignment: do nothing
        clear();                // 2. free what we own
        copyFrom(other);        // 3. deep-copy
    }
    return *this;
}
```

Without step 1, `c = c` frees the list and then copies from the freed list.

--

## Run it

```text
a: 3 -> 5 -> 8
after b = a; b.setFirst(99)
a: 3 -> 5 -> 8
b: 99 -> 5 -> 8
c: 3 -> 5 -> 8
live nodes inside the block: 9
live nodes after the block:  0
```

Three lists of three nodes: **9** allocated, **0** left.

--

## Checking for leaks

```text
g++ -std=c++17 -g intlist.cpp -o intlist
valgrind --leak-check=full ./intlist
```

A clean report has these two lines:

```text
All heap blocks were freed -- no leaks are possible
ERROR SUMMARY: 0 errors from 0 contexts
```

- run it on every path the program can take
- a submitted program is expected to produce this report

