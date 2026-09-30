// CSS 343 · memory topic: maze BFS visualizer, pathfinding (progress) + memory.
// FIXED geometry (deterministic seed → same maze every time). Start and goal are
// on the BOUNDARY, in opposite corners (top-left entrance, bottom-right exit).
// A lightly braided maze (a few loops) chosen so the goal is far: BFS explores
// almost the whole maze, then STOPS at the goal (first arrival = shortest path).
// Memory: the visited array is the full n² (light bar) filling with marked cells
// (purple); the queue (amber) is just the corridor frontier.
(function () {
  const SLATE = '#334155', PURPLE = '#7c5cff', AMBER = '#d39a00', GREEN = '#16a34a',
        WALL = '#3b4252', OPEN = '#eef0f6', INK = '#2a2a3a', RED = '#e2483d';
  const n = 25, CELLS = n * n;                 // odd n → clean maze; bigger board
  const SEED = 386;                            // FIXED geometry (chosen so the corner goal is far: ~122 steps, ~8 cells left unexplored)
  const BRAID = 0.22;                          // light braiding → a few loops, corners stay far
  const START = [0, 1], GOAL = [n - 1, n - 2]; // boundary cells: top-left / bottom-right corners
  const CARVE0 = [1, 1];                        // carve from the corner room

  function mulberry32(a) {                      // deterministic PRNG → fixed maze
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function carve(maze, rand, r, c) {           // recursive backtracker → perfect maze
    maze[r][c] = 0;
    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
    for (let i = dirs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [dirs[i], dirs[j]] = [dirs[j], dirs[i]]; }
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < n && nc > 0 && nc < n && maze[nr][nc] === 1) { maze[r + dr / 2][c + dc / 2] = 0; carve(maze, rand, nr, nc); }
    }
  }
  function braid(maze, rand) {                  // remove a few dead-ends → loops
    const D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let r = 1; r < n; r += 2) for (let c = 1; c < n; c += 2) {
      const open = D.filter(([dr, dc]) => maze[r + dr] && maze[r + dr][c + dc] === 0);
      if (open.length === 1 && rand() < BRAID) {
        const closed = D.filter(([dr, dc]) => { const rr = r + 2 * dr, cc = c + 2 * dc; return rr > 0 && rr < n && cc > 0 && cc < n && maze[r + dr][c + dc] === 1; });
        if (closed.length) { const [dr, dc] = closed[Math.floor(rand() * closed.length)]; maze[r + dr][c + dc] = 0; }
      }
    }
  }
  function buildMaze(seed) {
    const rand = mulberry32(seed);
    const maze = Array.from({ length: n }, () => Array(n).fill(1));
    carve(maze, rand, CARVE0[0], CARVE0[1]); braid(maze, rand);
    maze[START[0]][START[1]] = 0; maze[GOAL[0]][GOAL[1]] = 0;   // open the boundary corners
    return maze;
  }
  function bfsDist(maze) {
    const dist = Array.from({ length: n }, () => Array(n).fill(-1));
    dist[START[0]][START[1]] = 0; let q = [START]; const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
    while (q.length) { const nq = []; for (const [r, c] of q) for (let k = 0; k < 4; k++) { const nr = r + dr[k], nc = c + dc[k]; if (nr >= 0 && nr < n && nc >= 0 && nc < n && maze[nr][nc] === 0 && dist[nr][nc] < 0) { dist[nr][nc] = dist[r][c] + 1; nq.push([nr, nc]); } } q = nq; }
    return dist;
  }
  // seed-search hook: how much does BFS explore before reaching the corner goal?
  window.__bfsTest = function (seed) {
    const maze = buildMaze(seed), dist = bfsDist(maze), gd = dist[GOAL[0]][GOAL[1]];
    let open = 0, unvis = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (maze[r][c] === 0) { open++; if (dist[r][c] > gd || dist[r][c] < 0) unvis++; }
    return { seed, goalDist: gd, open, unvisited: unvis, exploredPct: Math.round(100 * (open - unvis) / open) };
  };

  function init(root) {
    if (root._viz) return;
    const prog = root.querySelector('.viz-progress');
    const mem  = root.querySelector('.viz-memory');
    const status = root.querySelector('.viz-status');
    const cs = 14, pad = 8;
    prog.width = n * cs + 2 * pad; prog.height = n * cs + 2 * pad;
    mem.width = 380; mem.height = prog.height;
    const P = prog.getContext('2d'), M = mem.getContext('2d');

    let maze, visited, parent, frontier, visitedCount, peakQ, qHist, vHist, pathSet, done, timer = null;

    function reset() {
      maze = buildMaze(SEED);                  // FIXED maze every time
      visited = Array.from({ length: n }, () => Array(n).fill(false));
      parent  = Array.from({ length: n }, () => Array(n).fill(null));
      visited[START[0]][START[1]] = true;
      frontier = [START]; visitedCount = 1; peakQ = 1;
      qHist = [1]; vHist = [1]; pathSet = null; done = false;
      stop(); draw();
    }

    function buildPath() {
      pathSet = new Set();
      let cur = GOAL;
      if (!visited[GOAL[0]][GOAL[1]]) return;
      while (cur) { pathSet.add(cur[0] * n + cur[1]); cur = parent[cur[0]][cur[1]]; }
    }

    function doStep() {
      if (done) return;
      const next = [], dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
      for (const [r, c] of frontier)
        for (let d = 0; d < 4; d++) {
          const nr = r + dr[d], nc = c + dc[d];
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && maze[nr][nc] === 0 && !visited[nr][nc]) {
            visited[nr][nc] = true; parent[nr][nc] = [r, c]; next.push([nr, nc]);
          }
        }
      frontier = next; visitedCount += next.length;
      peakQ = Math.max(peakQ, frontier.length);
      qHist.push(frontier.length); vHist.push(visitedCount);
      if (visited[GOAL[0]][GOAL[1]] || frontier.length === 0) { done = true; buildPath(); stop(); }
      draw();
    }

    function play() { if (timer) return; timer = setInterval(doStep, 130); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function draw() {
      P.clearRect(0, 0, prog.width, prog.height);
      const fset = new Set(frontier.map(([r, c]) => r * n + c));
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const x = pad + c * cs, y = pad + r * cs, key = r * n + c;
        let col;
        if (maze[r][c] === 1) col = WALL;
        else if (pathSet && pathSet.has(key)) col = GREEN;
        else if (fset.has(key)) col = AMBER;
        else if (visited[r][c]) col = PURPLE;
        else col = OPEN;
        P.fillStyle = col; P.fillRect(x, y, cs, cs);
      }
      const mark = (cell, color) => { P.strokeStyle = color; P.lineWidth = 3; P.strokeRect(pad + cell[1] * cs + 2, pad + cell[0] * cs + 2, cs - 4, cs - 4); };
      mark(START, '#2563eb'); mark(GOAL, RED);   // blue start (distinct from the green path), red goal

      M.clearRect(0, 0, 380, prog.height);
      const top = 34, bot = prog.height - 40, fullH = bot - top;
      const yOf = v => bot - (v / CELLS) * fullH;
      M.strokeStyle = '#cbd2e0'; M.setLineDash([4, 4]); M.lineWidth = 1;
      M.beginPath(); M.moveTo(20, top); M.lineTo(360, top); M.stroke(); M.setLineDash([]);
      M.fillStyle = '#94a3b8'; M.font = '12px sans-serif'; M.fillText(`n² = ${CELLS} (allocated)`, 20, top - 8);
      M.fillStyle = '#e7e3fb'; M.fillRect(40, top, 56, fullH);
      M.fillStyle = PURPLE; M.fillRect(40, yOf(visitedCount), 56, bot - yOf(visitedCount));
      M.fillStyle = INK; M.font = 'bold 13px sans-serif'; M.fillText(String(visitedCount), 40, yOf(visitedCount) - 6);
      M.fillStyle = SLATE; M.font = '12px sans-serif'; M.fillText('visited', 40, bot + 16);
      M.fillStyle = AMBER; M.fillRect(130, yOf(frontier.length), 56, bot - yOf(frontier.length));
      M.fillStyle = INK; M.font = 'bold 13px sans-serif'; M.fillText(String(frontier.length), 130, yOf(frontier.length) - 6);
      M.fillStyle = SLATE; M.font = '12px sans-serif'; M.fillText('queue', 130, bot + 16);
      const sx = 215, sw = 150;
      M.strokeStyle = '#e6e9f0'; M.strokeRect(sx, top, sw, fullH);
      M.fillStyle = '#94a3b8'; M.font = '11px sans-serif'; M.fillText('over time', sx, top - 8);
      const spark = (h, color) => {
        M.strokeStyle = color; M.lineWidth = 2; M.beginPath();
        for (let k = 0; k < h.length; k++) { const x = sx + (k / Math.max(1, qHist.length - 1)) * sw, y = bot - (h[k] / CELLS) * fullH; k ? M.lineTo(x, y) : M.moveTo(x, y); }
        M.stroke();
      };
      spark(vHist, PURPLE); spark(qHist, AMBER);

      if (done) {
        const plen = pathSet ? pathSet.size : 0;
        status.innerHTML = `Reached the goal: BFS <b>stops</b>. explored <b>${visitedCount}</b> cells (visited array is n²=${CELLS}) · shortest path = <b>${plen}</b> · queue peaked at <b>${peakQ}</b> (corridor). Only a few cells left unexplored.`;
      } else {
        status.innerHTML = `Expanding toward the goal · visited <b>${visitedCount}</b> · queue (frontier) <b>${frontier.length}</b> · peak queue ${peakQ}. The queue stays tiny; the visited array is n².`;
      }
    }

    root.querySelector('[data-act=play]').onclick  = () => (timer ? stop() : play());
    root.querySelector('[data-act=step]').onclick  = () => { stop(); doStep(); };
    root.querySelector('[data-act=reset]').onclick = reset;
    reset();
    root._viz = { doStep, play, reset };
  }

  window.initVizBfs = () =>
    document.querySelectorAll('.legacy-viz[data-viz=bfs-memory]').forEach(init);
})();
