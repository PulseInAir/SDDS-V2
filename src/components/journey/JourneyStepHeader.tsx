'use client';

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type JourneyHeaderStep = {
  id: string;
  label: string;
  status: "done" | "current" | "future" | "skipped";
};

interface JourneyStepHeaderProps {
  steps: JourneyHeaderStep[];
  currentStepId: string | null;
  onStepClick: (stepId: string) => void;
}

export function JourneyStepHeader({ steps, currentStepId, onStepClick }: JourneyStepHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-4xl mx-auto px-4">
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentStepId;
        const isDone = step.status === "done";
        const isFuture = step.status === "future";
        const isSkipped = step.status === "skipped";

        return (
          <React.Fragment key={step.id}>
            {/* Connector line before this step (except the first) */}
            {idx > 0 && (
              <div className="flex-1 h-[1px] min-w-[16px] max-w-[80px] relative">
                <div
                  className={`absolute inset-0 ${
                    isDone || (steps[idx - 1]?.status === "done")
                      ? "bg-gradient-to-r from-amber-500/40 to-amber-500/20"
                      : "bg-white/5"
                  }`}
                />
                {/* Animated pulse on active connector */}
                {isCurrent && steps[idx - 1]?.status === "done" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/60 to-amber-400/30"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
            )}

            {/* Step pill */}
            <button
              onClick={() => onStepClick(step.id)}
              disabled={isFuture}
              className={`
                relative group flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                transition-all duration-500 min-w-[100px] max-w-[140px]
                ${isFuture ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                ${isCurrent
                  ? "bg-amber-500/[0.08] border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                  : isDone
                  ? "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/20"
                  : isSkipped
                  ? "bg-white/[0.01] border border-white/[0.03] opacity-50"
                  : "bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04]"
                }
              `}
            >
              {/* Status indicator dot */}
              <div className="flex items-center gap-1.5">
                {isDone ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 w-4 h-4 rounded-full bg-amber-500/30 blur-sm"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] relative z-10" />
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                )}

                {/* Step name */}
                <span
                  className={`text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                    isCurrent
                      ? "text-amber-400"
                      : isDone
                      ? "text-white/70"
                      : "text-white/30"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Status text */}
              <span
                className={`text-[9px] font-mono uppercase tracking-widest ${
                  isCurrent
                    ? "text-amber-500/60"
                    : isDone
                    ? "text-emerald-500/50"
                    : isSkipped
                    ? "text-white/20"
                    : "text-white/15"
                }`}
              >
                {isDone ? "done" : isCurrent ? "current" : isSkipped ? "skipped" : "pending"}
              </span>

              {/* Active glow underline */}
              {isCurrent && (
                <motion.div
                  layoutId="activeStepGlow"
                  className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
