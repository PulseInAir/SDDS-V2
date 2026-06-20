import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { getShellContextData } from "@/lib/actions/settings";
import { AppContextProvider } from "@/contexts/AppContext";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthenticatedWorkspaceSession();
  const shellContext = await getShellContextData(session.workspace.id);

  return (
    <AppContextProvider
      assessmentYears={shellContext.assessmentYears}
      initialAssessmentYearId={shellContext.selectedAssessmentYearId}
      initialPrivacyMode={shellContext.isPrivacyMode}
    >
      <AppShell user={session.user}>
        {children}
      </AppShell>
    </AppContextProvider>
  );
}
