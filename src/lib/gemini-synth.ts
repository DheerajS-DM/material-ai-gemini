import { GoogleGenAI } from "@google/genai";
import { MaterialQueryConstraints, RankedMaterial } from "./schemas";

export async function* streamGeminiRationale(
  userQuery: string,
  constraints: MaterialQueryConstraints,
  shortlist: RankedMaterial[]
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    const ai = new GoogleGenAI({ apiKey });
    const geminiModels = [
      process.env.GEMINI_MODEL || "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ];

    const prompt = `System: You are a senior metallurgical and materials engineering consultant. You are given a user's engineering request and a shortlist of top ranked materials queried from an authoritative database.

CRITICAL INSTRUCTIONS:
- Refer ONLY to property values provided in the data payload below.
- If a property value is null or missing, state "Not Provided in Source Data". NEVER invent or guess missing numbers.
- Do not recommend any materials outside the provided shortlisted candidates.
- DO NOT use LaTeX math syntax like $M_1$ or $N_s$. Write numbers and units as plain text (e.g., M_1, N_s >= 1.5, MPa/(g/cm³)).

User Application Target: "${userQuery}"

Extracted Engineering Constraints:
${JSON.stringify(constraints, null, 2)}

Top Ranked Candidates Data:
${JSON.stringify(
  shortlist.map((m) => ({
    rank: m.rank,
    name: m.name,
    class: m.material_class,
    yield_strength_mpa: m.yield_strength_mpa ?? "Not Provided in Source Data",
    ultimate_tensile_strength_mpa: m.ultimate_tensile_strength_mpa ?? "Not Provided in Source Data",
    youngs_modulus_gpa: m.youngs_modulus_gpa ?? "Not Provided in Source Data",
    density_kg_m3: m.density_kg_m3 ?? "Not Provided in Source Data",
    cost_per_kg_usd: m.cost_per_kg_usd ?? "Not Provided in Source Data",
    max_service_temp_c: m.max_service_temp_c ?? "Not Provided in Source Data",
    corrosion_resistant: m.corrosion_resistant,
    maut_score: m.maut_score,
    ashby_indices: m.ashby_metrics,
  })),
  null,
  2
)}

Format your response in clean Markdown with the following sections:
### Executive Summary & Selection Overview
### Detailed Candidate Evaluation
### Operational Limits & Engineering Guidance`;

    for (const modelName of geminiModels) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: prompt,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
        return;
      } catch (err) {
        console.warn(`Gemini model ${modelName} failed or deprecated, trying next fallback:`, err);
      }
    }
  }

  // Fallback Rule-Based Engineering Rationale Generator
  for (const chunk of generateLocalRationaleChunks(userQuery, constraints, shortlist)) {
    yield chunk;
    await new Promise((res) => setTimeout(res, 40)); // simulate stream pacing
  }
}

function* generateLocalRationaleChunks(
  userQuery: string,
  constraints: MaterialQueryConstraints,
  shortlist: RankedMaterial[]
): Generator<string, void, unknown> {
  yield `### Executive Summary & Selection Overview\n\n`;
  yield `Based on the extracted engineering design criteria for **"${userQuery}"**, candidates were evaluated using multi-attribute utility theory (MAUT) with an optimization priority set to **"${constraints.optimization_priority}"**.\n\n`;
  yield `The top ${shortlist.length} candidate materials satisfy the hard structural and environmental constraints. Below is the quantitative engineering breakdown for each shortlisted candidate.\n\n`;

  yield `---\n\n### Detailed Candidate Evaluation\n\n`;

  for (const mat of shortlist) {
    yield `#### ${mat.rank}. ${mat.name} (${mat.material_class})\n`;
    yield `- **MAUT Utility Score:** \`${mat.maut_score} / 1.0\`\n`;
    yield `- **Primary Mechanical Justification:** `;

    if (mat.yield_strength_mpa && mat.density_kg_m3) {
      yield `Offers a specific strength metric (M_1) of \`${mat.ashby_metrics.m1_strength_to_density ?? "N/A"} MPa/(g/cm³)\` with a yield strength of \`${mat.yield_strength_mpa} MPa\` and density of \`${mat.density_kg_m3} kg/m³\`.\n`;
    } else {
      yield `Provides balanced structural properties tailored for ${mat.material_class.toLowerCase()} applications.\n`;
    }

    yield `- **Key Trade-offs:** `;
    if (mat.has_missing_cost) {
      yield `*Note: Commercial unit cost per kg is not recorded in the source database sheet for this specific entry.* `;
    }
    if (mat.density_kg_m3 && mat.density_kg_m3 > 7000) {
      yield `Higher mass density (${mat.density_kg_m3} kg/m³) increases structural self-weight penalty.\n`;
    } else if (mat.youngs_modulus_gpa && mat.youngs_modulus_gpa < 10) {
      yield `Lower elastic modulus (${mat.youngs_modulus_gpa} GPa) requires geometry compensation for deflection critical designs.\n`;
    } else {
      yield `Moderate cost and machining considerations depending on heat treatment state.\n`;
    }

    yield `- **Manufacturing Suitability:** `;
    if (mat.material_class === "Metals and alloys") {
      yield `CNC milling, precision turning, sheet forming, and investment casting.\n`;
    } else if (mat.material_class === "Polymers and elastomers") {
      yield `Injection molding, extrusion, and CNC polymer machining.\n`;
    } else if (mat.material_class === "Composites") {
      yield `Autoclave curing, vacuum bag resin infusion, and automated fiber placement.\n`;
    } else {
      yield `Diamond grinding, dry pressing, and high-temperature sintering.\n`;
    }

    yield `\n`;
  }

  yield `---\n\n### Operational Limits & Engineering Guidance\n`;
  yield `- Ensure design load safety factors (N_s ≥ 1.5 - 2.0) account for cyclic fatigue limits.\n`;
  yield `- Verify operational temperatures do not exceed the maximum service thresholds noted above.\n`;
}

