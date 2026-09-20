import { parseRequirementsWithGroq } from "@/lib/groq-parser";
import { queryMaterials } from "@/lib/database";
import { rankCandidates } from "@/lib/ranker";
import { streamGeminiRationale } from "@/lib/gemini-synth";

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
          // Stage 1: Parse requirements
          sendEvent("stage", { step: "parsing", message: "Extracting quantitative constraints with Groq Llama-3.3..." });
          const constraints = await parseRequirementsWithGroq(query);
          sendEvent("constraints", constraints);

          // Stage 2: Database Search & Filtering
          sendEvent("stage", { step: "searching", message: "Querying MatWeb materials database..." });
          const queryResult = queryMaterials(constraints);
          sendEvent("db_stats", {
            found_count: queryResult.candidates.length,
            total_db_count: queryResult.total_database_count,
            relaxation_logs: queryResult.relaxation_logs,
          });

          // Stage 3: Deterministic Ashby & MAUT Ranking
          sendEvent("stage", { step: "ranking", message: "Calculating Ashby performance indices and MAUT utility scores..." });
          const rankedShortlist = rankCandidates(queryResult.candidates, constraints, 5);
          sendEvent("candidates", rankedShortlist);

          // Stage 4: Engineering Rationale Generation (Gemini 2.0 Flash)
          sendEvent("stage", { step: "analyzing", message: "Generating engineering rationale report with Gemini 2.0 Flash..." });
          for await (const chunk of streamGeminiRationale(query, constraints, rankedShortlist)) {
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
