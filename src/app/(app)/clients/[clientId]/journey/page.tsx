import { redirect } from "next/navigation";

export default async function ClientJourneyRedirect({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params;
  redirect(`/clients/${resolvedParams.clientId}`);
}
