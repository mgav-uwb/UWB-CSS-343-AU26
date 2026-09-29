// CSS 343 unified library — core/renderers/matrix.js
// ONE renderer for every 2-D grid-shaped structure (dynamic-programming
// tables: LCS, 0/1 knapsack, edit distance). Draws a snapshot = { rows, cols,
// cells: value[rows][cols], rowLabels?: string[], colLabels?: string[] } —
// a cell value of "" or null/undefined renders blank (not-yet-computed).
// Highlight sets are CELL COORDINATES [r,c]: 'from' (cells the recurrence
// reads, orange), 'active' (cell being computed, purple), 'done' (already-
// filled cells, neutral grey), 'path' (the traceback — the ANSWER — green).
// Precedence done < from <
// active < path — mirrors ArrayRenderer's done/compare/active/danger order,
// so the most "interesting" state always wins the paint.

import { sizeCanvas } from "../render-config.js";

const COLORS = {
  accent: "#7c5cff", green: "#0a7d4d", red: "#b3261e", edge: "#e8590c",
  ink: "#1a1c22", dim: "#9aa3b5", line: "#b9c0d0", faint: "#8a93a6",
};

const asPairSet = (v) => {
  const s = new Set();
  if (v == null) return s;
  for (const p of v) s.add(`${p[0]},${p[1]}`);
  return s;
};

