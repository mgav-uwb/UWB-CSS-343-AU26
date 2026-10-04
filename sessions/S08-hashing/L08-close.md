<!--
  CSS 343 · Autumn 2026 · Lecture 8, closing: recap and this week.
  Session logistics only.
-->

### Wrap

<small>(~3 min)</small>

--

## Recap

- a **hash function** turns a key into an index; collisions are unavoidable
- **separate chaining**: a list per slot; expected cost Θ(1 + α)
- **linear probing**: probe forward to an empty slot; deletion must keep probe paths intact
- **clustering** makes probing degrade; double hashing spreads the probes
- **resize** when α crosses a threshold: rehash every key into a table twice as large

--

## This week

- **Homework 5** goes out Wednesday, after the graphs lecture. **Due Sun Nov 1, 11:59 PM.**
- **PA1** is due **Wed Oct 28, 11:59 PM**; PA2 goes out the same day.
- **Quiz 5:** Monday Nov 2, on Lectures 8 and 9, plus questions on PA1

