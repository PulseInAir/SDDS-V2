"use server";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { getShellContextData } from "@/lib/actions/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaseStatus } from "@/lib/constants/workflows";
import {
  DASHBOARD_METRIC_DEFINITIONS,
  deriveDashboardMetrics,
  getDashboardWorkflowDistribution,
  type DashboardCaseSnapshot,
  type DashboardDocumentSnapshot,
  type DashboardFollowUpSnapshot,
  type DashboardInvoiceSnapshot,
  type DashboardNoticeSnapshot,
  type DashboardRefundSnapshot,
} from "@/lib/dashboard/contracts";
import type { DocumentChecklistStatus } from "@/types/documents";

type ClientRelation = {
  id: string;
  full_name: string;
  pan_uppercase: string;
  mobile?: string | null;
} | ClientRelation[] | null;

type FilingCaseDashboardRow = {
  id: string;
  case_status: string;
  due_date: string | null;
  blocker_code: string | null;
  blocker_note: string | null;
  next_action: string | null;
  updated_at: string;
  clients: ClientRelation;
};

type ActivityRow = {
  id: string;
  entity_type: string;
  action: string;
  message: string;
  created_at: string;
  client_id: string | null;
  case_id: string | null;
};

function normalizeRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isOverdueDate(value: string | null) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`) < today;
}

function isAttentionCase(row: FilingCaseDashboardRow) {
  if (row.case_status === "Rectification Required" || row.case_status === "Notice Received") return true;
  if (row.blocker_note?.trim() || row.blocker_code?.trim()) return true;
  if (row.case_status === "Completed" || row.case_status === "Cancelled") return false;
  return isOverdueDate(row.due_date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export async function getOperationalDashboardData() {
  const session = await getAuthenticatedWorkspaceSession();
  const shell = await getShellContextData(session.workspace.id);
  const assessmentYearId = shell.selectedAssessmentYearId;
  const assessmentYear = shell.assessmentYears.find((year) => year.id === assessmentYearId) ?? null;
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  let casesQuery = supabase
    .from("filing_cases")
    .select(`
      id,
      case_status,
      due_date,
      blocker_code,
      blocker_note,
      next_action,
      updated_at,
      clients!inner (id, full_name, pan_uppercase, mobile)
    `)
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  let documentsQuery = supabase
    .from("documents")
    .select("case_id, checklist_status")
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null);

  let invoicesQuery = supabase
    .from("invoices")
    .select("id, status, total_amount, due_date, payments(amount, reversed_at)")
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null);

  let refundsQuery = supabaseAny
    .from("refunds")
    .select("status, expected_date, next_action, expected_amount, received_amount, updated_at, clients!inner(id, full_name, pan_uppercase)")
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  let noticesQuery = supabaseAny
    .from("tax_events")
    .select("status, response_due_date, event_type, category, next_action, updated_at, clients!inner(id, full_name, pan_uppercase)")
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  let followUpsQuery = supabaseAny
    .from("follow_ups")
    .select("status, due_date, next_action, updated_at, clients!inner(id, full_name, pan_uppercase, mobile)")
    .eq("workspace_id", session.workspace.id)
    .is("archived_at", null)
    .order("due_date", { ascending: true });

  const activityQuery = supabaseAny
    .from("activity_events")
    .select("id, entity_type, action, message, created_at, client_id, case_id")
    .eq("workspace_id", session.workspace.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (assessmentYearId) {
    casesQuery = casesQuery.eq("assessment_year_id", assessmentYearId);
    documentsQuery = documentsQuery.eq("assessment_year_id", assessmentYearId);
    invoicesQuery = invoicesQuery.eq("assessment_year_id", assessmentYearId);
    refundsQuery = refundsQuery.eq("assessment_year_id", assessmentYearId);
    noticesQuery = noticesQuery.eq("assessment_year_id", assessmentYearId);
    followUpsQuery = followUpsQuery.eq("assessment_year_id", assessmentYearId);
  }

  const [casesResult, documentsResult, invoicesResult, refundsResult, noticesResult, followUpsResult, activityResult] =
    await Promise.all([casesQuery, documentsQuery, invoicesQuery, refundsQuery, noticesQuery, followUpsQuery, activityQuery]);

  if (casesResult.error) throw new Error(`Failed to load dashboard filing cases: ${casesResult.error.message}`);
  if (documentsResult.error) throw new Error(`Failed to load dashboard documents: ${documentsResult.error.message}`);
  if (invoicesResult.error) throw new Error(`Failed to load dashboard invoices: ${invoicesResult.error.message}`);
  if (refundsResult.error) throw new Error(`Failed to load dashboard refunds: ${refundsResult.error.message}`);
  if (noticesResult.error) throw new Error(`Failed to load dashboard notices: ${noticesResult.error.message}`);
  if (followUpsResult.error) throw new Error(`Failed to load dashboard follow-ups: ${followUpsResult.error.message}`);
  if (activityResult.error) throw new Error(`Failed to load dashboard activity: ${activityResult.error.message}`);

  const filingCases = (casesResult.data ?? []) as FilingCaseDashboardRow[];
  const caseSnapshots: DashboardCaseSnapshot[] = filingCases.map((row) => ({
    id: row.id,
    case_status: row.case_status as CaseStatus,
    due_date: row.due_date,
    blocker: row.blocker_note ?? row.blocker_code,
  }));
  const documentSnapshots = ((documentsResult.data ?? []) as Array<{ case_id: string | null; checklist_status: string }>).map(
    (row): DashboardDocumentSnapshot => ({
      case_id: row.case_id,
      checklist_status: row.checklist_status as DocumentChecklistStatus,
    }),
  );
  const invoiceSnapshots = ((invoicesResult.data ?? []) as DashboardInvoiceSnapshot[]).map((invoice) => ({
    ...invoice,
    payments: invoice.payments ?? [],
  }));
  const refundSnapshots = (refundsResult.data ?? []) as DashboardRefundSnapshot[];
  const noticeSnapshots = (noticesResult.data ?? []) as DashboardNoticeSnapshot[];
  const followUpSnapshots = (followUpsResult.data ?? []) as DashboardFollowUpSnapshot[];
  const metrics = deriveDashboardMetrics({
    cases: caseSnapshots,
    documents: documentSnapshots,
    invoices: invoiceSnapshots,
    refunds: refundSnapshots,
    notices: noticeSnapshots,
    followUps: followUpSnapshots,
  });
  const workflow = getDashboardWorkflowDistribution(caseSnapshots).filter((item) => item.count > 0);
  const attentionQueue = filingCases
    .filter(isAttentionCase)
    .slice(0, 6)
    .map((row) => {
      const client = normalizeRelation(row.clients);
      return {
        id: row.id,
        clientName: client?.full_name ?? "Unknown client",
        pan: client?.pan_uppercase ?? "PAN missing",
        status: row.case_status,
        dueDate: row.due_date,
        nextAction: row.next_action ?? row.blocker_note ?? row.blocker_code ?? "Review required",
        href: `/filing-queue/${row.id}`,
      };
    });
  const queueSnapshot = filingCases.slice(0, 5).map((row) => {
    const client = normalizeRelation(row.clients);
    return {
      id: row.id,
      clientName: client?.full_name ?? "Unknown client",
      pan: client?.pan_uppercase ?? "PAN missing",
      status: row.case_status,
      nextAction: row.next_action ?? "No next action recorded",
      href: `/filing-queue/${row.id}`,
    };
  });
  const financialExceptions = [
    { label: "Outstanding", value: metrics.outstanding, href: "/invoices?scope=outstanding" },
    { label: "Overdue", value: metrics.overdue, href: "/invoices?scope=overdue" },
    { label: "Refunds pending", value: metrics.refunds_pending, href: "/refunds?unresolvedOnly=true" },
    { label: "Notices due", value: metrics.notices_due, href: "/notices?attentionOnly=true&unresolvedOnly=true" },
  ];
  const recentActivity = ((activityResult.data ?? []) as ActivityRow[]).map((row) => ({
    id: row.id,
    title: `${row.entity_type} · ${row.action}`,
    message: row.message,
    when: formatRelativeDate(row.created_at),
    href: row.case_id ? `/filing-queue/${row.case_id}` : row.client_id ? `/clients/${row.client_id}` : "/",
  }));

  return {
    workspace: session.workspace,
    assessmentYear,
    metrics,
    metricDefinitions: DASHBOARD_METRIC_DEFINITIONS,
    workflow,
    attentionQueue,
    queueSnapshot,
    financialExceptions,
    recentActivity,
  };
}
