import { ExportPageContent } from "@/components/settings/ExportPageContent";
import { getExportPageData } from "@/lib/exports/business";

export default async function SettingsExportPage() {
  const data = await getExportPageData();

  return <ExportPageContent data={data} />;
}
