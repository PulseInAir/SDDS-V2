"use client";

import { useActionState, useMemo, useState, useEffect } from "react";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";

import { createInvoiceAction, type InvoiceActionState } from "@/lib/actions/invoices";
import { getClientDocumentsModuleData } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";

type ClientOption = {
  id: string;
  full_name: string;
  pan_uppercase: string;
};

type AssessmentYearOption = {
  id: string;
  label: string;
  is_current: boolean | null;
};

type InvoiceItemDraft = {
  id: string;
  description: string;
  quantity: string;
  unitAmount: string;
};

const initialState: InvoiceActionState = {};

function createEmptyItem(): InvoiceItemDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitAmount: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function InvoiceCreateForm({
  clients,
  assessmentYears,
  defaultClientId,
}: {
  clients: ClientOption[];
  assessmentYears: AssessmentYearOption[];
  defaultClientId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);
  const [items, setItems] = useState<InvoiceItemDraft[]>([createEmptyItem()]);
  const [discountAmount, setDiscountAmount] = useState("0");

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? "");
  const [selectedAyId, setSelectedAyId] = useState(
    assessmentYears.find((year) => year.is_current)?.id ?? ""
  );
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (!selectedClientId) {
      setClientDocuments([]);
      return;
    }
    getClientDocumentsModuleData(selectedClientId)
      .then((res) => {
        const docs = res.chains
          .map((c) => c.latest)
          .filter((d) => d.mime_type === "application/pdf");
        setClientDocuments(docs);
      })
      .catch((err) => {
        console.error("Failed to load client documents:", err);
      });
  }, [selectedClientId]);

  const handleExtract = async (docId: string) => {
    if (!docId) return;
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/documents/${docId}/extract`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success && result.data) {
        const { assessmentYear, itrForm, assessmentYearId } = result.data;

        if (assessmentYearId) {
          setSelectedAyId(assessmentYearId);
        } else if (assessmentYear) {
          const match = assessmentYears.find((ay) => ay.label === assessmentYear);
          if (match) setSelectedAyId(match.id);
        }

        let fee = 1500;
        if (itrForm === "ITR-1") fee = 1000;
        else if (itrForm === "ITR-2") fee = 2500;
        else if (itrForm === "ITR-3") fee = 5000;
        else if (itrForm === "ITR-4") fee = 3500;

        setItems([
          {
            id: crypto.randomUUID(),
            description: `ITR Filing Charges - ${itrForm || "ITR"} (AY ${assessmentYear || "2026-27"})`,
            quantity: "1",
            unitAmount: String(fee),
          },
        ]);
      }
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtracting(false);
      setSelectedDocId("");
    }
  };

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number.parseFloat(item.quantity);
        const unitAmount = Number.parseFloat(item.unitAmount);

        if (!Number.isFinite(quantity) || !Number.isFinite(unitAmount)) {
          return sum;
        }

        return sum + quantity * unitAmount;
      }, 0),
    [items],
  );
  const total = Math.max(0, subtotal - (Number.parseFloat(discountAmount) || 0));

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Create invoice draft</h2>
          <p className="mt-1 text-sm text-text-muted">
            Create the draft first, then issue it from the detail view with a due date and print layout.
          </p>
        </div>
        <Receipt className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      {selectedClientId && clientDocuments.length > 0 && (
        <div className="rounded-[var(--radius-input)] border border-brand-100 bg-brand-50/50 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-semibold text-brand-900">Autofill from document</span>
              <p className="text-xs text-brand-700">Extract filing details and auto-populate invoice line items.</p>
            </div>
            <select
              value={selectedDocId}
              onChange={(e) => {
                const docId = e.target.value;
                setSelectedDocId(docId);
                handleExtract(docId);
              }}
              disabled={isExtracting}
              className="h-9 rounded-[var(--radius-input)] border border-brand-200 bg-white px-2 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:opacity-50"
            >
              <option value="">Choose a document...</option>
              {clientDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.document_type} ({doc.original_filename})
                </option>
              ))}
            </select>
          </div>
          {isExtracting && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
              <span>Parsing document and calculating filing charges...</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Client</span>
          <select
            name="clientId"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name} • {client.pan_uppercase}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Assessment year</span>
          <select
            name="assessmentYearId"
            value={selectedAyId}
            onChange={(e) => setSelectedAyId(e.target.value)}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Select AY</option>
            {assessmentYears.map((assessmentYear) => (
              <option key={assessmentYear.id} value={assessmentYear.id}>
                {assessmentYear.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Invoice items</h3>
            <p className="mt-1 text-xs text-text-muted">Add the billable work exactly as it should appear on the printable invoice.</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((currentItems) => [...currentItems, createEmptyItem()])}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const quantity = Number.parseFloat(item.quantity);
            const unitAmount = Number.parseFloat(item.unitAmount);
            const lineTotal = Number.isFinite(quantity) && Number.isFinite(unitAmount) ? quantity * unitAmount : 0;

            return (
              <div key={item.id} className="grid gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-white p-3 lg:grid-cols-[minmax(0,1.6fr)_120px_160px_140px_44px]">
                <label className="space-y-1 text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Description</span>
                  <input
                    value={item.description}
                    onChange={(event) =>
                      setItems((currentItems) =>
                        currentItems.map((currentItem) =>
                          currentItem.id === item.id ? { ...currentItem, description: event.target.value } : currentItem,
                        ),
                      )
                    }
                    placeholder="ITR filing charges"
                    className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </label>

                <label className="space-y-1 text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Qty</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((currentItems) =>
                        currentItems.map((currentItem) =>
                          currentItem.id === item.id ? { ...currentItem, quantity: event.target.value } : currentItem,
                        ),
                      )
                    }
                    className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </label>

                <label className="space-y-1 text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Unit amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitAmount}
                    onChange={(event) =>
                      setItems((currentItems) =>
                        currentItems.map((currentItem) =>
                          currentItem.id === item.id ? { ...currentItem, unitAmount: event.target.value } : currentItem,
                        ),
                      )
                    }
                    className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </label>

                <div className="space-y-1 text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Line total</span>
                  <div className="flex h-10 items-center rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 font-mono text-sm text-text-primary">
                    {formatCurrency(lineTotal)}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((currentItems) => (currentItems.length > 1 ? currentItems.filter((currentItem) => currentItem.id !== item.id) : currentItems))
                    }
                    disabled={items.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] border border-border-subtle text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove invoice item ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Optional internal or printable note."
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <div className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Discount amount</span>
            <input
              name="discountAmount"
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono text-text-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Discount</span>
              <span className="font-mono text-text-primary">{formatCurrency(Number.parseFloat(discountAmount) || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-base font-semibold text-text-primary">
              <span>Draft total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            displayOrder: index,
          })),
        )}
      />

      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Create draft
        </Button>
      </div>
    </form>
  );
}
