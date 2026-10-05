// CSS 343 · Machine-model simulator: the model, shared by machine-model.html
// and by the script that computes the numbers in the textbook chapter
// "Algorithms on Real Machines" (textbook/foundations/foundation-machine-models.html).
//
// A machine is a list of memory levels, fastest first. Each level has a
// capacity in bytes (the last is unbounded), the time to serve one read from
// it, and the size of the block it hands to the level above on a miss (64-byte
// cache lines between caches and main memory, 4096-byte pages from a disk).
//
// The model is ANALYTICAL, not a cycle-by-cycle simulation: every algorithm is
// described by how many memory accesses it makes and by the pattern of those
// accesses over a working set of W bytes, and the expected cost of one access
// is computed from W.
//   - Sequential scan of W bytes held at level k (the first level W fits in):
//     each block is fetched once from level k and then read element by element
//     from the top level, so one access costs lat0 + lat_k * (elem / block_k).
//   - Uniformly random accesses over W bytes: in steady state the level of
//     capacity C holds a fraction min(1, C / W) of the working set, so an access
//     is first found at level k with probability F_k - F_(k-1), where
//     F_k = min(1, C_k / W). This is exact for random replacement and close to
//     LRU (least recently used) for uniform random access.
// An exact LRU simulation of N^2 accesses is impossible at the sizes where the
// interesting effects happen (N past 10^9), and this model reproduces their
// shape: a cost per access that is constant while W fits a level, and steps up
// when W outgrows it.

export const KiB = 1024, MiB = 1024 * KiB, GiB = 1024 * MiB, TiB = 1024 * GiB;

export const MACHINES = {
  ram: {
    name: "RAM model (every access costs 1)", unit: "steps",
    levels: [{ name: "memory", cap: Infinity, lat: 1, block: 4 }],
  },
  laptop: {
    name: "Typical laptop: L1, L2, L3, main memory, SSD", unit: "ns",
    levels: [
      { name: "L1", cap: 32 * KiB, lat: 1.4, block: 64 },
      { name: "L2", cap: 256 * KiB, lat: 4, block: 64 },
      { name: "L3", cap: 16 * MiB, lat: 15, block: 64 },
      { name: "main memory", cap: 16 * GiB, lat: 100, block: 64 },
      { name: "SSD", cap: Infinity, lat: 50000, block: 4096 },
    ],
  },
  slowmem: {
    name: "Fast processor, every memory read a million cycles", unit: "cycles",
    levels: [{ name: "memory", cap: Infinity, lat: 1e6, block: 4 }],
  },
  swap: {
    name: "Small memory (64 MiB), swaps to a hard disk", unit: "ns",
    levels: [
      { name: "L1", cap: 32 * KiB, lat: 1.4, block: 64 },
      { name: "L3", cap: 4 * MiB, lat: 15, block: 64 },
      { name: "main memory", cap: 64 * MiB, lat: 100, block: 64 },
      { name: "disk", cap: Infinity, lat: 5e6, block: 4096 },
    ],
  },
};

/** index of the first level whose capacity holds W bytes */
export function levelOf(m, W) {
  const L = m.levels;
  for (let k = 0; k < L.length; k++) if (W <= L[k].cap) return k;
  return L.length - 1;
}
/** cost of one access in a sequential scan of W bytes of `elem`-byte items */
export function seqCost(m, W, elem) {
  const L = m.levels, k = levelOf(m, W);
  if (k === 0) return L[0].lat;
  return L[0].lat + L[k].lat * Math.min(1, elem / L[k].block);
}
/** expected cost of one uniformly random access over W bytes */
export function randCost(m, W) {
  const L = m.levels;
  let prev = 0, cost = 0;
  for (let k = 0; k < L.length; k++) {
    const F = k === L.length - 1 ? 1 : Math.min(1, L[k].cap / W);
    cost += (F - prev) * L[k].lat;
    prev = F;
    if (F >= 1) break;
  }
  return cost;
}

const lg = Math.log2;

