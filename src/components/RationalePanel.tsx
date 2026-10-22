"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Sparkles, AlertCircle } from "lucide-react";

interface RationalePanelProps {
  rationale: string;
  isProcessing: boolean;
  error?: string | null;
}

/** Pre-processes raw text to strip LaTeX dollar math delimiters ($M_1$ -> M_1) */
function sanitizeMarkdownContent(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\$M_1\$/g, "M_1")
    .replace(/\$M_2\$/g, "M_2")
    .replace(/\$N_s \\ge 1.5 - 2.0\$/g, "N_s ≥ 1.5 - 2.0")
    .replace(/\$N_s\$/g, "N_s")
    .replace(/\$C_m\$/g, "C_m")
    .replace(/\$\\rho\$/g, "ρ")
    .replace(/\$\\sigma_y\$/g, "σ_y")
    .replace(/\$\\sigma_uts\$/g, "σ_uts");
}

export function RationalePanel({ rationale, isProcessing, error }: RationalePanelProps) {
  if (!rationale && !isProcessing && !error) return null;

  const cleanedContent = sanitizeMarkdownContent(rationale);

  return (
    <div className="matte-panel p-6 rounded-xl border border-zinc-800 bg-[#111115] my-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 text-cyan-400 flex items-center justify-center border border-zinc-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <span>Engineering Synthesis & Rationale Report</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#18181b] text-zinc-400 border border-zinc-700">
                Gemini 2.5 Flash
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Zero-fabrication technical analysis of trade-offs, limitations, and manufacturing suitability.
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#18181b] border border-zinc-700 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Streaming Rationale...</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <div>
            <p className="font-semibold">Rationale Generation Notice</p>
            <p className="text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Streamed Markdown Rendered Box */}
      <div className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed">
        {cleanedContent ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ node, ...props }) => (
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-6 mb-3 pb-1 border-b border-zinc-800 flex items-center gap-2" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-xs sm:text-sm font-semibold text-cyan-400 mt-5 mb-2.5 font-mono" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-xs sm:text-sm text-zinc-300 mb-3 leading-relaxed" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-300 mb-4 pl-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-zinc-300 mb-4 pl-1" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-zinc-300 leading-relaxed" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-zinc-100" {...props} />
              ),
              code: ({ node, ...props }) => (
                <code className="px-1.5 py-0.5 rounded bg-[#18181b] text-cyan-300 font-mono text-[11px] border border-zinc-700 font-normal" {...props} />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-5 border-zinc-800" {...props} />
              ),
            }}
          >
            {cleanedContent}
          </ReactMarkdown>
        ) : (
          isProcessing && (
            <div className="py-6 text-center text-zinc-500 text-xs italic font-mono">
              Synthesizing engineering trade-off rationale from shortlisted candidate properties...
            </div>
          )
        )}
      </div>
    </div>
  );
}


