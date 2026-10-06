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

/** Historic and current machines, oldest first. Every machine is in ns, so the
 *  same algorithm can be compared across them. The numbers are rounded from
 *  published specifications (clock, memory cycle, cache sizes, disk access
 *  time) and from typical measured latencies for current machines; they are
 *  approximations meant to show the shape of each hierarchy, not benchmarks.
 *  Capacities are in bytes even for word machines (4096 18-bit words = 9216 B). */
export const HISTORIC = {
  pdp1: {
    name: "DEC PDP-1 (1959)", year: 1959, unit: "ns",
    spec: "18-bit words, 4,096 words of core memory (5 µs cycle), no cache; programs that outgrow core page by hand to a magnetic drum",
    levels: [
      { name: "core memory", cap: 9216, lat: 5000, block: 3 },
      { name: "magnetic drum", cap: Infinity, lat: 8.5e6, block: 4608 },
    ],
  },
  cdc6600: {
    name: "CDC 6600 (1964), Lawrence Livermore and others", year: 1964, unit: "ns",
    spec: "Seymour Cray's design, 10 MHz, 128K 60-bit words of core memory (1 µs cycle, 32 banks), no cache; disk for anything larger",
    levels: [
      { name: "core memory", cap: 983040, lat: 1000, block: 8 },
      { name: "disk", cap: Infinity, lat: 1e8, block: 4096 },
    ],
  },
  ibm360: {
    name: "IBM System/360 Model 65 (1965)", year: 1965, unit: "ns",
    spec: "512 KiB of core memory (750 ns cycle), no cache, no virtual memory; IBM 2314 disks, about 75 ms per random access",
    levels: [
      { name: "core memory", cap: 512 * KiB, lat: 750, block: 8 },
      { name: "disk", cap: Infinity, lat: 7.5e7, block: 4096 },
    ],
  },
  pdp11: {
    name: "DEC PDP-11/70 (1975), the Unix machine", year: 1975, unit: "ns",
    spec: "16-bit, 2 KiB cache (about 300 ns), 1 MiB of main memory (about 1.2 µs), RP06 disk (about 36 ms seek plus rotation)",
    levels: [
      { name: "cache", cap: 2 * KiB, lat: 300, block: 4 },
      { name: "main memory", cap: 1 * MiB, lat: 1200, block: 4 },
      { name: "disk", cap: Infinity, lat: 3.6e7, block: 512 },
    ],
  },
  apple1: {
    name: "Apple I (1976)", year: 1976, unit: "ns",
    spec: "MOS 6502 at 1 MHz, 4 KiB of RAM (1 µs per access), no cache; the only larger storage is a cassette tape, seconds away",
    levels: [
      { name: "main memory", cap: 4 * KiB, lat: 1000, block: 1 },
      { name: "cassette tape", cap: Infinity, lat: 1e10, block: 256 },
    ],
  },
  cray1: {
    name: "Cray-1 (1976)", year: 1976, unit: "ns",
    spec: "80 MHz (12.5 ns clock); 4 KiB of vector registers filled 64 words at a time; 8 MiB of main memory (about 150 ns); no cache, no virtual memory",
    levels: [
      { name: "vector registers", cap: 4 * KiB, lat: 12.5, block: 8 },
      { name: "main memory", cap: 8 * MiB, lat: 150, block: 512 },
      { name: "disk", cap: Infinity, lat: 3e7, block: 4096 },
    ],
  },
  vax780: {
    name: "DEC VAX-11/780 (1977)", year: 1977, unit: "ns",
    spec: "32-bit, 5 MHz (200 ns cycle), 8 KiB cache, 4 MiB of main memory (about 1.2 µs), virtual memory with 512-byte pages on disk (about 30 ms)",
    levels: [
      { name: "cache", cap: 8 * KiB, lat: 200, block: 8 },
      { name: "main memory", cap: 4 * MiB, lat: 1200, block: 8 },
      { name: "disk (paging)", cap: Infinity, lat: 3e7, block: 512 },
    ],
  },
  ibmxt: {
    name: "IBM PC XT (1983)", year: 1983, unit: "ns",
    spec: "Intel 8088 at 4.77 MHz (838 ns per memory cycle), 640 KiB of RAM, no cache; 10 MB hard disk, about 85 ms per access",
    levels: [
      { name: "main memory", cap: 640 * KiB, lat: 838, block: 1 },
      { name: "hard disk", cap: Infinity, lat: 8.5e7, block: 512 },
    ],
  },
  ibmat: {
    name: "IBM PC AT (1984)", year: 1984, unit: "ns",
    spec: "Intel 80286 at 6 MHz (500 ns per memory cycle), 512 KiB of RAM, no cache; 20 MB hard disk, about 40 ms per access",
    levels: [
      { name: "main memory", cap: 512 * KiB, lat: 500, block: 2 },
      { name: "hard disk", cap: Infinity, lat: 4e7, block: 512 },
    ],
  },
  onyx: {
    name: "SGI Onyx (1993)", year: 1993, unit: "ns",
    spec: "MIPS R4400 at 150 MHz, 16 KiB L1, 1 MiB L2, 512 MiB of shared main memory over the system bus (about 1 µs), SCSI disk (about 12 ms)",
    levels: [
      { name: "L1", cap: 16 * KiB, lat: 6.7, block: 32 },
      { name: "L2", cap: 1 * MiB, lat: 70, block: 128 },
      { name: "main memory", cap: 512 * MiB, lat: 1000, block: 128 },
      { name: "disk", cap: Infinity, lat: 1.2e7, block: 4096 },
    ],
  },
  rpi5: {
    name: "Raspberry Pi 5 (2023)", year: 2023, unit: "ns",
    spec: "Arm Cortex-A76 at 2.4 GHz, 64 KiB L1, 512 KiB L2, 2 MiB L3, 8 GiB LPDDR4X (about 110 ns), microSD card (about 0.4 ms per random read)",
    levels: [
      { name: "L1", cap: 64 * KiB, lat: 1.7, block: 64 },
      { name: "L2", cap: 512 * KiB, lat: 5, block: 64 },
      { name: "L3", cap: 2 * MiB, lat: 20, block: 64 },
      { name: "main memory", cap: 8 * GiB, lat: 110, block: 64 },
      { name: "microSD", cap: Infinity, lat: 4e5, block: 4096 },
    ],
  },
  workstation: {
    name: "Workstation (2024): 64-core x86, 256 GiB", year: 2024, unit: "ns",
    spec: "AMD Threadripper class: 32 KiB L1, 1 MiB L2, 32 MiB L3 per core complex, 256 GiB DDR5 (about 90 ns), NVMe SSD (about 30 µs)",
    levels: [
      { name: "L1", cap: 32 * KiB, lat: 1, block: 64 },
      { name: "L2", cap: 1 * MiB, lat: 3, block: 64 },
      { name: "L3", cap: 32 * MiB, lat: 11, block: 64 },
      { name: "main memory", cap: 256 * GiB, lat: 90, block: 64 },
      { name: "SSD", cap: Infinity, lat: 3e4, block: 4096 },
    ],
  },
  macbook: {
    name: "MacBook Pro (2024), Apple M4 Pro", year: 2024, unit: "ns",
    spec: "128 KiB L1 per performance core, 16 MiB shared L2, 48 GiB unified memory (about 110 ns), SSD (about 30 µs)",
    levels: [
      { name: "L1", cap: 128 * KiB, lat: 0.8, block: 128 },
      { name: "L2", cap: 16 * MiB, lat: 4.5, block: 128 },
      { name: "main memory", cap: 48 * GiB, lat: 110, block: 128 },
      { name: "SSD", cap: Infinity, lat: 3e4, block: 16384 },
    ],
  },
  elcap: {
    name: "El Capitan node (2024), Lawrence Livermore", year: 2024, unit: "ns",
    spec: "one AMD MI300A APU of the world's fastest supercomputer (2024): Zen 4 cores with 32 KiB L1, 1 MiB L2, 32 MiB L3, 128 GiB HBM3 (about 250 ns); beyond that the parallel file system (about 1 ms)",
    levels: [
      { name: "L1", cap: 32 * KiB, lat: 1.1, block: 64 },
      { name: "L2", cap: 1 * MiB, lat: 3.5, block: 64 },
      { name: "L3", cap: 32 * MiB, lat: 12, block: 64 },
      { name: "HBM3 main memory", cap: 128 * GiB, lat: 250, block: 64 },
      { name: "parallel file system", cap: Infinity, lat: 1e6, block: MiB },
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
    name: "N log₂ N: log₂ N merge passes over two arrays", exp: 1, elem: 4,
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
