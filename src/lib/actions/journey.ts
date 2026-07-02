'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { resolveJourneyState } from "@/lib/workflow/journey-resolver";
import type { CaseStatus } from "@/lib/constants/workflows";
import { ensureNextYearFollowUpForCase } from "@/lib/actions/follow-ups";

/**
 * Fetches all necessary data to resolve the client's journey state.
 */
export async function getClientJourneyState(clientId: string, assessmentYearId?: string) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // 1. Get assessment year (fallback to current if not provided)
    let selectedAyId = assessmentYearId;
    if (!selectedAyId) {
      const { data: currentAy } = await supabase
        .from("assessment_years")
        .select("id")
        .eq("workspace_id", session.workspace.id)
        .eq("is_current", true)
        .maybeSingle();
      
      if (currentAy) {
        selectedAyId = currentAy.id;
      }
    }

    if (!selectedAyId) {
      throw new Error("No active assessment year found.");
    }

    // 2. Fetch Client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("workspace_id", session.workspace.id)
      .eq("id", clientId)
      .maybeSingle();

    if (clientErr || !client) {
      throw new Error("Client not found.");
    }

    // 3. Fetch current filing case
    const { data: filingCase } = await supabase
      .from("filing_cases")
      .select("*")
      .eq("workspace_id", session.workspace.id)
      .eq("client_id", clientId)
      .eq("assessment_year_id", selectedAyId)
      .maybeSingle();

    let filings: any[] = [];
    let invoices: any[] = [];
    let refunds: any[] = [];
    let followUps: any[] = [];
    let nextAyLabel: string | null = null;

    if (filingCase) {
      // 4. Fetch related data
      const [
        { data: filingRecs },
        { data: invoiceRecs },
        { data: refundRecs },
        { data: followUpRecs }
      ] = await Promise.all([
        supabase
          .from("filing_records")
          .select("*")
          .eq("case_id", filingCase.id)
          .is("archived_at", null),
        supabase
          .from("invoices")
          .select("*, payments(*)")
          .eq("case_id", filingCase.id)
          .is("archived_at", null),
        supabase
          .from("refunds")
          .select("*")
          .eq("case_id", filingCase.id)
          .is("archived_at", null),
        supabase
          .from("follow_ups")
          .select("*")
          .eq("case_id", filingCase.id)
          .is("archived_at", null)
      ]);

      filings = filingRecs || [];
      invoices = invoiceRecs || [];
      refunds = refundRecs || [];
      followUps = followUpRecs || [];

      // 5. Get Next AY Label for automated scheduling
      const { data: ay } = await supabase
        .from("assessment_years")
        .select("label")
        .eq("workspace_id", session.workspace.id)
        .eq("id", selectedAyId)
        .single();
      
      if (ay) {
        // e.g. "2026-27" -> "2027-28"
        const parts = ay.label.split("-");
        if (parts.length === 2) {
          const y1 = parseInt(parts[0]) + 1;
          const y2 = parseInt(parts[1]) + 1;
          nextAyLabel = `${y1}-${String(y2).slice(-2)}`;
        }
      }
    }

    const state = resolveJourneyState({
      filingCase,
      filings,
      invoices,
      refunds,
      followUps,
      nextAyLabel,
    });

    return {
      success: true,
      client,
      filingCase,
      selectedAyId,
      state,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to load journey state.",
    };
  }
}

/**
 * Step 1 action: Initialize a case and file it.
 */
export async function createCaseAndFilingAction(data: {
  clientId: string;
  assessmentYearId: string;
  filingDate: string;
  ackNumber: string;
  filingKind: string;
  returnCategory: string;
}) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // 1. Create or get filing case
    let { data: filingCase } = await supabase
      .from("filing_cases")
      .select("id, case_status")
      .eq("workspace_id", session.workspace.id)
      .eq("client_id", data.clientId)
      .eq("assessment_year_id", data.assessmentYearId)
      .maybeSingle();

    if (!filingCase) {
      const { data: newCase, error: caseErr } = await supabase
        .from("filing_cases")
        .insert({
          workspace_id: session.workspace.id,
          client_id: data.clientId,
          assessment_year_id: data.assessmentYearId,
          case_status: "Filed", // directly moves to filed once filing is recorded
          return_category: data.returnCategory,
          next_action: "Upload ITR-V PDF to extract charges",
        })
        .select("id, case_status")
        .single();

      if (caseErr || !newCase) {
        throw new Error(`Failed to initialize filing case: ${caseErr?.message}`);
      }
      filingCase = newCase;

      // Status history entry
      await supabase.from("case_status_history").insert([
        {
          case_id: filingCase.id,
          from_status: null,
          to_status: "New Client" as CaseStatus,
          reason: "Case opened.",
          changed_by: session.user.id,
        },
        {
          case_id: filingCase.id,
          from_status: "New Client" as CaseStatus,
          to_status: "Filed" as CaseStatus,
          reason: "Filing record added immediately.",
          changed_by: session.user.id,
        }
      ]);
    } else {
      // Update return category and status
      await supabase
        .from("filing_cases")
        .update({
          case_status: "Filed",
          return_category: data.returnCategory,
          next_action: "Upload ITR-V PDF to extract charges",
        })
        .eq("id", filingCase.id);

      if (filingCase.case_status !== "Filed") {
        await supabase.from("case_status_history").insert({
          case_id: filingCase.id,
          from_status: filingCase.case_status as CaseStatus,
          to_status: "Filed" as CaseStatus,
          reason: "Filing record recorded.",
          changed_by: session.user.id,
        });
      }
    }

    // 2. Insert filing record
    const { error: filingErr } = await supabase.from("filing_records").insert({
      case_id: filingCase.id,
      workspace_id: session.workspace.id,
      filing_kind: data.filingKind,
      filing_date: data.filingDate,
      acknowledgement_number: data.ackNumber,
      verification_status: "Pending",
      processing_status: "Submitted",
    });

    if (filingErr) {
      throw new Error(`Failed to save filing record: ${filingErr.message}`);
    }

    revalidatePath(`/clients/${data.clientId}/journey`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record filing." };
  }
}

