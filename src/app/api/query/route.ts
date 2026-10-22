import { generateMultiQueryWithGroq } from "@/lib/groq-parser";
import { queryMultiMaterials } from "@/lib/database";
import { rankCandidates } from "@/lib/ranker";
import { selectChampionsWithGemini, streamGeminiRationale } from "@/lib/gemini-synth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Invalid query text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Stage 1: Multi-hypothesis requirement expansion with Groq
          sendEvent("stage", {
            step: "parsing",
            message: "Deconstructing specification into 3 search frontiers with Groq...",
          });
          const expansion = await generateMultiQueryWithGroq(query);
          sendEvent("expansion", expansion);
          // Send primary constraints for backward compatibility
          sendEvent("constraints", expansion.profiles[0]?.constraints);

          // Stage 2: Database Search across all 3 profiles & candidate pooling
          sendEvent("stage", {
            step: "searching",
            message: "Querying MatWeb across 3 search frontiers & pooling candidate pool...",
          });
          const queryResult = queryMultiMaterials(expansion);
          sendEvent("db_stats", {
            found_count: queryResult.candidates.length,
            total_db_count: queryResult.total_database_count,
            relaxation_logs: queryResult.relaxation_logs,
            profile_stats: queryResult.profile_stats,
          });

          // Stage 3: Load-Mode-Specific Ashby & MAUT Pre-Scoring
          sendEvent("stage", {
            step: "ranking",
            message: `Calculating ${expansion.load_mode} Ashby performance indices for ${queryResult.candidates.length} candidates...`,
          });
          const primaryConstraints = expansion.profiles.find((p) => p.profile_id === "balanced")?.constraints || expansion.profiles[0].constraints;
          const preRankedPool = rankCandidates(
            queryResult.candidates,
            primaryConstraints,
            18,
            expansion.load_mode
          );

          // Stage 3.5: Gemini LLM-as-a-Judge Candidate Tournament Selection
          sendEvent("stage", {
            step: "analyzing",
            message: "Gemini 2.5-Flash judging candidate pool and picking Top 5 Champions...",
          });
          const champions = await selectChampionsWithGemini(query, expansion, preRankedPool);
          sendEvent("candidates", champions);

          // Stage 4: Authoritative Engineering Trade-Off Report Stream
          sendEvent("stage", {
            step: "analyzing",
            message: "Streaming comprehensive engineering trade-off rationale with Gemini 2.5-Flash...",
          });
          for await (const chunk of streamGeminiRationale(query, expansion, champions)) {
            sendEvent("rationale_chunk", { text: chunk });
          }

          sendEvent("complete", { status: "success" });
        } catch (err: any) {
          console.error("Pipeline streaming error:", err);
          sendEvent("error", { message: err?.message || "Internal server processing error" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
