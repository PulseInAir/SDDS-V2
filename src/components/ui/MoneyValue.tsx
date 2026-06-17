"use client";

import { useAppContext } from "@/contexts/AppContext";
import { classNames } from "@/lib/utils/styles";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function MoneyValue({
  value,
  className,
  forceVisible = false,
}: {
  value: number;
  className?: string;
  forceVisible?: boolean;
}) {
  const { isPrivacyMode } = useAppContext();

  if (isPrivacyMode && !forceVisible) {
    return <span className={classNames("font-mono tracking-wider text-text-muted", className)}>••••</span>;
  }

  return <span className={classNames("font-mono tabular-nums", className)}>{formatCurrency(value)}</span>;
}
