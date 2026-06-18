import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, History, TriangleAlert } from "lucide-react";

import type { getImportPageData } from "@/lib/actions/imports";
import { ImportCommitForm } from "@/components/settings/ImportCommitForm";
import { ImportDryRunForm } from "@/components/settings/ImportDryRunForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ImportPageData = Awaited<ReturnType<typeof getImportPageData>>;

function getJobVariant(status: string) {
  switch (status) {
    case "validated":
      return "info";
    case "committed":
      return "success";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}

function getRowVariant(status: string) {
  switch (status) {
    case "committed":
      return "success";
    case "valid":
      return "info";
    case "skipped":
      return "neutral";
    default:
      return "error";
  }
}

export function ImportPageContent({ data }: { data: ImportPageData }) {
  const selectedJob = data.selectedJob;
  const jobSummary = selectedJob?.job.error_summary ?? {};

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">CSV import</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-muted">
              Use the locked filing-case template to dry-run historical client, filing, invoice, and single-payment records before an explicit commit. The import stays private, auditable, and conservative about conflicting data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="info">Template: filing-case-v1</StatusBadge>
            <StatusBadge>Route: /settings/import</StatusBadge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <ImportDryRunForm />

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Locked CSV template</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Keep the exact header order. Each row represents one filing case with optional filing, invoice, and one payment entry.
                </p>
              </div>
              <FileSpreadsheet className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="text-sm font-medium text-text-primary">Headers</p>
                <p className="mt-2 break-words font-mono text-xs leading-6 text-text-secondary">
                  {data.templateHeaders.join(", ")}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Clients upsert by canonical PAN and only fill missing profile fields.</li>
                <li>Existing filing cases with a different workflow status are rejected instead of silently overwritten.</li>
                <li>Invoice history uses SDDS invoice allocation and stores the source invoice reference in notes when supplied.</li>
                <li>The current commit path supports one optional payment per CSV row; additional historical payments should be added after import.</li>
              </ul>
            </div>
          </section>

          {selectedJob ? (
            <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Dry-run result</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Review row outcomes before committing. Rows already committed by a previous import job are marked as skipped to keep the mapping idempotent.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge variant={getJobVariant(selectedJob.job.status)}>{selectedJob.job.status}</StatusBadge>
                  <StatusBadge>{selectedJob.job.source_filename}</StatusBadge>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 md:grid-cols-4">
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Rows</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{selectedJob.job.total_rows}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Valid</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{selectedJob.job.valid_rows}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Errors</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{selectedJob.job.invalid_rows}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Committed</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{selectedJob.job.committed_rows}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-border-subtle px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant="info">Create {(jobSummary.create_rows as number | undefined) ?? 0}</StatusBadge>
                  <StatusBadge variant="warning">Update {(jobSummary.update_rows as number | undefined) ?? 0}</StatusBadge>
                  <StatusBadge>Skip {(jobSummary.skipped_rows as number | undefined) ?? 0}</StatusBadge>
                  <StatusBadge variant="error">Error {(jobSummary.error_rows as number | undefined) ?? 0}</StatusBadge>
                </div>

                {selectedJob.job.status === "validated" ? (
                  <div className="rounded-[var(--radius-input)] border border-brand-200 bg-brand-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-brand-900">Ready for explicit commit</p>
                        <p className="mt-1 text-sm text-brand-800">
                          Only validated rows will be applied. If a later conflict appears during commit, the job records that failure instead of pretending the import was clean.
                        </p>
                      </div>
                      <ImportCommitForm jobId={selectedJob.job.id} />
                    </div>
                  </div>
                ) : selectedJob.job.status === "committed" ? (
                  <div className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                    The approved rows have been committed. Re-running the same source rows will now dry-run as skipped because the source keys are already recorded.
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    This job contains dry-run or commit errors. Fix the flagged rows and start a fresh dry-run rather than forcing a partial overwrite.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-subtle text-sm">
                    <thead className="bg-surface-muted">
                      <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">PAN</th>
                        <th className="px-3 py-2">AY</th>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Plan / errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-white">
                      {selectedJob.rows.map((row) => {
                        const normalizedRow = row.normalized_row as Record<string, string | null>;
                        const plannedOperations = Array.isArray(row.outcome.plannedOperations)
                          ? (row.outcome.plannedOperations as string[])
                          : [];
                        const warnings = Array.isArray(row.outcome.warnings)
                          ? (row.outcome.warnings as string[])
                          : [];

                        return (
                          <tr key={row.id} className="align-top">
                            <td className="px-3 py-3 font-medium text-text-primary">{row.row_number}</td>
                            <td className="px-3 py-3 font-mono text-text-secondary">{normalizedRow.pan ?? "—"}</td>
                            <td className="px-3 py-3 text-text-secondary">{normalizedRow.assessmentYearLabel ?? "—"}</td>
                            <td className="px-3 py-3 text-text-secondary">{row.action}</td>
                            <td className="px-3 py-3">
                              <StatusBadge variant={getRowVariant(row.row_status)}>{row.row_status}</StatusBadge>
                            </td>
                            <td className="space-y-2 px-3 py-3 text-text-secondary">
                              {plannedOperations.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {plannedOperations.map((item) => (
                                    <StatusBadge key={item} variant="info">
                                      {item}
                                    </StatusBadge>
                                  ))}
                                </div>
                              ) : null}
                              {warnings.length > 0 ? (
                                <div className="flex items-start gap-2 text-xs text-amber-700">
                                  <TriangleAlert className="mt-0.5 h-4 w-4" aria-hidden="true" />
                                  <span>{warnings.join(" ")}</span>
                                </div>
                              ) : null}
                              {row.errors.length > 0 ? (
                                <div className="flex items-start gap-2 text-xs text-red-700">
                                  <TriangleAlert className="mt-0.5 h-4 w-4" aria-hidden="true" />
                                  <span>{row.errors.join(" ")}</span>
                                </div>
                              ) : null}
                              {row.row_status === "committed" ? (
                                <div className="flex items-start gap-2 text-xs text-green-700">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
                                  <span>Committed at {row.committed_at ?? "—"}.</span>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : (
            <EmptyState
              title="No import job selected yet"
              description="Run the dry-run with the locked CSV template to create the first auditable job."
              icon={<History className="h-10 w-10" aria-hidden="true" />}
            />
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Recent jobs</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Each dry-run and commit stays queryable from the settings area without exposing source data outside the authenticated workspace.
                </p>
              </div>
              <History className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            {data.recentJobs.length === 0 ? (
              <div className="px-5 py-6 text-sm text-text-muted">No CSV import jobs have been recorded yet.</div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {data.recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/settings/import?job=${job.id}`}
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-hover"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{job.source_filename}</span>
                      <StatusBadge variant={getJobVariant(job.status)}>{job.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-text-muted">
                      {job.total_rows} rows • {job.valid_rows} valid • {job.invalid_rows} errors • {job.committed_rows} committed
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-text-primary">Import guardrails</h2>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>Invalid or conflicting rows are rejected before commit.</li>
                  <li>Rows already committed by an earlier import dry-run as skipped on repeat.</li>
                  <li>Client enrichment fills missing fields only and does not silently replace richer existing data.</li>
                  <li>Existing filing cases with a different status or active invoice are treated as conflicts, not auto-merges.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
