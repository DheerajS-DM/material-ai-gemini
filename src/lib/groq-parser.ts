import Groq from "groq-sdk";
import {
  MaterialQueryConstraints,
  MaterialQueryConstraintsSchema,
  MultiQueryExpansion,
  MultiQueryExpansionSchema,
  LoadMode,
} from "./schemas";

export async function generateMultiQueryWithGroq(
  userQuery: string
): Promise<MultiQueryExpansion> {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && apiKey !== "your_groq_api_key_here") {
    const groqModels = [
      process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ];

    const groq = new Groq({ apiKey });

    const prompt = `You are a Materials Engineering Systems Architect and Ashby selection specialist.
Deconstruct the user's natural language engineering request into:
1. The structural loading mode.
2. Three complementary search profiles designed to retrieve a diverse candidate pool from MatWeb.

Loading Modes:
- "tie_tension": Rods, tensile ties, cables, pressurized membranes
- "beam_bending": Suspension arms, levers, chassis crossmembers, brackets, bike frames, beams
- "plate_bending": Panels, floorplates, aerodynamic skins, covers
- "column_buckling": Struts, pillars, compression columns
- "shaft_torsion": Drive axles, propeller shafts, torsion bars
- "thermal_dissipation": Heat sinks, cooling radiators, thermal spreaders
- "general": Non-specific or multi-axis

The 3 Search Profiles:
1. "balanced": Direct balanced translation of user's stated goals.
2. "performance_frontier": Prioritizes high stiffness/strength Ashby metrics, relaxing cost ceiling by 50-80% to admit high-performance alloys and composites.
3. "pragmatic_cost": Enforces a strict budget ceiling (30-50% lower cost), prioritizing high-yield, readily machinable structural grades.

CRITICAL INSTRUCTIONS FOR QUANTITATIVE INFERENCE:
If the user uses qualitative descriptors, INFER reasonable engineering baseline thresholds rather than leaving numbers null:
- "lightweight" / "racing" / "flight" -> max_density_kg_m3: 3000 to 4500 (aerospace aluminum, titanium, composites)
- "high stiffness" / "rigid" / "stiff" -> min_youngs_modulus_gpa: 65 to 110 (metals) or 40+ (composites)
- "high strength" / "heavy duty" -> min_yield_strength_mpa: 300 to 600
- "high temperature" / "turbine" -> max_operating_temp_c: 400 to 900+
- Convert imperial units (ksi -> MPa, lb/in³ -> kg/m³, °F -> °C) accurately.

User Request: "${userQuery}"

Output strict raw JSON matching this schema with ZERO markdown fences or commentary:
{
  "target_application": string,
  "load_mode": "tie_tension" | "beam_bending" | "plate_bending" | "column_buckling" | "shaft_torsion" | "thermal_dissipation" | "general",
  "reasoning": string,
  "profiles": [
    {
      "profile_id": "balanced",
      "label": "Balanced Target",
      "description": string,
      "constraints": {
        "target_application": string,
        "material_classes": Array<"Metals and alloys" | "Polymers and elastomers" | "Ceramics and glasses" | "Composites">,
        "min_yield_strength_mpa": float | null,
        "min_youngs_modulus_gpa": float | null,
        "max_density_kg_m3": float | null,
        "max_cost_per_kg_usd": float | null,
        "corrosion_resistance_required": boolean,
        "min_operating_temp_c": float | null,
        "max_operating_temp_c": float | null,
        "optimization_priority": "cost" | "weight" | "strength" | "balanced"
      }
    },
    {
      "profile_id": "performance_frontier",
      "label": "Performance Frontier",
      "description": string,
      "constraints": { ... }
    },
    {
      "profile_id": "pragmatic_cost",
      "label": "Pragmatic & Cost Frontier",
      "description": string,
      "constraints": { ... }
    }
  ]
}`;

    for (const modelName of groqModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: modelName,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return MultiQueryExpansionSchema.parse(parsed);
        }
      } catch (err) {
        console.warn(`Groq multi-query generation with ${modelName} failed, trying next model:`, err);
      }
    }
  }

  // Fallback to local heuristic rule-based multi-query generator
  return parseMultiLocally(userQuery);
}

export async function parseRequirementsWithGroq(
  userQuery: string
): Promise<MaterialQueryConstraints> {
  const multi = await generateMultiQueryWithGroq(userQuery);
  return multi.profiles[0]?.constraints || multi.profiles.find((p) => p.profile_id === "balanced")?.constraints!;
}

