'use client';

import React from "react";
import { Check, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react";
import type { JourneyStep, JourneyStepId } from "@/lib/workflow/journey-resolver";

interface JourneyPipelineProps {
  steps: JourneyStep[];
  currentStepId: JourneyStepId | null;
  onStepClick: (stepId: JourneyStepId) => void;
}

export function JourneyPipeline({ steps, currentStepId, onStepClick }: JourneyPipelineProps) {
  return (
    <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin">
      <div className="min-w-[800px] flex items-center justify-between px-6 py-4 relative">
        
        {/* Glowing Background Grid Line */}
        <div className="absolute top-[38px] left-[5%] right-[5%] h-[2px] bg-neutral-800 z-0 rounded-full" />
        
        {/* Dynamic Glowing Progress Indicator (Line) */}
        <div 
          className="absolute top-[38px] left-[5%] h-[2px] bg-gradient-to-r from-emerald-500 via-blue-500 to-transparent z-0 rounded-full transition-all duration-700 ease-in-out"
          style={{
            width: `${
              (steps.findIndex((s) => s.id === currentStepId) / (steps.length - 1)) * 90
            }%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isDone = step.status === "done";
          const isSkipped = step.status === "skipped";
          const isFuture = step.status === "future";

          let nodeClass = "";
          let glowClass = "";
          let textClass = "";

          if (isDone) {
            nodeClass = "border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]";
            textClass = "text-emerald-400";
          } else if (isCurrent) {
            nodeClass = "border-blue-500 bg-blue-950/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110 ring-2 ring-blue-500/20";
            glowClass = "animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500/20 opacity-75";
            textClass = "text-blue-400 font-bold";
          } else if (isSkipped) {
            nodeClass = "border-neutral-700 bg-neutral-900/60 text-neutral-500";
            textClass = "text-neutral-500 line-through decoration-neutral-700/60";
          } else {
            // Future
            nodeClass = "border-neutral-800 bg-neutral-950/40 text-neutral-600";
            textClass = "text-neutral-600";
          }

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              disabled={isFuture}
              className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isFuture ? "cursor-not-allowed opacity-50" : "cursor-pointer active:scale-95"
              }`}
              style={{ width: `${100 / steps.length}%` }}
            >
              {/* Pulse glow if active */}
              {isCurrent && <span className={glowClass} />}

              {/* The Step Node Circle */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 relative z-10
                  ${nodeClass} group-hover:border-brand-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]`}
              >
                {isDone ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : isSkipped ? (
                  <span className="text-[10px] font-mono tracking-tighter uppercase font-semibold">SKP</span>
                ) : (
                  <span className="text-sm font-bold font-mono">{idx + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span className={`mt-3 text-xs font-semibold text-center transition-colors px-1 ${textClass} group-hover:text-text-primary`}>
                {step.label}
              </span>

              {/* Mini status indicator */}
              <span className="mt-1 text-[9px] text-text-muted opacity-80 font-mono tracking-wider uppercase">
                {isDone ? "Done" : isCurrent ? "Active" : isSkipped ? "Skipped" : "Locked"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
