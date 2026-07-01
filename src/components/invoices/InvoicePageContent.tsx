"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Receipt, Edit } from "lucide-react";

import type { getInvoicesModuleData } from "@/lib/actions/invoices";
import { buildInvoiceQueryHref, formatInvoiceStatus, getInvoiceStatusVariant } from "@/lib/utils/invoices";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyValue } from "@/components/ui/MoneyValue";
import { StatusBadge } from "@/components/ui/StatusBadge";

type InvoicesModuleData = Awaited<ReturnType<typeof getInvoicesModuleData>>;

export function InvoicePageContent({
  data,
  basePath,
  showClientFilter,
  onEditInvoice,
}: {
  data: InvoicesModuleData;
  basePath: string;
  showClientFilter: boolean;
  onEditInvoice: (invoice: InvoicesModuleData["paginatedInvoices"][number]) => void;
}) {
  const activeFilters = data.filters;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Invoices & Revenue</h1>
            <p className="mt-1 text-sm text-text-muted">
              Track billed, received, outstanding, and overdue values from the same invoice and payment records.
            </p>
          </div>
          <Link href={basePath} className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Reset filters
          </Link>
        </div>

        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
            <span className="font-medium text-text-primary">Search</span>
            <input
              type="text"
              name="search"
              defaultValue={activeFilters.search ?? ""}
              placeholder="Client, PAN, or invoice number"
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
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="flex items-end gap-2 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-secondary">
            <input type="checkbox" name="overdueOnly" value="true" defaultChecked={activeFilters.overdueOnly === true} className="h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-600" />
            <span>Only overdue</span>
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
            <p className="text-xs uppercase tracking-wide text-text-muted">Billed</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.billedAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">Issued invoice totals only.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.receivedAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">Valid non-reversed payments.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Outstanding</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.outstandingAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">{data.summary.partialCount} invoices are partially paid.</p>
          </div>
          <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              <MoneyValue value={data.summary.overdueAmount} />
            </p>
            <p className="mt-1 text-sm text-text-secondary">{data.summary.overdueCount} invoices need follow-up.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Invoice register</h2>
            <p className="mt-1 text-sm text-text-muted">The same records drive billing, received cash/UPI totals, and outstanding balances.</p>
          </div>
          <StatusBadge>{data.invoices.length} records</StatusBadge>
        </div>

        {data.paginatedInvoices.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Receipt className="h-8 w-8" aria-hidden="true" />}
              title="No invoices in this scope"
              description="Adjust the filters or create the first invoice draft for this client and assessment-year context."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-text-primary">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <th scope="col" className="px-4 py-3 text-center w-16">Sl. No.</th>
                  <th scope="col" className="px-4 py-3">Client name</th>
                  <th scope="col" className="px-4 py-3 w-36">ITR Number</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">Refund Received</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">ITR Filing Charges</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">ITR Refund Claim Charges</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">Total Invoice value</th>
                  <th scope="col" className="px-4 py-3 w-32">Status</th>
                  <th scope="col" className="px-4 py-3 text-right w-56">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.paginatedInvoices.map((invoice, index) => {
                  const slNo = (data.page - 1) * data.pageSize + index + 1;
                  const rowBg = invoice.derivedStatus === "overdue"
                    ? "bg-red-50/20 hover:bg-red-50/30"
                    : "hover:bg-surface-hover";

                  // Extract filing case and records
                  const filingCase = invoice.filing_cases;
                  const itrNumber = filingCase?.filing_records?.[0]?.acknowledgement_number || "—";

                  // Extract received refund amount from matching refunds
                  const refundReceived = filingCase?.refunds?.[0]?.received_amount ?? 0;

                  // Extract ITR Filing Charges line item
                  const filingItem = invoice.invoice_items?.find((item) =>
                    item.description.toLowerCase().includes("filing")
                  );
                  const filingCharges = filingItem
                    ? Number(filingItem.unit_amount ?? 0) * Number(filingItem.quantity ?? 1)
                    : 0;

                  // Extract ITR Refund Claim Charges line item
                  const refundItem = invoice.invoice_items?.find((item) =>
                    item.description.toLowerCase().includes("refund claim") ||
                    item.description.toLowerCase().includes("refund")
                  );
                  const refundClaimCharges = refundItem
                    ? Number(refundItem.unit_amount ?? 0) * Number(refundItem.quantity ?? 1)
                    : 0;

                  return (
                    <tr key={invoice.id} className={`${rowBg} transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium text-text-muted">{slNo}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-text-primary">{invoice.clients?.full_name ?? "Unknown client"}</p>
                          <p className="text-xs text-text-muted">
                            {invoice.invoice_number} • {invoice.assessment_years?.label ? `AY ${invoice.assessment_years.label}` : "No AY"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{itrNumber}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <MoneyValue value={refundReceived} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <MoneyValue value={filingCharges} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        <MoneyValue value={refundClaimCharges} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                        <MoneyValue value={Number(invoice.total_amount ?? 0)} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={getInvoiceStatusVariant(invoice.derivedStatus)}>
                          {formatInvoiceStatus(invoice.derivedStatus)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2.5">
                          {invoice.derivedStatus === "draft" && (
                            <button
                              type="button"
                              onClick={() => onEditInvoice(invoice)}
                              className="inline-flex items-center gap-1 rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover hover:text-brand-600 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                              Edit
                            </button>
                          )}
                          {showClientFilter && (
                            <Link
                              href={`/clients/${invoice.client_id}/invoices`}
                              className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                            >
                              Client view
                            </Link>
                          )}
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex items-center text-xs font-medium text-brand-700 hover:text-brand-800"
                          >
                            Open
                            <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data.summary.overdueCount > 0 ? (
          <div className="border-t border-border-subtle bg-red-50/70 px-4 py-3 sm:px-5 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>
                {data.summary.overdueCount} overdue invoice{data.summary.overdueCount === 1 ? "" : "s"} still carry an outstanding balance.
              </span>
            </div>
          </div>
        ) : null}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 sm:px-5 sm:py-4 text-sm text-text-secondary">
            <span>
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={buildInvoiceQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  overdueOnly: activeFilters.overdueOnly ? "true" : undefined,
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
                href={buildInvoiceQueryHref(basePath, {
                  search: activeFilters.search,
                  clientId: activeFilters.clientId,
                  assessmentYearId: activeFilters.assessmentYearId,
                  status: activeFilters.status,
                  overdueOnly: activeFilters.overdueOnly ? "true" : undefined,
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
