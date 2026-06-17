export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Dashboard <span className="sr-only">Single Digit Data Solutions</span>
        </h1>
      </div>
      
      {/* Urgent Attention Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: "Urgent Cases", value: "3", color: "text-red-600" },
          { name: "Missing Documents", value: "12", color: "text-amber-600" },
          { name: "Follow-ups Due", value: "8", color: "text-blue-600" },
          { name: "Ready to File", value: "5", color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel px-4 py-5 shadow-sm sm:p-6">
            <dt className="truncate text-sm font-medium text-text-secondary">{stat.name}</dt>
            <dd className={`mt-2 text-3xl font-semibold tracking-tight ${stat.color}`}>{stat.value}</dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Workflow Distribution */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-text-primary">Workflow Distribution</h3>
            </div>
            <div className="p-4 sm:p-6 text-sm text-text-muted">
              Summary of all cases by status...
            </div>
          </div>

          {/* Urgent Work Queue */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-text-primary">Urgent Work</h3>
            </div>
            <div className="p-4 sm:p-6 text-sm text-text-muted">
              List of immediate blockers and overdue items...
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Financial Exceptions */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-text-primary">Financial Exceptions</h3>
            </div>
            <div className="p-4 sm:p-6 text-sm text-text-muted">
              Overdue invoices and refunds...
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-text-primary">Recent Activity</h3>
            </div>
            <div className="p-4 sm:p-6 text-sm text-text-muted">
              Timeline of recent case movements...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
