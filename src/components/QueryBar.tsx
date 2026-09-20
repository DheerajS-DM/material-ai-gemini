"use client";

import React, { useState } from "react";
import { Sparkles, SlidersHorizontal, ArrowRight } from "lucide-react";

interface QueryBarProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
}

const PRESET_QUERIES = [
  {
    label: "🚀 Aerospace Track Racing Arm",
    query: "High stiffness suspension arm for track racing, budget under $40/kg, lightweight, corrosion resistant",
  },
  {
    label: "🔥 High-Temp Turbine Component",
    query: "High temperature turbine component operating above 800°C with high tensile strength and creep resistance",
  },
  {
    label: "🚲 Ultralight Bike Frame",
    query: "Lightweight bicycle frame material with high Young's modulus, corrosion resistant, under 3000 kg/m3 density",
  },
  {
    label: "🦴 Biocompatible Orthopedic Implant",
    query: "Biocompatible high strength implant material resistant to human body fluid corrosion with high fatigue limit",
  },
  {
    label: "🏗️ Low Cost Structural Beam",
    query: "Economical low cost structural beam material for heavy building construction with yield strength above 250 MPa",
  },
];

export function QueryBar({ onSubmit, isProcessing }: QueryBarProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSubmit(inputText.trim());
  };

  const handlePresetSelect = (presetQuery: string) => {
    setInputText(presetQuery);
    onSubmit(presetQuery);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <div className="matte-panel p-2 rounded-xl flex items-center bg-[#111115] border border-zinc-800 focus-within:border-zinc-600 transition-colors shadow-sm">
          <div className="pl-3 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe your engineering application & requirements in plain English..."
            disabled={isProcessing}
            className="w-full bg-transparent px-3 py-3 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs sm:text-sm hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-100 transition-colors shrink-0"
          >
            <span>{isProcessing ? "Processing..." : "Evaluate"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3 text-zinc-400" /> Presets:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetSelect(preset.query)}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-md bg-[#16161a] hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-cyan-300 transition-colors disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

