"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Landmark, Receipt, TriangleAlert } from "lucide-react";

import type { getInvoiceDetail } from "@/lib/actions/invoices";
import {
  formatDateTime,
  formatInvoiceDate,
  formatInvoiceStatus,
  formatPaymentMode,
  getInvoiceStatusVariant,
} from "@/lib/utils/invoices";
import { IssueInvoiceForm } from "@/components/invoices/IssueInvoiceForm";
import { PaymentForm } from "@/components/invoices/PaymentForm";
import { PrintInvoiceButton } from "@/components/invoices/PrintInvoiceButton";
import { MoneyValue } from "@/components/ui/MoneyValue";
import { StatusBadge } from "@/components/ui/StatusBadge";

type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

export function InvoiceDetailContent({ invoice }: { invoice: InvoiceDetail }) {
  const canIssue = invoice.derivedStatus === "draft";
  const canRecordPayment = ["issued", "partially_paid", "overdue"].includes(invoice.derivedStatus) && invoice.balanceAmount > 0;

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Link href="/invoices" className="inline-flex items-center text-sm text-text-secondary transition-colors hover:text-text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to invoices
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-text-primary">{invoice.invoice_number}</h1>
              <StatusBadge variant={getInvoiceStatusVariant(invoice.derivedStatus)}>
                {formatInvoiceStatus(invoice.derivedStatus)}
              </StatusBadge>
            </div>

            <p className="mt-2 text-sm text-text-muted">
              {invoice.clients?.full_name ?? "Unknown client"} • {invoice.assessment_years?.label ?? "No AY"} • Created{" "}
              {formatDateTime(invoice.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clients/${invoice.client_id}/invoices`}
              className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              Client view
            </Link>
            <PrintInvoiceButton />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Total</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  <MoneyValue value={Number(invoice.total_amount ?? 0)} />
                </p>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Received</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  <MoneyValue value={invoice.paidAmount} />
                </p>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Outstanding</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  <MoneyValue value={invoice.balanceAmount} />
                </p>
              </div>
              <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">Due date</p>
                <p className="mt-2 text-base font-semibold text-text-primary">{formatInvoiceDate(invoice.due_date)}</p>
                <p className="mt-1 text-sm text-text-secondary">Issued {formatInvoiceDate(invoice.issue_date)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-input)] border border-border-subtle p-4">
                <h2 className="text-sm font-semibold text-text-primary">Case context</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Client</dt>
                    <dd className="text-right font-medium text-text-primary">{invoice.clients?.full_name ?? "Unknown client"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Assessment year</dt>
                    <dd className="text-right font-medium text-text-primary">{invoice.assessment_years?.label ?? "—"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Case status</dt>
                    <dd className="text-right font-medium text-text-primary">{invoice.filing_cases?.case_status ?? "No linked case"}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Next action</dt>
                    <dd className="max-w-[18rem] text-right text-text-primary">{invoice.filing_cases?.next_action ?? "No case note recorded"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[var(--radius-input)] border border-border-subtle p-4">
                <h2 className="text-sm font-semibold text-text-primary">Invoice values</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Subtotal</dt>
                    <dd className="text-right font-medium text-text-primary">
                      <MoneyValue value={Number(invoice.subtotal ?? 0)} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Discount</dt>
                    <dd className="text-right font-medium text-text-primary">
                      <MoneyValue value={Number(invoice.discount_amount ?? 0)} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Total</dt>
                    <dd className="text-right font-medium text-text-primary">
                      <MoneyValue value={Number(invoice.total_amount ?? 0)} />
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-text-muted">Balance</dt>
                    <dd className="text-right font-medium text-text-primary">
                      <MoneyValue value={invoice.balanceAmount} />
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            {canIssue ? <IssueInvoiceForm invoiceId={invoice.id} /> : null}
            {canRecordPayment ? <PaymentForm invoiceId={invoice.id} maxAmount={invoice.balanceAmount} /> : null}

            <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-text-primary">Operational notes</h2>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <Receipt className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
                  Draft invoices stay editable until issue. Issued totals reconcile automatically with recorded payments.
                </li>
                <li className="flex items-start gap-2">
                  <Landmark className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
                  Cash and UPI payments both count toward received revenue. Reversed payments are excluded from the paid total.
                </li>
                <li className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
                  Legal invoice identity, GST treatment, and signature assets remain pending open decision O-002.
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Line items</h2>
              <p className="mt-1 text-sm text-text-muted">Printable descriptions and values exactly as stored on the invoice draft.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-text-secondary">Description</th>
                  <th className="px-5 py-3 text-left font-medium text-text-secondary">Qty</th>
                  <th className="px-5 py-3 text-left font-medium text-text-secondary">Unit amount</th>
                  <th className="px-5 py-3 text-left font-medium text-text-secondary">Line amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white">
                {invoice.invoice_items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-text-primary">{item.description}</td>
                    <td className="px-5 py-4 font-mono text-text-secondary">{item.quantity}</td>
                    <td className="px-5 py-4 text-text-primary">
                      <MoneyValue value={Number(item.unit_amount ?? 0)} />
                    </td>
                    <td className="px-5 py-4 text-text-primary">
                      <MoneyValue value={Number(item.line_amount ?? 0)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Payment history</h2>
              <p className="mt-1 text-sm text-text-muted">Newest first, including reversed entries for audit visibility.</p>
            </div>
            <StatusBadge>{invoice.payments.length} records</StatusBadge>
          </div>

          {invoice.payments.length === 0 ? (
            <div className="p-5 text-sm text-text-muted">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-subtle text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-text-secondary">Date</th>
                    <th className="px-5 py-3 text-left font-medium text-text-secondary">Mode</th>
                    <th className="px-5 py-3 text-left font-medium text-text-secondary">Reference</th>
                    <th className="px-5 py-3 text-left font-medium text-text-secondary">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-white">
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4 text-text-secondary">{formatInvoiceDate(payment.payment_date)}</td>
                      <td className="px-5 py-4 text-text-primary">{formatPaymentMode(payment.mode)}</td>
                      <td className="px-5 py-4 text-text-secondary">{payment.reference ?? payment.note ?? "—"}</td>
                      <td className="px-5 py-4 text-text-primary">
                        <MoneyValue value={Number(payment.amount ?? 0)} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge variant={payment.reversed_at ? "neutral" : "success"}>
                          {payment.reversed_at ? "Reversed" : "Active"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section id="invoice-print-only" className="hidden rounded-[var(--radius-panel)] border border-border-subtle bg-white p-8 text-black shadow-none print:block">
        <div className="flex items-start justify-between gap-6 border-b border-slate-300 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Single Digit Data Solutions</p>
            <h2 className="mt-2 text-3xl font-semibold">Invoice</h2>
            <p className="mt-2 text-sm text-slate-600">Legal identity, address, and GST treatment remain pending workspace configuration (O-002).</p>
          </div>

          <div className="text-right text-sm">
            <p className="font-mono text-base font-semibold">{invoice.invoice_number}</p>
            <p className="mt-2 text-slate-600">Issue date: {formatInvoiceDate(invoice.issue_date)}</p>
            <p className="text-slate-600">Due date: {formatInvoiceDate(invoice.due_date)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Bill to</p>
            <p className="mt-2 text-lg font-semibold">{invoice.clients?.full_name ?? "Unknown client"}</p>
            <p className="mt-1 text-sm text-slate-600">{invoice.clients?.email ?? "Email not recorded"}</p>
            <p className="text-sm text-slate-600">{invoice.clients?.address ?? "Address not recorded"}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Assessment year context</p>
            <p className="mt-2 text-lg font-semibold">{invoice.assessment_years?.label ?? "No AY"}</p>
            <p className="mt-1 text-sm text-slate-600">Workspace: {invoice.workspaceName}</p>
            <p className="text-sm text-slate-600">Case status: {invoice.filing_cases?.case_status ?? "No linked case"}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-300">
          <table className="min-w-full divide-y divide-slate-300 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Unit amount</th>
                <th className="px-4 py-3 text-left font-medium">Line amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.invoice_items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 font-mono">{item.quantity}</td>
                  <td className="px-4 py-3 font-mono">
                    <MoneyValue value={Number(item.unit_amount ?? 0)} forceVisible={true} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <MoneyValue value={Number(item.line_amount ?? 0)} forceVisible={true} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Subtotal</span>
            <MoneyValue value={Number(invoice.subtotal ?? 0)} forceVisible={true} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Discount</span>
            <MoneyValue value={Number(invoice.discount_amount ?? 0)} forceVisible={true} />
          </div>
          <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold">
            <span>Total</span>
            <MoneyValue value={Number(invoice.total_amount ?? 0)} forceVisible={true} />
          </div>
        </div>

        {invoice.notes ? (
          <div className="mt-8 rounded-xl border border-slate-300 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Notes
            </div>
            <p className="mt-2 text-sm text-slate-700">{invoice.notes}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
