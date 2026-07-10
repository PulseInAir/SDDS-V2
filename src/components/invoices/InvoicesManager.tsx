"use client";

import { useState } from "react";
import type { getInvoicesModuleData } from "@/lib/actions/invoices";
import { InvoiceCreateForm } from "@/components/invoices/InvoiceCreateForm";
import { InvoicePageContent } from "@/components/invoices/InvoicePageContent";

type InvoicesModuleData = Awaited<ReturnType<typeof getInvoicesModuleData>>;

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

export function InvoicesManager({
  data,
  basePath,
  showClientFilter,
  defaultClientId,
}: {
  data: InvoicesModuleData;
  basePath: string;
  showClientFilter: boolean;
  defaultClientId?: string;
}) {
  const [editingInvoice, setEditingInvoice] = useState<InvoicesModuleData["paginatedInvoices"][number] | null>(null);

  const handleEditInvoice = (invoice: InvoicesModuleData["paginatedInvoices"][number]) => {
    setEditingInvoice(invoice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
  };

  const clients = data.clients as ClientOption[];
  const assessmentYears = data.assessmentYears as AssessmentYearOption[];

  return (
    <div className="space-y-6">
      <InvoicePageContent
        data={data}
        basePath={basePath}
        showClientFilter={showClientFilter}
        onEditInvoice={handleEditInvoice}
      />
      <InvoiceCreateForm
        key={editingInvoice?.id || "create"}
        clients={clients}
        assessmentYears={assessmentYears}
        defaultClientId={defaultClientId}
        invoiceSettings={data.invoiceSettings}
        editingInvoice={editingInvoice || undefined}
        onCancelEdit={handleCancelEdit}
        revalidateTarget={basePath}
      />
    </div>
  );
}
