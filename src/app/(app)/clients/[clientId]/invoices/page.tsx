import { notFound } from "next/navigation";

import { InvoicesManager } from "@/components/invoices/InvoicesManager";
import { getClientById } from "@/lib/actions/clients";
import { getClientInvoicesModuleData } from "@/lib/actions/invoices";

type ClientInvoicesSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function ClientInvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<ClientInvoicesSearchParams>;
}) {
  const resolvedParams = await params;
  const client = await getClientById(resolvedParams.clientId);

  if (!client) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === "string"
    ? Number.parseInt(resolvedSearchParams.page, 10)
    : 1;

  const data = await getClientInvoicesModuleData(resolvedParams.clientId, {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    assessmentYearId:
      typeof resolvedSearchParams.assessmentYearId === "string"
        ? resolvedSearchParams.assessmentYearId
        : "",
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "",
    overdueOnly: resolvedSearchParams.overdueOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <InvoicesManager
      data={data}
      basePath={`/clients/${resolvedParams.clientId}/invoices`}
      showClientFilter={false}
    />
  );
}
