export const REFUND_STATUSES = [
  "not_expected",
  "expected",
  "processing",
  "received",
  "adjusted",
  "rejected",
  "follow_up_required",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type RefundAttentionLevel = "overdue" | "due" | "follow_up" | "unresolved" | "resolved";

export type RefundStatusLike = {
  status: string;
  expected_date: string | null;
  next_action: string | null;
};

export function formatRefundStatus(status: string) {
  switch (status) {
    case "not_expected":
      return "Not Expected";
    case "expected":
      return "Expected";
    case "processing":
      return "Processing";
    case "received":
      return "Received";
    case "adjusted":
      return "Adjusted";
    case "rejected":
      return "Rejected";
    case "follow_up_required":
      return "Follow-up Required";
    default:
      return status;
  }
}

export function getRefundStatusVariant(status: string) {
  switch (status) {
    case "received":
    case "adjusted":
      return "success";
    case "rejected":
      return "error";
    case "follow_up_required":
      return "warning";
    case "processing":
      return "info";
    case "expected":
      return "warning";
    case "not_expected":
    default:
      return "neutral";
  }
}

export function isResolvedRefund(status: string) {
  return ["not_expected", "received", "adjusted", "rejected"].includes(status);
}

export function deriveRefundAttention(refund: RefundStatusLike): RefundAttentionLevel {
  if (refund.status === "follow_up_required") {
    return "follow_up";
  }

  if (isResolvedRefund(refund.status)) {
    return "resolved";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (refund.expected_date) {
    const expectedDate = new Date(`${refund.expected_date}T00:00:00`);

    if (expectedDate < today) {
      return "overdue";
    }

    if (expectedDate.getTime() === today.getTime()) {
      return "due";
    }
  }

  if (refund.next_action?.trim()) {
    return "unresolved";
  }

  return "unresolved";
}

export function getRefundAttentionLabel(attention: RefundAttentionLevel) {
  switch (attention) {
    case "overdue":
      return "Overdue";
    case "due":
      return "Due Today";
    case "follow_up":
      return "Follow-up";
    case "unresolved":
      return "Open";
    case "resolved":
    default:
      return "Resolved";
  }
}

export function getRefundAttentionVariant(attention: RefundAttentionLevel) {
  switch (attention) {
    case "overdue":
      return "error";
    case "due":
    case "follow_up":
      return "warning";
    case "unresolved":
      return "info";
    case "resolved":
    default:
      return "neutral";
  }
}

export function formatRefundDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatRefundDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buildRefundQueryHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
