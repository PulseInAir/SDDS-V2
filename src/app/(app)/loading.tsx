import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-56 rounded-[var(--radius-input)]" />
        <LoadingSkeleton className="h-4 w-full max-w-2xl rounded-[var(--radius-input)]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <LoadingSkeleton className="h-72 rounded-[var(--radius-panel)] border border-border-subtle" />
        <div className="space-y-4">
          <LoadingSkeleton className="h-28 rounded-[var(--radius-panel)] border border-border-subtle" />
          <LoadingSkeleton className="h-28 rounded-[var(--radius-panel)] border border-border-subtle" />
        </div>
      </div>
    </div>
  );
}
