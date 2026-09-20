import Groq from "groq-sdk";
import { MaterialQueryConstraints, MaterialQueryConstraintsSchema } from "./schemas";

export async function parseRequirementsWithGroq(
  userQuery: string
): Promise<MaterialQueryConstraints> {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && apiKey !== "your_groq_api_key_here") {
    const groqModels = [
      process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
      "groq/compound",
    ];

    const groq = new Groq({ apiKey });

    const prompt = `You are a materials engineering classifier. Extract quantitative constraints from the following engineering request into strict JSON format matching this schema:

{
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

User Request: "${userQuery}"

Important Rules:
- Convert imperial units (ksi to MPa, lb/in3 to kg/m3) if specified by user.
- If material class is unspecified or fuzzy, include relevant classes (e.g. Metals and alloys, Composites).
- If priority is not explicitly stated, infer based on keywords:
  - "lightweight", "racing", "flight", "aerospace" -> "weight"
  - "cheap", "low cost", "budget", "economical" -> "cost"
  - "high strength", "load bearing", "stiff", "heavy duty" -> "strength"
- Output ONLY valid raw JSON with zero markdown codeblocks or commentary.`;

    for (const modelName of groqModels) {
      try {
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: modelName,
          temperature: 0.0,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return MaterialQueryConstraintsSchema.parse(parsed);
        }
      } catch (err) {
        console.warn(`Groq model ${modelName} failed, trying next fallback:`, err);
      }
    }
  }

  // Fallback Rule-based Local Parser if Groq key is unconfigured or fails
  return parseLocally(userQuery);
}

function parseLocally(query: string): MaterialQueryConstraints {
  const q = query.toLowerCase();

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
    classes.push("Metals and alloys", "Polymers and elastomers", "Ceramics and glasses", "Composites");
  }

  // Extract numeric constraints with regex
  let min_yield: number | null = null;
  const yieldMatch = q.match(/(\d+)\s*(mpa|ksi)/i);
  if (yieldMatch) {
    const val = parseFloat(yieldMatch[1]);
    min_yield = yieldMatch[2].toLowerCase() === "ksi" ? val * 6.89 : val;
  }

  let max_cost: number | null = null;
  const costMatch = q.match(/\$?\s*(\d+)\s*(\/kg|per kg|usd)/i);
  if (costMatch) {
    max_cost = parseFloat(costMatch[1]);
  }

  let max_density: number | null = null;
  if (q.includes("lightweight") || q.includes("racing") || q.includes("flight")) {
    max_density = 4500; // max 4.5 g/cm³
  }

  // Determine priority
  let priority: "cost" | "weight" | "strength" | "balanced" = "balanced";
  if (q.includes("lightweight") || q.includes("weight") || q.includes("mass") || q.includes("racing")) {
    priority = "weight";
  } else if (q.includes("cheap") || q.includes("budget") || q.includes("cost") || q.includes("economical")) {
    priority = "cost";
  } else if (q.includes("stiff") || q.includes("strength") || q.includes("heavy duty") || q.includes("load")) {
    priority = "strength";
  }

  const corrosion = q.includes("corros") || q.includes("rust") || q.includes("marine") || q.includes("water") || q.includes("chemical");

  return {
    target_application: query,
    material_classes: classes,
    min_yield_strength_mpa: min_yield,
    min_youngs_modulus_gpa: null,
    max_density_kg_m3: max_density,
    max_cost_per_kg_usd: max_cost,
    corrosion_resistance_required: corrosion,
    min_operating_temp_c: null,
    max_operating_temp_c: q.includes("high temp") || q.includes("turbine") || q.includes("cryo") ? 400 : null,
    optimization_priority: priority,
  };
}
