import { CASE_STATUSES, type CaseStatus } from "@/lib/constants/workflows";
import type { DocumentChecklistStatus } from "@/types/documents";
import { DOCUMENT_EXCEPTION_STATUSES } from "@/lib/utils/documents";
import {
  deriveInvoiceStatus,
  getActivePayments,
  type InvoiceRow,
  type PaymentRow,
} from "@/lib/utils/invoices";
import { deriveRefundAttention } from "@/lib/utils/refunds";
import { deriveTaxEventAttention } from "@/lib/utils/notices";
import { deriveFollowUpAttention } from "@/lib/utils/follow-ups";

export type DashboardMetricId =
  | "active_clients"
  | "new_yet_to_start"
  | "filed"
  | "attention_cases"
  | "refunds_pending"
  | "notices_due"
  | "billed"
  | "received"
  | "outstanding"
  | "overdue"
  | "follow_ups_due";

export type DashboardMetricDefinition = {
  id: DashboardMetricId;
  label: string;
  description: string;
  destination: string;
};

export type DashboardCaseSnapshot = {
  id: string;
  case_status: CaseStatus;
  due_date: string | null;
  blocker: string | null;
};

export type DashboardDocumentSnapshot = {
  case_id: string | null;
  checklist_status: DocumentChecklistStatus;
};

export type DashboardInvoiceSnapshot = Pick<InvoiceRow, "id" | "status" | "total_amount" | "due_date"> & {
  payments: Pick<PaymentRow, "amount" | "reversed_at">[];
};

export type DashboardRefundSnapshot = {
  status: string;
  expected_date: string | null;
  next_action: string | null;
};

export type DashboardNoticeSnapshot = {
  status: string;
  response_due_date: string | null;
};

export type DashboardFollowUpSnapshot = {
  status: string;
  due_date: string;
};

export type DashboardMetricsSnapshot = {
  cases: DashboardCaseSnapshot[];
  documents: DashboardDocumentSnapshot[];
  invoices: DashboardInvoiceSnapshot[];
  refunds: DashboardRefundSnapshot[];
  notices: DashboardNoticeSnapshot[];
  followUps: DashboardFollowUpSnapshot[];
};

export const DASHBOARD_METRIC_DEFINITIONS: readonly DashboardMetricDefinition[] = [
  {
    id: "active_clients",
    label: "Active clients",
    description: "All active filing cases in the selected assessment year.",
    destination: "/filing-queue",
  },
  {
    id: "new_yet_to_start",
    label: "New / Yet to start",
    description: "Cases still at New Client.",
    destination: "/filing-queue?status=New+Client",
  },
  {
    id: "filed",
    label: "Filed",
    description: "Cases successfully filed.",
    destination: "/filing-queue?status=Filed",
  },
  {
    id: "attention_cases",
    label: "Attention cases",
    description: "Blocked or overdue filing cases.",
    destination: "/filing-queue?scope=attention",
  },
  {
    id: "refunds_pending",
    label: "Refunds pending",
    description: "Unresolved refund records.",
    destination: "/refunds?unresolvedOnly=true",
  },
  {
    id: "notices_due",
    label: "Notices due",
    description: "Open notices or intimations with active due dates.",
    destination: "/notices?attentionOnly=true&unresolvedOnly=true",
  },
  {
    id: "billed",
    label: "Billed",
    description: "Issued invoice totals excluding drafts and cancelled records.",
    destination: "/invoices?scope=billed",
  },
  {
    id: "received",
    label: "Received",
    description: "Valid non-reversed invoice payments.",
    destination: "/invoices?scope=received",
  },
  {
    id: "outstanding",
    label: "Outstanding",
    description: "Invoices still carrying a balance.",
    destination: "/invoices?scope=outstanding",
  },
  {
    id: "overdue",
    label: "Overdue",
    description: "Outstanding invoices past due.",
    destination: "/invoices?scope=overdue",
  },
  {
    id: "follow_ups_due",
    label: "Follow-ups due",
    description: "Due and overdue follow-up records.",
    destination: "/follow-up?attentionOnly=true",
  },
] as const;

