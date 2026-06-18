"use server";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { getShellContextData } from "@/lib/actions/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DASHBOARD_METRIC_DEFINITIONS,
  deriveDashboardMetrics,
  getDashboardWorkflowDistribution,
  type DashboardCaseSnapshot,
  type DashboardDocumentSnapshot,
  type DashboardFollowUpSnapshot,
  type DashboardInvoiceSnapshot,
  type DashboardMetricDefinition,
  type DashboardNoticeSnapshot,
  type DashboardRefundSnapshot,
} from "@/lib/dashboard/contracts";
import { deriveFollowUpAttention } from "@/lib/utils/follow-ups";
import type { DerivedInvoiceStatus } from "@/lib/utils/invoices";
import { deriveInvoiceStatus } from "@/lib/utils/invoices";
import { deriveTaxEventAttention } from "@/lib/utils/notices";
import { deriveRefundAttention } from "@/lib/utils/refunds";

type AssessmentYearSelection = {
  id: string;
  label: string;
  isCurrent: boolean;
  isOpen: boolean;
};

type DashboardMetricValue = DashboardMetricDefinition & {
  value: number;
};

type DashboardCaseRecord = DashboardCaseSnapshot & {
  client_id: string;
  client_name: string;
  client_pan: string;
  next_action: string | null;
  updated_at: string;
  expected_completion_date: string | null;
  blocker: string | null;
};

type DashboardInvoiceAttention = {
  id: string;
  client_id: string;
  client_name: string;
  client_pan: string;
  invoice_number: string;
  due_date: string | null;
  balance_amount: number;
  paid_amount: number;
  derived_status: DerivedInvoiceStatus;
};

type DashboardRefundAttention = {
  id: string;
  client_id: string;
  client_name: string;
  client_pan: string;
  status: string;
  expected_date: string | null;
  next_action: string | null;
  attention_level: ReturnType<typeof deriveRefundAttention>;
};

type DashboardNoticeAttention = {
  id: string;
  client_id: string;
  client_name: string;
  client_pan: string;
  event_type: string;
  status: string;
  response_due_date: string | null;
  next_action: string | null;
  attention_level: ReturnType<typeof deriveTaxEventAttention>;
};

type DashboardFollowUpAttention = DashboardFollowUpSnapshot & {
  id: string;
  client_id: string;
  client_name: string;
  client_pan: string;
  case_id: string | null;
  next_action: string | null;
  follow_up_type: string;
  attention_level: ReturnType<typeof deriveFollowUpAttention>;
};

type DashboardActivityItem = {
  id: string;
  client_id: string | null;
  case_id: string | null;
  client_name: string;
  client_pan: string;
  entity_type: string;
  action: string;
  message: string;
  created_at: string;
};

type DashboardPageData = {
  selectedAssessmentYear: AssessmentYearSelection | null;
  isPrivacyMode: boolean;
  metricValues: DashboardMetricValue[];
  workflowDistribution: ReturnType<typeof getDashboardWorkflowDistribution>;
  activeCaseCount: number;
  urgentCases: DashboardCaseRecord[];
  invoiceAttention: DashboardInvoiceAttention[];
  refundAttention: DashboardRefundAttention[];
  noticeAttention: DashboardNoticeAttention[];
  followUpsDue: DashboardFollowUpAttention[];
  recentActivity: DashboardActivityItem[];
};

type RelationValue<T> = T | T[] | null;

type CaseQueryRow = {
  id: string;
  client_id: string;
  case_status: DashboardCaseSnapshot["case_status"];
  next_action: string | null;
  due_date: string | null;
  expected_completion_date: string | null;
  updated_at: string;
  blocker_code: string | null;
  blocker_note: string | null;
  clients: RelationValue<{
    id: string;
    full_name: string;
    pan_uppercase: string;
  }>;
};

type InvoiceQueryRow = {
  id: string;
  client_id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  due_date: string | null;
  clients: RelationValue<{
    full_name: string;
    pan_uppercase: string;
  }>;
  payments: Array<{
    amount: number;
    reversed_at: string | null;
  }> | null;
};

type RefundQueryRow = {
  id: string;
  client_id: string;
  status: string;
  expected_date: string | null;
  next_action: string | null;
  clients: RelationValue<{
    full_name: string;
    pan_uppercase: string;
  }>;
};

type NoticeQueryRow = {
  id: string;
  client_id: string;
  event_type: string;
  status: string;
  response_due_date: string | null;
  next_action: string | null;
  clients: RelationValue<{
    full_name: string;
    pan_uppercase: string;
  }>;
};

