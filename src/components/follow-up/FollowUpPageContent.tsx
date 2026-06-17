import Link from "next/link";
import { AlertTriangle, ArrowUpRight, MessageSquare, PhoneCall } from "lucide-react";

import type { getFollowUpsModuleData } from "@/lib/actions/follow-ups";
import {
  buildFollowUpQueryHref,
  buildWhatsAppHref,
  formatCommunicationChannel,
  formatFollowUpDate,
  formatFollowUpDateTime,
  formatFollowUpStatus,
  formatFollowUpType,
  getFollowUpAttentionLabel,
  getFollowUpAttentionVariant,
  getFollowUpStatusVariant,
  getFollowUpTypeVariant,
} from "@/lib/utils/follow-ups";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FollowUpUpdateForm } from "@/components/follow-up/FollowUpUpdateForm";

type FollowUpsModuleData = Awaited<ReturnType<typeof getFollowUpsModuleData>>;

export function FollowUpPageContent({
  data,
  basePath,
  showClientFilter,
}: {
  data: FollowUpsModuleData;
  basePath: string;
  showClientFilter: boolean;
}) {
  const activeFilters = data.filters;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Follow-up</h1>
            <p className="mt-1 text-sm text-text-muted">
              Prioritise due work, keep the next step visible, and preserve each contact before the annual cycle slips.
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
              placeholder="Client, PAN, mobile, next action, or last contact"
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
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="excluded">Excluded</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Open</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.openCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Live follow-ups still waiting for contact or closure.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Due today</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.dueCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Work that should move before the day closes.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.overdueCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Follow-ups that have already slipped past their due date.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Excluded</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.excludedCount}</p>
            <p className="mt-1 text-sm text-text-secondary">Recoverable records deliberately kept out of the queue.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.completedCount}</p>
            <p className="mt-1 text-sm text-text-secondary">History retained after the next step has genuinely finished.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Follow-up queue</h2>
            <p className="mt-1 text-sm text-text-muted">
              Each row keeps the annual cycle, contact trail, exclusion state, and next step in one operational place.
            </p>
          </div>
          <StatusBadge>{data.followUps.length} records</StatusBadge>
        </div>

        {data.paginatedFollowUps.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<PhoneCall className="h-8 w-8" aria-hidden="true" />}
              title="No follow-ups in this scope"
              description="Complete a filing case to enrol the next-year follow-up, or adjust the filters to find excluded and historical records."
            />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.paginatedFollowUps.map((followUp) => {
              const whatsAppHref = buildWhatsAppHref(followUp.clients?.mobile ?? null);

              return (
                <article
                  key={followUp.id}
                  className={`space-y-4 px-5 py-5 ${
                    followUp.attentionLevel === "overdue"
                      ? "bg-red-50/40"
                      : followUp.attentionLevel === "due"
                        ? "bg-yellow-50/50"
                        : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge variant={getFollowUpTypeVariant(followUp.follow_up_type)}>
                          {formatFollowUpType(followUp.follow_up_type)}
                        </StatusBadge>
                        <StatusBadge variant={getFollowUpStatusVariant(followUp.status)}>
                          {formatFollowUpStatus(followUp.status)}
                        </StatusBadge>
                        <StatusBadge variant={getFollowUpAttentionVariant(followUp.attentionLevel)}>
                          {getFollowUpAttentionLabel(followUp.attentionLevel)}
                        </StatusBadge>
                        <span className="text-sm text-text-muted">
                          {followUp.assessment_years?.label ? `AY ${followUp.assessment_years.label}` : "Client-level"}
                        </span>
                      </div>

                      <div>
                        <p className="text-base font-semibold text-text-primary">{followUp.clients?.full_name ?? "Unknown client"}</p>
                        <p className="text-sm text-text-secondary">
                          Due {formatFollowUpDate(followUp.due_date)}
                          {followUp.filing_cases?.case_status ? ` • Case ${followUp.filing_cases.case_status}` : ""}
                          {followUp.filing_cases?.next_action ? ` • ${followUp.filing_cases.next_action}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                        <span>Next action {followUp.next_action ?? "Not recorded"}</span>
                        <span>Completed {formatFollowUpDateTime(followUp.completed_at)}</span>
                        <span>Excluded {formatFollowUpDateTime(followUp.excluded_at)}</span>
                        {followUp.latestCommunication ? (
                          <span>
                            Last contact {formatFollowUpDateTime(followUp.latestCommunication.communication_at)} via{" "}
                            {formatCommunicationChannel(followUp.latestCommunication.channel)}
                          </span>
                        ) : (
                          <span>No contact logged yet</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/clients/${followUp.client_id}/communications`}
                        className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                        Client view
                      </Link>
                      {whatsAppHref ? (
                        <a
                          href={whatsAppHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {followUp.case_id ? (
                        <Link
                          href={`/filing-queue/${followUp.case_id}`}
                          className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          Open case
                          <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted">Latest contact</p>
                      <p className="mt-2 text-sm text-text-secondary">
                        {followUp.latestCommunication?.summary ?? "No contact summary recorded yet."}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted">Exclusion reason</p>
                      <p className="mt-2 text-sm text-text-secondary">
                        {followUp.exclusion_reason ?? "No exclusion on this record."}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted">Notes</p>
                      <p className="mt-2 text-sm text-text-secondary">{followUp.notes ?? "No extra notes recorded."}</p>
                    </div>
                  </div>

                  {followUp.attentionLevel === "overdue" ? (
                    <div className="flex items-start gap-2 rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>The due date has passed. Log the latest contact or reactivate the next step immediately.</span>
                    </div>
                  ) : null}

                  <FollowUpUpdateForm followUp={followUp} revalidateTarget={basePath} />
                </article>
              );
            })}
          </div>
        )}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-4 text-sm text-text-secondary">
            <span>
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={buildFollowUpQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
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
                href={buildFollowUpQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
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
