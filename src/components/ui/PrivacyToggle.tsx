"use client";

import { Eye, EyeOff } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { IconButton } from "@/components/ui/IconButton";

export function PrivacyToggle() {
  const { isPrivacyMode, setIsPrivacyMode } = useAppContext();

  return (
    <IconButton
      variant="ghost"
      title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
      onClick={() => setIsPrivacyMode(!isPrivacyMode)}
    >
      {isPrivacyMode ? <EyeOff className="h-5 w-5 text-text-muted" /> : <Eye className="h-5 w-5 text-text-muted" />}
    </IconButton>
  );
}
