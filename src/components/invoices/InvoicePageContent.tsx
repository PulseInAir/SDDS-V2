"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Receipt, Edit } from "lucide-react";

import type { getInvoicesModuleData } from "@/lib/actions/invoices";
import { formatInvoiceStatus, getInvoiceStatusVariant } from "@/lib/utils/invoices";
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
  // Compute row-level values and totals dynamically
  const { rowData, totals } = useMemo(() => {
    const rows = data.paginatedInvoices.map((invoice) => {
      const filingCase = invoice.filing_cases;
      const filingRecord = filingCase?.filing_records?.[0];
      const itrFormType = filingRecord?.filing_kind || "—";
      const refundReceived = filingCase?.refunds?.[0]?.received_amount ?? 0;

      const filingItem = invoice.invoice_items?.find((item) =>
        item.description.toLowerCase().includes("filing")
      );
      const filingCharges = filingItem
        ? Number(filingItem.unit_amount ?? 0) * Number(filingItem.quantity ?? 1)
        : 0;

      const refundItem = invoice.invoice_items?.find((item) =>
        item.description.toLowerCase().includes("refund claim") ||
        item.description.toLowerCase().includes("refund")
      );
      const refundClaimCharges = refundItem
        ? Number(refundItem.unit_amount ?? 0) * Number(refundItem.quantity ?? 1)
        : 0;

      const totalInvoiceValue = Number(invoice.total_amount ?? 0);

      return {
        invoice,
        itrFormType,
        refundReceived,
        filingCharges,
        refundClaimCharges,
        totalInvoiceValue,
      };
    });

    const totalRefundReceived = rows.reduce((sum, r) => sum + r.refundReceived, 0);
    const totalFilingCharges = rows.reduce((sum, r) => sum + r.filingCharges, 0);
    const totalRefundClaimCharges = rows.reduce((sum, r) => sum + r.refundClaimCharges, 0);
    const totalInvoiceValue = rows.reduce((sum, r) => sum + r.totalInvoiceValue, 0);

    return {
      rowData: rows,
      totals: {
        refundReceived: Number(totalRefundReceived.toFixed(2)),
        filingCharges: Number(totalFilingCharges.toFixed(2)),
        refundClaimCharges: Number(totalRefundClaimCharges.toFixed(2)),
        totalInvoiceValue: Number(totalInvoiceValue.toFixed(2)),
      },
    };
  }, [data.paginatedInvoices]);

  return (
    <div className="space-y-6">
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
                  <th scope="col" className="px-4 py-3 w-28">ITR Form</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">Refund Received</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">ITR Filing Charges</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">ITR Refund Claim Charges</th>
                  <th scope="col" className="px-4 py-3 text-right w-36">Total Invoice value</th>
                  <th scope="col" className="px-4 py-3 w-32">Status</th>
                  <th scope="col" className="px-4 py-3 text-right w-56">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rowData.map((row, index) => {
                  const { invoice, itrFormType, refundReceived, filingCharges, refundClaimCharges, totalInvoiceValue } = row;
                  const slNo = (data.page - 1) * data.pageSize + index + 1;
                  const rowBg = invoice.derivedStatus === "overdue"
                    ? "bg-red-50/20 hover:bg-red-50/30"
                    : "hover:bg-surface-hover";

                  return (
                    <tr key={invoice.id} className={`${rowBg} transition-colors`}>
                      <td className="px-4 py-3 text-center font-medium text-text-muted">{slNo}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-text-primary">{invoice.clients?.full_name ?? "Unknown client"}</p>
                          <p className="text-xs text-text-muted">
                            {invoice.assessment_years?.label ? `AY ${invoice.assessment_years.label}` : "No AY"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                          {itrFormType}
                        </span>
                      </td>
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
                        <MoneyValue value={totalInvoiceValue} />
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
              <tfoot>
                <tr className="border-t-2 border-border-subtle bg-surface-muted font-semibold text-text-primary">
                  <td className="px-4 py-3 text-center" colSpan={3}>
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <MoneyValue value={totals.refundReceived} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <MoneyValue value={totals.filingCharges} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <MoneyValue value={totals.refundClaimCharges} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <MoneyValue value={totals.totalInvoiceValue} />
                  </td>
                  <td className="px-4 py-3" colSpan={2}></td>
                </tr>
              </tfoot>
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
                href={`${basePath}?page=${data.page > 1 ? data.page - 1 : 1}`}
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
                href={`${basePath}?page=${data.page < data.totalPages ? data.page + 1 : data.totalPages}`}
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
