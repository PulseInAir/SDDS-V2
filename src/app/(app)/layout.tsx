import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { AppContextProvider } from "@/contexts/AppContext";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This will throw a redirect if the user is unauthenticated or lacks workspace membership
  await getAuthenticatedWorkspaceSession();

  return (
    <AppContextProvider>
      <AppShell>
        {children}
      </AppShell>
    </AppContextProvider>
  );
}