/** The algorithms: accesses(N), working set W(N) in bytes, and cost(m, N). */
export const ALGOS = {
  pairsSeq: {
    name: "N² all pairs, sequential (for i, for j: read a[j])", exp: 2, elem: 4,
    W: (N) => 4 * N, accesses: (N) => N * N,
    cost: (m, N) => N * N * seqCost(m, 4 * N, 4),
  },
  pairsRand: {
    name: "N² all pairs, random order (each read a random a[j])", exp: 2, elem: 4,
    W: (N) => 4 * N, accesses: (N) => N * N,
    cost: (m, N) => N * N * randCost(m, 4 * N),
  },
  lookups: {
    name: "N random lookups in a table of N items (a hash table)", exp: 1, elem: 8,
    W: (N) => 8 * N, accesses: (N) => N,
    cost: (m, N) => N * randCost(m, 8 * N),
  },
  merge: {
    name: "N lg N: lg N merge passes over two arrays", exp: 1, elem: 4,
    W: (N) => 8 * N, accesses: (N) => 2 * N * Math.ceil(lg(N)),
    cost: (m, N) => 2 * N * Math.ceil(lg(N)) * seqCost(m, 8 * N, 4),
  },
  mmNaive: {
    name: "N³ matrix multiply, naive i-j-k (doubles)", exp: 3, elem: 8,
    W: (N) => 24 * N * N, accesses: (N) => 2 * N * N * N,
    cost: (m, N) => {
      // A[i][k] walks one row (8N bytes, reused for every j); B[k][j] walks a
      // column: every read is in a new block, and the next column reuses those
      // blocks only if all N of them stay resident.
      const a = seqCost(m, 8 * N, 8);
      const L = m.levels;
      if (L.length === 1) return 2 * N * N * N * L[0].lat;
      const kAll = levelOf(m, 8 * N * N);
      const kCol = levelOf(m, N * L[Math.max(1, kAll)].block);
      const b = L[kCol].lat + Math.min(1, 8 / L[kAll].block) * L[kAll].lat;
      return N * N * N * (a + b);
    },
  },
  mmBlocked: {
    name: "N³ matrix multiply, blocked (tiles fit the last cache)", exp: 3, elem: 8,
    W: (N) => 24 * N * N, accesses: (N) => 2 * N * N * N,
    cost: (m, N) => {
      const L = m.levels;
      if (L.length === 1) return 2 * N * N * N * L[0].lat;
      // tile level: the largest level above main memory (or the only cache)
      const ram = L.findIndex((l) => /memory/i.test(l.name));
      const t = ram > 0 ? ram - 1 : 0;
      const T = Math.max(1, Math.min(N, Math.floor(Math.sqrt(L[t].cap / 24))));
      const kAll = levelOf(m, 24 * N * N);
      if (kAll <= t) return 2 * N * N * N * L[kAll].lat;
      return 2 * N * N * N * L[t].lat + (2 * N * N * N / T) * Math.min(1, 8 / L[kAll].block) * L[kAll].lat;
    },
  },
};

/** doubling table: rows {N, W, T, ratio, b, level} for N = N0, 2 N0, ... while W <= maxW */
export function table(m, algoKey, N0 = 16, maxW = 128 * GiB) {
  const a = ALGOS[algoKey], rows = [];
  for (let N = N0; a.W(N) <= maxW; N *= 2) {
    const T = a.cost(m, N), prev = rows[rows.length - 1];
    const ratio = prev ? T / prev.T : null;
    rows.push({ N, W: a.W(N), T, ratio, b: ratio ? lg(ratio) : null, level: m.levels[levelOf(m, a.W(N))].name });
  }
  return rows;
}

/** human-readable amount of time (ns input) */
export function human(ns) {
  const u = [[365.25 * 86400e9, "years"], [86400e9, "days"], [3600e9, "h"], [60e9, "min"], [1e9, "s"], [1e6, "ms"], [1e3, "µs"]];
  for (const [d, n] of u) if (ns >= d) return `${(ns / d).toPrecision(3)} ${n}`;
  return `${ns.toPrecision(3)} ns`;
}
export function bytes(b) {
  if (b >= TiB) return `${+(b / TiB).toPrecision(3)} TiB`;
  if (b >= GiB) return `${+(b / GiB).toPrecision(3)} GiB`;
  if (b >= MiB) return `${+(b / MiB).toPrecision(3)} MiB`;
  if (b >= KiB) return `${+(b / KiB).toPrecision(3)} KiB`;
  return `${b} B`;
}