export class MatrixRenderer {
  /** @param {HTMLCanvasElement} canvas @param {{cell?:number}} [opts] */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.cell = opts.cell ?? 42;
    this.zoom = 1; // 1 = autofit; viewport.js drives this (opts in via attachPanZoom)
    this.baseW = this.W; this.baseH = this.H;
  }

  /** @param {{rows:number, cols:number, cells:Array<Array<*>>, rowLabels?:string[], colLabels?:string[]}} snapshot
   *  @param {{active?:number[][], from?:number[][], path?:number[][], done?:number[][]}} [hl] */
  draw(snapshot, hl = {}) {
    this._last = [snapshot, hl]; // viewport.js redraws the current frame on zoom
    const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    const rows = snapshot?.rows ?? 0, cols = snapshot?.cols ?? 0;
    if (!rows || !cols) return;
    const cellsData = snapshot.cells || [];
    const rowLabels = snapshot.rowLabels, colLabels = snapshot.colLabels;
    const hasRowLabels = Array.isArray(rowLabels), hasColLabels = Array.isArray(colLabels);

    const fromSet = asPairSet(hl.from), activeSet = asPairSet(hl.active),
      doneSet = asPairSet(hl.done), pathSet = asPairSet(hl.path);

    const M = 10; // outer margin
    // the row-label gutter is sized to the LONGEST label (measured, not a
    // fixed sliver) so labels like "A w2/v3" neither clip nor leave a gulf
    // of dead space between themselves and the grid
    let headerW = 0;
    if (hasRowLabels) {
      ctx.font = "600 12px ui-monospace, Menlo, monospace";
      const maxLabelW = Math.max(0, ...rowLabels.map((l) => ctx.measureText(String(l ?? "")).width));
      headerW = Math.min(maxLabelW + 14, this.baseW * 0.35);
    }
    const headerH = hasColLabels ? Math.max(18, this.cell * 0.5) : 0;

    // autofit: shrink cells so the WHOLE grid always fits the base canvas —
    // the user's zoom magnifies back up (capped at natural cell size);
    // zoomed in, the canvas grows (grids grow BOTH ways) and the panel pans
    const baseAvailW = Math.max(4, this.baseW - 2 * M - headerW);
    const baseAvailH = Math.max(4, this.baseH - 2 * M - headerH);
    const cell0 = Math.max(2, Math.min(this.cell, baseAvailW / cols, baseAvailH / rows));
    const cell = Math.min(this.cell, cell0 * this.zoom);
    sizeCanvas(this, 2 * M + headerW + cell * cols, 2 * M + headerH + cell * rows);
    ctx.clearRect(0, 0, this.W, this.H);
    const availW = Math.max(4, this.W - 2 * M - headerW);
    const availH = Math.max(4, this.H - 2 * M - headerH);
    const totalW = cell * cols, totalH = cell * rows;
    const gridX = M + headerW + Math.max(0, (availW - totalW) / 2);
    const gridY = M + headerH + Math.max(0, (availH - totalH) / 2);

    // font sizes shrink for larger grids so labels never overrun a cell;
    // below legibility the text is dropped entirely (the fill pattern is the
    // lesson at that scale — zoom in to read values)
    const showText = cell >= 9;
    const valueFont = Math.min(15, cell * 0.42);
    const labelFont = Math.min(12, cell * 0.34);

    if (hasColLabels && showText) {
      ctx.fillStyle = COLORS.faint; ctx.font = `600 ${labelFont}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let c = 0; c < cols; c++) {
        ctx.fillText(String(colLabels[c] ?? ""), gridX + c * cell + cell / 2, M + headerH / 2);
      }
    }
    if (hasRowLabels && showText) {
      // right-aligned against the grid's left edge, so label and row read as one
      ctx.fillStyle = COLORS.faint; ctx.font = `600 ${labelFont}px ui-monospace, Menlo, monospace`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let r = 0; r < rows; r++) {
        ctx.fillText(String(rowLabels[r] ?? ""), gridX - 8, gridY + r * cell + cell / 2);
      }
    }

    const stateColors = (r, c) => {
      let fill = "#fff", ring = COLORS.dim, text = COLORS.ink, rw = 1.5;
      const key = `${r},${c}`;
      // COMPUTED is background state, so it is neutral; the TRACEBACK is the
      // answer the user asked for, so it takes the green. (These were the other
      // way round, which made the optimal solution red — an alarm colour — and
      // contradicted the tree demos, where the optimal chain is green.)
      if (doneSet.has(key)) { fill = "#f2f4f8"; ring = "#c8cfdc"; text = "#5b6478"; rw = 2; }
      if (fromSet.has(key)) { fill = "#fff5e9"; ring = COLORS.edge; text = "#9a4200"; rw = 2; }
      if (activeSet.has(key)) { fill = COLORS.accent; ring = COLORS.accent; text = "#fff"; rw = 2.5; }
      if (pathSet.has(key)) { fill = "#d6f5e3"; ring = COLORS.green; text = "#0a5c39"; rw = 3; }
      return { fill, ring, text, rw };
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gridX + c * cell, y = gridY + r * cell;
        const { fill, ring, text, rw } = stateColors(r, c);
        ctx.beginPath(); ctx.rect(x, y, cell, cell);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = rw; ctx.strokeStyle = ring; ctx.stroke();

        const v = cellsData[r] ? cellsData[r][c] : undefined;
        if (showText && v !== "" && v != null) {
          ctx.fillStyle = text; ctx.font = `600 ${valueFont}px system-ui, sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(v), x + cell / 2, y + cell / 2 + 0.5);
        }
      }
    }
  }

  /** Text alternative for a snapshot — the table read row by row (blank =
   *  not yet computed), so a screen-reader user can reconstruct the grid.
   *  Player.js puts this on the canvas's aria-label. */
  describe(snapshot) {
    const rows = snapshot?.rows ?? 0, cols = snapshot?.cols ?? 0;
    if (!rows || !cols) return "An empty table.";
    const fmt = (v) => (v == null || v === "" ? "blank" : String(v));
    const rl = snapshot.rowLabels, cl = snapshot.colLabels;
    const head = Array.isArray(cl) ? ` Column labels: ${cl.map(fmt).join(", ")}.` : "";
    const body = (snapshot.cells || []).map((row, r) =>
      `row ${Array.isArray(rl) ? fmt(rl[r]) : r}: ${(row || []).map(fmt).join(", ")}`);
    return `A table with ${rows} rows and ${cols} columns.${head} ${body.join("; ")}.`;
  }
}
