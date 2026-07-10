import { notFound } from "next/navigation";
import { ClientJourneyPage } from "@/components/journey/ClientJourneyPage";
import { getClientJourneyState } from "@/lib/actions/journey";
import { getInvoicesModuleData } from "@/lib/actions/invoices";
import { getClientById } from "@/lib/actions/clients";
import { hasCredential } from "@/lib/actions/credentials";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";

type ClientJourneyPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ ayId?: string }>;
};

export const metadata = {
  title: "Guided Journey - SDDS",
};

export default async function ClientJourneyRoute({
  params,
  searchParams,
}: ClientJourneyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const clientId = resolvedParams.clientId;
  const ayId = resolvedSearchParams.ayId;

  // 1. Fetch current client journey state
  const journeyRes = await getClientJourneyState(clientId, ayId);
  if (!journeyRes.success) {
    notFound();
  }

  // 2. Fetch invoices reference data (clients, AYs, and settings)
  const invoiceData = await getInvoicesModuleData({ clientId });

  // 3. Fetch all active assessment years for the workspace switcher
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const { data: assessmentYears } = await supabase
    .from("assessment_years")
    .select("id, label, is_current")
    .eq("workspace_id", session.workspace.id)
    .order("label", { ascending: false });

  // 4. Fetch client data for identity profile form (Step 1)
  const client = await getClientById(clientId);
  let clientFormData = null;
  if (client) {
    clientFormData = {
      id: client.id,
      full_name: client.full_name,
      pan_uppercase: client.pan_uppercase,
      date_of_birth: client.date_of_birth || '',
      mobile: client.mobile || '',
      email: client.email || '',
      address: client.address || '',
      family_group: client.family_group || '',
      active: client.active,
      follow_up_excluded: client.follow_up_excluded,
      exclusion_reason: client.exclusion_reason || '',
    };
  }

  // 5. Check if credentials exist for this client (Step 1)
  const hasExistingCredential = await hasCredential(clientId);

  const clientsOptions = invoiceData.clients.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    pan_uppercase: c.pan_uppercase,
  }));

  const ayOptions = invoiceData.assessmentYears.map((ay) => ({
    id: ay.id,
    label: ay.label,
    is_current: ay.is_current,
  }));

  return (
    <ClientJourneyPage
      clientId={clientId}
      initialJourneyData={journeyRes}
      assessmentYears={assessmentYears || []}
      clientsOptions={clientsOptions}
      ayOptions={ayOptions}
      invoiceSettings={invoiceData.invoiceSettings}
      clientFormData={clientFormData}
      hasCredential={hasExistingCredential}
    />
  );
}
