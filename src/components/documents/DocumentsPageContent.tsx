import Link from "next/link";
import { AlertTriangle, Download, FileText, FolderSearch } from "lucide-react";

import type { getDocumentsModuleData } from "@/lib/actions/documents";
import { updateDocumentChecklistStatus } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DOCUMENT_CHECKLIST_STATUSES,
  formatDocumentChecklistStatus,
  formatDocumentSize,
  getDocumentStatusVariant,
} from "@/lib/utils/documents";

type DocumentsModuleData = Awaited<ReturnType<typeof getDocumentsModuleData>>;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildQueryHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function DocumentsPageContent({
  data,
  basePath,
  showClientSearch,
  currentClientId,
}: {
  data: DocumentsModuleData;
  basePath: string;
  showClientSearch: boolean;
  currentClientId?: string;
}) {
  const activeFilters = data.filters;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Documents</h1>
              <p className="mt-1 text-sm text-text-muted">
                Work the checklist exceptions first, then review the latest authorised document history.
              </p>
            </div>
            <Link href={basePath} className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Reset filters
            </Link>
          </div>

          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {showClientSearch ? (
              <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
                <span className="font-medium text-text-primary">Client search</span>
                <input
                  type="text"
                  name="search"
                  defaultValue={activeFilters.search ?? ""}
                  placeholder="Client name or PAN"
                  className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </label>
            ) : null}

            {currentClientId ? <input type="hidden" name="clientId" value={currentClientId} /> : null}

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
              <span className="font-medium text-text-primary">Checklist status</span>
              <select
                name="checklistStatus"
                defaultValue={activeFilters.checklistStatus ?? ""}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">All statuses</option>
                {DOCUMENT_CHECKLIST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatDocumentChecklistStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Document type</span>
              <input
                type="text"
                name="type"
                defaultValue={activeFilters.type ?? ""}
                placeholder="Filter by type"
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </label>

            <div className="flex items-end">
              <Button type="submit" variant="primary" className="w-full">
                Apply filters
              </Button>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex h-full flex-col justify-between rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Exceptions</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.exceptionCount}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary">Missing, requested, rejected, or replacement-needed work.</p>
            </div>
            <div className="flex h-full flex-col justify-between rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Verified</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.verifiedCount}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary">Latest checklist records already verified.</p>
            </div>
            <div className="flex h-full flex-col justify-between rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.receivedCount}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary">Files uploaded and waiting for further review.</p>
            </div>
            <div className="flex h-full flex-col justify-between rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Versioned</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{data.summary.versionedCount}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary">Document chains that already preserve replacement history.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Checklist exceptions</h2>
            <p className="mt-1 text-sm text-text-muted">
              Missing or blocked document work stays ahead of historical browsing.
            </p>
          </div>
          <StatusBadge variant="warning">{data.summary.exceptionCount} active</StatusBadge>
        </div>

        <div className="divide-y divide-border-subtle">
          {data.pendingCasesWithoutDocuments.map((filingCase) => (
            <div key={filingCase.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="warning">No checklist recorded</StatusBadge>
                  <span className="text-sm text-text-muted">{filingCase.assessment_years?.label ?? "No AY"}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{filingCase.clients?.full_name}</p>
                  <p className="text-sm text-text-secondary">
                    Documents Pending case exists without an uploaded or requested document record.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                  <span>Next action: {filingCase.next_action ?? "Record checklist request"}</span>
                  <span>Due: {filingCase.due_date ?? "No due date"}</span>
                </div>
              </div>

              <Link
                href={`/filing-queue/${filingCase.id}`}
                className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Open case
              </Link>
            </div>
          ))}

          {data.chains
            .filter((chain) => ["required", "requested", "rejected", "replacement_needed"].includes(chain.latest.checklist_status))
            .map((chain) => (
              <div key={chain.rootId} className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={getDocumentStatusVariant(chain.latest.checklist_status)}>
                      {formatDocumentChecklistStatus(chain.latest.checklist_status)}
                    </StatusBadge>
                    <span className="text-sm font-medium text-text-primary">{chain.latest.document_type}</span>
                    <span className="text-sm text-text-muted">{chain.latest.assessment_years?.label ?? "No AY"}</span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-text-primary">{chain.latest.clients?.full_name}</p>
                    <p className="text-sm text-text-secondary">
                      Latest version: v{chain.latest.version} • {chain.latest.original_filename}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    <span>Uploaded {formatDate(chain.latest.uploaded_at)}</span>
                    <span>Versions {chain.versions.length}</span>
                    {chain.latest.filing_cases?.next_action ? <span>Next action: {chain.latest.filing_cases.next_action}</span> : null}
                    {chain.latest.filing_cases?.due_date ? <span>Due: {chain.latest.filing_cases.due_date}</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/documents/${chain.latest.id}/download`}
                    className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    Download
                  </a>
                  <Link
                    href={`/clients/${chain.latest.client_id}/documents`}
                    className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <FolderSearch className="mr-2 h-4 w-4" aria-hidden="true" />
                    Client history
                  </Link>
                </div>
              </div>
            ))}

          {data.summary.exceptionCount === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
                title="No active document exceptions"
                description="The current document scope has no missing, rejected, or replacement-needed checklist records."
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Document history</h2>
            <p className="mt-1 text-sm text-text-muted">
              Latest authorised document chains with preserved replacement history.
            </p>
          </div>
          <StatusBadge>{data.visibleChains.length} records</StatusBadge>
        </div>

        {data.paginatedChains.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FileText className="h-8 w-8" aria-hidden="true" />}
              title="No documents in this scope"
              description="Adjust the filters or upload the first document for this client and assessment year context."
            />
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.paginatedChains.map((chain) => (
              <article key={chain.rootId} className="space-y-4 px-5 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant={getDocumentStatusVariant(chain.latest.checklist_status)}>
                        {formatDocumentChecklistStatus(chain.latest.checklist_status)}
                      </StatusBadge>
                      <span className="text-sm font-semibold text-text-primary">{chain.latest.document_type}</span>
                      <span className="text-sm text-text-muted">{chain.latest.clients?.full_name}</span>
                      {chain.latest.assessment_years?.label ? (
                        <span className="text-sm text-text-muted">AY {chain.latest.assessment_years.label}</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>{chain.latest.original_filename}</span>
                      <span>{formatDocumentSize(chain.latest.size_bytes)}</span>
                      <span>Uploaded {formatDate(chain.latest.uploaded_at)}</span>
                      <span>Versions {chain.versions.length}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/api/documents/${chain.latest.id}/download`}
                      className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                    >
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      Latest
                    </a>
                    <Link
                      href={`/clients/${chain.latest.client_id}/documents`}
                      className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                    >
                      Full client view
                    </Link>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[var(--radius-input)] border border-border-subtle">
                  <table className="min-w-full divide-y divide-border-subtle text-sm">
                    <thead className="bg-surface-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Version</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Checklist status</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">File</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Uploaded</th>
                        <th className="px-4 py-3 text-left font-medium text-text-secondary">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-white">
                      {chain.versions.map((version) => (
                        <tr key={version.id}>
                          <td className="px-4 py-3 font-medium text-text-primary">v{version.version}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge variant={getDocumentStatusVariant(version.checklist_status)}>
                                {formatDocumentChecklistStatus(version.checklist_status)}
                              </StatusBadge>
                              {version.verified_at ? (
                                <span className="text-xs text-text-muted">Verified {formatDate(version.verified_at)}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{version.original_filename}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDate(version.uploaded_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/api/documents/${version.id}/download`}
                                className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800"
                              >
                                <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                                Download
                              </a>
                              <form action={updateDocumentChecklistStatus.bind(null, version.id)} className="flex items-center gap-2">
                                <input type="hidden" name="revalidateTarget" value={basePath} />
                                <select
                                  name="checklistStatus"
                                  defaultValue={version.checklist_status}
                                  className="h-8 rounded-[var(--radius-input)] border border-border-subtle bg-white px-2 text-xs text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                                >
                                  {DOCUMENT_CHECKLIST_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                      {formatDocumentChecklistStatus(status)}
                                    </option>
                                  ))}
                                </select>
                                <button type="submit" className="text-xs font-medium text-brand-700 hover:text-brand-800">
                                  Save
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                href={buildQueryHref(basePath, {
                  ...Object.fromEntries(
                    Object.entries(activeFilters).map(([key, value]) => [key, typeof value === "number" ? String(value) : value])
                  ),
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
                href={buildQueryHref(basePath, {
                  ...Object.fromEntries(
                    Object.entries(activeFilters).map(([key, value]) => [key, typeof value === "number" ? String(value) : value])
                  ),
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
