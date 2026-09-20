import { z } from "zod";

export interface MaterialRecord {
  material_id: string;
  name: string;
  material_class: string;
  sub_class: string | null;
  source_url: string;

  // Mechanical properties
  density_kg_m3: number | null;
  youngs_modulus_gpa: number | null;
  yield_strength_mpa: number | null;
  ultimate_tensile_strength_mpa: number | null;
  shear_modulus_gpa: number | null;
  poissons_ratio: number | null;
  hardness_brinell: number | null;
  elongation_at_break_pct: number | null;

  // Thermal properties
  max_service_temp_c: number | null;
  thermal_conductivity_w_mk: number | null;
  melting_point_c: number | null;
  specific_heat_j_kgk: number | null;

  // Economic properties
  cost_per_kg_usd: number | null;

  // Qualitative
  corrosion_resistant: boolean | null;
}

export const MaterialClassEnum = z.enum([
  "Metals and alloys",
  "Polymers and elastomers",
  "Ceramics and glasses",
  "Composites",
]);

export type MaterialClass = z.infer<typeof MaterialClassEnum>;

export const OptimizationPriorityEnum = z.enum([
  "cost",
  "weight",
  "strength",
  "balanced",
]);

export type OptimizationPriority = z.infer<typeof OptimizationPriorityEnum>;

export const MaterialQueryConstraintsSchema = z.object({
  target_application: z.string(),
  material_classes: z.array(MaterialClassEnum),
  min_yield_strength_mpa: z.number().nullable().default(null),
  min_youngs_modulus_gpa: z.number().nullable().default(null),
  max_density_kg_m3: z.number().nullable().default(null),
  max_cost_per_kg_usd: z.number().nullable().default(null),
  corrosion_resistance_required: z.boolean().default(false),
  min_operating_temp_c: z.number().nullable().default(null),
  max_operating_temp_c: z.number().nullable().default(null),
  optimization_priority: OptimizationPriorityEnum,
});

export type MaterialQueryConstraints = z.infer<typeof MaterialQueryConstraintsSchema>;

export interface RankedMaterial extends MaterialRecord {
  rank: number;
  maut_score: number;
  ashby_metrics: {
    m1_strength_to_density: number | null; // σ_y / ρ (Strength tie)
    m2_stiffness_to_density: number | null; // sqrt(E) / ρ (Stiffness beam)
    m3_cost_stiffness: number | null;       // sqrt(E) / (Cost * ρ)
  };
  dimension_scores: {
    strength: number;
    stiffness: number;
    weight: number;
    cost: number;
  };
  has_missing_cost: boolean;
}
