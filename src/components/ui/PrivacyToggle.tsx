"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";
import { setPrivacyModePreferenceAction } from "@/lib/actions/settings";
import { useAppContext } from "@/contexts/AppContext";
import { IconButton } from "@/components/ui/IconButton";

export function PrivacyToggle() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isPrivacyMode, setIsPrivacyMode } = useAppContext();

  return (
    <IconButton
      variant="ghost"
      title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
      disabled={isPending}
      onClick={() => {
        const nextValue = !isPrivacyMode;
        const previousValue = isPrivacyMode;
        setIsPrivacyMode(nextValue);

        startTransition(async () => {
          try {
            await setPrivacyModePreferenceAction(nextValue);
            router.refresh();
          } catch {
            setIsPrivacyMode(previousValue);
          }
        });
      }}
    >
      {isPrivacyMode ? <EyeOff className="h-5 w-5 text-text-muted" /> : <Eye className="h-5 w-5 text-text-muted" />}
    </IconButton>
  );
}