/**
 * Step 3 action: Save the computed charges.
 */
export async function saveCaseChargesAction(data: {
  caseId: string;
  clientId: string;
  itrFilingCharges: number;
  refundClaimedAmount: number;
  refundClaimCharges: number;
}) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("filing_cases")
      .update({
        itr_filing_charges: data.itrFilingCharges,
        refund_claimed_amount: data.refundClaimedAmount,
        refund_claim_charges: data.refundClaimCharges,
        next_action: data.refundClaimedAmount > 0 
          ? "Awaiting tax department refund credit" 
          : "Generate invoice draft",
      })
      .eq("workspace_id", session.workspace.id)
      .eq("id", data.caseId);

    if (error) {
      throw new Error(`Failed to save charges: ${error.message}`);
    }

    // If refund claimed > 0, ensure a refund record is initialized
    if (data.refundClaimedAmount > 0) {
      // Check if refund record exists
      const { data: existingRefund } = await supabase
        .from("refunds")
        .select("id")
        .eq("case_id", data.caseId)
        .is("archived_at", null)
        .maybeSingle();

      if (!existingRefund) {
        await supabase.from("refunds").insert({
          case_id: data.caseId,
          workspace_id: session.workspace.id,
          expected_amount: data.refundClaimedAmount,
          status: "Pending",
          next_action: "Track refund status on portal",
        });
      } else {
        await supabase
          .from("refunds")
          .update({
            expected_amount: data.refundClaimedAmount,
          })
          .eq("id", existingRefund.id);
      }
    }

    revalidatePath(`/clients/${data.clientId}/journey`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save charges." };
  }
}

/**
 * Step 4 action: Update refund status.
 */
export async function updateRefundStatusAction(data: {
  caseId: string;
  clientId: string;
  status: string;
  receivedAmount?: number;
  receivedDate?: string;
}) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // Find the active refund
    const { data: refund } = await supabase
      .from("refunds")
      .select("id")
      .eq("case_id", data.caseId)
      .is("archived_at", null)
      .maybeSingle();

    if (!refund) {
      throw new Error("Refund record not found.");
    }

    const isReceived = data.status === "Received";

    const { error } = await supabase
      .from("refunds")
      .update({
        status: data.status,
        received_amount: isReceived ? data.receivedAmount : null,
        received_date: isReceived ? data.receivedDate : null,
        last_checked_at: new Date().toISOString(),
        next_action: isReceived ? "Generate invoice" : "Check portal for updates",
      })
      .eq("id", refund.id);

    if (error) {
      throw new Error(`Failed to update refund status: ${error.message}`);
    }

    revalidatePath(`/clients/${data.clientId}/journey`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update refund." };
  }
}

/**
 * Step 6 action: Record payment.
 */
export async function recordPaymentAction(data: {
  clientId: string;
  invoiceId: string;
  amount: number;
  mode: "Cash" | "UPI";
  reference?: string;
  note?: string;
}) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    // 1. Fetch current user session to record who made it
    const recordedBy = session.user.id;

    // 2. Insert payment record
    const { error: payErr } = await supabase.from("payments").insert({
      workspace_id: session.workspace.id,
      invoice_id: data.invoiceId,
      amount: data.amount,
      mode: data.mode,
      reference: data.reference || null,
      note: data.note || null,
      recorded_by: recordedBy,
      payment_date: new Date().toISOString(),
    });

    if (payErr) {
      throw new Error(`Failed to record payment: ${payErr.message}`);
    }

    // 3. Fetch invoice to recalculate balance and status
    const { data: invoice } = await supabase
      .from("invoices")
      .select("total_amount, case_id")
      .eq("id", data.invoiceId)
      .single();

    if (invoice) {
      // Sum all non-reversed payments
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", data.invoiceId)
        .is("reversed_at", null);

      const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = Number(invoice.total_amount) - totalPaid;
      const status = balance <= 0 ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Issued";

      await supabase
        .from("invoices")
        .update({
          status,
          balance_amount: balance,
        })
        .eq("id", data.invoiceId);

      // If fully paid, trigger automated Next AY Follow-up
      if (balance <= 0 && invoice.case_id) {
        // Trigger automated follow-up creation
        await ensureNextYearFollowUpForCase(invoice.case_id);
      }
    }

    revalidatePath(`/clients/${data.clientId}/journey`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

export async function getChargesRegisterData(clientId?: string) {
  try {
    const session = await getAuthenticatedWorkspaceSession();
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("filing_cases")
      .select(`
        id,
        case_status,
        return_category,
        itr_filing_charges,
        refund_claimed_amount,
        refund_claim_charges,
        client_id,
        assessment_year_id,
        clients (
          id,
          full_name,
          pan_uppercase
        ),
        assessment_years (
          id,
          label
        ),
        invoices (
          id,
          status,
          total_amount,
          balance_amount
        )
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("case_status", "Filed")
      .is("archived_at", null);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: cases, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: cases || [] };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch charges register." };
  }
}
