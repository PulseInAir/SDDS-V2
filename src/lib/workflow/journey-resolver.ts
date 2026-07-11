import type { Database } from "@/types/database.types";

type FilingCase = Database["public"]["Tables"]["filing_cases"]["Row"];
type FilingRecord = Database["public"]["Tables"]["filing_records"]["Row"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Refund = Database["public"]["Tables"]["refunds"]["Row"];
type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];

export type JourneyStepId =
  | "case_created"
  | "filed"
  | "charges"
  | "refund"
  | "invoice"
  | "payment"
  | "payment_followup"
  | "next_ay_followup";

export type JourneyStepStatus = "done" | "current" | "future" | "skipped";

export interface JourneyStep {
  id: JourneyStepId;
  label: string;
  description: string;
  status: JourneyStepStatus;
  data?: any;
}

export interface JourneyState {
  steps: JourneyStep[];
  currentStepId: JourneyStepId | null;
  isComplete: boolean;
}

export function resolveJourneyState({
  filingCase,
  filings,
  invoices,
  refunds,
  followUps,
  nextAyLabel,
}: {
  filingCase: FilingCase | null;
  filings: FilingRecord[];
  invoices: Invoice[];
  refunds: Refund[];
  followUps: FollowUp[];
  nextAyLabel: string | null;
}): JourneyState {
  const steps: JourneyStep[] = [];

  // ── Step 1: Case Created ─────────────────────────────────────────────────
  const step1Done = !!filingCase;
  steps.push({
    id: "case_created",
    label: "Case Opened",
    description: "Operational case initialized for the assessment year.",
    status: step1Done ? "done" : "current",
    data: filingCase
      ? {
          createdAt: filingCase.created_at,
          returnCategory: filingCase.return_category,
        }
      : undefined,
  });

  // Helper to determine status based on previous step
  const getStatus = (isDone: boolean, prevStepDone: boolean): JourneyStepStatus => {
    if (isDone) return "done";
    if (prevStepDone) return "current";
    return "future";
  };

  // ── Step 2: Return Filed ──────────────────────────────────────────────────
  // Check if we have an active filing record with an ack number
  const activeFiling = filings.find(
    (f) => f.acknowledgement_number && f.filing_date && !f.archived_at
  );
  const step2Done = !!activeFiling;
  steps.push({
    id: "filed",
    label: "ITR Filed",
    description: "Income Tax Return uploaded and acknowledgement recorded.",
    status: getStatus(step2Done, step1Done),
    data: activeFiling
      ? {
          filingDate: activeFiling.filing_date,
          ackNumber: activeFiling.acknowledgement_number,
          filingKind: activeFiling.filing_kind,
        }
      : undefined,
  });

  // ── Step 3: Charges Calculated ────────────────────────────────────────────
  // Done if charges are auto-populated from ITR-V extraction
  const hasCharges = !!filingCase?.return_category;
  const step3Done = step1Done && hasCharges;
  steps.push({
    id: "charges",
    label: "Charges Calculated",
    description: "Filing fees and refund service charges calculated.",
    status: getStatus(step3Done, step2Done),
    data: step3Done
      ? {
          itrFilingCharges: filingCase.itr_filing_charges,
          refundClaimedAmount: filingCase.refund_claimed_amount || 0,
          refundClaimCharges: filingCase.refund_claim_charges || 0,
          totalEstimated: (Number(filingCase.itr_filing_charges) || 0) + (Number(filingCase.refund_claim_charges) || 0),
        }
      : undefined,
  });

  // ── Step 4: Refund Tracking ───────────────────────────────────────────────
  // Skipped if refund claimed is 0 or null
  const refundClaimed = (filingCase && Number(filingCase.refund_claimed_amount)) || 0;
  const hasRefundClaim = step3Done && refundClaimed > 0;
  
  let step4Done = false;
  let step4Status: JourneyStepStatus = "skipped";
  let activeRefund: Refund | undefined;

  if (hasRefundClaim) {
    activeRefund = refunds.find((r) => !r.archived_at);
    step4Done = activeRefund?.status === "Received";
    step4Status = getStatus(step4Done, step3Done);
  }

  steps.push({
    id: "refund",
    label: "Refund Tracking",
    description: "Monitor and record tax department refund credit.",
    status: step4Status,
    data: activeRefund
      ? {
          status: activeRefund.status,
          expectedAmount: activeRefund.expected_amount,
          receivedAmount: activeRefund.received_amount,
          receivedDate: activeRefund.received_date,
        }
      : hasRefundClaim
      ? {
          status: "Pending",
          expectedAmount: refundClaimed,
        }
      : undefined,
  });

  // ── Step 5: Create Invoice ────────────────────────────────────────────────
  // Pre-requisite step is Step 3 (if no refund) or Step 4 (if refund claimed)
  const prereqStep4Done = hasRefundClaim ? step4Done : step3Done;
  
  // Done if an invoice exists for this case
  const activeInvoice = invoices.find((inv) => !inv.archived_at);
  const step5Done = !!activeInvoice;

  // Compute active invoice balance
  let invoiceBalanceAmount = 0;
  if (activeInvoice) {
    const paid = ((activeInvoice as any).payments || [])
      .filter((p: any) => !p.reversed_at)
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    invoiceBalanceAmount = Number(activeInvoice.total_amount) - paid;
  }

  steps.push({
    id: "invoice",
    label: "Invoice Issued",
    description: "Generate and send professional invoice to client.",
    status: getStatus(step5Done, prereqStep4Done),
    data: activeInvoice
      ? {
          invoiceId: activeInvoice.id,
          invoiceNumber: activeInvoice.invoice_number,
          status: activeInvoice.status,
          totalAmount: activeInvoice.total_amount,
          balanceAmount: invoiceBalanceAmount,
        }
      : undefined,
  });

  // ── Step 6: Record Payment ────────────────────────────────────────────────
  // Done if the invoice is fully paid
  const isInvoicePaid = activeInvoice?.status === "Paid";
  const step6Done = step5Done && isInvoicePaid;
  steps.push({
    id: "payment",
    label: "Payment Collected",
    description: "Collect ITR filing and refund service fee charges.",
    status: getStatus(step6Done, step5Done),
    data: activeInvoice
      ? {
          totalAmount: activeInvoice.total_amount,
          balanceAmount: invoiceBalanceAmount,
          status: activeInvoice.status,
        }
      : undefined,
  });

  // ── Step 7: Payment Follow-up ─────────────────────────────────────────────
  // Skipped if invoice is fully paid
  const needsPaymentFollowup = step5Done && !isInvoicePaid;
  
  steps.push({
    id: "payment_followup",
    label: "Payment Follow-up",
    description: "Follow up with client for pending payment.",
    status: needsPaymentFollowup ? "current" : isInvoicePaid ? "skipped" : "future",
    data: activeInvoice
      ? {
          balanceAmount: invoiceBalanceAmount,
        }
      : undefined,
  });

  // ── Step 8: Next AY Follow-up ─────────────────────────────────────────────
  // Done if a follow-up record for next AY is scheduled/active
  const nextAyFollowup = followUps.find((f) => f.follow_up_type === "annual" && !f.archived_at);
  const step8Done = !!nextAyFollowup;
  const settlementDone = step6Done; // settled when paid
  
  steps.push({
    id: "next_ay_followup",
    label: "Next AY Scheduled",
    description: "Automated transition into next year's filing cycle.",
    status: getStatus(step8Done, settlementDone),
    data: nextAyFollowup
      ? {
          status: nextAyFollowup.status,
          nextAyLabel,
        }
      : undefined,
  });

  // Determine current active step (first step that is "current")
  let currentStepId: JourneyStepId | null = null;
  const currentStep = steps.find((s) => s.status === "current");
  if (currentStep) {
    currentStepId = currentStep.id;
  } else if (steps.every((s) => s.status === "done" || s.status === "skipped")) {
    // If all are done/skipped, the current step is the last one (scheduled)
    currentStepId = "next_ay_followup";
  }

  const isComplete = steps.every((s) => s.status === "done" || s.status === "skipped");

  return {
    steps,
    currentStepId,
    isComplete,
  };
}
