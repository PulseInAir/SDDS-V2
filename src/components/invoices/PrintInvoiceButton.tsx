"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function PrintInvoiceButton({
  onClick,
  isPending,
}: {
  onClick?: () => void;
  isPending?: boolean;
} = {}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick ?? (() => window.print())}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      Download JPEG
    </Button>
  );
}
