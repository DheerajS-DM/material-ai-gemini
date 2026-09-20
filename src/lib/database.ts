import { MaterialRecord, MaterialQueryConstraints } from "./schemas";
import materialsData from "../data/materials_db.json";

const materials: MaterialRecord[] = materialsData as MaterialRecord[];

export interface QueryResult {
  candidates: MaterialRecord[];
  relaxation_logs: string[];
  total_database_count: number;
}

export function queryMaterials(constraints: MaterialQueryConstraints): QueryResult {
  const relaxation_logs: string[] = [];
  let currentConstraints = { ...constraints };
  
  let candidates = filterMaterials(materials, currentConstraints);
  
  // Progressive constraint relaxation if 0 candidates match
  if (candidates.length === 0) {
    if (currentConstraints.min_yield_strength_mpa != null) {
      const relaxed = Math.round(currentConstraints.min_yield_strength_mpa * 0.8 * 10) / 10;
      relaxation_logs.push(`Relaxed min yield strength constraint from ${currentConstraints.min_yield_strength_mpa} MPa to ${relaxed} MPa`);
      currentConstraints.min_yield_strength_mpa = relaxed;
      candidates = filterMaterials(materials, currentConstraints);
    }
  }

  if (candidates.length === 0 && currentConstraints.max_density_kg_m3 != null) {
    const relaxed = Math.round(currentConstraints.max_density_kg_m3 * 1.2 * 10) / 10;
    relaxation_logs.push(`Relaxed max density constraint from ${currentConstraints.max_density_kg_m3} kg/m³ to ${relaxed} kg/m³`);
    currentConstraints.max_density_kg_m3 = relaxed;
    candidates = filterMaterials(materials, currentConstraints);
  }

  if (candidates.length === 0 && currentConstraints.max_cost_per_kg_usd != null) {
    const relaxed = Math.round(currentConstraints.max_cost_per_kg_usd * 1.3 * 10) / 10;
    relaxation_logs.push(`Relaxed max cost constraint from $${currentConstraints.max_cost_per_kg_usd}/kg to $${relaxed}/kg`);
    currentConstraints.max_cost_per_kg_usd = relaxed;
    candidates = filterMaterials(materials, currentConstraints);
  }

  // Fallback if still 0: return materials matching at least material_classes
  if (candidates.length === 0) {
    relaxation_logs.push("Filtering relaxed to material class matching only to ensure engineering candidates are provided.");
    candidates = materials.filter((m) =>
      constraints.material_classes.includes(m.material_class as any)
    );
  }

  return {
    candidates: candidates.length > 0 ? candidates : materials.slice(0, 10),
    relaxation_logs,
    total_database_count: materials.length,
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

    // Max Cost (Allow null costs so missing cost materials aren't strictly eliminated)
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
