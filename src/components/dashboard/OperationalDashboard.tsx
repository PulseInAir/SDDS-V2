import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileWarning,
  IndianRupee,
  ReceiptIndianRupee,
  TrendingUp,
} from "lucide-react";

import type { getOperationalDashboardData } from "@/lib/actions/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MaskedValue } from "@/components/ui/MaskedValue";
import { MoneyValue } from "@/components/ui/MoneyValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatFollowUpDate, getFollowUpAttentionLabel, getFollowUpAttentionVariant } from "@/lib/utils/follow-ups";
import { formatInvoiceDate, formatInvoiceStatus, getInvoiceStatusVariant } from "@/lib/utils/invoices";
import { formatTaxEventType, getTaxEventAttentionLabel, getTaxEventAttentionVariant } from "@/lib/utils/notices";
import { formatRefundDate, formatRefundStatus, getRefundAttentionLabel, getRefundAttentionVariant } from "@/lib/utils/refunds";

type DashboardPageData = Awaited<ReturnType<typeof getOperationalDashboardData>>;

const ATTENTION_METRIC_IDS = [
  "attention_cases",
  "refunds_pending",
  "notices_due",
  "follow_ups_due",
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCaseStatusVariant(status: string) {
  if (status === "Completed" || status === "Filed") {
    return "success" as const;
  }

  if (status === "Rectification Required" || status === "Notice Received") {
    return "warning" as const;
  }

  if (status === "On Hold" || status === "Cancelled") {
    return "neutral" as const;
  }

  return "info" as const;
}

function getMetricIcon(metricId: string) {
  switch (metricId) {
    case "attention_cases":
    case "notices_due":
      return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
    case "documents_pending":
      return <FileWarning className="h-4 w-4" aria-hidden="true" />;
    case "refunds_pending":
    case "follow_ups_due":
      return <Clock3 className="h-4 w-4" aria-hidden="true" />;
    case "ready_to_file":
      return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
    default:
      return <BellRing className="h-4 w-4" aria-hidden="true" />;
  }
}

function getMetricTone(metricId: string) {
  switch (metricId) {
    case "ready_to_file":
      return "text-emerald-400";
    case "follow_ups_due":
    case "refunds_pending":
      return "text-amber-400";
    case "attention_cases":
    case "documents_pending":
    case "notices_due":
    default:
      return "text-red-400";
  }
}

function getCaseAttentionVariant(reason: string) {
  if (reason === "Rectification required" || reason === "Notice received" || reason === "Case due date has passed") {
    return "error" as const;
  }

  if (reason === "Due soon" || reason === "Ready to file") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function OperationalDashboard({ data }: { data: DashboardPageData }) {
  if (!data.selectedAssessmentYear) {
    return (
      <EmptyState
        icon={<FileWarning className="h-8 w-8" aria-hidden="true" />}
        title="No assessment year is configured"
        description="Add an assessment year in Settings before the operational dashboard can project filing, billing, refund, notice, and follow-up work."
      />
    );
  }

  const metricMap = new Map(data.metricValues.map((metric) => [metric.id, metric]));
  const attentionMetrics = ATTENTION_METRIC_IDS
    .map((metricId) => metricMap.get(metricId))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  const billedMetric = metricMap.get("billed");
  const receivedMetric = metricMap.get("received");
  const outstandingMetric = metricMap.get("outstanding");
  const overdueMetric = metricMap.get("overdue");

  const billedVal = billedMetric?.value ?? 0;
  const receivedVal = receivedMetric?.value ?? 0;
  const collectionEfficiency = billedVal > 0 ? Math.round((receivedVal / billedVal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Cockpit HUD */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border-subtle pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge variant="info">AY {data.selectedAssessmentYear.label}</StatusBadge>
            <StatusBadge variant={data.selectedAssessmentYear.isOpen ? "success" : "neutral"}>
              {data.selectedAssessmentYear.isOpen ? "Open year" : "Closed year"}
            </StatusBadge>
            {data.selectedAssessmentYear.isCurrent && (
              <StatusBadge variant="neutral">Current</StatusBadge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Operational Cockpit</h1>
          <p className="mt-1 text-sm text-text-muted">
            Real-time practice monitoring, automated filing pipelines, and compliance tracking.
          </p>
        </div>

        {/* Global HUD Mini-Matrix */}
        <div className="flex flex-wrap gap-3">
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Active Cases</p>
            <p className="text-xl font-bold text-text-primary mt-0.5 tabular-nums">{data.activeCaseCount}</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Urgent Queue</p>
            <p className="text-xl font-bold text-brand-400 mt-0.5 tabular-nums">{data.urgentCases.length}</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel/40 backdrop-blur-md px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Recent Events</p>
            <p className="text-xl font-bold text-text-primary mt-0.5 tabular-nums">{data.recentActivity.length}</p>
          </div>
        </div>
      </header>

      {/* 2. Interactive Filing Pipeline Map */}
      <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
          {/* Happy Path Timeline */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Filing Core Pipeline</h2>
                <p className="text-xs text-text-muted">Primary flow from onboarding to completion</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between py-2.5 px-4 overflow-x-auto">
              {/* Connector Line */}
              <div className="absolute top-[28px] left-8 right-8 h-[2px] bg-border-subtle z-0" />

              {/* Nodes */}
              {["New Client", "Filing Queue", "Filed"].map((status) => {
                const group = data.workflowDistribution.find((g) => g.status === status);
                const count = group?.count ?? 0;
                const dest = group?.destination ?? `/filing-queue?status=${encodeURIComponent(status)}`;
                const isCompleted = status === "Filed";
                const isActive = count > 0;

                let pulseColor = "bg-brand-500";
                if (isCompleted) pulseColor = "bg-emerald-500";

                return (
                  <Link
                    key={status}
                    href={dest}
                    className="relative z-10 flex flex-col items-center group focus:outline-none"
                  >
                    <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all duration-300 relative
                      ${isCompleted
                        ? isActive
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'border-border-subtle bg-surface-panel text-text-muted'
                        : isActive
                          ? 'border-brand-500 bg-surface-muted text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:border-brand-400'
                          : 'border-border-subtle bg-surface-panel text-text-muted'}`}
                    >
                      {/* Pulsing glow indicator if active */}
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${pulseColor}`}></span>
                        </span>
                      )}

                      <span className="text-lg font-bold font-mono">{count}</span>
                    </div>
                    <span className="mt-2.5 text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                      {status}
                    </span>
                    <span className="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 font-mono">
                      Open Queue
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider on large screens */}
          <div className="hidden lg:block w-[1px] bg-border-subtle self-stretch mx-4" />

          {/* Exception Statuses */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            <div>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Filing Exceptions</h2>
              <p className="text-xs text-text-muted">Filings paused or suspended</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 h-full items-start">
              {["On Hold", "Cancelled"].map((status) => {
                const group = data.workflowDistribution.find((g) => g.status === status);
                const count = group?.count ?? 0;
                const dest = group?.destination ?? `/filing-queue?status=${encodeURIComponent(status)}`;
                const isHold = status === "On Hold";

                return (
                  <Link
                    key={status}
                    href={dest}
                    className="flex flex-col justify-between p-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted/40 hover:border-brand-300 hover:bg-brand-50/10 transition-all group h-full"
                  >
                    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      {status}
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-[10px] text-text-muted">Cases</span>
                      <span className={`text-lg font-bold font-mono ${count > 0 ? (isHold ? 'text-amber-400' : 'text-slate-400') : 'text-text-muted'}`}>
                        {count}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Metrics Grid */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {attentionMetrics.map((metric) => {
          let accentBorder = "border-l-4 border-l-red-500";
          let glowShadow = "hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]";
          if (metric.id === "refunds_pending" || metric.id === "follow_ups_due") {
            accentBorder = "border-l-4 border-l-amber-500";
            glowShadow = "hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]";
          }

          return (
            <Link
              key={metric.id}
              href={metric.destination}
              className={`interactive-panel p-4 flex flex-col justify-between ${accentBorder} ${glowShadow}`}
            >
              <div>
                <div className={`flex items-center justify-between ${getMetricTone(metric.id)}`}>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                    {getMetricIcon(metric.id)}
                    {metric.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-text-primary font-mono tabular-nums leading-none">
                  {metric.value}
                </p>
              </div>
              <p className="mt-3 text-xs text-text-muted line-clamp-2 leading-relaxed">
                {metric.description}
              </p>
            </Link>
          );
        })}
      </section>

      {/* 4. Main Two-Column Grid */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[1.65fr_1fr]">

        {/* Left Column: Immediate Work Queue & Financial Position */}
        <div className="space-y-6">

          {/* Immediate Work Queue */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Immediate Work Queue</h2>
                <p className="text-xs text-text-muted mt-0.5">Overdue, blocked, or priority cases needing response</p>
              </div>
              <Link
                href="/filing-queue?scope=attention"
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                Open Attention Queue
              </Link>
            </div>

            {data.urgentCases.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />}
                  title="No urgent cases found"
                  description="All filing cases in this assessment year are currently on track."
                />
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {data.urgentCases.map((filingCase) => (
                  <article key={filingCase.id} className="p-4 hover:bg-surface-hover/10 transition-colors">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge variant={getCaseStatusVariant(filingCase.case_status)}>
                            {filingCase.case_status}
                          </StatusBadge>
                          <span className="text-sm font-semibold text-text-primary">{filingCase.client_name}</span>
                          <span className="text-xs text-text-muted font-mono">
                            <MaskedValue value={filingCase.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {filingCase.next_action ?? "No next action recorded"}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          <StatusBadge variant={getCaseAttentionVariant(filingCase.blocker ?? "Needs review")}>
                            {filingCase.blocker}
                          </StatusBadge>
                          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] text-text-muted border border-border-subtle font-mono">
                            Due {filingCase.due_date ? formatInvoiceDate(filingCase.due_date) : "Not scheduled"}
                          </span>
                          {filingCase.expected_completion_date && (
                            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] text-text-muted border border-border-subtle font-mono">
                              Expected {formatInvoiceDate(filingCase.expected_completion_date)}
                            </span>
                          )}
                          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] text-text-muted border border-border-subtle font-mono">
                            Moved {formatDateTime(filingCase.updated_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center self-end sm:self-start">
                        <Link
                          href={`/filing-queue/${filingCase.id}`}
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-1.5 text-xs font-semibold text-brand-400 hover:border-brand-400 hover:bg-brand-950/20 transition-all"
                        >
                          Open Case
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Financial Position Ledger */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Financial Position</h2>
                  <p className="text-xs text-text-muted mt-0.5">Billing overview and collections efficiency</p>
                </div>
                <Link
                  href="/invoices"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  View Ledger
                </Link>
              </div>

              {/* Collection Efficiency Progress Bar */}
              <div className="mt-4 p-3 bg-surface-muted/40 rounded-[var(--radius-input)] border border-border-subtle">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-secondary font-medium inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Collections Efficiency
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">{collectionEfficiency}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    style={{ width: `${collectionEfficiency}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1.5">
                  Collection target is 100% of issued invoices. Derived from total received fees vs total billed fees.
                </p>
              </div>
            </div>

            {/* Fintech Metrics Grid */}
            <div className="grid gap-px bg-border-subtle grid-cols-2 md:grid-cols-4 border-b border-border-subtle">
              <Link href={billedMetric?.destination ?? "/invoices?scope=billed"} className="bg-surface-panel p-4 hover:bg-surface-hover/20 transition-all flex flex-col justify-between">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">Billed</p>
                <div className="mt-2 flex items-center gap-1.5 text-text-primary">
                  <ReceiptIndianRupee className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <MoneyValue value={billedMetric?.value ?? 0} className="text-base font-bold font-mono" />
                </div>
              </Link>
              <Link href={receivedMetric?.destination ?? "/invoices?scope=received"} className="bg-surface-panel p-4 hover:bg-surface-hover/20 transition-all flex flex-col justify-between">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">Received</p>
                <div className="mt-2 flex items-center gap-1.5 text-text-primary">
                  <IndianRupee className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <MoneyValue value={receivedMetric?.value ?? 0} className="text-base font-bold font-mono text-emerald-400" />
                </div>
              </Link>
              <Link href={outstandingMetric?.destination ?? "/invoices?scope=outstanding"} className="bg-surface-panel p-4 hover:bg-surface-hover/20 transition-all flex flex-col justify-between">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">Outstanding</p>
                <div className="mt-2 flex items-center gap-1.5 text-text-primary">
                  <IndianRupee className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <MoneyValue value={outstandingMetric?.value ?? 0} className="text-base font-bold font-mono text-amber-400" />
                </div>
              </Link>
              <Link href={overdueMetric?.destination ?? "/invoices?scope=overdue"} className="bg-surface-panel p-4 hover:bg-surface-hover/20 transition-all flex flex-col justify-between">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">Overdue</p>
                <div className="mt-2 flex items-center gap-1.5 text-text-primary">
                  <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
                  <MoneyValue value={overdueMetric?.value ?? 0} className="text-base font-bold font-mono text-red-400" />
                </div>
              </Link>
            </div>

            {/* Overdue/Outstanding Invoices list */}
            <div className="divide-y divide-border-subtle bg-surface-panel">
              {data.invoiceAttention.length === 0 ? (
                <p className="px-5 py-4 text-xs text-text-muted text-center">No outstanding invoices in this assessment year.</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border-subtle">
                  {data.invoiceAttention.map((invoice) => (
                    <article key={invoice.id} className="px-4 py-3 hover:bg-surface-hover/10 transition-colors flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge variant={getInvoiceStatusVariant(invoice.derived_status)}>
                            {formatInvoiceStatus(invoice.derived_status)}
                          </StatusBadge>
                          <span className="text-xs font-semibold text-text-primary">{invoice.invoice_number}</span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {invoice.client_name} •{" "}
                          <span className="font-mono text-text-muted">
                            <MaskedValue value={invoice.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </span>
                        </p>
                        <p className="text-[10px] text-text-muted font-mono">Due {formatInvoiceDate(invoice.due_date)}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <MoneyValue value={invoice.balance_amount} className="text-xs font-bold text-text-primary font-mono" />
                        <p className="text-[10px] text-text-muted">
                          Paid <MoneyValue value={invoice.paid_amount} className="font-mono" />
                        </p>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-400 hover:underline"
                        >
                          Details
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Watchlists, Follow-ups, and activity stream */}
        <div className="space-y-6">

          {/* Compliance Watchlist */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Compliance Watchlist</h2>
              <p className="text-xs text-text-muted mt-0.5">Refund tracking and notices monitoring</p>
            </div>

            <div className="divide-y divide-border-subtle">
              {data.refundAttention.length === 0 && data.noticeAttention.length === 0 ? (
                <p className="px-5 py-4 text-xs text-text-muted text-center">No unresolved refunds or notices.</p>
              ) : (
                <div className="max-h-[350px] overflow-y-auto divide-y divide-border-subtle">
                  {/* Refunds */}
                  {data.refundAttention.map((refund) => (
                    <article key={refund.id} className="p-4 hover:bg-surface-hover/10 transition-colors border-l-2 border-l-amber-500">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge variant={getRefundAttentionVariant(refund.attention_level)}>
                              {getRefundAttentionLabel(refund.attention_level)}
                            </StatusBadge>
                            <span className="text-xs font-semibold text-text-primary">Refund Tracker</span>
                          </div>
                          <p className="text-xs font-medium text-text-secondary">
                            {refund.client_name} • <span className="font-mono text-text-muted"><MaskedValue value={refund.client_pan} isPrivacyMode={data.isPrivacyMode} /></span>
                          </p>
                          <p className="text-[10px] text-text-muted font-mono">
                            {formatRefundStatus(refund.status)} • Expected {formatRefundDate(refund.expected_date)}
                          </p>
                        </div>
                        <Link
                          href="/refunds?unresolvedOnly=true"
                          className="text-[10px] font-semibold text-brand-400 hover:underline"
                        >
                          Track
                        </Link>
                      </div>
                      {refund.next_action && (
                        <p className="mt-2 text-xs text-text-secondary bg-surface-muted/50 p-2 rounded border border-border-subtle/50 leading-relaxed">
                          {refund.next_action}
                        </p>
                      )}
                    </article>
                  ))}

                  {/* Notices */}
                  {data.noticeAttention.map((notice) => (
                    <article key={notice.id} className="p-4 hover:bg-surface-hover/10 transition-colors border-l-2 border-l-red-500">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge variant={getTaxEventAttentionVariant(notice.attention_level)}>
                              {getTaxEventAttentionLabel(notice.attention_level)}
                            </StatusBadge>
                            <span className="text-xs font-semibold text-text-primary">{formatTaxEventType(notice.event_type)}</span>
                          </div>
                          <p className="text-xs font-medium text-text-secondary">
                            {notice.client_name} • <span className="font-mono text-text-muted"><MaskedValue value={notice.client_pan} isPrivacyMode={data.isPrivacyMode} /></span>
                          </p>
                          <p className="text-[10px] text-text-muted font-mono">Response due {formatInvoiceDate(notice.response_due_date)}</p>
                        </div>
                        <Link
                          href="/notices?attentionOnly=true&unresolvedOnly=true"
                          className="text-[10px] font-semibold text-brand-400 hover:underline"
                        >
                          Respond
                        </Link>
                      </div>
                      {notice.next_action && (
                        <p className="mt-2 text-xs text-text-secondary bg-surface-muted/50 p-2 rounded border border-border-subtle/50 leading-relaxed">
                          {notice.next_action}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Follow-ups Due */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Follow-ups Due</h2>
                <p className="text-xs text-text-muted mt-0.5">Overdue or pending client calls</p>
              </div>
              <Link
                href="/follow-up?attentionOnly=true"
                className="text-xs font-semibold text-brand-400 hover:underline"
              >
                Open Queue
              </Link>
            </div>

            <div className="divide-y divide-border-subtle">
              {data.followUpsDue.length === 0 ? (
                <p className="px-5 py-4 text-xs text-text-muted text-center">No pending follow-ups due.</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border-subtle">
                  {data.followUpsDue.map((followUp) => (
                    <article key={followUp.id} className="p-4 hover:bg-surface-hover/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge variant={getFollowUpAttentionVariant(followUp.attention_level)}>
                              {getFollowUpAttentionLabel(followUp.attention_level)}
                            </StatusBadge>
                            <span className="text-xs font-semibold text-text-primary">{followUp.client_name}</span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            <span className="font-mono text-text-muted"><MaskedValue value={followUp.client_pan} isPrivacyMode={data.isPrivacyMode} /></span> • Due{" "}
                            <span className="font-mono">{formatFollowUpDate(followUp.due_date)}</span>
                          </p>
                        </div>
                        <StatusBadge variant="info">{followUp.follow_up_type.replaceAll("_", " ")}</StatusBadge>
                      </div>

                      {followUp.next_action && (
                        <p className="mt-2 text-xs text-text-secondary bg-surface-muted/50 p-2 rounded border border-border-subtle/50 leading-relaxed">
                          {followUp.next_action}
                        </p>
                      )}

                      <div className="mt-2 text-right">
                        <Link
                          href={followUp.case_id ? `/filing-queue/${followUp.case_id}` : "/follow-up?attentionOnly=true"}
                          className="text-[10px] font-semibold text-brand-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          {followUp.case_id ? "View Case" : "View Follow-up"}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Audit & Activity Log */}
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Audit & Activity Log</h2>
              <p className="text-xs text-text-muted mt-0.5">Recent operations in this assessment year</p>
            </div>

            <div className="divide-y divide-border-subtle">
              {data.recentActivity.length === 0 ? (
                <p className="px-5 py-4 text-xs text-text-muted text-center">No recent activity log.</p>
              ) : (
                <div className="max-h-[350px] overflow-y-auto p-4 space-y-4">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="relative pl-6 pb-2 last:pb-0 border-l border-border-subtle last:border-l-0">
                      {/* Timeline Dot */}
                      <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted border border-border-subtle text-text-muted">
                            {activity.entity_type.replaceAll("_", " ")}
                          </span>
                          <span className="text-xs font-semibold text-text-primary">{activity.client_name}</span>
                          <span className="text-[10px] text-text-muted font-mono ml-auto">{formatDateTime(activity.created_at)}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {activity.message}
                        </p>
                        {activity.case_id && (
                          <div className="pt-1">
                            <Link
                              href={`/filing-queue/${activity.case_id}`}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-400 hover:underline"
                            >
                              View Case
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
