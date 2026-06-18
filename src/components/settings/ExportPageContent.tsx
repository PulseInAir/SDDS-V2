import Link from "next/link";
import { DatabaseBackup, Download, FileSpreadsheet, History, ShieldCheck } from "lucide-react";

import type { getExportPageData } from "@/lib/exports/business";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ExportPageData = Awaited<ReturnType<typeof getExportPageData>>;

export function ExportPageContent({ data }: { data: ExportPageData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Business exports and backup</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-muted">
              Generate server-side CSV exports for practical business recovery and manage the approved off-platform backup
              procedure. Every export is audited, decrypted portal passwords are excluded, and Supabase private Storage
              remains the live document source of truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="info">{data.workspaceName}</StatusBadge>
            <StatusBadge>Route: /settings/export</StatusBadge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Authorised export sets</h2>
                <p className="mt-1 text-sm text-text-muted">
                  CSV exports cover the locked business modules and stay inside the authenticated workspace boundary.
                </p>
              </div>
              <FileSpreadsheet className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
              {data.exports.map((exportDefinition) => (
                <div
                  key={exportDefinition.key}
                  className="flex h-full flex-col justify-between rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary">{exportDefinition.label}</h3>
                      <StatusBadge variant="info">{exportDefinition.rowCount} rows</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{exportDefinition.description}</p>
                  </div>

                  <a
                    href={exportDefinition.route}
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-input)] border border-border-subtle bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download CSV
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-text-primary">Export guardrails</h2>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>Decrypted portal passwords are excluded from every business export.</li>
                  <li>Document exports include metadata and storage inventory, never signed URLs or public links.</li>
                  <li>Each download is generated server-side on demand and recorded in the activity stream.</li>
                  <li>Archived state is preserved in the CSV so recovery and historical review remain possible.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Approved backup destination</h2>
                <p className="mt-1 text-sm text-text-muted">
                  The release backup policy is now locked for encrypted off-platform retention without changing the live
                  storage architecture.
                </p>
              </div>
              <DatabaseBackup className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <div className="space-y-4 px-5 py-4 text-sm">
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="font-medium text-text-primary">{data.backupPolicy.destination}</p>
                <p className="mt-1 text-text-secondary">{data.backupPolicy.primaryStore}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="font-medium text-text-primary">Retention</p>
                  <p className="mt-1 text-text-secondary">{data.backupPolicy.retention}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                  <p className="font-medium text-text-primary">Encryption rule</p>
                  <p className="mt-1 text-text-secondary">{data.backupPolicy.encryption}</p>
                </div>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="font-medium text-text-primary">Backup package contents</p>
                <ul className="mt-3 space-y-2 text-text-secondary">
                  {data.backupPolicy.packageContents.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Recent export activity</h2>
                <p className="mt-1 text-sm text-text-muted">
                  The latest business-export downloads remain visible for audit review without exposing file contents here.
                </p>
              </div>
              <History className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            {data.recentExports.length === 0 ? (
              <EmptyState
                title="No export activity yet"
                description="Generate the first CSV export to create an auditable export trail."
                icon={<History className="h-10 w-10" aria-hidden="true" />}
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {data.recentExports.map((event) => (
                  <div key={event.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{event.exportKey ?? "business-export"}</span>
                      {event.rowCount !== null ? <StatusBadge variant="info">{event.rowCount} rows</StatusBadge> : null}
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{event.message}</p>
                    <p className="mt-1 text-xs text-text-muted">{event.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <DatabaseBackup className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-text-primary">Restore checklist</h2>
                <ol className="mt-3 space-y-2 text-sm text-text-secondary">
                  {data.backupPolicy.restoreChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <Link
                  href="/settings"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-[var(--radius-input)] border border-border-subtle bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                >
                  Return to Settings
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
