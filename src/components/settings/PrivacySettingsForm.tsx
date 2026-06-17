"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2, Shield } from "lucide-react";

import { setPrivacyModePreferenceAction, type SettingsActionState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";

const initialState: SettingsActionState = {};

async function updatePrivacyModeAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const nextValue = String(formData.get("privacyMode") ?? "on") === "on";
  await setPrivacyModePreferenceAction(nextValue);

  return {
    success: `Privacy Mode will now default to ${nextValue ? "ON" : "OFF"} in this browser.`,
  };
}

export function PrivacySettingsForm({ initialPrivacyMode }: { initialPrivacyMode: boolean }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updatePrivacyModeAction, initialState);
  const lastSuccessMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.success !== lastSuccessMessage.current) {
      lastSuccessMessage.current = state.success;
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Privacy Mode</h2>
          <p className="mt-1 text-sm text-text-muted">
            Sensitive identifiers and money stay masked by default. Password reveal remains a separate deliberate action even when masking is off.
          </p>
        </div>
        <Shield className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      <div className="space-y-2 text-sm text-text-secondary">
        <label className="flex items-start gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-3">
          <input
            type="radio"
            name="privacyMode"
            value="on"
            defaultChecked={initialPrivacyMode}
            className="mt-1 h-4 w-4 border-border-subtle text-brand-600 focus:ring-brand-600"
          />
          <span>
            <span className="block font-medium text-text-primary">Default ON</span>
            <span className="block text-xs">Recommended. PAN, contact values, invoice amounts, and refund amounts stay masked until intentionally revealed.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-3">
          <input
            type="radio"
            name="privacyMode"
            value="off"
            defaultChecked={!initialPrivacyMode}
            className="mt-1 h-4 w-4 border-border-subtle text-brand-600 focus:ring-brand-600"
          />
          <span>
            <span className="block font-medium text-text-primary">Default OFF</span>
            <span className="block text-xs">Useful only for intentional review sessions in this browser. Credential passwords still stay hidden until the reveal flow is used.</span>
          </span>
        </label>
      </div>

      {state.success ? (
        <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save privacy preference
        </Button>
      </div>
    </form>
  );
}
