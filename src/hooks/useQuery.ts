import { useState, useCallback } from "react";
import { MaterialQueryConstraints, RankedMaterial } from "@/lib/schemas";

export interface StageInfo {
  step: "parsing" | "searching" | "ranking" | "analyzing" | "done" | "idle";
  message: string;
}

export interface DbStats {
  found_count: number;
  total_db_count: number;
  relaxation_logs: string[];
}

export function useQueryPipeline() {
  const [stage, setStage] = useState<StageInfo>({ step: "idle", message: "" });
  const [constraints, setConstraints] = useState<MaterialQueryConstraints | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [candidates, setCandidates] = useState<RankedMaterial[]>([]);
  const [rationale, setRationale] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const runQuery = useCallback(async (queryText: string) => {
    setIsProcessing(true);
    setError(null);
    setCandidates([]);
    setRationale("");
    setConstraints(null);
    setDbStats(null);
    setStage({ step: "parsing", message: "Connecting to server engine..." });

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          if (eventMatch && dataMatch) {
            const eventName = eventMatch[1].trim();
            const rawData = dataMatch[1].trim();

            try {
              const data = JSON.parse(rawData);

              switch (eventName) {
                case "stage":
                  setStage(data);
                  break;
                case "constraints":
                  setConstraints(data);
                  break;
                case "db_stats":
                  setDbStats(data);
                  break;
                case "candidates":
                  setCandidates(data);
                  break;
                case "rationale_chunk":
                  if (data.text) {
                    setRationale((prev) => prev + data.text);
                  }
                  break;
                case "complete":
                  setStage({ step: "done", message: "Analysis complete!" });
                  setIsProcessing(false);
                  break;
                case "error":
                  setError(data.message || "An error occurred during query processing");
                  setIsProcessing(false);
                  break;
              }
            } catch (err) {
              console.warn("Error parsing SSE event data:", rawData);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Query pipeline failed:", err);
      setError(err?.message || "Failed to execute query pipeline");
      setStage({ step: "idle", message: "" });
      setIsProcessing(false);
    }
  }, []);

  return {
    stage,
    constraints,
    dbStats,
    candidates,
    rationale,
    error,
    isProcessing,
    runQuery,
  };
}
