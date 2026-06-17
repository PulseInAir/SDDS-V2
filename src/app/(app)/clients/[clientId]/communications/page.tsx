import { notFound } from "next/navigation";

import { CommunicationLogForm } from "@/components/follow-up/CommunicationLogForm";
import { FollowUpPageContent } from "@/components/follow-up/FollowUpPageContent";
import { EmptyState } from "@/components/ui/EmptyState";
import { getClientById } from "@/lib/actions/clients";
import { getClientCommunicationModuleData } from "@/lib/actions/follow-ups";
import {
  formatCommunicationChannel,
  formatCommunicationDirection,
  formatFollowUpDateTime,
} from "@/lib/utils/follow-ups";

type ClientCommunicationsSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function CommunicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<ClientCommunicationsSearchParams>;
}) {
  const resolvedParams = await params;
  const client = await getClientById(resolvedParams.clientId);

  if (!client) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams.page === "string"
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;

  const data = await getClientCommunicationModuleData(resolvedParams.clientId, {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    assessmentYearId:
      typeof resolvedSearchParams.assessmentYearId === "string"
        ? resolvedSearchParams.assessmentYearId
        : "",
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "",
    attentionOnly: resolvedSearchParams.attentionOnly === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const basePath = `/clients/${resolvedParams.clientId}/communications`;

  return (
    <div className="space-y-6">
      <CommunicationLogForm
        clients={data.clients}
        caseOptions={data.caseOptions}
        revalidateTarget={basePath}
        defaultClientId={resolvedParams.clientId}
      />
      <FollowUpPageContent data={data} basePath={basePath} showClientFilter={false} />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="text-base font-semibold text-text-primary">Recent communications</h2>
            <p className="mt-1 text-sm text-text-muted">
              Manual contact log for this client, newest first.
            </p>
          </div>
          {data.timeline.communications.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No contacts recorded yet"
                description="Use the record-contact form above to preserve the latest outreach or response."
              />
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {data.timeline.communications.map((communication) => (
                <article key={communication.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span>{formatFollowUpDateTime(communication.communication_at)}</span>
                    <span>{formatCommunicationChannel(communication.channel)}</span>
                    <span>{formatCommunicationDirection(communication.direction)}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    {communication.subject ?? "Contact log"}
                  </p>
                  <p className="text-sm text-text-secondary">{communication.summary}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-sm">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="text-base font-semibold text-text-primary">Recent activity</h2>
            <p className="mt-1 text-sm text-text-muted">
              System-recorded follow-up and case events for this client.
            </p>
          </div>
          {data.timeline.activity.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No activity yet"
                description="Operational events will appear here as cases, follow-ups, and contacts change."
              />
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {data.timeline.activity.map((event) => (
                <article key={event.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span>{formatFollowUpDateTime(event.created_at)}</span>
                    <span>{event.entity_type.replaceAll("_", " ")}</span>
                    <span>{event.action.replaceAll("_", " ")}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{event.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
