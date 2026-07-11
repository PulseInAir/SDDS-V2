'use client';

import React, { useState, useTransition } from "react";
import { InvoiceCreateForm } from "@/components/invoices/InvoiceCreateForm";
import { Button } from "@/components/ui/Button";
import { FileText, Edit3, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { issueInvoiceAction } from "@/lib/actions/invoices";
import { formatInvoiceStatus } from "@/lib/utils/invoices";

interface InvoiceStepProps {
  clientId: string;
  selectedAyId: string;
  clientsOptions: any[];
  ayOptions: any[];
  invoiceSettings: any;
  existingInvoice?: {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number;
    balance_amount: number;
  } | null;
  onComplete: () => void;
}

export function InvoiceStep({
  clientId,
  clientsOptions,
  ayOptions,
  invoiceSettings,
  existingInvoice,
  onComplete,
}: InvoiceStepProps) {
  const [issuing, startIssueTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // ── No invoice yet — Render creation form directly ────────────────────────
  if (!existingInvoice) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Generate Invoice</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Charges have been auto-populated from the ITR-V extraction. Edit details and create a draft or final invoice.
          </p>
        </div>

        {actionError && (
          <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {actionError}
          </div>
        )}

        <div className="border border-border-subtle rounded-[var(--radius-panel)] p-1 bg-neutral-950/10">
          <InvoiceCreateForm
            clients={clientsOptions}
            assessmentYears={ayOptions}
            defaultClientId={clientId}
            invoiceSettings={invoiceSettings}
            revalidateTarget={`/clients/${clientId}/journey`}
            onSuccess={() => onComplete()}
          />
        </div>
      </div>
    );
  }

  const isDraft = existingInvoice.status === "draft";

  // ── Existing invoice (draft or issued) ────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Invoice Summary</h3>
          <p className="text-sm text-text-muted mt-0.5">
            {isDraft
              ? "Draft saved. Edit details or issue the final invoice to continue."
              : "Invoice has been issued. Continue to record payment."}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isDraft
              ? "bg-amber-900/60 text-amber-400 border border-amber-500/30"
              : existingInvoice.status === "Paid"
              ? "bg-emerald-900/60 text-emerald-400 border border-emerald-500/30"
              : "bg-sky-900/60 text-sky-400 border border-sky-500/30"
          }`}
        >
          {formatInvoiceStatus(existingInvoice.status as any)}
        </span>
      </div>

      <div className="p-4 rounded-[var(--radius-panel)] border border-emerald-500/30 bg-emerald-950/20">
        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-text-primary font-mono">{existingInvoice.invoice_number}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center text-text-secondary">
            <span>Total Billed Amount</span>
            <span className="font-semibold text-text-primary font-mono">₹{existingInvoice.total_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-text-secondary">
            <span>Outstanding Balance</span>
            <span className={`font-semibold font-mono ${existingInvoice.balance_amount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              ₹{existingInvoice.balance_amount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href={`/invoices/${existingInvoice.id}`}
            className="h-9 px-4 rounded-[var(--radius-input)] border border-border-subtle hover:bg-surface-hover flex items-center justify-center gap-1.5 text-xs font-semibold text-text-primary transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Details
          </Link>

          {isDraft && (
            <Button
              size="sm"
              className="h-9 bg-amber-500 hover:bg-amber-400"
              disabled={issuing}
              onClick={() => {
                setActionError(null);
                startIssueTransition(async () => {
                  // issueInvoiceAction takes (invoiceId, _previousState, formData)
                  const today = new Date().toISOString().slice(0, 10);
                  const due = new Date();
                  due.setDate(due.getDate() + 15);
                  const dueDate = due.toISOString().slice(0, 10);

                  const formData = new FormData();
                  formData.append("issueDate", today);
                  formData.append("dueDate", dueDate);
                  const res = await issueInvoiceAction(existingInvoice.id, undefined as any, formData);
                  if (res.error) {
                    setActionError(res.error);
                    return;
                  }
                  onComplete();
                });
              }}
            >
              {issuing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5" />
              )}
              Issue Final Invoice →
            </Button>
          )}

          {!isDraft && existingInvoice.status !== "Paid" && (
            <Button size="sm" className="h-9" onClick={onComplete}>
              Record Payment →
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
          {actionError}
        </div>
      )}
    </div>
  );
}
