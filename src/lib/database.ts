import { MaterialRecord, MaterialQueryConstraints, MultiQueryExpansion, ProfileId } from "./schemas";
import materialsData from "../data/materials_db.json";

const materials: MaterialRecord[] = materialsData as MaterialRecord[];

export interface CandidateWithSource extends MaterialRecord {
  source_profile?: ProfileId;
  matched_profiles?: ProfileId[];
  closeness_score?: number;
}

export interface QueryResult {
  candidates: MaterialRecord[];
  relaxation_logs: string[];
  total_database_count: number;
}

export interface MultiQueryResult {
  candidates: CandidateWithSource[];
  relaxation_logs: string[];
  total_database_count: number;
  profile_stats: {
    profile_id: ProfileId;
    label: string;
    found_count: number;
  }[];
}

/**
 * Elastic Numerical Constraint Query Engine
 * Solves the binary cutoff failure by applying progressive multi-tier relaxation
 * and nearest-neighbor proximity matching when constraints exceed physical database limits.
 */
export function queryMaterials(constraints: MaterialQueryConstraints): QueryResult {
  const relaxation_logs: string[] = [];
  let currentConstraints = { ...constraints };
  
  let candidates = filterMaterials(materials, currentConstraints);
  
  // If fewer than 5 candidates match, execute Progressive Multi-Tier Elastic Relaxation:
  const RELAXATION_STEPS = [
    { factor_min: 0.90, factor_max: 1.15, label: "Tier 1 (10% engineering margin)" },
    { factor_min: 0.75, factor_max: 1.30, label: "Tier 2 (25% commercial margin)" },
    { factor_min: 0.60, factor_max: 1.50, label: "Tier 3 (40% frontier margin)" },
    { factor_min: 0.45, factor_max: 2.00, label: "Tier 4 (broad exploration margin)" },
  ];

  for (const step of RELAXATION_STEPS) {
    if (candidates.length >= 5) break;

    const changes: string[] = [];

    // Relax min yield strength
    if (currentConstraints.min_yield_strength_mpa != null) {
      const relaxed = Math.round(constraints.min_yield_strength_mpa! * step.factor_min * 10) / 10;
      if (relaxed !== currentConstraints.min_yield_strength_mpa) {
        changes.push(`Yield: ${currentConstraints.min_yield_strength_mpa} → ${relaxed} MPa`);
        currentConstraints.min_yield_strength_mpa = relaxed;
      }
    }

    // Relax min Young's modulus
    if (currentConstraints.min_youngs_modulus_gpa != null) {
      const relaxed = Math.round(constraints.min_youngs_modulus_gpa! * step.factor_min * 10) / 10;
      if (relaxed !== currentConstraints.min_youngs_modulus_gpa) {
        changes.push(`Modulus: ${currentConstraints.min_youngs_modulus_gpa} → ${relaxed} GPa`);
        currentConstraints.min_youngs_modulus_gpa = relaxed;
      }
    }

    // Relax max operating temp (CRITICAL FOR EXTREME TEMPERATURES)
    if (currentConstraints.max_operating_temp_c != null) {
      const relaxed = Math.round(constraints.max_operating_temp_c! * step.factor_min);
      if (relaxed !== currentConstraints.max_operating_temp_c) {
        changes.push(`Temp: ${currentConstraints.max_operating_temp_c}°C → ${relaxed}°C`);
        currentConstraints.max_operating_temp_c = relaxed;
      }
    }

    // Relax max density
    if (currentConstraints.max_density_kg_m3 != null) {
      const relaxed = Math.round(constraints.max_density_kg_m3! * step.factor_max);
      if (relaxed !== currentConstraints.max_density_kg_m3) {
        changes.push(`Density: ${currentConstraints.max_density_kg_m3} → ${relaxed} kg/m³`);
        currentConstraints.max_density_kg_m3 = relaxed;
      }
    }

    // Relax max cost
    if (currentConstraints.max_cost_per_kg_usd != null) {
      const relaxed = Math.round(constraints.max_cost_per_kg_usd! * step.factor_max * 10) / 10;
      if (relaxed !== currentConstraints.max_cost_per_kg_usd) {
        changes.push(`Cost: $${currentConstraints.max_cost_per_kg_usd} → $${relaxed}/kg`);
        currentConstraints.max_cost_per_kg_usd = relaxed;
      }
    }

    if (changes.length > 0) {
      const newlyFiltered = filterMaterials(materials, currentConstraints);
      if (newlyFiltered.length > candidates.length) {
        candidates = newlyFiltered;
        relaxation_logs.push(`Elastic relaxation (${step.label}): ${changes.join(", ")} [Found ${candidates.length} candidates]`);
      }
    }
  }

  // If still fewer than 5 candidates (e.g. extreme targets like 2000°C where DB ceiling is 1700°C):
  if (candidates.length < 5) {
    relaxation_logs.push("Target exceeded database ceiling. Activated Nearest-Neighbor Proximity Matcher (top boundary candidates).");
    candidates = getNearestNeighborCandidates(materials, constraints);
  }

  return {
    candidates: candidates.slice(0, 15),
    relaxation_logs,
    total_database_count: materials.length,
  };
}

/**
 * Nearest-Neighbor Proximity Matcher:
 * Computes a continuous closeness score [0, 1] for each candidate relative to the target specifications.
 * Ensures the system ALWAYS returns the closest high-performance physical boundary materials
 * instead of arbitrary items.
 */
