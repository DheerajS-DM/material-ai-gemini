"use client";

import React from "react";
import { CheckCircle2, Loader2, Sparkles, Database, Calculator, Trophy } from "lucide-react";
import { StageInfo } from "@/hooks/useQuery";

interface ProgressStepperProps {
  stage: StageInfo;
}

const STEPS = [
  { id: "parsing", label: "Groq Multi-Query Expansion", icon: Sparkles },
  { id: "searching", label: "MatWeb Frontier Pool", icon: Database },
  { id: "ranking", label: "Ashby Load-Mode Pre-Score", icon: Calculator },
  { id: "analyzing", label: "Gemini Tournament Selection", icon: Trophy },
];

export function ProgressStepper({ stage }: ProgressStepperProps) {
  if (stage.step === "idle") return null;

  const getStepStatus = (stepId: string) => {
    const order = ["parsing", "searching", "ranking", "analyzing", "done"];
    const currentIndex = order.indexOf(stage.step);
    const stepIndex = order.indexOf(stepId);

    if (stage.step === "done" || stepIndex < currentIndex) {
      return "completed";
    } else if (stepIndex === currentIndex) {
      return "active";
    }
    return "pending";
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-5">
      <div className="matte-panel p-4 rounded-xl border border-zinc-800 bg-[#111115]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <h4 className="text-xs font-semibold text-zinc-200">Execution Pipeline Status</h4>
          </div>
          <span className="text-xs font-mono text-zinc-300 bg-[#18181b] px-3 py-1 rounded-md border border-zinc-800">
            {stage.message || "Processing request..."}
          </span>
        </div>

        {/* Stepper Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-xs ${
                  status === "completed"
                    ? "bg-[#141d18] border-emerald-500/30 text-emerald-300"
                    : status === "active"
                    ? "bg-[#161c24] border-cyan-500/40 text-cyan-200"
                    : "bg-[#18181b] border-zinc-800 text-zinc-500"
                }`}
              >
                <div>
                  {status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 opacity-50" />
                  )}
                </div>
                <span className="font-medium truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
