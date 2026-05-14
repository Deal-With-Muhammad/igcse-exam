export interface Symbol {
  char: string;
  name: string;
  category: SymbolCategory;
  aliases?: string[];
}

export type SymbolCategory =
  | "basic"
  | "operators"
  | "comparison"
  | "greek"
  | "fractions"
  | "powers"
  | "sets"
  | "logic"
  | "calculus"
  | "geometry"
  | "trig"
  | "statistics"
  | "physics"
  | "chemistry"
  | "currency"
  | "units"
  | "arrows"
  | "misc";

export const CATEGORY_LABELS: Record<SymbolCategory, string> = {
  basic: "Basic",
  operators: "Operators",
  comparison: "Comparison",
  greek: "Greek letters",
  fractions: "Fractions",
  powers: "Powers / roots",
  sets: "Sets",
  logic: "Logic",
  calculus: "Calculus",
  geometry: "Geometry",
  trig: "Trigonometry",
  statistics: "Statistics",
  physics: "Physics",
  chemistry: "Chemistry",
  currency: "Currency",
  units: "Units",
  arrows: "Arrows",
  misc: "Misc",
};

export const SYMBOLS: Symbol[] = [
  // Basic
  { char: "±", name: "Plus-minus", category: "basic", aliases: ["plusminus"] },
  { char: "∓", name: "Minus-plus", category: "basic" },
  { char: "×", name: "Multiply", category: "basic", aliases: ["times", "x"] },
  { char: "÷", name: "Divide", category: "basic", aliases: ["division"] },
  { char: "·", name: "Dot multiply", category: "basic", aliases: ["cdot"] },
  { char: "∗", name: "Asterisk operator", category: "basic" },
  { char: "°", name: "Degree", category: "basic" },
  { char: "′", name: "Prime", category: "basic", aliases: ["minute"] },
  { char: "″", name: "Double prime", category: "basic", aliases: ["second"] },
  { char: "%", name: "Percent", category: "basic" },
  { char: "‰", name: "Per mille", category: "basic" },

  // Operators
  { char: "∑", name: "Summation", category: "operators", aliases: ["sigma sum"] },
  { char: "∏", name: "Product", category: "operators", aliases: ["pi product"] },
  { char: "∫", name: "Integral", category: "operators" },
  { char: "∬", name: "Double integral", category: "operators" },
  { char: "∮", name: "Contour integral", category: "operators" },
  { char: "∇", name: "Nabla", category: "operators", aliases: ["del", "gradient"] },
  { char: "∂", name: "Partial", category: "operators", aliases: ["partial derivative"] },

  // Comparison
  { char: "≤", name: "Less than or equal", category: "comparison", aliases: ["lte", "<="] },
  { char: "≥", name: "Greater than or equal", category: "comparison", aliases: ["gte", ">="] },
  { char: "≠", name: "Not equal", category: "comparison", aliases: ["neq"] },
  { char: "≈", name: "Approximately equal", category: "comparison", aliases: ["approx"] },
  { char: "≡", name: "Identical", category: "comparison" },
  { char: "∝", name: "Proportional to", category: "comparison" },
  { char: "≪", name: "Much less than", category: "comparison" },
  { char: "≫", name: "Much greater than", category: "comparison" },
  { char: "≅", name: "Congruent", category: "comparison" },
  { char: "≃", name: "Asymptotically equal", category: "comparison" },

  // Greek lowercase
  { char: "α", name: "alpha", category: "greek" },
  { char: "β", name: "beta", category: "greek" },
  { char: "γ", name: "gamma", category: "greek" },
  { char: "δ", name: "delta", category: "greek" },
  { char: "ε", name: "epsilon", category: "greek" },
  { char: "ζ", name: "zeta", category: "greek" },
  { char: "η", name: "eta", category: "greek" },
  { char: "θ", name: "theta", category: "greek" },
  { char: "ι", name: "iota", category: "greek" },
  { char: "κ", name: "kappa", category: "greek" },
  { char: "λ", name: "lambda", category: "greek" },
  { char: "μ", name: "mu", category: "greek" },
  { char: "ν", name: "nu", category: "greek" },
  { char: "ξ", name: "xi", category: "greek" },
  { char: "π", name: "pi", category: "greek" },
  { char: "ρ", name: "rho", category: "greek" },
  { char: "σ", name: "sigma", category: "greek" },
  { char: "τ", name: "tau", category: "greek" },
  { char: "υ", name: "upsilon", category: "greek" },
  { char: "φ", name: "phi", category: "greek" },
  { char: "χ", name: "chi", category: "greek" },
  { char: "ψ", name: "psi", category: "greek" },
  { char: "ω", name: "omega", category: "greek" },
  // Greek uppercase
  { char: "Γ", name: "Gamma capital", category: "greek" },
  { char: "Δ", name: "Delta capital", category: "greek", aliases: ["change"] },
  { char: "Θ", name: "Theta capital", category: "greek" },
  { char: "Λ", name: "Lambda capital", category: "greek" },
  { char: "Ξ", name: "Xi capital", category: "greek" },
  { char: "Π", name: "Pi capital", category: "greek" },
  { char: "Σ", name: "Sigma capital", category: "greek" },
  { char: "Φ", name: "Phi capital", category: "greek" },
  { char: "Ψ", name: "Psi capital", category: "greek" },
  { char: "Ω", name: "Omega capital", category: "greek", aliases: ["ohm"] },

  // Fractions
  { char: "½", name: "One half", category: "fractions" },
  { char: "⅓", name: "One third", category: "fractions" },
  { char: "⅔", name: "Two thirds", category: "fractions" },
  { char: "¼", name: "One quarter", category: "fractions" },
  { char: "¾", name: "Three quarters", category: "fractions" },
  { char: "⅕", name: "One fifth", category: "fractions" },
  { char: "⅙", name: "One sixth", category: "fractions" },
  { char: "⅛", name: "One eighth", category: "fractions" },

  // Powers / roots
  { char: "²", name: "Squared", category: "powers", aliases: ["sq"] },
  { char: "³", name: "Cubed", category: "powers" },
  { char: "⁴", name: "Power 4", category: "powers" },
  { char: "ⁿ", name: "Power n", category: "powers" },
  { char: "₁", name: "Subscript 1", category: "powers" },
  { char: "₂", name: "Subscript 2", category: "powers" },
  { char: "₃", name: "Subscript 3", category: "powers" },
  { char: "√", name: "Square root", category: "powers", aliases: ["sqrt"] },
  { char: "∛", name: "Cube root", category: "powers" },
  { char: "∜", name: "Fourth root", category: "powers" },
  { char: "∞", name: "Infinity", category: "powers", aliases: ["inf"] },

  // Sets
  { char: "∈", name: "Element of", category: "sets", aliases: ["in"] },
  { char: "∉", name: "Not element of", category: "sets" },
  { char: "⊂", name: "Subset", category: "sets" },
  { char: "⊆", name: "Subset or equal", category: "sets" },
  { char: "⊃", name: "Superset", category: "sets" },
  { char: "⊇", name: "Superset or equal", category: "sets" },
  { char: "∪", name: "Union", category: "sets" },
  { char: "∩", name: "Intersection", category: "sets" },
  { char: "∅", name: "Empty set", category: "sets" },
  { char: "ℕ", name: "Natural numbers", category: "sets" },
  { char: "ℤ", name: "Integers", category: "sets" },
  { char: "ℚ", name: "Rationals", category: "sets" },
  { char: "ℝ", name: "Reals", category: "sets" },
  { char: "ℂ", name: "Complex", category: "sets" },

  // Logic
  { char: "∧", name: "And", category: "logic", aliases: ["wedge"] },
  { char: "∨", name: "Or", category: "logic", aliases: ["vee"] },
  { char: "¬", name: "Not", category: "logic", aliases: ["neg"] },
  { char: "⇒", name: "Implies", category: "logic" },
  { char: "⇔", name: "If and only if", category: "logic", aliases: ["iff"] },
  { char: "∀", name: "For all", category: "logic" },
  { char: "∃", name: "There exists", category: "logic" },
  { char: "∴", name: "Therefore", category: "logic" },
  { char: "∵", name: "Because", category: "logic" },

  // Geometry / Trig
  { char: "∠", name: "Angle", category: "geometry" },
  { char: "∢", name: "Spherical angle", category: "geometry" },
  { char: "⊥", name: "Perpendicular", category: "geometry" },
  { char: "∥", name: "Parallel", category: "geometry" },
  { char: "△", name: "Triangle", category: "geometry" },
  { char: "□", name: "Square", category: "geometry" },
  { char: "○", name: "Circle", category: "geometry" },

  // Statistics
  { char: "x̄", name: "Mean (x-bar)", category: "statistics", aliases: ["mean"] },
  { char: "σ²", name: "Variance", category: "statistics" },
  { char: "χ²", name: "Chi squared", category: "statistics" },
  { char: "ρ", name: "Correlation rho", category: "statistics" },

  // Physics
  { char: "Δx", name: "Change in x", category: "physics" },
  { char: "ħ", name: "h-bar (Planck reduced)", category: "physics" },
  { char: "∇²", name: "Laplacian", category: "physics" },
  { char: "⃗", name: "Vector arrow", category: "physics" },

  // Chemistry
  { char: "→", name: "Reaction arrow", category: "chemistry", aliases: ["yields"] },
  { char: "⇌", name: "Equilibrium", category: "chemistry" },
  { char: "↑", name: "Gas evolved", category: "chemistry" },
  { char: "↓", name: "Precipitate", category: "chemistry" },
  { char: "Δ", name: "Heat (delta)", category: "chemistry" },

  // Currency
  { char: "$", name: "Dollar", category: "currency" },
  { char: "€", name: "Euro", category: "currency" },
  { char: "£", name: "Pound", category: "currency" },
  { char: "¥", name: "Yen", category: "currency" },
  { char: "₹", name: "Rupee", category: "currency" },
  { char: "₨", name: "Pakistani rupee", category: "currency" },
  { char: "RM", name: "Ringgit", category: "currency" },

  // Units
  { char: "m", name: "metre", category: "units" },
  { char: "cm", name: "centimetre", category: "units" },
  { char: "km", name: "kilometre", category: "units" },
  { char: "kg", name: "kilogram", category: "units" },
  { char: "g", name: "gram", category: "units" },
  { char: "mg", name: "milligram", category: "units" },
  { char: "s", name: "second", category: "units" },
  { char: "ms", name: "millisecond", category: "units" },
  { char: "Hz", name: "Hertz", category: "units" },
  { char: "kHz", name: "kilohertz", category: "units" },
  { char: "MHz", name: "Megahertz", category: "units" },
  { char: "GHz", name: "Gigahertz", category: "units" },
  { char: "N", name: "Newton", category: "units" },
  { char: "Pa", name: "Pascal", category: "units" },
  { char: "kPa", name: "kilopascal", category: "units" },
  { char: "J", name: "Joule", category: "units" },
  { char: "kJ", name: "kilojoule", category: "units" },
  { char: "W", name: "Watt", category: "units" },
  { char: "kW", name: "kilowatt", category: "units" },
  { char: "V", name: "Volt", category: "units" },
  { char: "A", name: "Ampere", category: "units" },
  { char: "Ω", name: "Ohm", category: "units" },
  { char: "C", name: "Coulomb / Celsius", category: "units" },
  { char: "K", name: "Kelvin", category: "units" },
  { char: "°C", name: "degree Celsius", category: "units" },
  { char: "°F", name: "degree Fahrenheit", category: "units" },
  { char: "mol", name: "mole", category: "units" },
  { char: "L", name: "litre", category: "units" },
  { char: "mL", name: "millilitre", category: "units" },
  { char: "m/s", name: "metre per second", category: "units" },
  { char: "m/s²", name: "metre per second squared", category: "units" },
  { char: "km/h", name: "kilometre per hour", category: "units" },

  // Arrows
  { char: "←", name: "Left arrow", category: "arrows" },
  { char: "→", name: "Right arrow", category: "arrows" },
  { char: "↑", name: "Up arrow", category: "arrows" },
  { char: "↓", name: "Down arrow", category: "arrows" },
  { char: "↔", name: "Left-right arrow", category: "arrows" },
  { char: "⇐", name: "Double left arrow", category: "arrows" },
  { char: "⇒", name: "Double right arrow", category: "arrows" },
  { char: "⇔", name: "Double left-right arrow", category: "arrows" },

  // Misc
  { char: "□", name: "Box", category: "misc" },
  { char: "■", name: "Filled box", category: "misc" },
  { char: "▢", name: "Open box", category: "misc" },
  { char: "★", name: "Star", category: "misc" },
  { char: "✓", name: "Check", category: "misc" },
  { char: "✗", name: "Cross", category: "misc" },
  { char: "•", name: "Bullet", category: "misc" },
  { char: "…", name: "Ellipsis", category: "misc" },
];

export function searchSymbols(query: string): Symbol[] {
  if (!query.trim()) return SYMBOLS;
  const q = query.toLowerCase().trim();
  return SYMBOLS.filter((s) => {
    if (s.char.toLowerCase().includes(q)) return true;
    if (s.name.toLowerCase().includes(q)) return true;
    return s.aliases?.some((a) => a.toLowerCase().includes(q));
  });
}
