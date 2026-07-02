'use client';

import React, { useState } from "react";
import { InvoiceCreateForm } from "@/components/invoices/InvoiceCreateForm";
import { Button } from "@/components/ui/Button";
import { FilePlus, FileText, Printer, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

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
  selectedAyId,
  clientsOptions,
  ayOptions,
  invoiceSettings,
  existingInvoice,
  onComplete,
}: InvoiceStepProps) {
  const [showForm, setShowForm] = useState(false);

  if (existingInvoice) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Invoice Summary</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Invoice has been successfully generated for this filing case.
          </p>
        </div>

        <div className="p-4 rounded-[var(--radius-panel)] border border-emerald-500/30 bg-emerald-950/20 max-w-md">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-text-primary font-mono">{existingInvoice.invoice_number}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              existingInvoice.status === "Paid" 
                ? "bg-emerald-900/60 text-emerald-400 border border-emerald-500/30" 
                : "bg-amber-900/60 text-amber-400 border border-amber-500/30"
            }`}>
              {existingInvoice.status}
            </span>
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

          <div className="mt-4 flex gap-2.5">
            <Link
              href={`/invoices/${existingInvoice.id}`}
              className="flex-1 h-9 rounded-[var(--radius-input)] border border-border-subtle hover:bg-surface-hover flex items-center justify-center gap-1.5 text-xs font-semibold text-text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Details
            </Link>
            
            {existingInvoice.status !== "Paid" && (
              <Button size="sm" className="flex-1" onClick={onComplete}>
                Record Payment
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Generate Invoice</h3>
            <p className="text-sm text-text-muted mt-0.5">
              Generate the draft invoice for this filing case. Charges will be automatically populated.
            </p>
          </div>

          <Button onClick={() => setShowForm(true)} className="active:scale-95 transition-transform">
            <FilePlus className="h-4 w-4 mr-1.5" /> Create Draft Invoice Inline
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-text-primary">New Invoice Draft</h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-text-secondary hover:text-text-primary font-medium transition-colors">
              Hide Form
            </button>
          </div>

          <div className="border border-border-subtle rounded-[var(--radius-panel)] p-1 bg-neutral-950/10">
            <InvoiceCreateForm
              clients={clientsOptions}
              assessmentYears={ayOptions}
              defaultClientId={clientId}
              invoiceSettings={invoiceSettings}
              revalidateTarget={`/clients/${clientId}/journey`}
              onCancelEdit={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
