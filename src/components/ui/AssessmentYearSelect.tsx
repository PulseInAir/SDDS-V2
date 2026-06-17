"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { setAssessmentYearPreferenceAction } from "@/lib/actions/settings";
import { useAppContext } from "@/contexts/AppContext";
import { ChevronDown } from "lucide-react";

export function AssessmentYearSelect() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { assessmentYears, assessmentYearId, setAssessmentYearId } = useAppContext();

  return (
    <div className="relative">
      <select
        value={assessmentYearId ?? ""}
        disabled={assessmentYears.length === 0 || isPending}
        onChange={(event) => {
          const nextValue = event.target.value;
          const previousValue = assessmentYearId;
          setAssessmentYearId(nextValue || null);

          startTransition(async () => {
            try {
              await setAssessmentYearPreferenceAction(nextValue);
              router.refresh();
            } catch {
              setAssessmentYearId(previousValue);
            }
          });
        }}
        className="h-9 cursor-pointer appearance-none rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel py-1.5 pl-3 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Selected assessment year"
      >
        {assessmentYears.length === 0 ? (
          <option value="">No AY configured</option>
        ) : null}
        {assessmentYears.map((year) => (
          <option key={year.id} value={year.id}>
            AY {year.label}{year.is_open ? "" : " (Closed)"}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
