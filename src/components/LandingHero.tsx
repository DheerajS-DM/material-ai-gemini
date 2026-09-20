"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Zap, ArrowDown, Activity } from "lucide-react";

interface LandingHeroProps {
  onStartClick: () => void;
}

export function LandingHero({ onStartClick }: LandingHeroProps) {
  const [engineStatus, setEngineStatus] = useState<"checking" | "online" | "offline">("checking");
  const [materialCount, setMaterialCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setEngineStatus("online");
          setMaterialCount(data.materials_count || 3850);
        } else {
          setEngineStatus("offline");
        }
      })
      .catch(() => setEngineStatus("offline"));
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20 border-b border-zinc-800/80 bg-[#09090b]">
      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#141418] border border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  engineStatus === "online" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  engineStatus === "online" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-zinc-300">
              {engineStatus === "online"
                ? `Engine Active • ${materialCount ?? 3850} MatWeb Material Records`
                : "Initializing In-Memory Engine..."}
            </span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-zinc-100">
            Autonomous <span className="text-cyan-400 font-mono">Material Selection</span> Engine
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Translate qualitative natural-language design specifications into quantitative constraints, query 3,850+ MatWeb items, calculate Ashby performance indices, and stream zero-fabrication rationale reports.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="matte-panel p-5 rounded-xl border border-zinc-800 bg-[#111115]">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Groq Llama-3.3 NLP Parsing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extracts structured JSON constraints (E, σ_y, ρ, T_max, budget) with strict temperature control.
            </p>
          </div>

          <div className="matte-panel p-5 rounded-xl border border-zinc-800 bg-[#111115]">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-purple-400 mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Ashby & MAUT Optimization</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculates performance tie indices (M_1 = σ_y/ρ, M_2 = sqrt(E)/ρ) and normalizes multi-attribute utility.
            </p>
          </div>

          <div className="matte-panel p-5 rounded-xl border border-zinc-800 bg-[#111115]">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">Gemini 2.0 Rationale Stream</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Streams engineering trade-off analysis while strictly enforcing "Not Provided in Source Data" policies.
            </p>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="flex justify-center">
          <button
            onClick={onStartClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <span>Start Design Analysis</span>
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

