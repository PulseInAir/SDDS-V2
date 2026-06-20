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

const SUMMARY_METRIC_IDS = [
  "active_clients",
  "new_yet_to_start",
  "filed",
] as const;

const interactivePanelClassName =
  "rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

const compactMetricLinkClassName =
  "rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

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
      return "text-emerald-700";
    case "follow_ups_due":
    case "refunds_pending":
      return "text-amber-700";
    case "attention_cases":
    case "documents_pending":
    case "notices_due":
    default:
      return "text-red-700";
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
  const summaryMetrics = SUMMARY_METRIC_IDS
    .map((metricId) => metricMap.get(metricId))
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));
  const billedMetric = metricMap.get("billed");
  const receivedMetric = metricMap.get("received");
  const outstandingMetric = metricMap.get("outstanding");
  const overdueMetric = metricMap.get("overdue");

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)] xl:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="info">AY {data.selectedAssessmentYear.label}</StatusBadge>
              <StatusBadge variant={data.selectedAssessmentYear.isOpen ? "success" : "neutral"}>
                {data.selectedAssessmentYear.isOpen ? "Open year" : "Closed year"}
              </StatusBadge>
              {data.selectedAssessmentYear.isCurrent ? (
                <StatusBadge variant="neutral">Current</StatusBadge>
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Operational dashboard</h1>
              <p className="mt-1 text-sm text-text-muted">
                Keep urgent filing work, payment exceptions, due follow-ups, and recent case movement visible without leaving the selected assessment year.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Active cases</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{data.activeCaseCount}</p>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Urgent queue</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{data.urgentCases.length}</p>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Recent activity</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{data.recentActivity.length}</p>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {summaryMetrics.map((metric) => (
              <Link
                key={metric.id}
                href={metric.destination}
                className={compactMetricLinkClassName}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{metric.value}</p>
                <p className="mt-1 text-xs text-text-secondary">{metric.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {attentionMetrics.map((metric) => (
          <Link
            key={metric.id}
            href={metric.destination}
            className={interactivePanelClassName + " p-4"}
          >
            <div className={`flex items-center justify-between ${getMetricTone(metric.id)}`}>
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                {getMetricIcon(metric.id)}
                {metric.label}
              </span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">{metric.value}</p>
            <p className="mt-1 text-sm text-text-secondary">{metric.description}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2.05fr)_minmax(19rem,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Workflow distribution</h2>
                <p className="mt-1 text-sm text-text-muted">
                  The filing queue remains the source of truth. These counts link straight back to the same filtered records.
                </p>
              </div>
              <StatusBadge>{data.activeCaseCount} active cases</StatusBadge>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.workflowDistribution.map((statusGroup) => (
                <Link
                  key={statusGroup.status}
                  href={statusGroup.destination}
                  className={compactMetricLinkClassName}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <StatusBadge variant={getCaseStatusVariant(statusGroup.status)}>{statusGroup.status}</StatusBadge>
                      <p className="text-xs text-text-secondary">Open the matching filing queue records</p>
                    </div>
                    <span className="text-xl font-semibold text-text-primary">{statusGroup.count}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Immediate work queue</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Attention statuses, blockers, overdue dates, and filing-ready cases surface first so the next action is obvious.
                </p>
              </div>
              <Link
                href="/filing-queue?scope=attention"
                className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Open attention view
              </Link>
            </div>

            {data.urgentCases.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" aria-hidden="true" />}
                  title="No urgent work in this assessment year"
                  description="When a case becomes overdue, blocked, notice-linked, or filing-ready, it will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {data.urgentCases.map((filingCase) => (
                  <article key={filingCase.id} className="px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge variant={getCaseStatusVariant(filingCase.case_status)}>
                            {filingCase.case_status}
                          </StatusBadge>
                          <span className="text-sm font-medium text-text-primary">{filingCase.client_name}</span>
                          <span className="text-sm text-text-muted">
                            <MaskedValue value={filingCase.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </span>
                        </div>

                        <p className="text-sm text-text-secondary">
                          {filingCase.next_action ?? "No next action recorded"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <StatusBadge variant={getCaseAttentionVariant(filingCase.blocker ?? "Needs review")}>
                            {filingCase.blocker}
                          </StatusBadge>
                          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-text-secondary">
                            Due {filingCase.due_date ? formatInvoiceDate(filingCase.due_date) : "Not scheduled"}
                          </span>
                          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-text-secondary">
                            Expected {filingCase.expected_completion_date ? formatInvoiceDate(filingCase.expected_completion_date) : "Not recorded"}
                          </span>
                          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-text-secondary">
                            Last moved {formatDateTime(filingCase.updated_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start lg:items-center">
                        <Link
                          href={`/filing-queue/${filingCase.id}`}
                          className="inline-flex items-center gap-2 rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                        >
                          Open case
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Financial exceptions</h2>
              <p className="mt-1 text-sm text-text-muted">
                Billing, receipts, and outstanding balances stay distinct, with overdue invoices listed below the totals.
              </p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Link href={billedMetric?.destination ?? "/invoices?scope=billed"} className={compactMetricLinkClassName}>
                <p className="text-xs uppercase tracking-wide text-text-muted">Billed</p>
                <div className="mt-2 flex items-center gap-2 text-text-primary">
                  <ReceiptIndianRupee className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <MoneyValue value={billedMetric?.value ?? 0} className="text-lg font-semibold" />
                </div>
              </Link>
              <Link href={receivedMetric?.destination ?? "/invoices?scope=received"} className={compactMetricLinkClassName}>
                <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
                <div className="mt-2 flex items-center gap-2 text-text-primary">
                  <IndianRupee className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <MoneyValue value={receivedMetric?.value ?? 0} className="text-lg font-semibold" />
                </div>
              </Link>
              <Link href={outstandingMetric?.destination ?? "/invoices?scope=outstanding"} className={compactMetricLinkClassName}>
                <p className="text-xs uppercase tracking-wide text-text-muted">Outstanding</p>
                <div className="mt-2 flex items-center gap-2 text-text-primary">
                  <IndianRupee className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <MoneyValue value={outstandingMetric?.value ?? 0} className="text-lg font-semibold" />
                </div>
              </Link>
              <Link href={overdueMetric?.destination ?? "/invoices?scope=overdue"} className={compactMetricLinkClassName}>
                <p className="text-xs uppercase tracking-wide text-text-muted">Overdue</p>
                <div className="mt-2 flex items-center gap-2 text-text-primary">
                  <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden="true" />
                  <MoneyValue value={overdueMetric?.value ?? 0} className="text-lg font-semibold" />
                </div>
              </Link>
            </div>

            <div className="border-t border-border-subtle">
              {data.invoiceAttention.length === 0 ? (
                <p className="px-5 py-4 text-sm text-text-muted">No outstanding invoices in this assessment year.</p>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {data.invoiceAttention.map((invoice) => (
                    <article key={invoice.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge variant={getInvoiceStatusVariant(invoice.derived_status)}>
                              {formatInvoiceStatus(invoice.derived_status)}
                            </StatusBadge>
                            <span className="text-sm font-medium text-text-primary">{invoice.invoice_number}</span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {invoice.client_name} •{" "}
                            <MaskedValue value={invoice.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </p>
                          <p className="text-xs text-text-muted">Due {formatInvoiceDate(invoice.due_date)}</p>
                        </div>
                        <div className="text-right">
                          <MoneyValue value={invoice.balance_amount} className="text-sm font-semibold text-text-primary" />
                          <p className="mt-1 text-xs text-text-muted">
                            Received <MoneyValue value={invoice.paid_amount} className="text-xs text-text-muted" />
                          </p>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                          >
                            Open invoice
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Resolution watchlist</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Refund follow-through and notice due dates stay visible alongside the filing queue.
                </p>
              </div>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.refundAttention.length === 0 && data.noticeAttention.length === 0 ? (
                <p className="px-5 py-4 text-sm text-text-muted">No unresolved refunds or notices in this assessment year.</p>
              ) : (
                <>
                  {data.refundAttention.map((refund) => (
                    <article key={refund.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge variant={getRefundAttentionVariant(refund.attention_level)}>
                              {getRefundAttentionLabel(refund.attention_level)}
                            </StatusBadge>
                            <span className="text-sm font-medium text-text-primary">Refund</span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {refund.client_name} •{" "}
                            <MaskedValue value={refund.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatRefundStatus(refund.status)} • Expected {formatRefundDate(refund.expected_date)}
                          </p>
                        </div>
                        <Link
                          href="/refunds?unresolvedOnly=true"
                          className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                        >
                          Open
                        </Link>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{refund.next_action ?? "No next action recorded."}</p>
                    </article>
                  ))}

                  {data.noticeAttention.map((notice) => (
                    <article key={notice.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge variant={getTaxEventAttentionVariant(notice.attention_level)}>
                              {getTaxEventAttentionLabel(notice.attention_level)}
                            </StatusBadge>
                            <span className="text-sm font-medium text-text-primary">{formatTaxEventType(notice.event_type)}</span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {notice.client_name} •{" "}
                            <MaskedValue value={notice.client_pan} isPrivacyMode={data.isPrivacyMode} />
                          </p>
                          <p className="text-xs text-text-muted">Response due {formatInvoiceDate(notice.response_due_date)}</p>
                        </div>
                        <Link
                          href="/notices?attentionOnly=true&unresolvedOnly=true"
                          className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                        >
                          Open
                        </Link>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary">{notice.next_action ?? "No next action recorded."}</p>
                    </article>
                  ))}
                </>
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Follow-ups due</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Due and overdue annual follow-ups stay separate from case workflow without leaving the selected year.
                </p>
              </div>
              <Link
                href="/follow-up?attentionOnly=true"
                className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Open queue
              </Link>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.followUpsDue.length === 0 ? (
                <p className="px-5 py-4 text-sm text-text-muted">No follow-ups are due today or overdue.</p>
              ) : (
                data.followUpsDue.map((followUp) => (
                  <article key={followUp.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge variant={getFollowUpAttentionVariant(followUp.attention_level)}>
                            {getFollowUpAttentionLabel(followUp.attention_level)}
                          </StatusBadge>
                          <span className="text-sm font-medium text-text-primary">{followUp.client_name}</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                          <MaskedValue value={followUp.client_pan} isPrivacyMode={data.isPrivacyMode} /> • Due{" "}
                          {formatFollowUpDate(followUp.due_date)}
                        </p>
                        <p className="text-sm text-text-secondary">{followUp.next_action ?? "No next action recorded."}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge variant="info">{followUp.follow_up_type.replaceAll("_", " ")}</StatusBadge>
                        <Link
                          href={followUp.case_id ? `/filing-queue/${followUp.case_id}` : "/follow-up?attentionOnly=true"}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                        >
                          {followUp.case_id ? "Open case" : "Open follow-up"}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="border-b border-border-subtle px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">Recent activity</h2>
              <p className="mt-1 text-sm text-text-muted">
                Append-only business events from the selected year keep the latest movement visible without exposing sensitive values.
              </p>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.recentActivity.length === 0 ? (
                <p className="px-5 py-4 text-sm text-text-muted">No recent case activity is available for this assessment year yet.</p>
              ) : (
                data.recentActivity.map((activity) => (
                  <article key={activity.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge>{activity.entity_type.replaceAll("_", " ")}</StatusBadge>
                          <span className="text-sm font-medium text-text-primary">{activity.client_name}</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                          <MaskedValue value={activity.client_pan} isPrivacyMode={data.isPrivacyMode} /> • {activity.message}
                        </p>
                        <p className="text-xs text-text-muted">{formatDateTime(activity.created_at)}</p>
                      </div>
                      {activity.case_id ? (
                        <Link
                          href={`/filing-queue/${activity.case_id}`}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
