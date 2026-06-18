import Link from "next/link";

import { getOperationalDashboardData } from "@/lib/actions/dashboard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-muted">{children}</p>;
}

export default async function HomePage() {
  const data = await getOperationalDashboardData();
  const { metrics } = data;
  const completionRate = metrics.active_clients > 0
    ? Math.round((metrics.completed / metrics.active_clients) * 100)
    : 0;

  const urgentCards = [
    {
      label: "Attention cases",
      value: metrics.attention_cases,
      detail: "Blocked, overdue, notices, rectifications",
      href: "/filing-queue?scope=attention",
      tone: "text-red-600",
    },
    {
      label: "Documents pending",
      value: metrics.documents_pending,
      detail: "Missing, requested, rejected, replacement needed",
      href: "/documents?scope=exceptions",
      tone: "text-amber-600",
    },
    {
      label: "Ready to file",
      value: metrics.ready_to_file,
      detail: "Cases waiting for filing action",
      href: "/filing-queue?status=Ready+To+File",
      tone: "text-emerald-600",
    },
    {
      label: "Follow-ups due",
      value: metrics.follow_ups_due,
      detail: "Due and overdue client follow-ups",
      href: "/follow-up?attentionOnly=true",
      tone: "text-blue-600",
    },
  ];

  const coreMetrics = [
    { label: "Active clients", value: metrics.active_clients, href: "/filing-queue" },
    { label: "New / Yet to start", value: metrics.new_yet_to_start, href: "/filing-queue?status=New+Client" },
    { label: "Verification pending", value: metrics.verification_pending, href: "/filing-queue?status=Verification+Pending" },
    { label: "Computation", value: metrics.computation_in_progress, href: "/filing-queue?status=Computation+In+Progress" },
    { label: "Approval pending", value: metrics.approval_pending, href: "/filing-queue?status=Client+Approval+Pending" },
    { label: "Filed, not complete", value: metrics.filed_not_complete, href: "/filing-queue?status=Filed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">Operational control centre</p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Dashboard <span className="sr-only">Single Digit Data Solutions</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data.assessmentYear?.label ?? "No assessment year selected"} · {data.workspace.name}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Add Client
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {urgentCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-medium text-text-secondary">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold tracking-tight ${card.tone}`}>{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-text-muted">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Workflow Distribution</h2>
                <p className="text-sm text-text-muted">Real filing cases grouped by controlled workflow status.</p>
              </div>
              <div className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
                {completionRate}% completed
              </div>
            </div>
            <div className="space-y-4 p-5">
              {data.workflow.length > 0 ? (
                data.workflow.map((item) => {
                  const width = metrics.active_clients > 0
                    ? Math.max(4, Math.round((item.count / metrics.active_clients) * 100))
                    : 0;

                  return (
                    <Link key={item.status} href={item.destination} className="block rounded-2xl p-2 transition hover:bg-surface-hover">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-text-primary">{item.status}</span>
                        <span className="font-semibold text-text-secondary">{item.count}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-surface-muted">
                        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${width}%` }} />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <EmptyState>No filing cases exist for the selected assessment year.</EmptyState>
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Urgent Work Queue</h2>
                <p className="text-sm text-text-muted">Immediate blockers, overdue cases, notices, and rectifications.</p>
              </div>
              <Link href="/filing-queue?scope=attention" className="text-sm font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.attentionQueue.length > 0 ? (
                data.attentionQueue.map((item) => (
                  <Link key={item.id} href={item.href} className="grid gap-2 px-5 py-4 transition hover:bg-surface-hover sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-text-primary">{item.clientName}</p>
                      <p className="text-xs text-text-muted">{item.pan} · {item.status}</p>
                      <p className="mt-1 text-sm text-text-secondary">{item.nextAction}</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{formatDate(item.dueDate)}</span>
                  </Link>
                ))
              ) : (
                <div className="p-5"><EmptyState>No urgent case is currently flagged.</EmptyState></div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {coreMetrics.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm font-medium text-text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">{item.value}</p>
              </Link>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Financial Exceptions</h2>
              <p className="text-sm text-text-muted">Billed, received, outstanding, overdue, refund and notice signals.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              <Link href="/invoices?scope=billed" className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs font-medium text-text-muted">Billed</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{formatCurrency(metrics.billed)}</p>
              </Link>
              <Link href="/invoices?scope=received" className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs font-medium text-text-muted">Received</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{formatCurrency(metrics.received)}</p>
              </Link>
              {data.financialExceptions.map((item) => (
                <Link key={item.label} href={item.href} className="rounded-2xl bg-surface-muted p-4">
                  <p className="text-xs font-medium text-text-muted">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {item.label !== "Refunds pending" && item.label !== "Notices due"
                      ? formatCurrency(item.value)
                      : item.value}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Filing Queue Snapshot</h2>
              <Link href="/filing-queue" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.queueSnapshot.length > 0 ? (
                data.queueSnapshot.map((item) => (
                  <Link key={item.id} href={item.href} className="block px-5 py-4 transition hover:bg-surface-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{item.clientName}</p>
                        <p className="text-xs text-text-muted">{item.pan}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{item.nextAction}</p>
                  </Link>
                ))
              ) : (
                <div className="p-5"><EmptyState>No active filing queue rows.</EmptyState></div>
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
              <p className="text-sm text-text-muted">Latest recorded SDDS activity events.</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((item) => (
                  <Link key={item.id} href={item.href} className="block px-5 py-4 transition hover:bg-surface-hover">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <span className="shrink-0 text-xs text-text-muted">{item.when}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{item.message}</p>
                  </Link>
                ))
              ) : (
                <div className="p-5"><EmptyState>No activity has been recorded yet.</EmptyState></div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
