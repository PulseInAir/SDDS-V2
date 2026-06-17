import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentsPageContent } from "@/components/documents/DocumentsPageContent";
import { getClientDocumentsModuleData } from "@/lib/actions/documents";
import { getClientById } from "@/lib/actions/clients";
import { notFound } from "next/navigation";

type ClientDocumentsSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<ClientDocumentsSearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const client = await getClientById(resolvedParams.clientId);

  if (!client) {
    notFound();
  }

  const page =
    typeof resolvedSearchParams.page === "string"
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;

  const data = await getClientDocumentsModuleData(resolvedParams.clientId, {
    assessmentYearId:
      typeof resolvedSearchParams.assessmentYearId === "string"
        ? resolvedSearchParams.assessmentYearId
        : "",
    checklistStatus:
      typeof resolvedSearchParams.checklistStatus === "string"
        ? resolvedSearchParams.checklistStatus
        : "",
    type: typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const basePath = `/clients/${resolvedParams.clientId}/documents`;

  return (
    <div className="space-y-6">
      <DocumentUploadForm
        revalidateTarget={basePath}
        defaultClientId={client.id}
        clients={[{ id: client.id, label: `${client.full_name} • ${client.pan_uppercase}` }]}
        assessmentYears={data.assessmentYears.map((assessmentYear) => ({
          id: assessmentYear.id,
          label: assessmentYear.label,
        }))}
        replacementOptions={data.chains.map((chain) => ({
          id: chain.latest.id,
          label: `${chain.latest.document_type} • ${chain.latest.assessment_years?.label ?? "No AY"} • v${chain.latest.version}`,
        }))}
      />

      <DocumentsPageContent
        data={data}
        basePath={basePath}
        showClientSearch={false}
        currentClientId={client.id}
      />
    </div>
  );
}
