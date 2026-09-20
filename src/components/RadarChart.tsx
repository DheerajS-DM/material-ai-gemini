"use client";

import React from "react";
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RankedMaterial } from "@/lib/schemas";

interface RadarChartProps {
  candidates: RankedMaterial[];
}

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

export function RadarChart({ candidates }: RadarChartProps) {
  if (!candidates || candidates.length === 0) return null;

  // Transform candidates into radar axes format
  const data = [
    {
      dimension: "Yield Strength",
      ...candidates.reduce((acc, c) => ({ ...acc, [c.name]: c.dimension_scores.strength }), {}),
    },
    {
      dimension: "Elastic Stiffness",
      ...candidates.reduce((acc, c) => ({ ...acc, [c.name]: c.dimension_scores.stiffness }), {}),
    },
    {
      dimension: "Weight Efficiency",
      ...candidates.reduce((acc, c) => ({ ...acc, [c.name]: c.dimension_scores.weight }), {}),
    },
    {
      dimension: "Cost Efficiency",
      ...candidates.reduce((acc, c) => ({ ...acc, [c.name]: c.dimension_scores.cost }), {}),
    },
  ];

  return (
    <div className="matte-panel p-6 rounded-xl border border-zinc-800 bg-[#111115]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-100">Multi-Attribute Property Radar</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Normalized comparison [0-100] across strength, stiffness, lightness, and cost efficiency.
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={data} outerRadius="55%" cx="50%" cy="45%">
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis dataKey="dimension" stroke="#a1a1aa" fontSize={11} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={9} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#3f3f46",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                color: "#fafafa",
              }}
            />
            {candidates.map((c, index) => (
              <Radar
                key={c.material_id}
                name={`#${c.rank} ${c.name}`}
                dataKey={c.name}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* Clean Custom Multi-Column Legend */}
      <div className="mt-2 pt-4 border-t border-zinc-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {candidates.map((c, index) => (
            <div key={c.material_id} className="flex items-center gap-2 min-w-0" title={c.name}>
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-semibold text-zinc-300 font-mono shrink-0">#{c.rank}</span>
              <span className="text-zinc-400 truncate text-[11px]">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