export function getDashboardMetricDefinition(metricId: DashboardMetricId) {
  return DASHBOARD_METRIC_DEFINITIONS.find((metric) => metric.id === metricId) ?? null;
}

export function getDashboardWorkflowDistribution(cases: DashboardCaseSnapshot[]) {
  return CASE_STATUSES.map((status) => ({
    status,
    count: cases.filter((filingCase) => filingCase.case_status === status).length,
    destination: `/filing-queue?status=${encodeURIComponent(status)}`,
  }));
}

function isOverdueDate(value: string | null) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${value}T00:00:00`) < today;
}

function countDocumentsPendingCases(cases: DashboardCaseSnapshot[], documents: DashboardDocumentSnapshot[]) {
  const impactedCaseIds = new Set<string>();

  for (const filingCase of cases) {
    if (filingCase.case_status === "Documents Pending") {
      impactedCaseIds.add(filingCase.id);
    }
  }

  for (const document of documents) {
    if (document.case_id && DOCUMENT_EXCEPTION_STATUSES.has(document.checklist_status)) {
      impactedCaseIds.add(document.case_id);
    }
  }

  return impactedCaseIds.size;
}

function countAttentionCases(cases: DashboardCaseSnapshot[]) {
  return cases.filter((filingCase) => {
    if (filingCase.case_status === "Rectification Required" || filingCase.case_status === "Notice Received") {
      return true;
    }

    if (filingCase.blocker?.trim()) {
      return true;
    }

    if (filingCase.case_status === "Completed" || filingCase.case_status === "Cancelled") {
      return false;
    }

    return isOverdueDate(filingCase.due_date);
  }).length;
}

function summarizeInvoices(invoices: DashboardInvoiceSnapshot[]) {
  const billableInvoices = invoices
    .map((invoice) => {
      const paidAmount = Number(
        getActivePayments(invoice.payments as PaymentRow[])
          .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
          .toFixed(2),
      );
      const balanceAmount = Number((Number(invoice.total_amount ?? 0) - paidAmount).toFixed(2));

      return {
        ...invoice,
        paidAmount,
        balanceAmount,
        derivedStatus: deriveInvoiceStatus(invoice, balanceAmount),
      };
    })
    .filter((invoice) => !["draft", "cancelled"].includes(invoice.derivedStatus));

  const outstandingInvoices = billableInvoices.filter((invoice) => invoice.balanceAmount > 0);
  const overdueInvoices = outstandingInvoices.filter((invoice) => invoice.derivedStatus === "overdue");

  return {
    billed: Number(billableInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0).toFixed(2)),
    received: Number(billableInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0).toFixed(2)),
    outstanding: Number(outstandingInvoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0).toFixed(2)),
    overdue: Number(overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0).toFixed(2)),
  };
}

export function deriveDashboardMetrics(snapshot: DashboardMetricsSnapshot) {
  const invoiceSummary = summarizeInvoices(snapshot.invoices);

  return {
    active_clients: snapshot.cases.length,
    new_yet_to_start: snapshot.cases.filter((filingCase) => filingCase.case_status === "New Client").length,
    filed: snapshot.cases.filter((filingCase) => filingCase.case_status === "Filed").length,
    attention_cases: countAttentionCases(snapshot.cases),
    refunds_pending: snapshot.refunds.filter((refund) => deriveRefundAttention(refund) !== "resolved").length,
    notices_due: snapshot.notices.filter((event) => {
      const attention = deriveTaxEventAttention(event);
      return attention === "due" || attention === "overdue";
    }).length,
    billed: invoiceSummary.billed,
    received: invoiceSummary.received,
    outstanding: invoiceSummary.outstanding,
    overdue: invoiceSummary.overdue,
    follow_ups_due: snapshot.followUps.filter((followUp) => {
      const attention = deriveFollowUpAttention(followUp);
      return attention === "due" || attention === "overdue";
    }).length,
  };
}
