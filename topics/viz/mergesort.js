// CSS 343 · memory topic: mergesort visualizer, full divide & conquer + memory.
//  • recursion-stack brackets above the array show the DIVIDE phase and depth (O(log N))
//  • each MERGE interleaves the two runs cell-by-cell into a visible tmp buffer row
//  • the memory gauge tracks the scratch buffer (rises/falls, peaks at 4N → O(N))
// Driven by a fine-grained event trace; Play/Step/Reset + Speed.
(function () {
  const SLATE = '#334155', PURPLE = '#7c5cff', LPURPLE = '#a78bfa', DPURPLE = '#5b3ff0',
        AMBER = '#d39a00', GREY = '#cbd2e0', INK = '#2a2a3a', GREYT = '#94a3b8';
  const N = 32, ITEM = 4, MAXB = ITEM * N;           // 4N bytes = peak buffer
  const LOGN = Math.ceil(Math.log2(N));              // 5

  function init(root) {
    if (root._viz) return;
    const prog = root.querySelector('.viz-progress');
    const mem  = root.querySelector('.viz-memory');
    const status = root.querySelector('.viz-status');
    prog.width = 560; prog.height = 380;
    mem.width = 380;  mem.height = 380;
    const P = prog.getContext('2d'), M = mem.getContext('2d');

    let arr = [], events = [], idx = 0, timer = null;
    // display state
    let stack = [], cur = null, tmp = null, cmp = null, bufBytes = 0, peak = 0, bufHist = [];
    const speeds = [['0.5×', 120], ['1×', 55], ['2×', 24]]; let si = 1;

    function genEvents() {
      events = [];
      const sim = arr.slice();
      (function rec(lo, hi) {
        events.push({ t: 'push', lo, hi });
        if (lo < hi) {
          const mid = (lo + hi) >> 1;
          rec(lo, mid); rec(mid + 1, hi);
          events.push({ t: 'mergeStart', lo, mid, hi });
          let i = lo, j = mid + 1, k = 0; const buf = [];
          while (i <= mid && j <= hi) {
            events.push({ t: 'compare', i, j });
            if (sim[i] <= sim[j]) { events.push({ t: 'toTmp', k, val: sim[i] }); buf[k++] = sim[i++]; }
            else { events.push({ t: 'toTmp', k, val: sim[j] }); buf[k++] = sim[j++]; }
          }
          while (i <= mid) { events.push({ t: 'toTmp', k, val: sim[i] }); buf[k++] = sim[i++]; }
          while (j <= hi)  { events.push({ t: 'toTmp', k, val: sim[j] }); buf[k++] = sim[j++]; }
          events.push({ t: 'copyBack', lo, seg: buf.slice() });
          for (let x = 0; x < buf.length; x++) sim[lo + x] = buf[x];
          events.push({ t: 'mergeEnd' });
        }
        events.push({ t: 'pop' });
      })(0, N - 1);
    }

    function reset() {
      arr = Array.from({ length: N }, (_, i) => i + 1);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      genEvents();
      idx = 0; stack = []; cur = null; tmp = null; cmp = null; bufBytes = 0; peak = 0; bufHist = [0];
      stop(); draw();
    }

    function apply(e) {
      switch (e.t) {
        case 'push': stack.push({ lo: e.lo, hi: e.hi }); break;
        case 'pop': stack.pop(); break;
        case 'mergeStart': cur = { lo: e.lo, mid: e.mid, hi: e.hi }; tmp = { lo: e.lo, hi: e.hi, cells: new Array(e.hi - e.lo + 1).fill(null) }; bufBytes = (e.hi - e.lo + 1) * ITEM; cmp = null; break;
        case 'compare': cmp = { i: e.i, j: e.j }; break;
        case 'toTmp': tmp.cells[e.k] = e.val; cmp = null; break;
        case 'copyBack': for (let x = 0; x < e.seg.length; x++) arr[e.lo + x] = e.seg[x]; break;
        case 'mergeEnd': cur = null; tmp = null; bufBytes = 0; cmp = null; break;
      }
      peak = Math.max(peak, bufBytes);
      bufHist.push(bufBytes);
    }

    function doStep() {
      if (idx >= events.length) return;
      apply(events[idx++]);
      draw();
      if (idx >= events.length) stop();
    }
    function play() { if (timer) return; timer = setInterval(doStep, speeds[si][1]); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function draw() {
      const W = prog.width, H = prog.height, MW = mem.width, MH = mem.height;
      const pad = 18, bw = (W - 2 * pad) / N, xOf = i => pad + i * bw;
      const stackTop = 24, levelH = 8, barTop = stackTop + (LOGN + 1) * levelH + 6;
      const barBase = H - 56, maxBarH = barBase - barTop, tmpTop = barBase + 14, tmpH = 24;

      P.clearRect(0, 0, W, H);
      // label
      P.fillStyle = SLATE; P.font = '14px sans-serif';
      P.fillText(idx >= events.length ? 'sorted' : cur ? `merge a[${cur.lo}..${cur.hi}]  ·  recursion depth ${stack.length}` : `divide  ·  recursion depth ${stack.length}`, pad, 16);

      // recursion-stack brackets (the call stack / divide structure)
      for (let d = 0; d < stack.length; d++) {
        const f = stack[d], x1 = xOf(f.lo), x2 = xOf(f.hi + 1);
        P.fillStyle = d === stack.length - 1 ? PURPLE : GREY;
        P.fillRect(x1 + 0.5, stackTop + d * levelH, Math.max(2, x2 - x1 - 1), levelH - 2);
      }

      // array bars
      for (let i = 0; i < N; i++) {
        const h = (arr[i] / N) * maxBarH;
        let color = GREY;
        if (cur && i >= cur.lo && i <= cur.mid) color = LPURPLE;        // left run
        else if (cur && i > cur.mid && i <= cur.hi) color = PURPLE;     // right run
        if (cmp && (i === cmp.i || i === cmp.j)) color = AMBER;         // being compared
        P.fillStyle = color;
        P.fillRect(xOf(i) + 1, barBase - h, bw - 2, h);
      }
      if (cur) {                                                       // divider between the two runs
        const mx = xOf(cur.mid + 1);
        P.strokeStyle = AMBER; P.setLineDash([3, 3]); P.lineWidth = 2;
        P.beginPath(); P.moveTo(mx, barTop); P.lineTo(mx, barBase + 1); P.stroke(); P.setLineDash([]);
      }

      // tmp buffer row (fills cell-by-cell during a merge)
      if (tmp) {
        P.fillStyle = GREYT; P.font = '12px sans-serif';
        P.fillText('tmp buffer (O(N) scratch): the merged result builds here', pad, tmpTop - 3);
        for (let k = 0; k < tmp.cells.length; k++) {
          const x = xOf(tmp.lo) + k * bw, v = tmp.cells[k];
          P.fillStyle = '#f1f0fb'; P.fillRect(x + 1, tmpTop + 2, bw - 2, tmpH);
          if (v != null) { const h = (v / N) * tmpH; P.fillStyle = DPURPLE; P.fillRect(x + 1, tmpTop + 2 + (tmpH - h), bw - 2, h); }
        }
      }

      // ---- memory panel ----
      M.clearRect(0, 0, MW, MH);
      const top = 34, bot = MH - 92, fullH = bot - top, barX = 34, barW = 84;
      const yOf = b => bot - (b / MAXB) * fullH;
      M.strokeStyle = GREY; M.setLineDash([4, 4]); M.lineWidth = 1;
      M.beginPath(); M.moveTo(barX, top); M.lineTo(MW - 18, top); M.stroke(); M.setLineDash([]);
      M.fillStyle = GREYT; M.font = '13px sans-serif'; M.fillText(`4N = ${MAXB} B`, barX, top - 8);
      M.fillStyle = PURPLE; M.fillRect(barX, yOf(bufBytes), barW, bot - yOf(bufBytes));
      M.fillStyle = SLATE; M.font = '12px sans-serif'; M.fillText(`buffer (${bufBytes} B)`, barX, bot + 18);
      M.strokeStyle = AMBER; M.lineWidth = 2; M.beginPath(); M.moveTo(barX, yOf(peak)); M.lineTo(barX + barW + 10, yOf(peak)); M.stroke();
      M.fillStyle = AMBER; M.font = 'bold 13px sans-serif'; M.fillText(`peak ${peak}`, barX + barW + 14, yOf(peak) + 4);
      // sparkline (buffer bytes over time)
      const sx = barX + barW + 96, sw = MW - sx - 16;
      M.strokeStyle = '#e6e9f0'; M.strokeRect(sx, top, sw, fullH);
      M.fillStyle = GREYT; M.font = '12px sans-serif'; M.fillText('buffer over time', sx, top - 8);
      M.strokeStyle = PURPLE; M.lineWidth = 2; M.beginPath();
      for (let k = 0; k < bufHist.length; k++) { const x = sx + (k / Math.max(1, events.length)) * sw, y = bot - (bufHist[k] / MAXB) * fullH; k ? M.lineTo(x, y) : M.moveTo(x, y); }
      M.stroke();
      // recursion-depth readout (the O(log N) stack)
      M.fillStyle = SLATE; M.font = 'bold 14px sans-serif'; M.fillText(`recursion depth: ${stack.length}`, barX, bot + 50);
      M.fillStyle = GREYT; M.font = '12px sans-serif'; M.fillText(`(≤ log₂N = ${LOGN} frames → the O(log N) stack)`, barX, bot + 70);

      // ---- status ----
      if (idx >= events.length) status.innerHTML = `Sorted. Peak buffer = <b>${peak} B = 4N</b> → <b>O(N)</b> space; recursion was ≤ <b>${LOGN}</b> deep → <b>O(log N)</b> stack.`;
      else if (cur) status.innerHTML = `Merging a[${cur.lo}..${cur.hi}] (size ${cur.hi - cur.lo + 1}: interleaving the two runs into the buffer = <b>${bufBytes} B</b>. peak so far ${peak} B.`;
      else status.innerHTML = `Dividing: recursing down; the call stack is <b>${stack.length}</b> deep (the O(log N) memory). Buffers are allocated on the way back up.`;
    }

    // controls (+ inject a Speed button)
    root.querySelector('[data-act=play]').onclick  = () => (timer ? stop() : play());
    root.querySelector('[data-act=step]').onclick  = () => { stop(); doStep(); };
    root.querySelector('[data-act=reset]').onclick = reset;
    const ctrls = root.querySelector('.viz-controls');
    const sb = document.createElement('button');
    sb.textContent = 'Speed ' + speeds[si][0];
    sb.onclick = () => { si = (si + 1) % speeds.length; sb.textContent = 'Speed ' + speeds[si][0]; if (timer) { stop(); play(); } };
    ctrls.insertBefore(sb, root.querySelector('.viz-status'));

    reset();
    root._viz = { doStep, play, reset, runToEnd: () => { while (idx < events.length) apply(events[idx++]); draw(); } };
  }

  window.initVizMergesort = () =>
    document.querySelectorAll('.legacy-viz[data-viz=mergesort-memory]').forEach(init);
})();
