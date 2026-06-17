export const TAX_EVENT_TYPES = ["intimation", "notice", "rectification", "defective_return"] as const;

export const TAX_EVENT_STATUSES = ["open", "response_due", "submitted", "closed", "cancelled"] as const;

export type TaxEventType = (typeof TAX_EVENT_TYPES)[number];
export type TaxEventStatus = (typeof TAX_EVENT_STATUSES)[number];
export type TaxEventAttentionLevel = "overdue" | "due" | "awaiting_closure" | "open" | "resolved";

export type TaxEventStatusLike = {
  status: string;
  response_due_date: string | null;
};

export function formatTaxEventType(value: string) {
  switch (value) {
    case "intimation":
      return "Intimation";
    case "notice":
      return "Notice";
    case "rectification":
      return "Rectification";
    case "defective_return":
      return "Defective Return";
    default:
      return value;
  }
}

export function formatTaxEventStatus(value: string) {
  switch (value) {
    case "open":
      return "Open";
    case "response_due":
      return "Response Due";
    case "submitted":
      return "Response Submitted";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
    default:
      return value;
  }
}

export function getTaxEventTypeVariant(value: string) {
  switch (value) {
    case "notice":
      return "error";
    case "rectification":
      return "warning";
    case "defective_return":
      return "warning";
    case "intimation":
    default:
      return "info";
  }
}

export function getTaxEventStatusVariant(value: string) {
  switch (value) {
    case "closed":
      return "success";
    case "cancelled":
      return "neutral";
    case "submitted":
      return "info";
    case "response_due":
      return "warning";
    case "open":
    default:
      return "error";
  }
}

export function isResolvedTaxEvent(status: string) {
  return status === "closed" || status === "cancelled";
}

export function deriveTaxEventAttention(event: TaxEventStatusLike): TaxEventAttentionLevel {
  if (isResolvedTaxEvent(event.status)) {
    return "resolved";
  }

  if (event.status === "submitted") {
    return "awaiting_closure";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (event.response_due_date) {
    const dueDate = new Date(`${event.response_due_date}T00:00:00`);

    if (dueDate < today) {
      return "overdue";
    }

    if (dueDate.getTime() === today.getTime()) {
      return "due";
    }
  }

  return "open";
}

export function getTaxEventAttentionLabel(value: TaxEventAttentionLevel) {
  switch (value) {
    case "overdue":
      return "Overdue";
    case "due":
      return "Due Today";
    case "awaiting_closure":
      return "Awaiting Closure";
    case "open":
      return "Open";
    case "resolved":
    default:
      return "Resolved";
  }
}

export function getTaxEventAttentionVariant(value: TaxEventAttentionLevel) {
  switch (value) {
    case "overdue":
      return "error";
    case "due":
      return "warning";
    case "awaiting_closure":
    case "open":
      return "info";
    case "resolved":
    default:
      return "neutral";
  }
}

export function formatTaxEventDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export function buildTaxEventQueryHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
