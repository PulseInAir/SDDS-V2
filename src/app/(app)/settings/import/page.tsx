import { ImportPageContent } from "@/components/settings/ImportPageContent";
import { getImportPageData } from "@/lib/actions/imports";

export default async function SettingsImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedJobId = typeof resolvedSearchParams.job === "string" ? resolvedSearchParams.job : undefined;
  const data = await getImportPageData(selectedJobId);

  return <ImportPageContent data={data} />;
}
