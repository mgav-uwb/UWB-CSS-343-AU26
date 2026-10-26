<!--
  TOPIC · Deleting from a linear-probing table: the probe-path rule across the end of the array, and deleting by shifting.
  Teaches: re-insertion in code; why it keeps every key on its probe path when a cluster wraps; the shift delete (Knuth's Algorithm R) and its test d(r, i) < d(r, j) with d(a, b) = (b - a) mod M; why comparing slot numbers fails on a cluster that wraps.
  Needs:   linear probing.
  Demos:   none; figures hs-lp-delete-wrap, hs-lp-shift, hs-lp-shift-naive, hs-lp-shift-practice (tools/gen-hash-figures.mjs)
  Program: none
  Budget:  ~12 min, 8 slides. Lecture 8 mounts it as an appendix after the close.
-->

### Appendix: deleting from a linear-probing table

> Knuth's Algorithm R deletes from a linear-probing table with no tombstones and no rehashing: it moves later keys of the cluster back into the hole, each only when the hole lies on its probe path.

<small>D. E. Knuth, *The Art of Computer Programming*, Vol. 3, *Sorting and Searching*, 2nd ed., 1998, §6.4</small>

--

## Re-insertion, in code

```cpp
void LinearProbing::remove(int k) {
    int i = h(k);
    while (table[i] != k) {                // find k
        if (table[i] == EMPTY) return;     // k is absent
        i = (i + 1) % M;
    }
    table[i] = EMPTY;                      // the hole
    n--;
    // the rest of the cluster, wrapping past M-1 like any probe
    for (int j = (i + 1) % M; table[j] != EMPTY; j = (j + 1) % M) {
        int key = table[j];                // lift each later key out
        table[j] = EMPTY;
        n--;
        insert(key);                       // and insert it again from h(key)
    }
}
```

Insert starts at $h(k)$ and steps $\bmod M$: a lifted key lands **on its own probe path**, at or before its old slot.

--

## Delete across the end

<div><img src="../../topics/figures/hashing/hs-lp-delete-wrap.svg" style="height:400px" alt="
   M = 11: [ 11 53 _ _ _ _ _ _ _ 31 42 ]   cluster: slots 9, 10, 0, 1
   delete 31:      empty slot 9
   re-insert 42:   h(42) = 9 is free        → slot 9
   re-insert 11:   h(11) = 0 is free        → slot 0
   re-insert 53:   h(53) = 9 taken (42)     → slot 10
   slot 2 is empty: done   [ 11 _ _ _ _ _ _ _ _ 42 53 ]"></div>

53 moves **back across the end**, toward its home.

--

## Shift instead of rehash

Re-insertion walks each lifted key from its home: $\Theta(L^2)$ probes for a cluster of length $L$. **Shifting** makes one pass, $\Theta(L)$: move each later key straight into the hole when legal; the hole moves to where it was.

$$d(a, b) = (b - a) \bmod M \qquad \text{(steps from } a \text{ forward to } b\text{)}$$

Key in slot $j$, home $r$, hole at $i$: **move it iff $d(r, i) < d(r, j)$**, the hole comes earlier on its probe path than its own slot.

--

## Shift, in code

```cpp
// The number of steps from slot a forward to slot b, wrapping past M-1.
int LinearProbing::dist(int a, int b) const {
    return (b - a + M) % M;
}

void LinearProbing::remove(int k) {
    // find k and empty its slot, as in re-insertion: slot i is the hole
    for (int j = (i + 1) % M; table[j] != EMPTY; j = (j + 1) % M) {
        int r = h(table[j]);               // the home of the key in slot j
        if (dist(r, i) < dist(r, j)) {     // the hole is on its probe path
            table[i] = table[j];           // move the key back into the hole
            table[j] = EMPTY;
            i = j;                         // the hole moves to slot j
        }
    }
}
```

--

## Shift across the end

<div><img src="../../topics/figures/hashing/hs-lp-shift.svg" style="height:500px" alt="
   [ 11 53 _ _ _ _ _ _ _ 31 42 ]   delete 31: the hole is slot 9
   42 (slot 10, home 9): d(9,9) = 0 &lt; d(9,10) = 1    → move to 9; hole 10
   11 (slot 0, home 0):  d(0,10) = 10 ≥ d(0,0) = 0  → stays
   53 (slot 1, home 9):  d(9,10) = 1 &lt; d(9,1) = 3    → move to 10; hole 1
   slot 2 empty: done   [ 11 _ _ _ _ _ _ _ _ 42 53 ]"></div>

--

## The slot-number trap

Move a key when $r \le i$, **by slot number**:

<div><img src="../../topics/figures/hashing/hs-lp-shift-naive.svg" style="height:350px" alt="
   delete 31, move when home ≤ hole:
   42 (home 9 ≤ 9) → slot 9;  11 (home 0 ≤ 10) → slot 10  ✗
   [ _ 53 _ _ _ _ _ _ _ 42 11 ]
   search 11: h(11) = 0 is empty → not found ✗   (11 is in slot 10)
   search 53: 42, 11, then empty slot 0 → not found ✗   (53 is in slot 1)"></div>

--

## Your turn

$M = 7$, $h(k) = k \bmod 7$:

<div><img src="../../topics/figures/hashing/hs-lp-shift-practice.svg" style="height:90px" alt="
   M = 7: [ 20 7 27 _ _ _ 13 ]   delete 13 by shifting?
            0  1  2 3 4 5  6"></div>

**Delete 13 by shifting:** which keys move? What does $r \le i$ get wrong?

<details class="answer"><summary>Answer:</summary>

All three: 20 to slot 6 ($0 < 1$), 7 to 0 ($0 < 1$), 27 to 1 ($d(6, 1) = 2 < d(6, 2) = 3$). With $r \le i$, 27 stays ($6 \le 1$ is false), behind the hole at 1: lost.

</details>

