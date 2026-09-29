// CSS 343 unified library — core/render-config.js
// Settable render/zoom limits shared by every scalable renderer. The DEFAULT
// view always autofits — the whole structure stays on-canvas however big it
// grows, so students watch the global shape change during a run (even when
// individual values become too small to read). To read values, the user zooms
// in (see core/viewport.js): + / − buttons, wheel (anchored at the pointer),
// and drag / scrollbars to pan. Tweak per page/demo before building:
//   import { RENDER_LIMITS } from "../../lib/index.js";
//   RENDER_LIMITS.zoomMax = 20;
export const RENDER_LIMITS = {
  zoomMax: 10,        // deepest zoom-in the controls allow (1 = autofit)
  zoomWheelStep: 1.15, // per wheel tick
  zoomButtonStep: 1.5, // per +/− click
};

// Grow (or restore) a renderer's canvas so content at the current zoom fits.
// At zoom 1 the canvas keeps its construction size (pure autofit, no
// scrollbars). Zoomed in, the bitmap AND the on-screen width grow
// proportionally (an inline % width), so the scroller shows scrollbars
// instead of the browser squashing it back down. When a mid-animation redraw
// changes the canvas size, the scroll position is adjusted to keep the
// viewport centered on the same content fraction — no jumping.
export function sizeCanvas(rend, needW, needH) {
  const cv = rend.canvas;
  rend.baseW ??= cv.width; rend.baseH ??= cv.height;
  const w = Math.max(rend.baseW, Math.ceil(needW));   // DESIGN units — what renderers draw in
  const h = Math.max(rend.baseH, Math.ceil(needH));
  const grew = rend.W !== w || rend.H !== h;

  const wrap = cv.parentElement;
  let fx = null, fy = null;
  if (grew && wrap && wrap.scrollWidth > wrap.clientWidth + 1)
    fx = (wrap.scrollLeft + wrap.clientWidth / 2) / wrap.scrollWidth;
  if (grew && wrap && wrap.scrollHeight > wrap.clientHeight + 1)
    fy = (wrap.scrollTop + wrap.clientHeight / 2) / wrap.scrollHeight;

  if (grew) cv.style.width = w > rend.baseW ? (100 * w / rend.baseW).toFixed(2) + "%" : "";

  // The BITMAP is sized to what the canvas is actually DISPLAYED at, times the
  // device pixel ratio: `.u-canvas-wrap canvas { width: 100% }` stretches every
  // canvas to its container, so a 560-unit bitmap shown across 770 CSS px on a
  // 2x screen was upscaled 2.75x and looked soft — worst on the LCS table,
  // whose content is small text in cells. Renderers are untouched: the context
  // carries the scale, so they keep drawing in design units.
  // An OFFSCREEN caller (the exam illustration harness in canvas_qti.py) draws
  // into a detached canvas, where getBoundingClientRect() is 0 and headless
  // devicePixelRatio is 1 -- so the measurement below would collapse S to 1 and,
  // because setTransform REPLACES rather than composes, silently undo the 2x
  // the caller set for crisp text. Such a caller pins rend.fixedScale instead.
  const dpr = Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const shown = cv.getBoundingClientRect ? cv.getBoundingClientRect().width : 0;
  const S = rend.fixedScale ?? Math.max(1, ((shown || w) / w) * dpr);
  const pw = Math.round(w * S), ph = Math.round(h * S);
  if (cv.width !== pw) cv.width = pw;                 // NB: writing either resets
  if (cv.height !== ph) cv.height = ph;               // the context transform
  rend.scale = S;                                     // design -> bitmap (hit-testing)
  rend.ctx.setTransform(S, 0, 0, S, 0, 0);            // so re-apply it every time
  rend.W = w; rend.H = h;

  if (fx != null) wrap.scrollLeft = fx * wrap.scrollWidth - wrap.clientWidth / 2;
  if (fy != null) wrap.scrollTop = fy * wrap.scrollHeight - wrap.clientHeight / 2;
}
