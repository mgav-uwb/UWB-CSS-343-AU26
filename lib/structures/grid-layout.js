// CSS 343 unified library: structures/grid-layout.js
// A graph whose vertices are 0..k²−1 and whose every edge joins row-neighbours
// (u, u+1 in one row) or column-neighbours (u, u+k) IS a k×k grid: draw it as
// one, not on a ring (where a grid's edges cross everywhere). Returns null when
// the edge list is not a grid, so callers fall back to their ring layout.
export function gridNodes(maxId, edges) {
  const n = maxId + 1, k = Math.round(Math.sqrt(n));
  if (k < 3 || k * k !== n || !edges.length) return null;
  const ok = edges.every(({ u, v }) => {
    const d = Math.abs(u - v);
    return (d === 1 && Math.floor(u / k) === Math.floor(v / k)) || d === k;
  });
  if (!ok) return null;
  return Array.from({ length: n }, (_, id) => ({
    id, x: 0.12 + 0.76 * ((id % k) / (k - 1)), y: 0.1 + 0.8 * (Math.floor(id / k) / (k - 1)),
  }));
}
