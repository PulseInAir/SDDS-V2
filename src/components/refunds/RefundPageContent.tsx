import Link from "next/link";
import { AlertTriangle, ArrowUpRight, RotateCcw } from "lucide-react";

import type { getRefundsModuleData } from "@/lib/actions/refunds";
import {
  buildRefundQueryHref,
  formatRefundDate,
  formatRefundDateTime,
  formatRefundStatus,
  getRefundAttentionLabel,
  getRefundAttentionVariant,
  getRefundStatusVariant,
} from "@/lib/utils/refunds";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyValue } from "@/components/ui/MoneyValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RefundUpdateForm } from "@/components/refunds/RefundUpdateForm";

type RefundsModuleData = Awaited<ReturnType<typeof getRefundsModuleData>>;

export function RefundPageContent({
  data,
  basePath,
  showClientFilter,
}: {
  data: RefundsModuleData;
  basePath: string;
  showClientFilter: boolean;
}) {
  const activeFilters = data.filters;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Refunds</h1>
            <p className="mt-1 text-sm text-text-muted">
              Track expected versus received amounts, work the overdue queue first, and keep the next follow-up visible.
            </p>
          </div>
          <Link href={basePath} className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Reset filters
          </Link>
        </div>

        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
            <span className="font-medium text-text-primary">Search</span>
            <input
              type="text"
              name="search"
              defaultValue={activeFilters.search ?? ""}
              placeholder="Client, PAN, acknowledgement, or action"
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          {showClientFilter ? (
            <label className="space-y-1 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Client</span>
              <select
                name="clientId"
                defaultValue={activeFilters.clientId ?? ""}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">All clients</option>
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Assessment year</span>
            <select
              name="assessmentYearId"
              defaultValue={activeFilters.assessmentYearId ?? ""}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="">All years</option>
              {data.assessmentYears.map((assessmentYear) => (
                <option key={assessmentYear.id} value={assessmentYear.id}>
                  {assessmentYear.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Status</span>
            <select
              name="status"
              defaultValue={activeFilters.status ?? ""}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="">All statuses</option>
              <option value="expected">Expected</option>
              <option value="processing">Processing</option>
              <option value="follow_up_required">Follow-up Required</option>
              <option value="received">Received</option>
              <option value="adjusted">Adjusted</option>
              <option value="rejected">Rejected</option>
              <option value="not_expected">Not Expected</option>
            </select>
          </label>

          <label className="flex items-end gap-2 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="unresolvedOnly"
              value="true"
              defaultChecked={activeFilters.unresolvedOnly === true}
              className="h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-600"
            />
            <span>Only unresolved</span>
          </label>

          <label className="flex items-end gap-2 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="attentionOnly"
              value="true"
              defaultChecked={activeFilters.attentionOnly === true}
              className="h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-600"
            />
            <span>Only due/overdue</span>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-input)] bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Apply filters
            </button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Expected</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.expectedAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">Total refund value currently tracked in this scope.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.receivedAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">Amounts already credited and recorded.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.pendingAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">{data.summary.unresolvedCount} refunds still need closure.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Attention</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.overdueCount + data.summary.dueCount}</p>
            <p className="mt-1 text-sm text-text-secondary">{data.summary.followUpCount} records are already marked for follow-up.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Refund register</h2>
            <p className="mt-1 text-sm text-text-muted">
              Due, overdue, and follow-up-required records stay ahead of closed refund history.
            </p>
          </div>
          <StatusBadge>{data.refunds.length} records</StatusBadge>
        </div>

        {data.paginatedRefunds.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<RotateCcw className="h-8 w-8" aria-hidden="true" />}
              title="No refunds in this scope"
              description="Adjust the filters or create the first refund record for the relevant filing case."
            />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.paginatedRefunds.map((refund) => (
              <article
                key={refund.id}
                className={`space-y-4 px-5 py-5 ${
                  refund.attentionLevel === "overdue"
                    ? "bg-red-50/40"
                    : refund.attentionLevel === "due" || refund.attentionLevel === "follow_up"
                      ? "bg-yellow-50/50"
                      : ""
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant={getRefundStatusVariant(refund.status)}>
                        {formatRefundStatus(refund.status)}
                      </StatusBadge>
                      <StatusBadge variant={getRefundAttentionVariant(refund.attentionLevel)}>
                        {getRefundAttentionLabel(refund.attentionLevel)}
                      </StatusBadge>
                      <span className="text-sm text-text-muted">
                        {refund.assessment_years?.label ? `AY ${refund.assessment_years.label}` : "No AY"}
                      </span>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-text-primary">{refund.clients?.full_name ?? "Unknown client"}</p>
                      <p className="text-sm text-text-secondary">
                        Case status: {refund.filing_cases?.case_status ?? "Unknown"}
                        {refund.filing_cases?.next_action ? ` • ${refund.filing_cases.next_action}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>Expected {formatRefundDate(refund.expected_date)}</span>
                      <span>Received {formatRefundDate(refund.received_date)}</span>
                      <span>Last checked {formatRefundDateTime(refund.last_checked_at)}</span>
                      {refund.filing_records?.filing_kind ? <span>Filing {refund.filing_records.filing_kind}</span> : null}
                      {refund.filing_records?.acknowledgement_number ? (
                        <span>Ack {refund.filing_records.acknowledgement_number}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/clients/${refund.client_id}/refunds`}
                      className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                    >
                      Client view
                    </Link>
                    <Link
                      href={`/filing-queue/${refund.case_id}`}
                      className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Open case
                      <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Expected</p>
                    <p className="mt-2 text-base font-semibold text-text-primary">
                      <MoneyValue value={refund.expectedAmount} />
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
                    <p className="mt-2 text-base font-semibold text-text-primary">
                      <MoneyValue value={refund.receivedAmount} />
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Pending</p>
                    <p className="mt-2 text-base font-semibold text-text-primary">
                      <MoneyValue value={refund.pendingAmount} />
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Next action</p>
                    <p className="mt-2 text-sm text-text-secondary">{refund.next_action ?? "No next action recorded."}</p>
                  </div>
                </div>

                {refund.attentionLevel === "overdue" ? (
                  <div className="flex items-start gap-2 rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>The expected date has passed and this refund still needs closure or an updated next action.</span>
                  </div>
                ) : null}

                <RefundUpdateForm
                  refund={refund}
                  filingRecordOptions={data.filingRecordOptions.filter((filingRecord) => filingRecord.case_id === refund.case_id)}
                  revalidateTarget={basePath}
                />
              </article>
            ))}
          </div>
        )}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
            <span>
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={buildRefundQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  unresolvedOnly: activeFilters.unresolvedOnly ? "true" : undefined,
                  attentionOnly: activeFilters.attentionOnly ? "true" : undefined,
                  page: data.page > 1 ? String(data.page - 1) : undefined,
                })}
                aria-disabled={data.page <= 1}
                className={`rounded-[var(--radius-input)] border px-3 py-1.5 ${
                  data.page <= 1
                    ? "cursor-not-allowed border-border-subtle text-text-muted"
                    : "border-border-subtle text-text-primary hover:bg-surface-hover"
                }`}
              >
                Previous
              </Link>
              <Link
                href={buildRefundQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  unresolvedOnly: activeFilters.unresolvedOnly ? "true" : undefined,
                  attentionOnly: activeFilters.attentionOnly ? "true" : undefined,
                  page: data.page < data.totalPages ? String(data.page + 1) : undefined,
                })}
                aria-disabled={data.page >= data.totalPages}
                className={`rounded-[var(--radius-input)] border px-3 py-1.5 ${
                  data.page >= data.totalPages
                    ? "cursor-not-allowed border-border-subtle text-text-muted"
                    : "border-border-subtle text-text-primary hover:bg-surface-hover"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
