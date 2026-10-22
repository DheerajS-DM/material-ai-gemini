import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { MultiQueryExpansion, RankedMaterial, MaterialQueryConstraints } from "./schemas";

// Verified unthrottled models prioritized to avoid 429 quota exhaustion & 503 spikes
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

const GROQ_FALLBACK_MODELS = [
  process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

export interface GeminiChampionPick {
  material_id: string;
  badge: string;
  verdict: string;
}

/**
 * Stage 3.5: AI LLM-as-a-Judge Candidate Tournament Selection
 * Evaluates candidate materials across multiple query profiles
 * with automatic cross-provider failover (Gemini -> Groq -> Local).
 */
export async function selectChampionsWithGemini(
  userQuery: string,
  expansion: MultiQueryExpansion,
  candidatePool: RankedMaterial[]
): Promise<RankedMaterial[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a Principal Materials & Metallurgical Engineering Selection Judge.
The user has submitted an engineering design specification:
User Request: "${userQuery}"
Detected Load Mode: "${expansion.load_mode}"
Architecture Context: "${expansion.reasoning}"
${expansion.feasibility_notes ? `Physical Feasibility Note: "${expansion.feasibility_notes}"` : ""}

A multi-angle database search retrieved the following ${candidatePool.length} pooled candidate materials:
${JSON.stringify(
  candidatePool.map((m) => ({
    material_id: m.material_id,
    name: m.name,
    class: m.material_class,
    source_profile: m.source_profile || "balanced",
    yield_strength_mpa: m.yield_strength_mpa,
    compressive_strength_mpa: m.compressive_strength_mpa,
    youngs_modulus_gpa: m.youngs_modulus_gpa,
    density_kg_m3: m.density_kg_m3,
    cost_per_kg_usd: m.cost_per_kg_usd,
    corrosion_resistant: m.corrosion_resistant,
    max_service_temp_c: m.max_service_temp_c,
    maut_score: m.maut_score,
    mode_index: m.ashby_metrics.mode_index_value,
    mode_label: m.ashby_metrics.mode_index_label,
  })),
  null,
  2
)}

YOUR TASK:
Review this candidate pool from an authoritative engineering perspective.
Apply REAL-WORLD FAILURE MODE SCREENING before picking candidates:

CRITICAL ENGINEERING REALITY & FAILURE-MODE SCREENING (VETO CRITERIA):
Do NOT blindly pick materials solely based on their raw database MAUT score or scalar datasheet numbers if they exhibit well-known fatal structural failure modes for this specific application:
1. Asymmetric Tension/Compression & Micro-buckling:
   - For bicycle frames, suspension arms, tubular trusses, or bending beams: Bending generates equal tension and compression (sigma = +/- M*y/I).
   - Aramid / Kevlar (AFRP) has severe compressive weakness (~200-280 MPa compressive vs 1400 MPa tensile due to polymer chain kink-band microbuckling). In pure bicycle frames or structural tubes, pure Aramid/Kevlar WILL BUCKLE and crease under pedaling/impact! It must NEVER be recommended as a standalone structural frame material (it is only used as a hybrid impact/puncture shield or damping layer with Carbon Fiber). VETO pure Kevlar from top structural frame recommendations.
2. High Temperature Refractory Screening:
   - For operating temperatures > 1200°C: Standard steels, nickels, and polymers oxidize or melt. Only refractory ceramics (Alumina, SiC, Zirconia) can survive. Disqualify low-temperature steels from the top ranks.
3. Anisotropy & Torsional Splitting:
   - Single-direction unidirectional composites without multi-axial reinforcement split under torsional pedaling/cornering loads.
4. Brittle Impact & Environmental Degradation:
   - Aramid fibers are hygroscopic (absorb up to 4% water) and UV-sensitive unless completely sealed. Unreinforced ceramics shatter under impact.

Pick the TOP 5 CHAMPION MATERIALS that represent genuinely viable, robust engineering choices:
1. Overall Best Champion (proven balance of structural rigidity, thermal stability, availability, and cost)
2. High-Performance Pick (maximum specific stiffness/strength/thermal frontier without fatal failure modes)
3. Value / Manufacturability Pick (best economics, easy CNC/casting/welding)
4. Specialized Structural Alternative (e.g. Titanium Grade 9/5, CrMo Steel, or refractory ceramic)
5. Reliable / High-Safety Factor Pick

Output ONLY strict JSON matching this structure:
{
  "champions": [
    {
      "material_id": string,
      "badge": string,
      "verdict": string
    }
  ]
}`;

  // Try Google Gemini models
  if (geminiApiKey && geminiApiKey !== "your_gemini_api_key_here" && candidatePool.length > 0) {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.champions) && parsed.champions.length > 0) {
            return buildChosenChampions(parsed.champions, candidatePool);
          }
        }
      } catch (err: any) {
        console.warn(`Gemini champion selection with ${modelName} failed (${err?.status || err?.message}), trying next model...`);
      }
    }
  }

  // Cross-Provider Fallback: Groq (ultra-high throughput, no 429 daily cap)
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && groqApiKey !== "your_groq_api_key_here") {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      for (const modelName of GROQ_FALLBACK_MODELS) {
        try {
          const res = await groq.chat.completions.create({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1,
          });
          const content = res.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.champions) && parsed.champions.length > 0) {
              return buildChosenChampions(parsed.champions, candidatePool);
            }
          }
        } catch (groqErr) {
          console.warn(`Groq fallback model ${modelName} failed:`, groqErr);
        }
      }
    } catch (err) {
      console.warn("Groq cross-provider champion selection fallback failed:", err);
    }
  }

  // Fallback: Deterministic MAUT ranking with heuristic badges
  return fallbackChampionSelection(candidatePool);
}

function buildChosenChampions(
  championsList: GeminiChampionPick[],
  candidatePool: RankedMaterial[]
): RankedMaterial[] {
  const materialMap = new Map(candidatePool.map((c) => [c.material_id, c]));
  const chosen: RankedMaterial[] = [];

  for (let i = 0; i < championsList.length && i < 5; i++) {
    const pick = championsList[i];
    const mat = materialMap.get(pick.material_id);
    if (mat) {
      chosen.push({
        ...mat,
        rank: i + 1,
        gemini_badge: pick.badge,
        gemini_verdict: pick.verdict,
      });
      materialMap.delete(pick.material_id);
    }
  }

  // Fill remaining spots if fewer than 5 were chosen
  if (chosen.length < 5) {
    for (const remaining of candidatePool) {
      if (chosen.length >= 5) break;
      if (!chosen.some((c) => c.material_id === remaining.material_id)) {
        chosen.push({
          ...remaining,
          rank: chosen.length + 1,
          gemini_badge: "⭐ Qualified Candidate",
          gemini_verdict: "High-scoring alternative from multi-query candidate pool.",
        });
      }
    }
  }

  return chosen;
}

function fallbackChampionSelection(candidates: RankedMaterial[]): RankedMaterial[] {
  const badges = [
    "🏆 Top Utility Rank",
    "⚡ High-Performance Pick",
    "💰 Pragmatic Cost Pick",
    "🔬 Qualified Alternative",
    "🛡️ Structural Candidate",
  ];

  return candidates.slice(0, 5).map((mat, idx) => ({
    ...mat,
    rank: idx + 1,
    gemini_badge: badges[idx] || "Candidate",
    gemini_verdict: `Selected via deterministic multi-attribute utility optimization with score ${mat.maut_score}.`,
  }));
}

/**
 * Stage 4: Authoritative Engineering Trade-Off Report Stream
 * With multi-model failover (Gemini active models -> Groq streaming -> Local generator)
 */
export async function* streamGeminiRationale(
  userQuery: string,
  constraints: MaterialQueryConstraints | MultiQueryExpansion,
  shortlist: RankedMaterial[]
): AsyncGenerator<string, void, unknown> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const loadMode = (constraints as MultiQueryExpansion).load_mode || "beam_bending";
  const appReasoning = (constraints as MultiQueryExpansion).reasoning || "";
  const feasibilityNotes = (constraints as MultiQueryExpansion).feasibility_notes || "";

  const prompt = `System: You are a Principal Metallurgist and Materials Engineering Consultant.
You are evaluating the TOP 5 CHAMPION MATERIALS chosen from an authoritative MatWeb database query.

CRITICAL INSTRUCTIONS:
- Refer ONLY to property values provided in the data payload below.
- If a property value is null or missing, state "Not Provided in Source Data". NEVER invent missing numbers.
- Do not recommend any materials outside the provided shortlisted candidates.
- DO NOT use LaTeX math syntax like $M_1$ or $\\sigma_y$. Write numbers and units as plain text (e.g., M_1, sigma_y, E/rho >= 25, MPa/(g/cm³)).

User Application Target: "${userQuery}"
Loading Mode & Context: ${loadMode} - ${appReasoning}
${feasibilityNotes ? `Physical Feasibility Context: ${feasibilityNotes}` : ""}

Shortlisted Champion Materials Data:
${JSON.stringify(
  shortlist.map((m) => ({
    rank: m.rank,
    name: m.name,
    class: m.material_class,
    badge: m.gemini_badge,
    verdict: m.gemini_verdict,
    source_profile: m.source_profile,
    yield_strength_mpa: m.yield_strength_mpa ?? "Not Provided in Source Data",
    compressive_strength_mpa: m.compressive_strength_mpa ?? "Not Provided in Source Data",
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
### 🏆 Tournament Selection & Trade-Off Matrix
(Explain why Champion #1 was chosen as the premier pick and compare direct trade-offs against Candidates #2 through #5. Address physical reality checks: e.g. if the application involves extreme temperatures or tube bending, explain why flawed materials were rejected and why the champions succeed in real-world service)

### 🔬 Detailed Candidate Engineering Evaluation
(For each of the 5 champions, evaluate structural suitability, specific stiffness/strength/thermal indices, tension-compression symmetry, and notable failure modes)

### ⚙️ Manufacturing, Heat Treatment & Operational Limits
(Provide practical fabrication notes: machinability, composite layup strategy, welding vs bonded lugs, recommended tempers like T6/O, galvanic corrosion isolation, and thermal service thresholds)`;

  // Try Google Gemini Stream
  if (geminiApiKey && geminiApiKey !== "your_gemini_api_key_here") {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    for (const modelName of GEMINI_MODELS) {
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
      } catch (err: any) {
        console.warn(`Gemini model ${modelName} stream failed (${err?.status || err?.message}), trying fallback...`);
      }
    }
  }

  // Cross-Provider Streaming AI Fallback: Groq (ultra-fast, zero quota limitation)
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && groqApiKey !== "your_groq_api_key_here") {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      for (const modelName of GROQ_FALLBACK_MODELS) {
        try {
          const stream = await groq.chat.completions.create({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            stream: true,
            temperature: 0.2,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              yield text;
            }
          }
          return;
        } catch (groqStreamErr) {
          console.warn(`Groq stream fallback with ${modelName} failed:`, groqStreamErr);
        }
      }
    } catch (err) {
      console.warn("Groq cross-provider streaming fallback failed:", err);
    }
  }

  // Fallback Rule-Based Engineering Rationale Generator
  for (const chunk of generateLocalRationaleChunks(userQuery, shortlist)) {
    yield chunk;
    await new Promise((res) => setTimeout(res, 35));
  }
}

function* generateLocalRationaleChunks(
  userQuery: string,
  shortlist: RankedMaterial[]
): Generator<string, void, unknown> {
  yield `### 🏆 Tournament Selection & Trade-Off Matrix\n\n`;
  yield `Based on multi-query constraint expansion for **"${userQuery}"**, candidate materials were pooled across balanced, high-performance, and pragmatic cost frontiers.\n\n`;
  yield `The top ${shortlist.length} champion materials were selected based on multi-attribute utility theory (MAUT) and load-mode-specific Ashby performance indices.\n\n`;

  yield `---\n\n### 🔬 Detailed Candidate Engineering Evaluation\n\n`;

  for (const mat of shortlist) {
    yield `#### ${mat.rank}. ${mat.name} (${mat.material_class}) — *${mat.gemini_badge || "Candidate"}*\n`;
    yield `- **MAUT Utility Score:** \`${mat.maut_score} / 1.0\`\n`;
    if (mat.gemini_verdict) {
      yield `- **Selection Verdict:** ${mat.gemini_verdict}\n`;
    }
    yield `- **Mechanical Performance:** `;

    if (mat.yield_strength_mpa && mat.density_kg_m3) {
      yield `Yield Strength: \`${mat.yield_strength_mpa} MPa\` | Density: \`${mat.density_kg_m3} kg/m³\` | Elastic Modulus: \`${mat.youngs_modulus_gpa ?? "N/A"} GPa\`.\n`;
    } else {
      yield `Balanced structural metrics tailored for ${mat.material_class.toLowerCase()} applications.\n`;
    }

    if (mat.ashby_metrics.mode_index_label && mat.ashby_metrics.mode_index_value) {
      yield `- **Structural Performance Metric (${mat.ashby_metrics.mode_index_label}):** \`${mat.ashby_metrics.mode_index_value}\`\n`;
    }

    yield `- **Cost & Sourcing:** `;
    if (mat.cost_per_kg_usd) {
      yield `Commercial raw material pricing estimated at \`$${mat.cost_per_kg_usd} / kg\`.\n`;
    } else {
      yield `Raw unit cost requires mill quote / supplier specification.\n`;
    }

    yield `\n`;
  }

  yield `---\n\n### ⚙️ Manufacturing, Heat Treatment & Operational Limits\n`;
  yield `- Maintain design load safety factors (N_s ≥ 1.5 - 2.0) to guard against fatigue in dynamic load cycles.\n`;
  yield `- Verify operational temperatures remain within certified continuous service thresholds.\n`;
}
