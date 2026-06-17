"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function PrintInvoiceButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
      Print invoice
    </Button>
  );
}