type FollowUpQueryRow = {
  id: string;
  client_id: string;
  case_id: string | null;
  follow_up_type: string;
  status: string;
  due_date: string;
  next_action: string | null;
  clients: RelationValue<{
    full_name: string;
    pan_uppercase: string;
  }>;
};

type ActivityQueryRow = {
  id: string;
  client_id: string | null;
  case_id: string | null;
  entity_type: string;
  action: string;
  message: string;
  created_at: string;
  clients: RelationValue<{
    full_name: string;
    pan_uppercase: string;
  }>;
};

function normalizeRelation<T>(value: RelationValue<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function isOverdueDate(value: string | null) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${value}T00:00:00`) < today;
}

function daysUntil(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCaseAttentionReason(filingCase: DashboardCaseRecord) {
  if (filingCase.case_status === "Rectification Required") {
    return "Rectification required";
  }

  if (filingCase.case_status === "Notice Received") {
    return "Notice received";
  }

  if (filingCase.blocker) {
    return filingCase.blocker;
  }

  if (isOverdueDate(filingCase.due_date)) {
    return "Case due date has passed";
  }

  if (filingCase.case_status === "Ready To File") {
    return "Ready to file";
  }

  if (daysUntil(filingCase.due_date) <= 2) {
    return "Due soon";
  }

  return "Needs review";
}

function getUrgencyScore(filingCase: DashboardCaseRecord) {
  if (filingCase.case_status === "Rectification Required" || filingCase.case_status === "Notice Received") {
    return 0;
  }

  if (filingCase.blocker) {
    return 1;
  }

  if (isOverdueDate(filingCase.due_date)) {
    return 2;
  }

  if (filingCase.case_status === "Ready To File") {
    return 3;
  }

  if (daysUntil(filingCase.due_date) <= 2) {
    return 4;
  }

  return 5;
}

export async function getOperationalDashboardData(): Promise<DashboardPageData> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const shell = await getShellContextData(session.workspace.id);
  const selectedAssessmentYearId = shell.selectedAssessmentYearId;

  if (!selectedAssessmentYearId) {
    return {
      selectedAssessmentYear: null,
      isPrivacyMode: shell.isPrivacyMode,
      metricValues: [],
      workflowDistribution: [],
      activeCaseCount: 0,
      urgentCases: [],
      invoiceAttention: [],
      refundAttention: [],
      noticeAttention: [],
      followUpsDue: [],
      recentActivity: [],
    };
  }

  const selectedAssessmentYearRow = shell.assessmentYears.find(
    (assessmentYear) => assessmentYear.id === selectedAssessmentYearId,
  );

  const [
    casesResult,
    documentsResult,
    invoicesResult,
    refundsResult,
    noticesResult,
    followUpsResult,
  ] = await Promise.all([
    supabase
      .from("filing_cases")
      .select(`
        id,
        client_id,
        case_status,
        next_action,
        due_date,
        expected_completion_date,
        updated_at,
        blocker_code,
        blocker_note,
        clients!inner (id, full_name, pan_uppercase)
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("documents")
      .select("case_id, checklist_status")
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null),
    supabase
      .from("invoices")
      .select(`
        id,
        client_id,
        invoice_number,
        status,
        total_amount,
        due_date,
        clients!inner (full_name, pan_uppercase),
        payments (amount, reversed_at)
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("refunds")
      .select(`
        id,
        client_id,
        status,
        expected_date,
        next_action,
        clients!inner (full_name, pan_uppercase)
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("tax_events")
      .select(`
        id,
        client_id,
        event_type,
        status,
        response_due_date,
        next_action,
        clients!inner (full_name, pan_uppercase)
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("follow_ups")
      .select(`
        id,
        client_id,
        case_id,
        follow_up_type,
        status,
        due_date,
        next_action,
        clients!inner (full_name, pan_uppercase)
      `)
      .eq("workspace_id", session.workspace.id)
      .eq("assessment_year_id", selectedAssessmentYearId)
      .is("archived_at", null)
      .order("due_date", { ascending: true }),
  ]);

  if (casesResult.error) {
    throw new Error(`Failed to load dashboard filing cases: ${casesResult.error.message}`);
  }

  if (documentsResult.error) {
    throw new Error(`Failed to load dashboard documents: ${documentsResult.error.message}`);
  }

  if (invoicesResult.error) {
    throw new Error(`Failed to load dashboard invoices: ${invoicesResult.error.message}`);
  }

  if (refundsResult.error) {
    throw new Error(`Failed to load dashboard refunds: ${refundsResult.error.message}`);
  }

  if (noticesResult.error) {
    throw new Error(`Failed to load dashboard notices: ${noticesResult.error.message}`);
  }

  if (followUpsResult.error) {
    throw new Error(`Failed to load dashboard follow-ups: ${followUpsResult.error.message}`);
  }

  const cases = ((casesResult.data ?? []) as CaseQueryRow[]).map((filingCase) => {
    const client = normalizeRelation(filingCase.clients);
    const blocker = filingCase.blocker_note?.trim() || filingCase.blocker_code?.trim() || null;

    return {
      id: filingCase.id,
      client_id: filingCase.client_id,
      client_name: client?.full_name ?? "Unknown client",
      client_pan: client?.pan_uppercase ?? "",
      case_status: filingCase.case_status,
      next_action: filingCase.next_action,
      due_date: filingCase.due_date,
      expected_completion_date: filingCase.expected_completion_date,
      updated_at: filingCase.updated_at,
      blocker,
    } satisfies DashboardCaseRecord;
  });

  const documents = (documentsResult.data ?? []) as DashboardDocumentSnapshot[];

  const invoices = ((invoicesResult.data ?? []) as InvoiceQueryRow[]).map((invoice) => {
    const client = normalizeRelation(invoice.clients);
    const payments = invoice.payments ?? [];
    const paidAmount = Number(
      payments
        .filter((payment) => payment.reversed_at === null)
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    );
    const balanceAmount = Number((Number(invoice.total_amount ?? 0) - paidAmount).toFixed(2));
    const derivedStatus = deriveInvoiceStatus(invoice, balanceAmount);

    return {
      snapshot: {
        id: invoice.id,
        status: invoice.status,
        total_amount: invoice.total_amount,
        due_date: invoice.due_date,
        payments,
      } satisfies DashboardInvoiceSnapshot,
      attention: {
        id: invoice.id,
        client_id: invoice.client_id,
        client_name: client?.full_name ?? "Unknown client",
        client_pan: client?.pan_uppercase ?? "",
        invoice_number: invoice.invoice_number,
        due_date: invoice.due_date,
        balance_amount: balanceAmount,
        paid_amount: paidAmount,
        derived_status: derivedStatus,
      } satisfies DashboardInvoiceAttention,
    };
  });

  const refunds = ((refundsResult.data ?? []) as RefundQueryRow[]).map((refund) => {
    const client = normalizeRelation(refund.clients);
    const attentionLevel = deriveRefundAttention(refund);

    return {
      snapshot: {
        status: refund.status,
        expected_date: refund.expected_date,
        next_action: refund.next_action,
      } satisfies DashboardRefundSnapshot,
      attention: {
        id: refund.id,
        client_id: refund.client_id,
        client_name: client?.full_name ?? "Unknown client",
        client_pan: client?.pan_uppercase ?? "",
        status: refund.status,
        expected_date: refund.expected_date,
        next_action: refund.next_action,
        attention_level: attentionLevel,
      } satisfies DashboardRefundAttention,
    };
  });

  const notices = ((noticesResult.data ?? []) as NoticeQueryRow[]).map((notice) => {
    const client = normalizeRelation(notice.clients);
    const attentionLevel = deriveTaxEventAttention(notice);

    return {
      snapshot: {
        status: notice.status,
        response_due_date: notice.response_due_date,
      } satisfies DashboardNoticeSnapshot,
      attention: {
        id: notice.id,
        client_id: notice.client_id,
        client_name: client?.full_name ?? "Unknown client",
        client_pan: client?.pan_uppercase ?? "",
        event_type: notice.event_type,
        status: notice.status,
        response_due_date: notice.response_due_date,
        next_action: notice.next_action,
        attention_level: attentionLevel,
      } satisfies DashboardNoticeAttention,
    };
  });

  const followUps = ((followUpsResult.data ?? []) as FollowUpQueryRow[]).map((followUp) => {
    const client = normalizeRelation(followUp.clients);
    const attentionLevel = deriveFollowUpAttention(followUp);

    return {
      snapshot: {
        status: followUp.status,
        due_date: followUp.due_date,
      } satisfies DashboardFollowUpSnapshot,
      attention: {
        id: followUp.id,
        client_id: followUp.client_id,
        client_name: client?.full_name ?? "Unknown client",
        client_pan: client?.pan_uppercase ?? "",
        case_id: followUp.case_id,
        status: followUp.status,
        due_date: followUp.due_date,
        next_action: followUp.next_action,
        follow_up_type: followUp.follow_up_type,
        attention_level: attentionLevel,
      } satisfies DashboardFollowUpAttention,
    };
  });

  const metricSource = deriveDashboardMetrics({
    cases: cases.map<DashboardCaseSnapshot>((filingCase) => ({
      id: filingCase.id,
      case_status: filingCase.case_status,
      due_date: filingCase.due_date,
      blocker: filingCase.blocker,
    })),
    documents,
    invoices: invoices.map((invoice) => invoice.snapshot),
    refunds: refunds.map((refund) => refund.snapshot),
    notices: notices.map((notice) => notice.snapshot),
    followUps: followUps.map((followUp) => followUp.snapshot),
  });

  const metricValues = DASHBOARD_METRIC_DEFINITIONS.map((definition) => ({
    ...definition,
    value: metricSource[definition.id],
  }));

  const workflowDistribution = getDashboardWorkflowDistribution(
    cases.map((filingCase) => ({
      id: filingCase.id,
      case_status: filingCase.case_status,
      due_date: filingCase.due_date,
      blocker: filingCase.blocker,
    })),
  );

  const urgentCases = cases
    .filter((filingCase) => !["Completed", "Cancelled"].includes(filingCase.case_status))
    .sort((left, right) => {
      const urgencyDelta = getUrgencyScore(left) - getUrgencyScore(right);
      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }

      const dueDelta = daysUntil(left.due_date) - daysUntil(right.due_date);
      if (dueDelta !== 0) {
        return dueDelta;
      }

      return right.updated_at.localeCompare(left.updated_at);
    })
    .slice(0, 8);

  const caseIds = cases.map((filingCase) => filingCase.id);
  let recentActivity: DashboardActivityItem[] = [];

  if (caseIds.length > 0) {
    const activityResult = await supabase
      .from("activity_events")
      .select(`
        id,
        client_id,
        case_id,
        entity_type,
        action,
        message,
        created_at,
        clients (full_name, pan_uppercase)
      `)
      .eq("workspace_id", session.workspace.id)
      .in("case_id", caseIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (activityResult.error) {
      throw new Error(`Failed to load dashboard activity: ${activityResult.error.message}`);
    }

    recentActivity = ((activityResult.data ?? []) as ActivityQueryRow[]).map((activity) => {
      const client = normalizeRelation(activity.clients);

      return {
        id: activity.id,
        client_id: activity.client_id,
        case_id: activity.case_id,
        client_name: client?.full_name ?? "Unknown client",
        client_pan: client?.pan_uppercase ?? "",
        entity_type: activity.entity_type,
        action: activity.action,
        message: activity.message,
        created_at: activity.created_at,
      };
    });
  }

  return {
    selectedAssessmentYear: selectedAssessmentYearRow
      ? {
          id: selectedAssessmentYearRow.id,
          label: selectedAssessmentYearRow.label,
          isCurrent: selectedAssessmentYearRow.is_current,
          isOpen: selectedAssessmentYearRow.is_open,
        }
      : null,
    isPrivacyMode: shell.isPrivacyMode,
    metricValues,
    workflowDistribution,
    activeCaseCount: cases.length,
    urgentCases: urgentCases.map((filingCase) => ({
      ...filingCase,
      blocker: getCaseAttentionReason(filingCase),
    })),
    invoiceAttention: invoices
      .map((invoice) => invoice.attention)
      .filter((invoice) => invoice.balance_amount > 0)
      .sort((left, right) => {
        if (left.derived_status === "overdue" && right.derived_status !== "overdue") {
          return -1;
        }

        if (left.derived_status !== "overdue" && right.derived_status === "overdue") {
          return 1;
        }

        return daysUntil(left.due_date) - daysUntil(right.due_date);
      })
      .slice(0, 6),
    refundAttention: refunds
      .map((refund) => refund.attention)
      .filter((refund) => refund.attention_level !== "resolved")
      .slice(0, 5),
    noticeAttention: notices
      .map((notice) => notice.attention)
      .filter((notice) => notice.attention_level !== "resolved")
      .slice(0, 5),
    followUpsDue: followUps
      .map((followUp) => followUp.attention)
      .filter((followUp) => followUp.attention_level === "overdue" || followUp.attention_level === "due")
      .slice(0, 6),
    recentActivity,
  };
}
