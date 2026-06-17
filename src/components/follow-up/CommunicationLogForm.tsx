"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, MessageSquareText, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { recordCommunicationAction, type FollowUpActionState } from "@/lib/actions/follow-ups";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTIONS,
  formatCommunicationChannel,
  formatCommunicationDirection,
} from "@/lib/utils/follow-ups";

type ClientOption = {
  id: string;
  full_name: string;
  pan_uppercase: string;
};

type CaseOption = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_status: string;
  next_action: string | null;
};

const initialState: FollowUpActionState = {};

function getDefaultCommunicationAt() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CommunicationLogForm({
  clients,
  caseOptions,
  revalidateTarget,
  defaultClientId,
}: {
  clients: ClientOption[];
  caseOptions: CaseOption[];
  revalidateTarget: string;
  defaultClientId?: string;
}) {
  const [state, formAction, isPending] = useActionState(recordCommunicationAction, initialState);
  const [clientId, setClientId] = useState(defaultClientId ?? "");

  const availableCases = useMemo(
    () => caseOptions.filter((filingCase) => filingCase.client_id === clientId),
    [caseOptions, clientId],
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm"
    >
      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />
      {defaultClientId ? <input type="hidden" name="clientId" value={clientId} /> : null}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Record contact</h2>
          <p className="mt-1 text-sm text-text-muted">
            Log the latest client touchpoint, keep the follow-up queue current, and preserve the contact trail without storing unnecessary message content.
          </p>
        </div>
        <MessageSquareText className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Client</span>
          <select
            name={defaultClientId ? undefined : "clientId"}
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
            disabled={Boolean(defaultClientId)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-surface-muted"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name} • {client.pan_uppercase}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Channel</span>
          <select
            name="channel"
            defaultValue="whatsapp"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {COMMUNICATION_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {formatCommunicationChannel(channel)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Direction</span>
          <select
            name="direction"
            defaultValue="outbound"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {COMMUNICATION_DIRECTIONS.map((direction) => (
              <option key={direction} value={direction}>
                {formatCommunicationDirection(direction)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Linked case</span>
          <select
            name="caseId"
            disabled={!clientId}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-surface-muted"
          >
            <option value="">{clientId ? "Client-level contact" : "Choose client first"}</option>
            {availableCases.map((filingCase) => (
              <option key={filingCase.id} value={filingCase.id}>
                {filingCase.case_status}
                {filingCase.next_action ? ` • ${filingCase.next_action}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Contact time</span>
          <input
            type="datetime-local"
            name="communicationAt"
            defaultValue={getDefaultCommunicationAt()}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Subject</span>
          <input
            type="text"
            name="subject"
            placeholder="Document reminder, AY outreach, payment check, notice update..."
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Summary</span>
          <textarea
            name="summary"
            rows={3}
            required
            placeholder="Summarise what was requested, confirmed, or promised next."
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="reset"
          variant="secondary"
          onClick={() => {
            setClientId(defaultClientId ?? "");
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
        <Button type="submit" variant="primary" disabled={isPending || !clientId}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Record contact
        </Button>
      </div>
    </form>
  );
}
