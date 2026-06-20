import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { ProfilePageContent } from "@/components/settings/ProfilePageContent";

export default async function ProfilePage() {
  const session = await getAuthenticatedWorkspaceSession();

  return <ProfilePageContent session={session} />;
}
