import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileText } from "lucide-react";

import type { getNoticesModuleData } from "@/lib/actions/notices";
import {
  buildTaxEventQueryHref,
  formatTaxEventDate,
  formatTaxEventStatus,
  formatTaxEventType,
  getTaxEventAttentionLabel,
  getTaxEventAttentionVariant,
  getTaxEventStatusVariant,
  getTaxEventTypeVariant,
} from "@/lib/utils/notices";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyValue } from "@/components/ui/MoneyValue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TaxEventUpdateForm } from "@/components/notices/TaxEventUpdateForm";

type NoticesModuleData = Awaited<ReturnType<typeof getNoticesModuleData>>;

export function TaxEventPageContent({
  data,
  basePath,
  showClientFilter,
}: {
  data: NoticesModuleData;
  basePath: string;
  showClientFilter: boolean;
}) {
  const activeFilters = data.filters;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Intimations / Notices</h1>
            <p className="mt-1 text-sm text-text-muted">
              Work the due and overdue queue first, keep the response trail visible, and close only when the record is truly resolved.
            </p>
          </div>
          <Link href={basePath} className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Reset filters
          </Link>
        </div>

        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
            <span className="font-medium text-text-primary">Search</span>
            <input
              type="text"
              name="search"
              defaultValue={activeFilters.search ?? ""}
              placeholder="Client, PAN, category, reference, or next action"
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
            <span className="font-medium text-text-primary">Type</span>
            <select
              name="eventType"
              defaultValue={activeFilters.eventType ?? ""}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="">All types</option>
              <option value="intimation">Intimation</option>
              <option value="notice">Notice</option>
              <option value="rectification">Rectification</option>
              <option value="defective_return">Defective Return</option>
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
              <option value="open">Open</option>
              <option value="response_due">Response Due</option>
              <option value="submitted">Response Submitted</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
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

          <div className="flex items-end xl:col-span-7 xl:justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-input)] bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Apply filters
            </button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Open records</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.unresolvedCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Notices still requiring action or closure.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Due / overdue</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {data.summary.dueCount + data.summary.overdueCount}
            </p>
            <p className="mt-1 text-sm text-text-secondary">Events with an active response deadline in this scope.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Awaiting closure</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.awaitingClosureCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Responses filed but the event is not yet closed.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Closed</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.closedCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Records completed and kept for history.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Tracked demand</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.totalDemandAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">Demand amounts captured on the active and closed register.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Notice register</h2>
            <p className="mt-1 text-sm text-text-muted">
              Due dates, response submission, document context, and closure stay visible on the same record.
            </p>
          </div>
          <StatusBadge>{data.taxEvents.length} records</StatusBadge>
        </div>

        {data.paginatedTaxEvents.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FileText className="h-8 w-8" aria-hidden="true" />}
              title="No notices in this scope"
              description="Adjust the filters or create the first intimation, notice, rectification, or defective-return record."
            />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.paginatedTaxEvents.map((event) => (
              <article
                key={event.id}
                className={`space-y-4 px-5 py-5 ${
                  event.attentionLevel === "overdue"
                    ? "bg-red-50/40"
                    : event.attentionLevel === "due"
                      ? "bg-yellow-50/50"
                      : ""
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant={getTaxEventTypeVariant(event.event_type)}>
                        {formatTaxEventType(event.event_type)}
                      </StatusBadge>
                      <StatusBadge variant={getTaxEventStatusVariant(event.status)}>
                        {formatTaxEventStatus(event.status)}
                      </StatusBadge>
                      <StatusBadge variant={getTaxEventAttentionVariant(event.attentionLevel)}>
                        {getTaxEventAttentionLabel(event.attentionLevel)}
                      </StatusBadge>
                      <span className="text-sm text-text-muted">
                        {event.assessment_years?.label ? `AY ${event.assessment_years.label}` : "No AY"}
                      </span>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-text-primary">{event.clients?.full_name ?? "Unknown client"}</p>
                      <p className="text-sm text-text-secondary">
                        {event.category}
                        {event.filing_cases?.case_status ? ` • Case ${event.filing_cases.case_status}` : ""}
                        {event.filing_cases?.next_action ? ` • ${event.filing_cases.next_action}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>Issued {formatTaxEventDate(event.issue_date)}</span>
                      <span>Received {formatTaxEventDate(event.received_date)}</span>
                      <span>Due {formatTaxEventDate(event.response_due_date)}</span>
                      <span>Submitted {formatTaxEventDate(event.submission_date)}</span>
                      <span>Closed {formatTaxEventDate(event.closure_date)}</span>
                      {event.filing_records?.filing_kind ? <span>Filing {event.filing_records.filing_kind}</span> : null}
                      {event.filing_records?.acknowledgement_number ? (
                        <span>Ack {event.filing_records.acknowledgement_number}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/clients/${event.client_id}/documents`}
                      className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                    >
                      Documents
                    </Link>
                    <Link
                      href={`/clients/${event.client_id}/notices`}
                      className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                    >
                      Client view
                    </Link>
                    <Link
                      href={`/filing-queue/${event.case_id}`}
                      className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Open case
                      <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Demand amount</p>
                    <p className="mt-2 text-base font-semibold text-text-primary">
                      <MoneyValue value={event.amountValue} />
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Reference</p>
                    <p className="mt-2 text-sm text-text-secondary">{event.reference_number ?? "No reference recorded."}</p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Next action</p>
                    <p className="mt-2 text-sm text-text-secondary">{event.next_action ?? "No next action recorded."}</p>
                  </div>
                  <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-text-muted">Documents</p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {event.caseDocumentCount} case docs
                      {event.filing_record_id ? ` • ${event.filingDocumentCount} filing-linked` : ""}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {event.documentTypePreview.length > 0
                        ? event.documentTypePreview.join(", ")
                        : "Use the Documents tab to attach the relevant files."}
                    </p>
                  </div>
                </div>

                {event.attentionLevel === "overdue" ? (
                  <div className="flex items-start gap-2 rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>The response due date has passed. Update the response or record the closure immediately.</span>
                  </div>
                ) : null}

                <TaxEventUpdateForm
                  taxEvent={event}
                  filingRecordOptions={data.filingRecordOptions.filter((filingRecord) => filingRecord.case_id === event.case_id)}
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
                href={buildTaxEventQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  eventType: activeFilters.eventType,
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
                href={buildTaxEventQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  eventType: activeFilters.eventType,
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
