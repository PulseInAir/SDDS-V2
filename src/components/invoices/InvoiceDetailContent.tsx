"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Landmark, Receipt, TriangleAlert } from "lucide-react";

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
import { QRCodeSVG } from "qrcode.react";

type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

function BrandedInvoiceLayout({ invoice, className }: { invoice: InvoiceDetail; className?: string }) {
  const items = invoice.invoice_items ?? [];
  const totalRows = 8;
  const emptyRowCount = Math.max(0, totalRows - items.length);

  return (
    <div className={`flex flex-col sm:flex-row w-full bg-[#FFF4D4] text-neutral-900 font-sans shadow-none border border-neutral-300 ${className ?? ""}`}>
      {/* Left Column: Forest Green (Branding & Identity) - Exact 32.5% Width */}
      <div className="w-full sm:w-[32.5%] bg-[#476A30] text-white p-6 flex flex-col items-center justify-between border-b sm:border-b-0 sm:border-r border-neutral-300">
        <div className="flex flex-col items-center w-full">
          <h1 className="text-3xl font-bold tracking-[0.1em] text-white uppercase text-center mt-6">
            INVOICE
          </h1>
          
          {/* Logo Container: styled box as reference */}
          <div className="mt-8 bg-[#D5AD4E] p-3 rounded-lg border-4 border-[#610B35] flex items-center justify-center w-36 h-36">
            <img src="/Logo.png" alt="SDDS Logo" className="object-contain w-full h-full" />
          </div>
        </div>

        {/* Issuer Details */}
        <div className="mt-12 sm:mt-0 mb-4 text-center text-xs leading-relaxed space-y-1 w-full font-semibold">
          <div className="h-px w-full bg-white/10 my-4 sm:hidden"></div>
          <p className="font-bold text-sm text-white">Single Digit Data Solutions</p>
          <p className="text-white">Duliajan</p>
          <p className="text-white">Dibrugarh, Assam</p>
        </div>
      </div>

      {/* Right Column: Warm Sand-Cream (Details, Table, Financials) - Exact 67.5% Width */}
      <div className="w-full sm:w-[67.5%] p-6 flex flex-col justify-between">
        <div>
          {/* Header Block: Client & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-900">Bill To :-</h3>
              <p className="text-base font-bold text-neutral-900">{invoice.clients?.full_name ?? "Client Name"}</p>
              <p className="text-sm text-neutral-800 leading-tight">{invoice.clients?.address ?? "Client Address"}</p>
            </div>
            <div className="space-y-1 text-left sm:text-right text-sm">
              <div className="flex sm:justify-end gap-2">
                <span className="font-bold text-neutral-700">Date :-</span>
                <span className="text-neutral-900">{formatInvoiceDate(invoice.issue_date ?? invoice.created_at)}</span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="font-bold text-neutral-700">Invoice No.:-</span>
                <span className="font-mono text-neutral-900">{invoice.invoice_number}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table: Exact 8 rows with thin borders */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs min-w-[450px] border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-100/50">
                  <th className="border border-neutral-300 p-2 text-center font-bold text-neutral-800 w-16">Sl. No.</th>
                  <th className="border border-neutral-300 p-2 text-center font-bold text-neutral-800">DESCRIPTION</th>
                  <th className="border border-neutral-300 p-2 text-center font-bold text-neutral-800 w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, totalRows).map((item, index) => (
                  <tr key={item.id} className="h-8">
                    <td className="border border-neutral-300 p-2 text-center text-neutral-900">{index + 1}</td>
                    <td className="border border-neutral-300 p-2 text-neutral-800">{item.description}</td>
                    <td className="border border-neutral-300 p-2 text-right font-mono text-neutral-900">
                      <MoneyValue value={Number(item.line_amount ?? 0)} forceVisible={true} />
                    </td>
                  </tr>
                ))}
                {Array.from({ length: emptyRowCount }).map((_, i) => {
                  const slNo = items.length + i + 1;
                  return (
                    <tr key={`empty-${i}`} className="h-8">
                      <td className="border border-neutral-300 p-2 text-center text-neutral-400">{slNo <= totalRows ? slNo : ""}</td>
                      <td className="border border-neutral-300 p-2 text-neutral-400">&nbsp;</td>
                      <td className="border border-neutral-300 p-2 text-right text-neutral-400">&nbsp;</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculations Block */}
          <div className="mt-4 ml-auto max-w-[280px] space-y-1.5 text-xs text-neutral-800">
            <div className="flex justify-between font-bold">
              <span>SUBTOTAL</span>
              <span className="font-mono"><MoneyValue value={Number(invoice.subtotal ?? 0)} forceVisible={true} /></span>
            </div>
            <div className="flex justify-between font-bold">
              <span>DISCOUNT</span>
              <span className="font-mono"><MoneyValue value={Number(invoice.discount_amount ?? 0)} forceVisible={true} /></span>
            </div>
            <div className="flex justify-between font-bold">
              <span>SUBTOTAL LESS DISCOUNT</span>
              <span className="font-mono"><MoneyValue value={Number(invoice.subtotal ?? 0) - Number(invoice.discount_amount ?? 0)} forceVisible={true} /></span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Advance Paid</span>
              <span className="font-mono"><MoneyValue value={invoice.paidAmount} forceVisible={true} /></span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-b-4 border-double border-neutral-900 py-1.5">
              <span>Balance Due</span>
              <span className="font-mono font-black"><MoneyValue value={invoice.balanceAmount} forceVisible={true} /></span>
            </div>
          </div>
        </div>

        {/* Footer Details: UPI Info & QR Code */}
        <div className="mt-6 flex justify-between items-end border-t border-neutral-300 pt-4">
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-neutral-900">Payment Details :-</h4>
            <div className="flex gap-2">
              <span className="font-bold text-neutral-600">UPI ID -</span>
              <a href="upi://pay?pa=8011626740@ybl&pn=Single%20Digit%20Data%20Solutions" className="text-blue-600 font-bold underline">8011626740@ybl</a>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-neutral-600">UPI No. -</span>
              <span className="text-neutral-900 font-bold font-mono">8011626740</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-300 p-1 rounded shadow-sm flex items-center justify-center">
            <QRCodeSVG 
              value={`upi://pay?pa=8011626740@ybl&pn=Single%20Digit%20Data%20Solutions&am=${invoice.balanceAmount}&cu=INR`} 
              size={96}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoiceDetailContent({ invoice }: { invoice: InvoiceDetail }) {
  const [viewMode, setViewMode] = useState<"admin" | "preview">("admin");
  const [isDownloading, setIsDownloading] = useState(false);
  const canIssue = invoice.derivedStatus === "draft";
  const canRecordPayment = ["issued", "partially_paid", "overdue"].includes(invoice.derivedStatus) && invoice.balanceAmount > 0;

  const handleDownloadJPEG = async () => {
    try {
      setIsDownloading(true);
      const { default: html2canvas } = await import("html2canvas");
      const element = document.getElementById("invoice-print-only");
      if (!element) return;

      // Temporarily show it off-screen for html2canvas safely
      element.classList.remove("hidden");
      element.style.position = "fixed";
      element.style.left = "0";
      element.style.top = "0";
      element.style.zIndex = "-9999";
      element.style.opacity = "0";
      element.style.display = "block";
      element.style.width = "850px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFF2D3",
      });

      // Restore original state
      element.style.position = "";
      element.style.left = "";
      element.style.top = "";
      element.style.zIndex = "";
      element.style.opacity = "";
      element.style.display = "";
      element.style.width = "";
      element.classList.add("hidden");

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `Invoice_${invoice.invoice_number.replace(/\//g, "-")}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate invoice image", error);
      alert("Failed to download invoice image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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
            <div className="inline-flex rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-1 mr-2">
              <button
                type="button"
                onClick={() => setViewMode("admin")}
                className={`rounded-[var(--radius-input)] px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "admin"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Admin View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`rounded-[var(--radius-input)] px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                Client Preview
              </button>
            </div>
            <Link
              href={`/clients/${invoice.client_id}/invoices`}
              className="inline-flex items-center rounded-[var(--radius-input)] border border-border-subtle px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              Client view
            </Link>
            <PrintInvoiceButton onClick={handleDownloadJPEG} isPending={isDownloading} />
          </div>
        </div>

        {viewMode === "admin" ? (
          <>
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
          </>
        ) : (
          <div className="max-w-[850px] mx-auto rounded-[var(--radius-panel)] border border-border-subtle bg-[#FFF2D3] shadow-md overflow-hidden my-6">
            <BrandedInvoiceLayout invoice={invoice} />
          </div>
        )}
      </div>

      <section id="invoice-print-only" className="hidden print:block w-full text-black bg-[#FFF2D3]">
        <BrandedInvoiceLayout invoice={invoice} className="h-full" />
      </section>
    </>
  );
}
