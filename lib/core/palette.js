// CSS 343 unified library — core/palette.js
// One colour per SYMBOL, shared by every view that has to say "this bit came
// from that character". The codec demo colours the source text, the bits it
// produced, the decoded text, and the leaf that emits it — all from here.
//
// The colours are doing ONE job: showing where a codeword starts and ends in
// an undelimited bit stream. That needs contrast between neighbours, not a
// unique hue per symbol — so this is a short, deliberately RECYCLED cycle of
// Google's brand colours rather than a generated ramp. A 26-letter alphabet
// reuses them; the input panel still says which character each run belongs to.

const CYCLE = [
  "#4285f4", // Google blue
  "#ea4335", // Google red
  "#f9ab00", // Google yellow 600 (readable on white; #fbbc05 is not)
  "#1e8e3e", // Google green 600
  "#a142f4", // purple
  "#12b5cb", // cyan
  "#fa7b17", // orange
  "#e52592", // pink
];

/** Ink colour for symbol index i (0-based, usually most-frequent-first).
 *  A negative index means "no symbol owns this yet" — a bit nobody has decoded,
 *  or a character the code was not built for — and reads as dim grey. */
export function symbolColor(i) {
  if (!Number.isFinite(i) || i < 0) return "#9aa3b5";
  return CYCLE[i % CYCLE.length];
}

/** How many colours before one repeats — a caller that wants ADJACENT runs to
 *  differ (rather than a stable per-symbol colour) can cycle on this. */
export const SYMBOL_COLORS = CYCLE.length;

/** The same colour, washed out — a background dark ink still reads on. */
export function symbolWash(i) {
  if (!Number.isFinite(i) || i < 0) return "#f2f4f8";
  return CYCLE[i % CYCLE.length] + "1f";   // ~12% alpha
}
