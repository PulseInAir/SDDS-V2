import { LockKeyhole, Receipt, Settings2 } from "lucide-react";

import {
  getSettingsPageData,
  setAssessmentYearOpenStateAction,
  setCurrentAssessmentYearAction,
} from "@/lib/actions/settings";
import { AssessmentYearCreateForm } from "@/components/settings/AssessmentYearCreateForm";
import { PrivacySettingsForm } from "@/components/settings/PrivacySettingsForm";
import { StatusBadge } from "@/components/ui/StatusBadge";

type SettingsPageData = Awaited<ReturnType<typeof getSettingsPageData>>;

export function SettingsPageContent({ data }: { data: SettingsPageData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
            <p className="mt-1 text-sm text-text-muted">
              Keep workspace configuration focused on assessment years, invoice numbering visibility, and privacy-safe operator defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="info">{data.workspace.name}</StatusBadge>
            {data.shell.selectedAssessmentYearId ? (
              <StatusBadge>
                Active AY{" "}
                {data.assessmentYears.find((assessmentYear) => assessmentYear.id === data.shell.selectedAssessmentYearId)?.label ??
                  "Not set"}
              </StatusBadge>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <AssessmentYearCreateForm />

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Configured assessment years</h2>
                <p className="mt-1 text-sm text-text-muted">
                  One year should stay current. Closed years remain in history while dropping out of live operational use.
                </p>
              </div>
              <Settings2 className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            {data.assessmentYears.length === 0 ? (
              <div className="px-5 py-6 text-sm text-text-muted">
                Add the first assessment year to unlock shell selection, filing-case defaults, and invoice serial previews.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {data.assessmentYears.map((assessmentYear) => (
                  <div key={assessmentYear.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">{assessmentYear.label}</h3>
                        {assessmentYear.is_current ? <StatusBadge variant="info">Current</StatusBadge> : null}
                        <StatusBadge variant={assessmentYear.is_open ? "success" : "neutral"}>
                          {assessmentYear.is_open ? "Open" : "Closed"}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {assessmentYear.start_date} to {assessmentYear.end_date}
                      </p>
                      <p className="text-xs text-text-muted">
                        Next invoice serial preview: SDDS/ITR/{assessmentYear.label}/{String(assessmentYear.nextInvoiceSerial).padStart(3, "0")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!assessmentYear.is_current && assessmentYear.is_open ? (
                        <form action={setCurrentAssessmentYearAction}>
                          <input type="hidden" name="assessmentYearId" value={assessmentYear.id} />
                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-input)] border border-border-subtle bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                          >
                            Set current
                          </button>
                        </form>
                      ) : !assessmentYear.is_current ? (
                        <span className="inline-flex h-10 items-center rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-4 text-sm text-text-muted">
                          Reopen to set current
                        </span>
                      ) : null}

                      {!assessmentYear.is_current ? (
                        <form action={setAssessmentYearOpenStateAction}>
                          <input type="hidden" name="assessmentYearId" value={assessmentYear.id} />
                          <input type="hidden" name="isOpen" value={assessmentYear.is_open ? "false" : "true"} />
                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-input)] border border-border-subtle bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
                          >
                            {assessmentYear.is_open ? "Close year" : "Reopen year"}
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex h-10 items-center rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-4 text-sm text-text-muted">
                          Current year stays open
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Invoice configuration</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Invoice identity stays database-allocated and assessment-year scoped. This task keeps the configuration controlled and non-speculative.
                </p>
              </div>
              <Receipt className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>

            <dl className="mt-4 space-y-4 text-sm">
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <dt className="font-medium text-text-primary">Numbering contract</dt>
                <dd className="mt-1 font-mono text-text-secondary">SDDS/ITR/{"{AY}"}/{"{Serial}"}</dd>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <dt className="font-medium text-text-primary">Serial reset rule</dt>
                <dd className="mt-1 text-text-secondary">Each configured assessment year keeps its own atomic next serial.</dd>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <dt className="font-medium text-text-primary">Issued records in workspace</dt>
                <dd className="mt-1 text-text-secondary">{data.invoiceCount} invoice record{data.invoiceCount === 1 ? "" : "s"} currently exist.</dd>
              </div>
              <div className="rounded-[var(--radius-input)] border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <dt className="font-medium">Pending owner decision</dt>
                <dd className="mt-1 text-sm">
                  Legal invoice identity, GST treatment, logo, and signature assets remain intentionally deferred by open decision O-002.
                </dd>
              </div>
            </dl>
          </section>

          <PrivacySettingsForm initialPrivacyMode={data.shell.isPrivacyMode} />

          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Security boundary</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Privacy Mode affects supported screens consistently, but it does not replace authorisation or the credential reveal flow.
                </p>
              </div>
              <LockKeyhole className="h-5 w-5 text-text-muted" aria-hidden="true" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>Portal passwords remain hidden until the authorised reveal action is used.</li>
              <li>Invoice, payment, and refund values stay masked by default when Privacy Mode is on.</li>
              <li>Closed assessment years preserve history without weakening RLS, storage privacy, or auditability.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
