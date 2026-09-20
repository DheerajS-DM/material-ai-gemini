"use client";

import React, { useRef } from "react";
import { LandingHero } from "@/components/LandingHero";
import { QueryBar } from "@/components/QueryBar";
import { ProgressStepper } from "@/components/ProgressStepper";
import { MaterialCard } from "@/components/MaterialCard";
import { AshbyPlot } from "@/components/AshbyPlot";
import { RadarChart } from "@/components/RadarChart";
import { ComparisonTable } from "@/components/ComparisonTable";
import { RationalePanel } from "@/components/RationalePanel";
import { useQueryPipeline } from "@/hooks/useQuery";
import { Layers, Database, AlertCircle } from "lucide-react";

export default function Home() {
  const querySectionRef = useRef<HTMLDivElement>(null);
  const {
    stage,
    constraints,
    dbStats,
    candidates,
    rationale,
    error,
    isProcessing,
    runQuery,
  } = useQueryPipeline();

  const scrollToQuery = () => {
    querySectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 pb-20">
      {/* 1. Landing Hero Section */}
      <LandingHero onStartClick={scrollToQuery} />

      {/* 2. Main Application Portal Section */}
      <div ref={querySectionRef} className="container max-w-6xl mx-auto px-4 pt-10">
        <div className="text-center mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 bg-[#16161a] px-3 py-1 rounded-md border border-zinc-800">
            MaterialsAI Decision Engine Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mt-3">
            Natural Language Design Intake
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mt-1.5 font-normal">
            Enter your qualitative mechanical, thermal, and economic constraints below.
          </p>
        </div>

        {/* Query Input Bar */}
        <QueryBar onSubmit={runQuery} isProcessing={isProcessing} />

        {/* Execution Pipeline Stepper */}
        <ProgressStepper stage={stage} />

        {/* Relaxation Logs Banner */}
        {dbStats?.relaxation_logs && dbStats.relaxation_logs.length > 0 && (
          <div className="w-full max-w-4xl mx-auto my-4 p-3.5 rounded-lg bg-[#1a1710] border border-amber-800/60 text-amber-300 text-xs font-mono">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Constraint Relaxation Applied</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
              {dbStats.relaxation_logs.map((log, i) => (
                <li key={i}>{log}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Results Overview (Shown when candidates exist) */}
        {candidates.length > 0 && (
          <div className="mt-10 space-y-8">
            {/* Candidates Section Title */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Top Shortlisted Candidates ({candidates.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selected via Ashby performance index optimization & multi-attribute utility theory (MAUT).
                </p>
              </div>

              {dbStats && (
                <span className="text-xs font-mono text-zinc-400 bg-[#16161a] px-3 py-1.5 rounded-md border border-zinc-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Queried {dbStats.total_db_count} MatWeb items</span>
                </span>
              )}
            </div>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((mat) => (
                <MaterialCard key={mat.material_id} material={mat} />
              ))}
            </div>

            {/* Visual Analytics Grid: Ashby Plot & Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AshbyPlot candidates={candidates} />
              <RadarChart candidates={candidates} />
            </div>

            {/* Property Comparison Matrix Table */}
            <ComparisonTable candidates={candidates} />

            {/* Streamed Gemini Engineering Rationale Panel */}
            <RationalePanel rationale={rationale} isProcessing={isProcessing} error={error} />
          </div>
        )}
      </div>
    </main>
  );
}

