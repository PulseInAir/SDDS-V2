import { notFound } from "next/navigation";

import { TaxEventCreateForm } from "@/components/notices/TaxEventCreateForm";
import { TaxEventPageContent } from "@/components/notices/TaxEventPageContent";
import { getClientById } from "@/lib/actions/clients";
import { getClientNoticesModuleData } from "@/lib/actions/notices";

type ClientNoticesSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function NoticesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<ClientNoticesSearchParams>;
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

  const data = await getClientNoticesModuleData(resolvedParams.clientId, {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    assessmentYearId:
      typeof resolvedSearchParams.assessmentYearId === "string"
        ? resolvedSearchParams.assessmentYearId
        : "",
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "",
    eventType: typeof resolvedSearchParams.eventType === "string" ? resolvedSearchParams.eventType : "",
    unresolvedOnly: resolvedSearchParams.unresolvedOnly === "true",
    attentionOnly: resolvedSearchParams.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const basePath = `/clients/${resolvedParams.clientId}/notices`;

  return (
    <div className="space-y-6">
      <TaxEventCreateForm
        clients={data.clients}
        assessmentYears={data.assessmentYears}
        caseOptions={data.caseOptions}
        filingRecordOptions={data.filingRecordOptions}
        defaultClientId={resolvedParams.clientId}
      />
      <TaxEventPageContent data={data} basePath={basePath} showClientFilter={false} />
    </div>
  );
}
