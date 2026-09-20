import { MaterialRecord, MaterialQueryConstraints, RankedMaterial } from "./schemas";

// Priority weight vectors for MAUT scoring
const WEIGHT_VECTORS = {
  strength: { w_strength: 0.45, w_stiffness: 0.15, w_weight: 0.25, w_cost: 0.15 },
  cost:     { w_strength: 0.15, w_stiffness: 0.20, w_weight: 0.20, w_cost: 0.45 },
  weight:   { w_strength: 0.20, w_stiffness: 0.20, w_weight: 0.45, w_cost: 0.15 },
  balanced: { w_strength: 0.25, w_stiffness: 0.25, w_weight: 0.25, w_cost: 0.25 },
};

export function rankCandidates(
  candidates: MaterialRecord[],
  constraints: MaterialQueryConstraints,
  topK: number = 5
): RankedMaterial[] {
  if (candidates.length === 0) return [];

  const weights = WEIGHT_VECTORS[constraints.optimization_priority] || WEIGHT_VECTORS.balanced;

  // Compute Ashby indices for each candidate
  const evaluated = candidates.map((m) => {
    const yield_str = m.yield_strength_mpa ?? m.ultimate_tensile_strength_mpa ?? 0;
    const modulus = m.youngs_modulus_gpa ?? 0;
    const density = m.density_kg_m3 ?? 7800; // default benchmark if missing

    // Ashby Indices:
    // M1 = σ_y / ρ (Strength-to-weight tie)
    const m1 = density > 0 ? (yield_str / (density / 1000.0)) : null; // MPa / (g/cm³)

    // M2 = sqrt(E) / ρ (Stiffness-to-weight beam in bending)
    const m2 = (density > 0 && modulus > 0) ? (Math.sqrt(modulus) / (density / 1000.0)) : null;

    // M3 = sqrt(E) / (Cost * ρ) (Cost-weighted stiffness beam)
    const m3 = (m.cost_per_kg_usd && m.cost_per_kg_usd > 0 && m2 != null)
      ? m2 / m.cost_per_kg_usd
      : null;

    return {
      record: m,
      m1,
      m2,
      m3,
      yield_str,
      modulus,
      density,
      cost: m.cost_per_kg_usd,
      has_missing_cost: m.cost_per_kg_usd == null,
    };
  });

  // Calculate min and max for normalization
  const max_yield = Math.max(...evaluated.map((e) => e.yield_str), 1);
  const max_modulus = Math.max(...evaluated.map((e) => e.modulus), 1);
  const min_density = Math.min(...evaluated.map((e) => e.density).filter((d) => d > 0), 1000);
  const max_density = Math.max(...evaluated.map((e) => e.density), 10000);
  
  const valid_costs = evaluated.map((e) => e.cost).filter((c): c is number => c != null && c > 0);
  const min_cost = valid_costs.length > 0 ? Math.min(...valid_costs) : 1;
  const max_cost = valid_costs.length > 0 ? Math.max(...valid_costs) : 100;

  // Compute MAUT score for each material
  const scored = evaluated.map((item) => {
    // Normalized strength score [0, 1]
    const s_strength = item.yield_str / max_yield;

    // Normalized stiffness score [0, 1]
    const s_stiffness = item.modulus / max_modulus;

    // Normalized weight score [0, 1] (lower density is better)
    const s_weight = (max_density - item.density) / (max_density - min_density || 1);

    // Normalized cost score [0, 1] (lower cost is better, 0 if null)
    let s_cost = 0;
    if (item.cost != null) {
      s_cost = (max_cost - item.cost) / (max_cost - min_cost || 1);
    }

    const maut_score =
      weights.w_strength * s_strength +
      weights.w_stiffness * s_stiffness +
      weights.w_weight * Math.max(0, s_weight) +
      weights.w_cost * Math.max(0, s_cost);

    return {
      ...item.record,
      maut_score: Math.round(maut_score * 100) / 100,
      ashby_metrics: {
        m1_strength_to_density: item.m1 ? Math.round(item.m1 * 10) / 10 : null,
        m2_stiffness_to_density: item.m2 ? Math.round(item.m2 * 100) / 100 : null,
        m3_cost_stiffness: item.m3 ? Math.round(item.m3 * 100) / 100 : null,
      },
      dimension_scores: {
        strength: Math.round(s_strength * 100),
        stiffness: Math.round(s_stiffness * 100),
        weight: Math.round(Math.max(0, s_weight) * 100),
        cost: Math.round(Math.max(0, s_cost) * 100),
      },
      has_missing_cost: item.has_missing_cost,
    };
  });

  // Sort descending by MAUT score
  scored.sort((a, b) => b.maut_score - a.maut_score);

  // Assign ranks & slice top K
  return scored.slice(0, topK).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
