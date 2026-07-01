"use client";

import { useState } from "react";
import type { getRefundsModuleData } from "@/lib/actions/refunds";
import { RefundCreateForm } from "@/components/refunds/RefundCreateForm";
import { RefundPageContent } from "@/components/refunds/RefundPageContent";

type RefundsModuleData = Awaited<ReturnType<typeof getRefundsModuleData>>;

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

type CaseOption = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_status: string;
  next_action: string | null;
};

type FilingRecordOption = {
  id: string;
  case_id: string;
  filing_kind: string;
  filing_date: string | null;
  acknowledgement_number: string | null;
};

export type RefundFormRecord = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_id: string;
  filing_record_id: string | null;
  status: string;
  expected_amount: number | null;
  expected_date: string | null;
  received_amount: number | null;
  received_date: string | null;
  last_checked_at: string | null;
  next_action: string | null;
  notes: string | null;
};

export function RefundsManager({
  data,
  basePath,
  showClientFilter,
  defaultClientId,
}: {
  data: RefundsModuleData;
  basePath: string;
  showClientFilter: boolean;
  defaultClientId?: string;
}) {
  const [editingRefund, setEditingRefund] = useState<RefundFormRecord | null>(null);

  const handleEditRefund = (refund: RefundFormRecord) => {
    setEditingRefund(refund);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingRefund(null);
  };

  // Extract needed options from data safely
  const clients = data.clients as ClientOption[];
  const assessmentYears = data.assessmentYears as AssessmentYearOption[];
  const caseOptions = data.caseOptions as CaseOption[];
  const filingRecordOptions = data.filingRecordOptions as FilingRecordOption[];

  return (
    <div className="space-y-6">
      <RefundCreateForm
        key={editingRefund?.id || "create"}
        clients={clients}
        assessmentYears={assessmentYears}
        caseOptions={caseOptions}
        filingRecordOptions={filingRecordOptions}
        defaultClientId={defaultClientId}
        editingRefund={editingRefund}
        onCancelEdit={handleCancelEdit}
        revalidateTarget={basePath}
      />
      <RefundPageContent
        data={data}
        basePath={basePath}
        showClientFilter={showClientFilter}
        onEditRefund={handleEditRefund}
      />
    </div>
  );
}
