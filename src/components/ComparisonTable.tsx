"use client";

import React from "react";
import { RankedMaterial } from "@/lib/schemas";
import { ExternalLink, Info } from "lucide-react";

interface ComparisonTableProps {
  candidates: RankedMaterial[];
}

export function ComparisonTable({ candidates }: ComparisonTableProps) {
  if (!candidates || candidates.length === 0) return null;

  const renderValue = (val: number | null | undefined, unit: string) => {
    if (val == null) {
      return (
        <span className="inline-flex items-center gap-1 text-zinc-500 italic text-[11px]">
          <Info className="w-3 h-3" /> Not Provided
        </span>
      );
    }
    return (
      <span className="font-mono text-zinc-200 font-medium">
        {val.toLocaleString()} {unit}
      </span>
    );
  };

  return (
    <div className="matte-panel p-6 rounded-xl border border-zinc-800 bg-[#111115] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Candidate Property Matrix</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Quantitative physical, mechanical, thermal, and economic property comparison.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#18181b] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Property Metric</th>
              {candidates.map((c) => (
                <th key={c.material_id} className="py-3 px-4 min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">#{c.rank} {c.name}</span>
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-cyan-400 transition-colors"
                      title="MatWeb Source Sheet"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-normal block mt-0.5">{c.material_class}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 font-sans">
            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">MAUT Utility Score</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4 font-bold text-emerald-400 font-mono">
                  {c.maut_score} / 1.0
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Density (ρ)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.density_kg_m3, "kg/m³")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Yield Strength (σ_y)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.yield_strength_mpa, "MPa")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Ultimate Tensile (σ_uts)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.ultimate_tensile_strength_mpa, "MPa")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Young's Modulus (E)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.youngs_modulus_gpa, "GPa")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Specific Strength (M_1)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.ashby_metrics.m1_strength_to_density, "MPa/(g/cm³)")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Max Service Temp (T_max)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.max_service_temp_c, "°C")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Thermal Conductivity (k)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {renderValue(c.thermal_conductivity_w_mk, "W/m·K")}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Corrosion Resistant</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {c.corrosion_resistant ? (
                    <span className="text-emerald-400 font-semibold">Yes</span>
                  ) : (
                    <span className="text-zinc-500">No</span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-zinc-800/30">
              <td className="py-3 px-4 font-medium text-zinc-400">Unit Cost (C_m)</td>
              {candidates.map((c) => (
                <td key={c.material_id} className="py-3 px-4">
                  {c.cost_per_kg_usd != null ? (
                    <span className="font-mono text-cyan-400 font-bold">${c.cost_per_kg_usd} / kg</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-zinc-500 italic text-[11px]">
                      <Info className="w-3 h-3" /> Not Provided in MatWeb Sheet
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

