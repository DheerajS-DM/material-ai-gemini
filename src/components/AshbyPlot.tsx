"use client";

import React, { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RankedMaterial } from "@/lib/schemas";
import materialsData from "@/data/materials_db.json";

interface AshbyPlotProps {
  candidates: RankedMaterial[];
}

export function AshbyPlot({ candidates }: AshbyPlotProps) {
  const [metricY, setMetricY] = useState<"youngs_modulus_gpa" | "yield_strength_mpa">("youngs_modulus_gpa");

  // Format all materials in the DB as baseline background points
  const candidateIds = new Set(candidates.map((c) => c.material_id));

  const allPoints = (materialsData as any[])
    .map((m) => {
      const isTop = candidateIds.has(m.material_id);
      const topMatch = candidates.find((c) => c.material_id === m.material_id);

      return {
        id: m.material_id,
        name: m.name,
        materialClass: m.material_class,
        xDensity: m.density_kg_m3 ? Number((m.density_kg_m3 / 1000.0).toFixed(3)) : null, // g/cm³
        yModulus: m.youngs_modulus_gpa ? Number(m.youngs_modulus_gpa.toFixed(1)) : null,
        yStrength: m.yield_strength_mpa ? Number(m.yield_strength_mpa.toFixed(1)) : null,
        isTop,
        rank: topMatch?.rank || null,
        score: topMatch?.maut_score || null,
      };
    })
    .filter((p) => p.xDensity !== null && (metricY === "youngs_modulus_gpa" ? p.yModulus !== null : p.yStrength !== null));

  // Colors based on material classes
  const getClassColor = (materialClass: string, isTop: boolean) => {
    if (isTop) return "#06b6d4"; // Cyan for top candidate
    switch (materialClass) {
      case "Metals and alloys":
        return "#3b82f6"; // Blue
      case "Polymers and elastomers":
        return "#a855f7"; // Purple
      case "Ceramics and glasses":
        return "#f59e0b"; // Amber
      case "Composites":
        return "#10b981"; // Emerald
      default:
        return "#71717a";
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-700 text-xs shadow-2xl space-y-1">
          <p className="font-bold text-zinc-100">{data.name}</p>
          <p className="text-cyan-400 font-medium">{data.materialClass}</p>
          <div className="pt-1 space-y-0.5 text-zinc-300 font-mono text-[11px]">
            <p>Density (ρ): <span className="text-zinc-100">{data.xDensity} g/cm³</span></p>
            <p>
              {metricY === "youngs_modulus_gpa" ? "Young's Modulus (E):" : "Yield Strength (σ_y):"}{" "}
              <span className="text-zinc-100">
                {metricY === "youngs_modulus_gpa" ? `${data.yModulus} GPa` : `${data.yStrength} MPa`}
              </span>
            </p>
            {data.isTop && (
              <p className="text-emerald-400 font-semibold pt-1">
                Rank #{data.rank} (MAUT Score: {data.score})
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="matte-panel p-6 rounded-xl border border-zinc-800 bg-[#111115]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Dynamic Ashby Property Chart</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Log Scale
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualizing structural performance trade-offs across 3,850+ materials.
          </p>
        </div>

        {/* Toggle metric */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setMetricY("youngs_modulus_gpa")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              metricY === "youngs_modulus_gpa"
                ? "bg-zinc-800 text-cyan-300 border border-zinc-700 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Stiffness vs Density (E vs ρ)
          </button>
          <button
            onClick={() => setMetricY("yield_strength_mpa")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              metricY === "yield_strength_mpa"
                ? "bg-zinc-800 text-cyan-300 border border-zinc-700 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Strength vs Density (σ_y vs ρ)
          </button>
        </div>
      </div>

      {/* Ashby Scatter Plot Container */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
            <XAxis
              type="number"
              dataKey="xDensity"
              name="Density"
              unit=" g/cm³"
              stroke="#71717a"
              fontSize={11}
              domain={["auto", "auto"]}
              scale="log"
              tickFormatter={(val) => (typeof val === "number" ? val.toFixed(1) : val)}
            />
            <YAxis
              type="number"
              dataKey={metricY === "youngs_modulus_gpa" ? "yModulus" : "yStrength"}
              name={metricY === "youngs_modulus_gpa" ? "Modulus" : "Strength"}
              unit={metricY === "youngs_modulus_gpa" ? " GPa" : " MPa"}
              stroke="#71717a"
              fontSize={11}
              domain={["auto", "auto"]}
              scale="log"
              tickFormatter={(val) =>
                typeof val === "number"
                  ? val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : `${val >= 10 ? val.toFixed(0) : val.toFixed(1)}`
                  : val
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Materials" data={allPoints}>
              {allPoints.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getClassColor(entry.materialClass, entry.isTop)}
                  r={entry.isTop ? 7 : 3.5}
                  stroke={entry.isTop ? "#ffffff" : "none"}
                  strokeWidth={entry.isTop ? 2 : 0}
                  opacity={entry.isTop ? 1 : 0.4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Material Class Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white/80" />
          <span className="font-semibold text-zinc-200">Top Candidate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Metals & Alloys</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Polymers & Elastomers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Ceramics & Glasses</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Composites</span>
        </div>
      </div>
    </div>
  );
}

