import { RefundsManager } from "@/components/refunds/RefundsManager";
import { getRefundsModuleData } from "@/lib/actions/refunds";

export const metadata = {
  title: "Refunds - SDDS",
};

type RefundsSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<RefundsSearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;

  const data = await getRefundsModuleData({
    search: typeof params.search === "string" ? params.search : "",
    clientId: typeof params.clientId === "string" ? params.clientId : "",
    assessmentYearId: typeof params.assessmentYearId === "string" ? params.assessmentYearId : "",
    status: typeof params.status === "string" ? params.status : "",
    unresolvedOnly: params.unresolvedOnly === "true",
    attentionOnly: params.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return (
    <RefundsManager
      data={data}
      basePath="/refunds"
      showClientFilter={true}
    />
  );
}
