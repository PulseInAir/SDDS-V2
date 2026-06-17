import { notFound } from "next/navigation";

import { InvoiceDetailContent } from "@/components/invoices/InvoiceDetailContent";
import { getInvoiceDetail } from "@/lib/actions/invoices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const resolvedParams = await params;
  const invoice = await getInvoiceDetail(resolvedParams.invoiceId);

  return {
    title: invoice ? `${invoice.invoice_number} - SDDS` : "Invoice Not Found - SDDS",
  };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const resolvedParams = await params;
  const invoice = await getInvoiceDetail(resolvedParams.invoiceId);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailContent invoice={invoice} />;
}
