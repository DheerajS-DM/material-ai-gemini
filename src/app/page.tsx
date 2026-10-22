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
import { Layers, Database, AlertCircle, Compass, Zap } from "lucide-react";

export default function Home() {
  const querySectionRef = useRef<HTMLDivElement>(null);
  const {
    stage,
    expansion,
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

        {/* Multi-Query Expansion Showcase */}
        {expansion && (
          <div className="w-full max-w-4xl mx-auto my-5 p-4 rounded-xl bg-[#111115] border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Multi-Hypothesis Search Frontiers
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  Mode: {expansion.load_mode.replace("_", " ")}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Deconstructed into 3 parallel constraint queries
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              {expansion.reasoning}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {expansion.profiles.map((p) => {
                const stats = dbStats?.profile_stats?.find((s) => s.profile_id === p.profile_id);
                return (
                  <div
                    key={p.profile_id}
                    className="p-3 rounded-lg bg-[#16161c] border border-zinc-800/90 flex flex-col justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-semibold text-zinc-200">{p.label}</span>
                        {stats && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {stats.found_count} pooled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-400 space-y-0.5">
                      {p.constraints.min_yield_strength_mpa && (
                        <div>σ_y ≥ {p.constraints.min_yield_strength_mpa} MPa</div>
                      )}
                      {p.constraints.min_youngs_modulus_gpa && (
                        <div>E ≥ {p.constraints.min_youngs_modulus_gpa} GPa</div>
                      )}
                      {p.constraints.max_density_kg_m3 && (
                        <div>ρ ≤ {p.constraints.max_density_kg_m3} kg/m³</div>
                      )}
                      {p.constraints.max_cost_per_kg_usd && (
                        <div>Cost ≤ ${p.constraints.max_cost_per_kg_usd}/kg</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Gemini Tournament Champions ({candidates.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selected by Gemini 2.5-Flash from pooled multi-query candidates using Ashby performance indices & trade-off rationale.
                </p>
              </div>

              {dbStats && (
                <span className="text-xs font-mono text-zinc-400 bg-[#16161a] px-3 py-1.5 rounded-md border border-zinc-800 flex items-center gap-1.5 shrink-0">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{dbStats.found_count} pooled from {dbStats.total_db_count} MatWeb items</span>
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
