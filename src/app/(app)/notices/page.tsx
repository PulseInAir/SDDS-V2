import { TaxEventCreateForm } from "@/components/notices/TaxEventCreateForm";
import { TaxEventPageContent } from "@/components/notices/TaxEventPageContent";
import { getNoticesModuleData } from "@/lib/actions/notices";

export const metadata = {
  title: "Intimations / Notices - SDDS",
};

type NoticesSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<NoticesSearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;

  const data = await getNoticesModuleData({
    search: typeof params.search === "string" ? params.search : "",
    clientId: typeof params.clientId === "string" ? params.clientId : "",
    assessmentYearId: typeof params.assessmentYearId === "string" ? params.assessmentYearId : "",
    status: typeof params.status === "string" ? params.status : "",
    eventType: typeof params.eventType === "string" ? params.eventType : "",
    unresolvedOnly: params.unresolvedOnly === "true",
    attentionOnly: params.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <div className="space-y-6">
      <TaxEventCreateForm
        clients={data.clients}
        assessmentYears={data.assessmentYears}
        caseOptions={data.caseOptions}
        filingRecordOptions={data.filingRecordOptions}
      />
      <TaxEventPageContent data={data} basePath="/notices" showClientFilter={true} />
    </div>
  );
}
