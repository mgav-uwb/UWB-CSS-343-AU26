<!--
  CSS 343 · Autumn 2026 · Lecture 19, closing: recap, this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap: tries

- one node per prefix; a key ends on a **word-marked** node, not necessarily a leaf
- search and insert: $\Theta(L)$, whatever the number of keys
- prefix queries: walk the prefix, then the subtree; the longest prefix in one walk
- $R$ links per node: a TST or a radix tree when memory matters

--

## Recap: substring search

| | idea | worst case |
| --- | --- | --- |
| brute force | every alignment, left to right | $\Theta(nm)$ |
| KMP | the longest border says where to resume; the text pointer never backs up | $\Theta(n + m)$ |
| Boyer-Moore | compare from the right; skip past characters the pattern lacks | $\Theta(nm)$, typically $n/m$ |

--

## This week

- **PA3**: due **Wed Dec 9, 11:59 PM**
- **Homework 10** (trie insert and longest prefix, KMP, Boyer-Moore, NFA simulation): due **Fri Dec 11, 11:59 PM**, no late tokens
- **Final exam**: Wed Dec 16, 1:15–3:15, in this room
