import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { DocumentsPageContent } from "@/components/documents/DocumentsPageContent";
import { getDocumentsModuleData } from "@/lib/actions/documents";

export const metadata = {
  title: "Documents - SDDS",
};

type DocumentsSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<DocumentsSearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;

  const data = await getDocumentsModuleData({
    search: typeof params.search === "string" ? params.search : "",
    assessmentYearId: typeof params.assessmentYearId === "string" ? params.assessmentYearId : "",
    checklistStatus: typeof params.checklistStatus === "string" ? params.checklistStatus : "",
    scope: typeof params.scope === "string" ? params.scope : "",
    type: typeof params.type === "string" ? params.type : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <div className="space-y-6">
      <DocumentUploadForm
        revalidateTarget="/documents"
        clients={data.clients.map((client) => ({
          id: client.id,
          label: `${client.full_name} • ${client.pan_uppercase}`,
        }))}
        assessmentYears={data.assessmentYears.map((assessmentYear) => ({
          id: assessmentYear.id,
          label: assessmentYear.label,
        }))}
      />

      <DocumentsPageContent data={data} basePath="/documents" showClientSearch={true} />
    </div>
  );
}
