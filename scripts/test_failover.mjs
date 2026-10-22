import fs from "fs";

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

process.env.GROQ_API_KEY = env.GROQ_API_KEY;
process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;

const { generateMultiQueryWithGroq } = await import("../src/lib/groq-parser.ts");
const { queryMultiMaterials } = await import("../src/lib/database.ts");
const { rankCandidates } = await import("../src/lib/ranker.ts");
const { selectChampionsWithGemini, streamGeminiRationale } = await import("../src/lib/gemini-synth.ts");

const query = "it must handle 2000 degree operating temperature";

console.log("=== Testing 2000C Query with Active Gemini Models & Failover ===");
const expansion = await generateMultiQueryWithGroq(query);
console.log("Expansion load_mode:", expansion.load_mode);
console.log("Feasibility Notes:", expansion.feasibility_notes);

const queryResult = queryMultiMaterials(expansion);
console.log(`Pooled materials count: ${queryResult.candidates.length}`);

const preRankedPool = rankCandidates(
  queryResult.candidates,
  expansion.profiles[0].constraints,
  15,
  expansion.load_mode
);

console.log("\nSelecting champions...");
const champions = await selectChampionsWithGemini(query, expansion, preRankedPool);
console.log(`\nChampions selected successfully (${champions.length}):`);
champions.forEach((c) => {
  console.log(`- #${c.rank} ${c.name} (${c.max_service_temp_c}°C) [${c.gemini_badge}]: "${c.gemini_verdict}"`);
});

console.log("\nStreaming rationale (first 250 chars):");
let streamedText = "";
for await (const chunk of streamGeminiRationale(query, expansion, champions)) {
  streamedText += chunk;
  if (streamedText.length > 250) break;
}
console.log("Streamed Output:\n", streamedText);
console.log("\n>>> LIVE TEST PASSED WITH ZERO CRASHES! <<<");
process.exit(0);
