import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This will throw a redirect if the user is unauthenticated or lacks workspace membership
  await getAuthenticatedWorkspaceSession();

  return <>{children}</>;
}
