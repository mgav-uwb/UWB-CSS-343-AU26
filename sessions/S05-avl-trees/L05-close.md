<!--
  CSS 343 · Autumn 2026 · Lecture 5, closing: recap, Homework 3, PA1, Quiz 3.
  Session logistics only.
-->

### Wrap

<small>(~4 min)</small>

--

## Recap

- **AVL invariant**: at every node, subtree heights differ by at most 1
- **rotations** fix an imbalance in constant time and keep the BST order
- **insertion**: BST insert, then rebalance on the way up; one rotation (single or double) suffices
- **deletion**: BST delete, then rebalance; rotations may cascade up the path
- **height** at most about **1.44 log₂ n**, so every operation is Θ(log n) in the worst case

--

## This week

- **Homework 3**, <a href="../S04-trees-bst/hw03/HW03.html">HW03.html</a>. **Due Sun Oct 18, 11:59 PM.**
- **PA1**, <a href="../../assignments/PA1/PA1.html">PA1.html</a>: the AVL mode uses today's insertion. **Due Wed Oct 28.**
- **Quiz 3:** Monday Oct 19, on Lectures 4 and 5

