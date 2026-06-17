import { CommunicationLogForm } from "@/components/follow-up/CommunicationLogForm";
import { FollowUpPageContent } from "@/components/follow-up/FollowUpPageContent";
import { getFollowUpsModuleData } from "@/lib/actions/follow-ups";

export const metadata = {
  title: "Follow-up - SDDS",
};

type FollowUpSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function FollowUpPage({
  searchParams,
}: {
  searchParams: Promise<FollowUpSearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;

  const data = await getFollowUpsModuleData({
    search: typeof params.search === "string" ? params.search : "",
    clientId: typeof params.clientId === "string" ? params.clientId : "",
    assessmentYearId: typeof params.assessmentYearId === "string" ? params.assessmentYearId : "",
    status: typeof params.status === "string" ? params.status : "",
    attentionOnly: params.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <div className="space-y-6">
      <CommunicationLogForm clients={data.clients} caseOptions={data.caseOptions} revalidateTarget="/follow-up" />
      <FollowUpPageContent data={data} basePath="/follow-up" showClientFilter={true} />
    </div>
  );
}
