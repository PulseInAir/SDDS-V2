"use client";

import { useActionState } from "react";

import { commitImportJobAction, type ImportActionState } from "@/lib/actions/imports";
import { Button } from "@/components/ui/Button";

const initialState: ImportActionState = {};

export function ImportCommitForm({ jobId }: { jobId: string }) {
  const action = commitImportJobAction.bind(null, jobId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" isLoading={isPending}>
        Commit approved rows
      </Button>
    </form>
  );
}
