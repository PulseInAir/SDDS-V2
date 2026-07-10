"use client";

import { useState } from "react";
import type { getInvoicesModuleData } from "@/lib/actions/invoices";
import { InvoicePageContent } from "@/components/invoices/InvoicePageContent";

type InvoicesModuleData = Awaited<ReturnType<typeof getInvoicesModuleData>>;

export function InvoicesManager({
  data,
  basePath,
  showClientFilter,
}: {
  data: InvoicesModuleData;
  basePath: string;
  showClientFilter: boolean;
}) {
  const [editingInvoice, setEditingInvoice] = useState<InvoicesModuleData["paginatedInvoices"][number] | null>(null);

  const handleEditInvoice = (invoice: InvoicesModuleData["paginatedInvoices"][number]) => {
    setEditingInvoice(invoice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingInvoice(null);
  };

  return (
    <div className="space-y-6">
      <InvoicePageContent
        data={data}
        basePath={basePath}
        showClientFilter={showClientFilter}
        onEditInvoice={handleEditInvoice}
      />
    </div>
  );
}
