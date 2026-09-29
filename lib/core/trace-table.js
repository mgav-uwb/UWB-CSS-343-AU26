// CSS 343 unified library — core/trace-table.js
// STATIC run tables for handouts and slides: one ROW per selected trace frame,
// with the step's narration and caller-defined columns read off the frame —
// the textbook "queue | dist | order" table for a BFS run, or "ready | in-deg
// | order" for Kahn, generated FROM THE ENGINE'S OWN TRACE so the numbers can
// never drift from what the interactive demo shows. The graph-shaped sibling
// of core/state-stack.js (whose vertical table-state stacks cover the
// array-shaped structures). Styles live in lib.css (.u-ttable).

/**
 * @param {HTMLElement} el
 * @param {{
 *   trace: any,                                  // a Trace (run the structure yourself)
 *   cols: Array<{ label: string, get: (frame:any) => (string|number) }>,
 *   pick?: (frame:any, i:number) => boolean,     // which frames become rows (default: all)
 *   action?: (frame:any) => string,              // row narration (default: frame.msg)
 * }} cfg
 */
export function renderTraceTable(el, cfg) {
  const pick = cfg.pick ?? (() => true);
  const action = cfg.action ?? ((f) => f.msg);
  const table = document.createElement("table");
  table.className = "u-ttable";

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["#", "action", ...cfg.cols.map((c) => c.label)].forEach((h) => {
    const th = document.createElement("th"); th.textContent = h; hr.appendChild(th);
  });
  thead.appendChild(hr); table.appendChild(thead);

  const tbody = document.createElement("tbody");
  let row = 0;
  cfg.trace.frames.forEach((f, i) => {
    if (!pick(f, i)) return;
    const tr = document.createElement("tr");
    const num = document.createElement("td"); num.className = "u-tt-num"; num.textContent = String(++row); tr.appendChild(num);
    const act = document.createElement("td"); act.className = "u-tt-act"; act.textContent = action(f); tr.appendChild(act);
    cfg.cols.forEach((c) => {
      const td = document.createElement("td"); td.textContent = String(c.get(f) ?? ""); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  el.appendChild(table);
}
