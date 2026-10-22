"use client";

import React from "react";
import { RankedMaterial } from "@/lib/schemas";
import { ExternalLink, Award, Shield, DollarSign, Thermometer, Gauge, Sparkles } from "lucide-react";

interface MaterialCardProps {
  material: RankedMaterial;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const profileColors: Record<string, string> = {
    balanced: "text-cyan-400 bg-cyan-950/40 border-cyan-800/60",
    performance_frontier: "text-purple-400 bg-purple-950/40 border-purple-800/60",
    pragmatic_cost: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
  };

  const profileLabel: Record<string, string> = {
    balanced: "Balanced Frontier",
    performance_frontier: "Performance Frontier",
    pragmatic_cost: "Cost & Machining Frontier",
  };

  return (
    <div className="matte-panel p-5 rounded-xl border border-zinc-800 bg-[#111115] hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm">
      <div>
        {/* Gemini Champion Badge Banner */}
        {material.gemini_badge && (
          <div className="mb-3 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/30 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{material.gemini_badge}</span>
          </div>
        )}

        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-zinc-800 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-zinc-700">
              #{material.rank}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#18181b] border border-zinc-800 text-zinc-300 font-medium">
              {material.material_class}
            </span>
            {material.source_profile && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${
                  profileColors[material.source_profile] || "text-zinc-400 bg-zinc-900 border-zinc-800"
                }`}
              >
                {profileLabel[material.source_profile] || material.source_profile}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-emerald-400 text-xs font-mono font-semibold shrink-0">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Score: {material.maut_score}</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-zinc-100">
            {material.name}
          </h4>
          <a
            href={material.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-cyan-400 shrink-0 p-1 transition-colors"
            title="Open MatWeb Spec Sheet"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Gemini Selection Verdict */}
        {material.gemini_verdict && (
          <p className="text-xs text-zinc-400 italic mb-3 bg-[#15151a] p-2 rounded-lg border border-zinc-800/80">
            &ldquo;{material.gemini_verdict}&rdquo;
          </p>
        )}

        {/* Property Metrics Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800/80 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Yield Strength</span>
              <span className="font-mono text-zinc-200 font-medium">
                {material.yield_strength_mpa ? `${material.yield_strength_mpa} MPa` : "N/A"}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800/80 flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400 w-3.5 text-center shrink-0">E</span>
            <div>
              <span className="text-[10px] text-zinc-400 block">Elastic Modulus</span>
              <span className="font-mono text-zinc-200 font-medium">
                {material.youngs_modulus_gpa ? `${material.youngs_modulus_gpa} GPa` : "N/A"}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800/80 flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Max Temp</span>
              <span className="font-mono text-zinc-200 font-medium">
                {material.max_service_temp_c ? `${material.max_service_temp_c}°C` : "N/A"}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#18181b] border border-zinc-800/80 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-400 block">Unit Cost</span>
              <span className="font-mono text-zinc-200 font-medium">
                {material.cost_per_kg_usd ? `$${material.cost_per_kg_usd}/kg` : "Not Provided"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details: Ashby Load-Mode Index & Density */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1 font-mono text-cyan-300">
          <Shield className="w-3 h-3 text-cyan-400" />
          {material.ashby_metrics.mode_index_label || "M_beam"}:{" "}
          <strong className="text-zinc-100">{material.ashby_metrics.mode_index_value ?? "N/A"}</strong>
        </span>
        <span className="font-mono">
          ρ: {material.density_kg_m3 ? `${material.density_kg_m3} kg/m³` : "N/A"}
        </span>
      </div>
    </div>
  );
}
