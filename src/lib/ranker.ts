import { MaterialRecord, MaterialQueryConstraints, RankedMaterial, LoadMode, ProfileId } from "./schemas";

// Priority weight vectors for MAUT scoring
const WEIGHT_VECTORS = {
  strength: { w_strength: 0.45, w_stiffness: 0.15, w_weight: 0.25, w_cost: 0.15 },
  cost:     { w_strength: 0.15, w_stiffness: 0.20, w_weight: 0.20, w_cost: 0.45 },
  weight:   { w_strength: 0.20, w_stiffness: 0.20, w_weight: 0.45, w_cost: 0.15 },
  balanced: { w_strength: 0.25, w_stiffness: 0.25, w_weight: 0.25, w_cost: 0.25 },
};

export interface CandidateWithSource extends MaterialRecord {
  source_profile?: ProfileId;
  gemini_badge?: string;
  gemini_verdict?: string;
}

export function rankCandidates(
  candidates: (MaterialRecord | CandidateWithSource)[],
  constraints: MaterialQueryConstraints,
  topK: number = 5,
  loadMode: LoadMode = "beam_bending"
): RankedMaterial[] {
  if (candidates.length === 0) return [];

  const weights = WEIGHT_VECTORS[constraints.optimization_priority] || WEIGHT_VECTORS.balanced;

  // Compute Ashby indices for each candidate
  const evaluated = candidates.map((m) => {
    const yield_str = m.yield_strength_mpa ?? m.ultimate_tensile_strength_mpa ?? 0;
    const modulus = m.youngs_modulus_gpa ?? 0;
    const density = m.density_kg_m3 ?? 7800; // default benchmark if missing
    const rho_g_cm3 = density > 0 ? density / 1000.0 : 7.8;
    const shear_g = m.shear_modulus_gpa ?? modulus / (2 * (1 + (m.poissons_ratio ?? 0.33)));

    // Standard Ashby Indices:
    // M1 = σ_y / ρ (Strength-to-weight tie)
    const m1 = rho_g_cm3 > 0 && yield_str > 0 ? yield_str / rho_g_cm3 : null;

    // M2 = sqrt(E) / ρ (Stiffness-to-weight beam in bending)
    const m2 = rho_g_cm3 > 0 && modulus > 0 ? Math.sqrt(modulus) / rho_g_cm3 : null;

    // M3 = sqrt(E) / (Cost * ρ)
    const m3 = (m.cost_per_kg_usd && m.cost_per_kg_usd > 0 && m2 != null)
      ? m2 / m.cost_per_kg_usd
      : null;

    // Load-Mode-Specific Performance Index
    let mode_index_label = "M_beam (√E/ρ)";
    let mode_index_value: number | null = null;

    switch (loadMode) {
      case "tie_tension":
        mode_index_label = "M_tie (E/ρ)";
        mode_index_value = rho_g_cm3 > 0 && modulus > 0 ? Math.round((modulus / rho_g_cm3) * 10) / 10 : null;
        break;
      case "plate_bending":
        mode_index_label = "M_plate (E^(1/3)/ρ)";
        mode_index_value = rho_g_cm3 > 0 && modulus > 0 ? Math.round((Math.cbrt(modulus) / rho_g_cm3) * 100) / 100 : null;
        break;
      case "column_buckling":
        mode_index_label = "M_buckle (√E/ρ)";
        mode_index_value = m2 ? Math.round(m2 * 100) / 100 : null;
        break;
      case "shaft_torsion":
        mode_index_label = "M_torsion (√G/ρ)";
        mode_index_value = rho_g_cm3 > 0 && shear_g > 0 ? Math.round((Math.sqrt(shear_g) / rho_g_cm3) * 100) / 100 : null;
        break;
      case "thermal_dissipation":
        mode_index_label = "M_diffusivity (k/ρ)";
        const k = m.thermal_conductivity_w_mk ?? 0;
        mode_index_value = rho_g_cm3 > 0 && k > 0 ? Math.round((k / rho_g_cm3) * 10) / 10 : null;
        break;
      case "beam_bending":
      default:
        mode_index_label = "M_beam (√E/ρ)";
        mode_index_value = m2 ? Math.round(m2 * 100) / 100 : null;
        break;
    }

    return {
      record: m,
      m1,
      m2,
      m3,
      mode_index_label,
      mode_index_value,
      yield_str,
      modulus,
      density,
      cost: m.cost_per_kg_usd,
      has_missing_cost: m.cost_per_kg_usd == null,
      source_profile: (m as CandidateWithSource).source_profile,
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
    const s_strength = item.yield_str / max_yield;
    const s_stiffness = item.modulus / max_modulus;
    const s_weight = (max_density - item.density) / (max_density - min_density || 1);

    // If cost is missing, grant average utility score (0.4) rather than 0 penalty
    let s_cost = 0.40;
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
        mode_index_label: item.mode_index_label,
        mode_index_value: item.mode_index_value,
      },
      dimension_scores: {
        strength: Math.round(s_strength * 100),
        stiffness: Math.round(s_stiffness * 100),
        weight: Math.round(Math.max(0, s_weight) * 100),
        cost: Math.round(Math.max(0, s_cost) * 100),
      },
      has_missing_cost: item.has_missing_cost,
      source_profile: item.source_profile,
      load_mode: loadMode,
    };
  });

  // Sort descending by MAUT score
  scored.sort((a, b) => b.maut_score - a.maut_score);

  // Assign ranks
  return scored.slice(0, topK).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
