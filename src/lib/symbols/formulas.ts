export interface Formula {
  name: string;
  template: string;
  category: "algebra" | "geometry" | "physics" | "chemistry" | "trig" | "statistics" | "calculus";
  description?: string;
}

export const FORMULAS: Formula[] = [
  // Algebra
  { name: "Quadratic formula", template: "x = (−b ± √(b² − 4ac)) / 2a", category: "algebra" },
  { name: "Discriminant", template: "Δ = b² − 4ac", category: "algebra" },
  { name: "Difference of squares", template: "a² − b² = (a + b)(a − b)", category: "algebra" },
  { name: "Slope-intercept", template: "y = mx + c", category: "algebra" },
  { name: "Distance formula", template: "d = √((x₂ − x₁)² + (y₂ − y₁)²)", category: "algebra" },
  { name: "Midpoint", template: "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)", category: "algebra" },

  // Geometry
  { name: "Area of triangle", template: "A = ½ × b × h", category: "geometry" },
  { name: "Area of circle", template: "A = π r²", category: "geometry" },
  { name: "Circumference", template: "C = 2π r", category: "geometry" },
  { name: "Area of rectangle", template: "A = l × w", category: "geometry" },
  { name: "Volume of cube", template: "V = s³", category: "geometry" },
  { name: "Volume of sphere", template: "V = (4/3) π r³", category: "geometry" },
  { name: "Volume of cylinder", template: "V = π r² h", category: "geometry" },
  { name: "Pythagoras", template: "a² + b² = c²", category: "geometry" },

  // Trigonometry
  { name: "sin / cos / tan", template: "sin θ = opp/hyp,  cos θ = adj/hyp,  tan θ = opp/adj", category: "trig" },
  { name: "Identity sin² + cos²", template: "sin²θ + cos²θ = 1", category: "trig" },
  { name: "Sine rule", template: "a/sin A = b/sin B = c/sin C", category: "trig" },
  { name: "Cosine rule", template: "c² = a² + b² − 2ab cos C", category: "trig" },

  // Physics
  { name: "Speed", template: "v = d / t", category: "physics" },
  { name: "Acceleration", template: "a = (v − u) / t", category: "physics" },
  { name: "Newton's 2nd law", template: "F = m × a", category: "physics" },
  { name: "Weight", template: "W = m × g", category: "physics" },
  { name: "Density", template: "ρ = m / V", category: "physics" },
  { name: "Pressure", template: "P = F / A", category: "physics" },
  { name: "Kinetic energy", template: "Eₖ = ½ m v²", category: "physics" },
  { name: "Potential energy", template: "Eₚ = m g h", category: "physics" },
  { name: "Work done", template: "W = F × d", category: "physics" },
  { name: "Power", template: "P = W / t", category: "physics" },
  { name: "Ohm's law", template: "V = I × R", category: "physics" },
  { name: "Electrical power", template: "P = V × I = I² R = V²/R", category: "physics" },
  { name: "Wave equation", template: "v = f × λ", category: "physics" },
  { name: "SUVAT (1)", template: "v = u + a t", category: "physics" },
  { name: "SUVAT (2)", template: "s = u t + ½ a t²", category: "physics" },
  { name: "SUVAT (3)", template: "v² = u² + 2 a s", category: "physics" },

  // Chemistry
  { name: "Moles", template: "n = m / M", category: "chemistry" },
  { name: "Concentration", template: "c = n / V", category: "chemistry" },
  { name: "Ideal gas law", template: "P V = n R T", category: "chemistry" },
  { name: "Percent yield", template: "% yield = (actual / theoretical) × 100", category: "chemistry" },
  { name: "pH", template: "pH = −log₁₀[H⁺]", category: "chemistry" },

  // Statistics
  { name: "Mean", template: "x̄ = (Σ xᵢ) / n", category: "statistics" },
  { name: "Variance", template: "σ² = (Σ(xᵢ − x̄)²) / n", category: "statistics" },
  { name: "Standard deviation", template: "σ = √variance", category: "statistics" },
  { name: "Probability", template: "P(A) = favourable / total", category: "statistics" },

  // Calculus
  { name: "Power rule (deriv.)", template: "d/dx [xⁿ] = n xⁿ⁻¹", category: "calculus" },
  { name: "Power rule (integ.)", template: "∫ xⁿ dx = xⁿ⁺¹ / (n+1) + C", category: "calculus" },
  { name: "Chain rule", template: "d/dx [f(g(x))] = f'(g(x)) × g'(x)", category: "calculus" },
  { name: "Product rule", template: "d/dx [u v] = u' v + u v'", category: "calculus" },
  { name: "Quotient rule", template: "d/dx [u/v] = (u'v − u v') / v²", category: "calculus" },
];

export function searchFormulas(query: string): Formula[] {
  if (!query.trim()) return FORMULAS;
  const q = query.toLowerCase().trim();
  return FORMULAS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.template.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q),
  );
}
