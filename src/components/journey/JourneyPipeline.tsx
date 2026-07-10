'use client';

import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export type JourneyPipelineStep = {
  id: string;
  label: string;
  status: "done" | "current" | "future" | "skipped";
};

interface JourneyPipelineProps {
  steps: JourneyPipelineStep[];
  currentStepId: string | null;
  onStepClick: (id: string) => void;
}

export function JourneyPipeline({ steps, currentStepId, onStepClick }: JourneyPipelineProps) {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-4">
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentStepId;
        const isDone = step.status === "done";
        const isSkipped = step.status === "skipped";
        const isFuture = step.status === "future";

        return (
          <div key={step.id} className="relative flex items-center group">
            {/* Tooltip on hover */}
            <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-end">
              <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-amber-400" : isDone ? "text-white" : "text-neutral-500"}`}>
                {step.label}
              </span>
            </div>

            <button
              onClick={() => onStepClick(step.id)}
              disabled={isFuture}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isFuture ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:scale-110"
              }`}
            >
              {/* Node connecting line */}
              {idx !== 0 && (
                <div className="absolute bottom-full mb-2 h-4 w-[1px] bg-neutral-800" />
              )}

              {isDone ? (
                <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                  <Check className="w-3 h-3 text-neutral-400" />
                </div>
              ) : isCurrent ? (
                <>
                  <motion.div 
                    layoutId="activeOrbGlow"
                    className="absolute inset-0 rounded-full bg-amber-500/20 blur-sm"
                  />
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] z-10" />
                </>
              ) : isSkipped ? (
                <div className="w-3 h-3 rounded-full bg-neutral-800" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