function parseMultiLocally(query: string): MultiQueryExpansion {
  const q = query.toLowerCase();

  // Detect Load Mode
  let loadMode: LoadMode = "beam_bending";
  if (q.includes("tension") || q.includes("tie") || q.includes("cable") || q.includes("rope") || q.includes("pressure vessel")) {
    loadMode = "tie_tension";
  } else if (q.includes("panel") || q.includes("plate") || q.includes("skin") || q.includes("sheet")) {
    loadMode = "plate_bending";
  } else if (q.includes("strut") || q.includes("column") || q.includes("pillar") || q.includes("buckl")) {
    loadMode = "column_buckling";
  } else if (q.includes("shaft") || q.includes("axle") || q.includes("torsion") || q.includes("torque")) {
    loadMode = "shaft_torsion";
  } else if (q.includes("heat") || q.includes("thermal") || q.includes("sink") || q.includes("cooling")) {
    loadMode = "thermal_dissipation";
  }

  // Determine material classes
  const classes: ("Metals and alloys" | "Polymers and elastomers" | "Ceramics and glasses" | "Composites")[] = [];
  if (q.includes("metal") || q.includes("steel") || q.includes("aluminum") || q.includes("titanium") || q.includes("alloy")) {
    classes.push("Metals and alloys");
  }
  if (q.includes("plastic") || q.includes("polymer") || q.includes("peek") || q.includes("nylon") || q.includes("teflon")) {
    classes.push("Polymers and elastomers");
  }
  if (q.includes("ceramic") || q.includes("glass") || q.includes("alumina") || q.includes("silicon carbide")) {
    classes.push("Ceramics and glasses");
  }
  if (q.includes("composite") || q.includes("cfrp") || q.includes("gfrp") || q.includes("carbon fiber")) {
    classes.push("Composites");
  }
  if (classes.length === 0) {
    classes.push("Metals and alloys", "Composites");
  }

  let min_yield: number | null = null;
  const yieldMatch = q.match(/(\d+)\s*(mpa|ksi)/i);
  if (yieldMatch) {
    const val = parseFloat(yieldMatch[1]);
    min_yield = yieldMatch[2].toLowerCase() === "ksi" ? val * 6.89 : val;
  } else if (q.includes("strength") || q.includes("heavy duty")) {
    min_yield = 300;
  }

  let min_youngs: number | null = null;
  if (q.includes("stiff") || q.includes("rigid") || q.includes("young")) {
    min_youngs = 65; // standard stiffness baseline (aluminum level or higher)
  }

  let max_cost: number | null = null;
  const costMatch = q.match(/\$?\s*(\d+)\s*(\/kg|per kg|usd)/i);
  if (costMatch) {
    max_cost = parseFloat(costMatch[1]);
  }

  let max_density: number | null = null;
  if (q.includes("lightweight") || q.includes("racing") || q.includes("flight") || q.includes("aero")) {
    max_density = 4500;
  }

  const corrosion = q.includes("corros") || q.includes("rust") || q.includes("marine") || q.includes("water") || q.includes("chemical");
  const max_temp = q.includes("high temp") || q.includes("turbine") || q.includes("creep") ? 500 : null;

  const baseConstraints: MaterialQueryConstraints = {
    target_application: query,
    material_classes: classes,
    min_yield_strength_mpa: min_yield,
    min_youngs_modulus_gpa: min_youngs,
    max_density_kg_m3: max_density,
    max_cost_per_kg_usd: max_cost,
    corrosion_resistance_required: corrosion,
    min_operating_temp_c: null,
    max_operating_temp_c: max_temp,
    optimization_priority: q.includes("cheap") || q.includes("cost") ? "cost" : q.includes("weight") || q.includes("light") ? "weight" : "strength",
  };

  return {
    target_application: query,
    load_mode: loadMode,
    reasoning: `Rule-based multi-hypothesis expansion for ${loadMode} loading mode.`,
    profiles: [
      {
        profile_id: "balanced",
        label: "Balanced Target",
        description: "Standard engineering targets matching specification directly.",
        constraints: baseConstraints,
      },
      {
        profile_id: "performance_frontier",
        label: "Performance Frontier",
        description: "Optimized for maximum structural index, relaxing cost limits.",
        constraints: {
          ...baseConstraints,
          min_yield_strength_mpa: min_yield ? min_yield * 1.3 : 400,
          min_youngs_modulus_gpa: min_youngs ? min_youngs * 1.2 : 75,
          max_density_kg_m3: max_density ? Math.min(max_density, 3200) : 3200,
          max_cost_per_kg_usd: max_cost ? max_cost * 1.8 : 80,
          optimization_priority: "weight",
        },
      },
      {
        profile_id: "pragmatic_cost",
        label: "Pragmatic & Cost Frontier",
        description: "Budget and manufacturing optimized with relaxed mass limits.",
        constraints: {
          ...baseConstraints,
          max_density_kg_m3: max_density ? max_density * 1.5 : null,
          max_cost_per_kg_usd: max_cost ? max_cost * 0.7 : 25,
          optimization_priority: "cost",
        },
      },
    ],
  };
}
