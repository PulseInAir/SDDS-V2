"use client";

import { useAppContext } from "@/contexts/AppContext";
import { ChevronDown } from "lucide-react";

export function AssessmentYearSelect() {
  const { assessmentYear, setAssessmentYear } = useAppContext();

  const years = ["2024-25", "2025-26", "2026-27"];

  return (
    <div className="relative">
      <select
        value={assessmentYear}
        onChange={(e) => setAssessmentYear(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            AY {year}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
