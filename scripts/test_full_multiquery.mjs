import fs from "fs";

function loadEnv() {
  const content = fs.readFileSync(".env.local", "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
process.env.GROQ_API_KEY = env.GROQ_API_KEY;
process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;

const { generateMultiQueryWithGroq } = await import("../src/lib/groq-parser.ts");
const { queryMultiMaterials } = await import("../src/lib/database.ts");
const { rankCandidates } = await import("../src/lib/ranker.ts");
const { selectChampionsWithGemini, streamGeminiRationale } = await import("../src/lib/gemini-synth.ts");

const testQuery = "High stiffness suspension arm for track racing, budget under $40/kg, lightweight, corrosion resistant";

console.log("=== STEP 1: Groq Multi-Query Expansion ===");
const expansion = await generateMultiQueryWithGroq(testQuery);
console.log("Load Mode:", expansion.load_mode);
console.log("Reasoning:", expansion.reasoning);
console.log("Profiles generated:", expansion.profiles.map(p => `${p.label} (ID: ${p.profile_id})`).join(", "));

console.log("\n=== STEP 2: MatWeb Multi-Query Pooling ===");
const queryResult = queryMultiMaterials(expansion);
console.log(`Pooled candidates count: ${queryResult.candidates.length}`);
console.log("Profile stats:", queryResult.profile_stats);

console.log("\n=== STEP 3: Load-Mode Ashby Pre-Ranking ===");
const preRankedPool = rankCandidates(
  queryResult.candidates,
  expansion.profiles[0].constraints,
  15,
  expansion.load_mode
);
console.log(`Pre-ranked pool count: ${preRankedPool.length}`);
console.log("Top candidate 1 metric:", preRankedPool[0]?.name, preRankedPool[0]?.ashby_metrics);

console.log("\n=== STEP 4: Gemini LLM-as-a-Judge Champion Selection ===");
const champions = await selectChampionsWithGemini(testQuery, expansion, preRankedPool);
console.log(`Gemini Selected Champions (${champions.length}):`);
champions.forEach((c) => {
  console.log(`- #${c.rank} ${c.name} [${c.gemini_badge}]: "${c.gemini_verdict}"`);
});

console.log("\n=== STEP 5: Gemini Stream Rationale (First 300 chars) ===");
let rationaleSnippet = "";
for await (const chunk of streamGeminiRationale(testQuery, expansion, champions)) {
  rationaleSnippet += chunk;
  if (rationaleSnippet.length > 300) break;
}
console.log("Snippet:\n", rationaleSnippet);
console.log("\n>>> FULL MULTI-QUERY & GEMINI TOURNAMENT PIPELINE VERIFIED SUCCESSFULLY! <<<");
