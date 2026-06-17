import { notFound } from "next/navigation";

import { RefundCreateForm } from "@/components/refunds/RefundCreateForm";
import { RefundPageContent } from "@/components/refunds/RefundPageContent";
import { getClientById } from "@/lib/actions/clients";
import { getClientRefundsModuleData } from "@/lib/actions/refunds";

type ClientRefundsSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function ClientRefundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<ClientRefundsSearchParams>;
}) {
  const resolvedParams = await params;
  const client = await getClientById(resolvedParams.clientId);

  if (!client) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams.page === "string"
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;

  const data = await getClientRefundsModuleData(resolvedParams.clientId, {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    assessmentYearId:
      typeof resolvedSearchParams.assessmentYearId === "string"
        ? resolvedSearchParams.assessmentYearId
        : "",
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "",
    unresolvedOnly: resolvedSearchParams.unresolvedOnly === "true",
    attentionOnly: resolvedSearchParams.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const basePath = `/clients/${resolvedParams.clientId}/refunds`;

  return (
    <div className="space-y-6">
      <RefundCreateForm
        clients={data.clients}
        assessmentYears={data.assessmentYears}
        caseOptions={data.caseOptions}
        filingRecordOptions={data.filingRecordOptions}
        defaultClientId={resolvedParams.clientId}
      />
      <RefundPageContent data={data} basePath={basePath} showClientFilter={false} />
    </div>
  );
}
