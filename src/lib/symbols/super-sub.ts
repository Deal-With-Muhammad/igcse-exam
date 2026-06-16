// Convert plain characters to their Unicode super/subscript equivalents.
// The exam editor stores plain text (no markup), and the PDF + student views
// render that text as-is, so real Unicode characters are the only thing that
// shows up correctly everywhere. Characters without a Unicode super/subscript
// form are left unchanged (best effort — same as the app's existing symbols).

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ",
  i: "ⁱ", j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ",
  r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  A: "ᴬ", B: "ᴮ", D: "ᴰ", E: "ᴱ", G: "ᴳ", H: "ᴴ", I: "ᴵ", J: "ᴶ",
  K: "ᴷ", L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ", P: "ᴾ", R: "ᴿ", T: "ᵀ",
  U: "ᵁ", V: "ⱽ", W: "ᵂ",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ",
  n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

// Reverse maps so an already-converted run can be toggled back to normal.
const FROM_SUPER: Record<string, string> = Object.fromEntries(
  Object.entries(SUPERSCRIPT).map(([k, v]) => [v, k]),
);
const FROM_SUB: Record<string, string> = Object.fromEntries(
  Object.entries(SUBSCRIPT).map(([k, v]) => [v, k]),
);

const mapWith = (s: string, table: Record<string, string>) =>
  Array.from(s).map((ch) => table[ch] ?? ch).join("");

export const toSuperscript = (s: string) => mapWith(s, SUPERSCRIPT);
export const toSubscript = (s: string) => mapWith(s, SUBSCRIPT);

/** True if every (non-space) char in the string is already superscript. */
const allIn = (s: string, table: Record<string, string>) => {
  const chars = Array.from(s).filter((c) => c.trim());
  return chars.length > 0 && chars.every((c) => table[c] !== undefined);
};

/**
 * Toggle a run of text to super/subscript. If it's already fully in that
 * form, convert it back to normal (Word-style toggle). Otherwise convert to
 * the target form.
 */
export function toggleScript(s: string, kind: "super" | "sub"): string {
  if (kind === "super") {
    return allIn(s, FROM_SUPER) ? mapWith(s, FROM_SUPER) : toSuperscript(s);
  }
  return allIn(s, FROM_SUB) ? mapWith(s, FROM_SUB) : toSubscript(s);
}
