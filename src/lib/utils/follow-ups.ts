export const FOLLOW_UP_TYPES = ["next_year", "document_collection", "payment", "notice", "refund", "general"] as const;

export const FOLLOW_UP_STATUSES = ["open", "completed", "excluded", "cancelled"] as const;

export const COMMUNICATION_CHANNELS = ["phone", "whatsapp", "email", "in_person", "portal", "other"] as const;

export const COMMUNICATION_DIRECTIONS = ["inbound", "outbound", "internal"] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];
export type FollowUpAttentionLevel = "overdue" | "due" | "open" | "completed" | "excluded" | "cancelled";

export type FollowUpStatusLike = {
  status: string;
  due_date: string;
};

export function formatFollowUpType(value: string) {
  switch (value) {
    case "next_year":
      return "Next Year";
    case "document_collection":
      return "Document Collection";
    case "payment":
      return "Payment";
    case "notice":
      return "Notice";
    case "refund":
      return "Refund";
    case "general":
    default:
      return "General";
  }
}

export function formatFollowUpStatus(value: string) {
  switch (value) {
    case "open":
      return "Open";
    case "completed":
      return "Completed";
    case "excluded":
      return "Excluded";
    case "cancelled":
      return "Cancelled";
    default:
      return value;
  }
}

export function formatCommunicationChannel(value: string) {
  switch (value) {
    case "phone":
      return "Phone";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    case "in_person":
      return "In Person";
    case "portal":
      return "Portal";
    case "other":
    default:
      return "Other";
  }
}

export function formatCommunicationDirection(value: string) {
  switch (value) {
    case "inbound":
      return "Inbound";
    case "outbound":
      return "Outbound";
    case "internal":
    default:
      return "Internal";
  }
}

export function getFollowUpTypeVariant(value: string) {
  switch (value) {
    case "next_year":
      return "info";
    case "document_collection":
    case "payment":
      return "warning";
    case "notice":
      return "error";
    case "refund":
      return "success";
    case "general":
    default:
      return "neutral";
  }
}

export function getFollowUpStatusVariant(value: string) {
  switch (value) {
    case "completed":
      return "success";
    case "excluded":
    case "cancelled":
      return "neutral";
    case "open":
    default:
      return "info";
  }
}

export function deriveFollowUpAttention(followUp: FollowUpStatusLike): FollowUpAttentionLevel {
  if (followUp.status === "completed") {
    return "completed";
  }

  if (followUp.status === "excluded") {
    return "excluded";
  }

  if (followUp.status === "cancelled") {
    return "cancelled";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${followUp.due_date}T00:00:00`);
  if (dueDate < today) {
    return "overdue";
  }

  if (dueDate.getTime() === today.getTime()) {
    return "due";
  }

  return "open";
}

export function getFollowUpAttentionLabel(value: FollowUpAttentionLevel) {
  switch (value) {
    case "overdue":
      return "Overdue";
    case "due":
      return "Due Today";
    case "open":
      return "Open";
    case "completed":
      return "Completed";
    case "excluded":
      return "Excluded";
    case "cancelled":
    default:
      return "Cancelled";
  }
}

export function getFollowUpAttentionVariant(value: FollowUpAttentionLevel) {
  switch (value) {
    case "overdue":
      return "error";
    case "due":
      return "warning";
    case "open":
      return "info";
    case "completed":
      return "success";
    case "excluded":
    case "cancelled":
    default:
      return "neutral";
  }
}

export function formatFollowUpDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatFollowUpDateTime(value: string | null) {
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

export function buildFollowUpQueryHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildWhatsAppHref(mobile: string | null) {
  if (!mobile) {
    return null;
  }

  const digits = mobile.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const internationalDigits = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${internationalDigits}`;
}
