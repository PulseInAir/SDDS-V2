import { SettingsPageContent } from "@/components/settings/SettingsPageContent";
import { getSettingsPageData } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const data = await getSettingsPageData();

  return <SettingsPageContent data={data} />;
}

