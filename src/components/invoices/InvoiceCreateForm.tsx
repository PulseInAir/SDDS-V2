"use client";

import { useActionState, useMemo, useState, useEffect } from "react";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";

import { createInvoiceAction, type InvoiceActionState } from "@/lib/actions/invoices";
import { getClientDocumentsModuleData } from "@/lib/actions/documents";
import { getClientFilingCaseByAY } from "@/lib/actions/cases";
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
  invoiceSettings,
}: {
  clients: ClientOption[];
  assessmentYears: AssessmentYearOption[];
  defaultClientId?: string;
  invoiceSettings?: {
    rate_card: Record<string, number>;
    refund_charge_percentage: number;
    pdf_extraction_settings: {
      page_scope: string;
      itr_form_pattern: string;
      refund_amount_pattern: string;
    };
  };
}) {
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);
  const [items, setItems] = useState<InvoiceItemDraft[]>([createEmptyItem()]);
  const [discountAmount, setDiscountAmount] = useState("0");

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? "");
  const [selectedAyId, setSelectedAyId] = useState(
    assessmentYears.find((year) => year.is_current)?.id ?? ""
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // Extracted ITR-V details
  const [itrvDetails, setItrvDetails] = useState<{
    itrForm: string | null;
    totalIncome: number | null;
    refundAmount: number | null;
    taxPayable: number | null;
  } | null>(null);

  // Calculator inputs
  const [refundableAmount, setRefundableAmount] = useState("");
  const [refundPercentage, setRefundPercentage] = useState(
    String(invoiceSettings?.refund_charge_percentage ?? 10)
  );
  const [originalPercentage, setOriginalPercentage] = useState(
    invoiceSettings?.refund_charge_percentage ?? 10
  );

  // Validation errors for calculator inputs
  const [calcErrors, setCalcErrors] = useState<{
    refundableAmount?: string;
    refundPercentage?: string;
  }>({});

  // Sync default percentage when settings change
  useEffect(() => {
    if (invoiceSettings?.refund_charge_percentage !== undefined) {
      setRefundPercentage(String(invoiceSettings.refund_charge_percentage));
      setOriginalPercentage(invoiceSettings.refund_charge_percentage);
    }
  }, [invoiceSettings]);

  useEffect(() => {
    if (!selectedClientId) {
      Promise.resolve().then(() => setClientDocuments((prev) => (prev.length === 0 ? prev : [])));
      return;
    }
    // Reset extraction state when client changes
    setSelectedDocId("");
    setItrvDetails(null);
    setRefundableAmount("");
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


  useEffect(() => {
    if (!selectedClientId || !selectedAyId) return;

    getClientFilingCaseByAY(selectedClientId, selectedAyId)
      .then((filingCase) => {
        const ayLabel = assessmentYears.find((y) => y.id === selectedAyId)?.label ?? "";
        const rateCard = invoiceSettings?.rate_card ?? {};
        const parsedItrForm = filingCase?.return_category || "ITR-V";
        const fee = rateCard[parsedItrForm] ?? rateCard["ITR-V"] ?? 500;

        setItems([
          {
            id: crypto.randomUUID(),
            description: `ITR Filing Charges - ${parsedItrForm} (AY ${ayLabel})`,
            quantity: "1",
            unitAmount: String(fee),
          },
        ]);
        // NOTE: do NOT reset itrvDetails or refundableAmount here —
        // those are cleared only when the client changes (above effect).
        // Clearing here would race against extraction which also updates selectedAyId.
      })
      .catch((err) => {
        console.error("Failed to fetch client case for auto-populate:", err);
      });
  }, [selectedClientId, selectedAyId, invoiceSettings, assessmentYears]);

  // Calculate Refund Claim Charges Amount in real-time
  const calculatedRefundChargesAmount = useMemo(() => {
    const amt = parseFloat(refundableAmount);
    const pct = parseFloat(refundPercentage);

    // Validate inputs
    const errors: { refundableAmount?: string; refundPercentage?: string } = {};
    if (refundableAmount && (isNaN(amt) || amt < 0)) {
      errors.refundableAmount = "Refundable amount must be a positive number.";
    }
    if (refundPercentage && (isNaN(pct) || pct < 0 || pct > 100)) {
      errors.refundPercentage = "Percentage must be between 0 and 100.";
    }
    setCalcErrors(errors);

    if (isNaN(amt) || isNaN(pct) || amt <= 0 || pct <= 0) {
      return 0;
    }

    return Math.round((amt * pct) / 100);
  }, [refundableAmount, refundPercentage]);

  // Sync calculated Refund Claim Charges to items list in real-time
  useEffect(() => {
    if (calculatedRefundChargesAmount > 0) {
      setItems((prev) => {
        const refundIndex = prev.findIndex((item) => item.description.includes("Refund Claim Charges"));
        if (refundIndex >= 0) {
          return prev.map((item, idx) =>
            idx === refundIndex
              ? { ...item, unitAmount: String(calculatedRefundChargesAmount) }
              : item
          );
        } else {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              description: "Refund Claim Charges",
              quantity: "1",
              unitAmount: String(calculatedRefundChargesAmount),
            },
          ];
        }
      });
    } else {
      // Remove refund charges item if amount is 0 or invalid
      setItems((prev) => prev.filter((item) => !item.description.includes("Refund Claim Charges")));
    }
  }, [calculatedRefundChargesAmount]);

  const handleExtract = async (docId: string) => {
    if (!docId) return;
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/documents/${docId}/extract`, {
        method: "POST",
      });
      const result = await res.json();
      console.log("[ITR-V Extract] API response:", JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        const { assessmentYear, itrForm, assessmentYearId, refundAmount, totalIncome, taxPayable } = result.data;
        console.log("[ITR-V Extract] Parsed fields:", { itrForm, totalIncome, refundAmount, taxPayable, assessmentYear, assessmentYearId });

        if (assessmentYearId) {
          setSelectedAyId(assessmentYearId);
        } else if (assessmentYear) {
          const match = assessmentYears.find((ay) => ay.label === assessmentYear);
          if (match) setSelectedAyId(match.id);
        }

        const ayLabel = assessmentYear || assessmentYears.find((ay) => ay.id === selectedAyId)?.label || "2026-27";
        const rateCard = invoiceSettings?.rate_card ?? {};
        const parsedItrForm = itrForm || "ITR-V";
        const fee = rateCard[parsedItrForm] ?? rateCard["ITR-V"] ?? 500;

        const details = {
          itrForm: parsedItrForm,
          totalIncome: totalIncome ?? null,
          refundAmount: refundAmount ?? null,
          taxPayable: taxPayable ?? null,
        };
        console.log("[ITR-V Extract] Setting itrvDetails:", details);
        // Save parsed details for visual section
        setItrvDetails(details);

        // Pre-populate refundable amount if found
        if (refundAmount && refundAmount > 0) {
          setRefundableAmount(String(refundAmount));
        }

        const newItems: InvoiceItemDraft[] = [
          {
            id: crypto.randomUUID(),
            description: `ITR Filing Charges - ${parsedItrForm} (AY ${ayLabel})`,
            quantity: "1",
            unitAmount: String(fee),
          },
        ];

        setItems(newItems);
      } else {
        console.warn("[ITR-V Extract] No data returned or result.success is false:", result);
      }
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtracting(false);
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

      {/* Extracted details and Refund calculator section */}
      {selectedClientId && (
        <div className="grid gap-4 border-t border-border-subtle pt-4 md:grid-cols-2">
          {/* ITR-V Extracted details */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-white p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">ITR-V Document Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border-subtle pb-1">
                <span className="text-text-muted">Form Number</span>
                <span className="font-medium text-text-primary">{itrvDetails?.itrForm || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-1">
                <span className="text-text-muted">Total Income</span>
                <span className="font-medium text-text-primary font-mono">
                  {itrvDetails?.totalIncome !== null && itrvDetails?.totalIncome !== undefined
                    ? formatCurrency(itrvDetails.totalIncome).replace(".00", "")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tax Payable/Refundable</span>
                <span className="font-semibold font-mono text-text-primary">
                  {itrvDetails?.refundAmount !== null && itrvDetails?.refundAmount !== undefined && itrvDetails.refundAmount > 0 ? (
                    <span className="text-green-700">(-) Refundable: {formatCurrency(itrvDetails.refundAmount).replace(".00", "")}</span>
                  ) : itrvDetails?.taxPayable !== null && itrvDetails?.taxPayable !== undefined && itrvDetails.taxPayable > 0 ? (
                    <span className="text-red-700">(+) Tax Payable: {formatCurrency(itrvDetails.taxPayable).replace(".00", "")}</span>
                  ) : (
                    <span>—</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Claim Charges Calculator */}
          <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Refund Claim Charges Calculator</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-text-secondary">
                <span className="font-medium text-text-primary">Refundable Amount (₹)</span>
                <input
                  type="text"
                  value={refundableAmount}
                  onChange={(e) => setRefundableAmount(e.target.value)}
                  className={`h-9 w-full rounded-[var(--radius-input)] border ${
                    calcErrors.refundableAmount ? "border-red-500" : "border-border-subtle"
                  } bg-white px-2.5 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600`}
                />
                {calcErrors.refundableAmount && (
                  <p className="text-[10px] text-red-500">{calcErrors.refundableAmount}</p>
                )}
              </label>

              <label className="space-y-1 text-xs text-text-secondary">
                <span className="font-medium text-text-primary">Refund Claim Charges %</span>
                <input
                  type="text"
                  value={refundPercentage}
                  onChange={(e) => setRefundPercentage(e.target.value)}
                  className={`h-9 w-full rounded-[var(--radius-input)] border ${
                    calcErrors.refundPercentage ? "border-red-500" : "border-border-subtle"
                  } bg-white px-2.5 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600`}
                />
                {calcErrors.refundPercentage && (
                  <p className="text-[10px] text-red-500">{calcErrors.refundPercentage}</p>
                )}
              </label>
            </div>

            <div className="rounded-[var(--radius-input)] bg-brand-50 p-2.5 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between border border-brand-100">
              <span className="text-xs font-medium text-brand-900">Refund Claim Charges Amount</span>
              <span className="text-base font-bold text-brand-700 font-mono">
                {formatCurrency(calculatedRefundChargesAmount).replace(".00", "")}
              </span>
            </div>
            {/* Auditing Fields Hidden Inputs */}
            <input type="hidden" name="refundClaimSettingsPercentage" value={originalPercentage} />
            <input type="hidden" name="refundClaimAppliedPercentage" value={refundPercentage} />
          </div>
        </div>
      )}

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