function getNearestNeighborCandidates(
  dataset: MaterialRecord[],
  c: MaterialQueryConstraints
): MaterialRecord[] {
  const pool = c.material_classes.length > 0
    ? dataset.filter((m) => c.material_classes.includes(m.material_class as any))
    : dataset;

  const scored = pool.map((m) => {
    let penalty = 0;
    let factors = 0;

    // Operating Temp Proximity: closer to target is better
    if (c.max_operating_temp_c != null) {
      factors++;
      const matTemp = m.max_service_temp_c ?? 0;
      if (matTemp < c.max_operating_temp_c) {
        penalty += ((c.max_operating_temp_c - matTemp) / c.max_operating_temp_c) * 2.5; // High weight for thermal requests
      }
    }

    // Yield Strength Proximity
    if (c.min_yield_strength_mpa != null) {
      factors++;
      const matYield = m.yield_strength_mpa ?? 0;
      if (matYield < c.min_yield_strength_mpa) {
        penalty += (c.min_yield_strength_mpa - matYield) / c.min_yield_strength_mpa;
      }
    }

    // Young's Modulus Proximity
    if (c.min_youngs_modulus_gpa != null) {
      factors++;
      const matE = m.youngs_modulus_gpa ?? 0;
      if (matE < c.min_youngs_modulus_gpa) {
        penalty += (c.min_youngs_modulus_gpa - matE) / c.min_youngs_modulus_gpa;
      }
    }

    // Density Proximity
    if (c.max_density_kg_m3 != null) {
      factors++;
      const matRho = m.density_kg_m3 ?? 7800;
      if (matRho > c.max_density_kg_m3) {
        penalty += (matRho - c.max_density_kg_m3) / c.max_density_kg_m3;
      }
    }

    // Cost Proximity
    if (c.max_cost_per_kg_usd != null && m.cost_per_kg_usd != null) {
      factors++;
      if (m.cost_per_kg_usd > c.max_cost_per_kg_usd) {
        penalty += (m.cost_per_kg_usd - c.max_cost_per_kg_usd) / c.max_cost_per_kg_usd;
      }
    }

    const fitScore = factors > 0 ? 1 / (1 + penalty) : 0.5;
    return { record: m, fitScore };
  });

  scored.sort((a, b) => b.fitScore - a.fitScore);
  return scored.slice(0, 15).map((s) => s.record);
}

export function queryMultiMaterials(expansion: MultiQueryExpansion): MultiQueryResult {
  const candidateMap = new Map<string, CandidateWithSource>();
  const combinedRelaxationLogs: string[] = [];
  const profileStats: { profile_id: ProfileId; label: string; found_count: number }[] = [];

  for (const profile of expansion.profiles) {
    const res = queryMaterials(profile.constraints);
    
    if (res.relaxation_logs.length > 0) {
      for (const log of res.relaxation_logs) {
        combinedRelaxationLogs.push(`[${profile.label}] ${log}`);
      }
    }

    const profileCandidates = res.candidates.slice(0, 12);
    profileStats.push({
      profile_id: profile.profile_id,
      label: profile.label,
      found_count: profileCandidates.length,
    });

    for (const mat of profileCandidates) {
      if (!candidateMap.has(mat.material_id)) {
        candidateMap.set(mat.material_id, {
          ...mat,
          source_profile: profile.profile_id,
          matched_profiles: [profile.profile_id],
        });
      } else {
        const existing = candidateMap.get(mat.material_id)!;
        if (!existing.matched_profiles?.includes(profile.profile_id)) {
          existing.matched_profiles?.push(profile.profile_id);
        }
      }
    }
  }

  const pooledList = Array.from(candidateMap.values());

  return {
    candidates: pooledList.length > 0 ? pooledList : materials.slice(0, 15).map((m) => ({ ...m, source_profile: "balanced" })),
    relaxation_logs: Array.from(new Set(combinedRelaxationLogs)),
    total_database_count: materials.length,
    profile_stats: profileStats,
  };
}

function filterMaterials(
  dataset: MaterialRecord[],
  c: MaterialQueryConstraints
): MaterialRecord[] {
  return dataset.filter((m) => {
    // Material class filter
    if (c.material_classes.length > 0 && !c.material_classes.includes(m.material_class as any)) {
      return false;
    }

    // Min Yield Strength
    if (c.min_yield_strength_mpa != null) {
      if (m.yield_strength_mpa == null || m.yield_strength_mpa < c.min_yield_strength_mpa) {
        return false;
      }
    }

    // Min Young's Modulus
    if (c.min_youngs_modulus_gpa != null) {
      if (m.youngs_modulus_gpa == null || m.youngs_modulus_gpa < c.min_youngs_modulus_gpa) {
        return false;
      }
    }

    // Max Density
    if (c.max_density_kg_m3 != null) {
      if (m.density_kg_m3 != null && m.density_kg_m3 > c.max_density_kg_m3) {
        return false;
      }
    }

    // Max Cost
    if (c.max_cost_per_kg_usd != null && m.cost_per_kg_usd != null) {
      if (m.cost_per_kg_usd > c.max_cost_per_kg_usd) {
        return false;
      }
    }

    // Corrosion Resistance
    if (c.corrosion_resistance_required) {
      if (m.corrosion_resistant !== true) {
        return false;
      }
    }

    // Operating Temperature
    if (c.max_operating_temp_c != null) {
      if (m.max_service_temp_c != null && m.max_service_temp_c < c.max_operating_temp_c) {
        return false;
      }
    }

    return true;
  });
}
