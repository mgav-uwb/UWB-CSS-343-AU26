<!--
  TOPIC · Interval partitioning: the same events, a different question.
  Teaches: interval partitioning (host every request in as few rooms as possible); the depth as a lower bound; the greedy (start order, reuse a free room) on the five requests; its C++ with a min-heap of free times; why it never exceeds the depth (a matching bound, not an exchange); the intervals demo running both greedies; the ten-request practice.
  Needs:   activity selection.
  Demos:   intervals (slide spec in topics/demos.js); figures gm-depth5, gm-rooms5, is-ten (tools/gen-greedy-figures.mjs)
  Program: code/interval-partitioning/rooms.cpp
  Budget:  ~12 min, 8 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 2.
-->

### The same events, a different question

> Seymour Benzer tested in 1959 whether the overlaps among deletions in a virus gene could be drawn as intervals on a line. They could: evidence that the fine structure of a gene is linear.

<small>S. Benzer, “On the Topology of the Genetic Fine Structure,” PNAS 45(11), 1959</small>

--

## How many rooms?

Now **every** request must be hosted, one request per room at a time. **Minimize the rooms.**

<div><img src="../../topics/figures/greedy/gm-depth5.svg" style="height:215px" alt="
   t     1  2  3  4  5  6  7  8  9  10 11
   a     [===========)
   b        [===========)
   c           [===========)
   d                       [=====)
   e                          [========)
   count 1  2  3  3  2  1  1  2  1  1"></div>

One room keeps **2** of these five. How many rooms host **all five**?

--

## The depth: a lower bound

The **depth** is the most requests live at one instant: here **3**, in $[3, 4)$ and $[4, 5)$.

- requests live at one instant **pairwise conflict**
- so no two of them can share a room
- so **every** schedule needs at least that many rooms

$$\text{rooms} \ge \text{depth} = 3$$

--

## Reuse a free room

<div><img src="../../topics/figures/greedy/gm-rooms5.svg" style="height:230px" alt="
   a [1,5)   R1: opens
   b [2,6)   R2: R1 busy until 5
   c [3,7)   R3: R1, R2 busy
   d [7,9)   R1: free since 5
   e [8,11)  R2: free since 6
   live: 1 2 3 3 2 1 1 2 1 1"></div>

In **start** order, put each request in a room that is free; open a new room **only** when every open room is busy. **3 rooms.**

--

## Rooms, in C++

```cpp
bool startsFirst(const Request& a, const Request& b) {
    return a.start < b.start;
}

int minRooms(vector<Request> reqs) {
    sort(reqs.begin(), reqs.end(), startsFirst);
    // the times the open rooms come free, soonest on top
    priority_queue<int, vector<int>, greater<int>> freeAt;
    for (const Request& r : reqs) {
        if (!freeAt.empty() && freeAt.top() <= r.start)
            freeAt.pop();                    // reuse the soonest-free room
        freeAt.push(r.finish);               // r holds a room until r.finish
    }
    return freeAt.size();                    // one entry per room ever opened
}
```

If the room that frees **soonest** is busy, every room is busy. $O(n \log n)$.

--

## The bounds meet

When the greedy opens room $m$ for request $r$:

- the other $m - 1$ rooms are **busy** at time $s(r)$
- so $m$ requests are live at one instant: $m \le \text{depth}$

$$\text{greedy} \le \text{depth} \le \text{optimum} \le \text{greedy}$$

All equal: **optimal**, by a matching bound, not an exchange.

--

## Demo: both questions

<div class="algo-viz" data-algo="intervals" data-config='{"width":860,"height":210}'>
<pre class="viz-fallback">
   a[1,5) b[2,6) c[3,7) d[7,9) e[8,11)
   Rooms:  start order, reuse a free room: 3 rooms
           (a, d share R1; b, e share R2; c alone in R3)
   Select: earliest finish first, one room: 2 requests (a, d)
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>**Rooms** colours each request by its room; **Select** marks the ones one room keeps. Edit the pairs, add `1 11`, and run both.</small>

--

## Your turn: rooms for ten

<div><img src="../../topics/figures/greedy/is-ten.svg" style="height:240px" alt="
   a [1,4)  b [3,5)  c [0,6)  d [4,7)  e [7,9)
   f [5,9)  g [6,10) h [8,11) i [8,12) j [11,13)"></div>

How many rooms do the ten need? Argue both bounds.

<details class="answer"><summary>Answer:</summary>

$e, f, g, h, i$ are live in $[8, 9)$: depth **5**, and the greedy opens **5**.

</details>

