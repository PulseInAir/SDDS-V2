import type { Tables } from "@/types/database.types";

export type InvoiceRow = Tables<"invoices">;
export type InvoiceItemRow = Tables<"invoice_items">;
export type PaymentRow = Tables<"payments">;

export const INVOICE_STATUS_ORDER = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type DerivedInvoiceStatus = (typeof INVOICE_STATUS_ORDER)[number];

export function formatInvoiceStatus(status: DerivedInvoiceStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "issued":
      return "Issued";
    case "partially_paid":
      return "Partially Paid";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getInvoiceStatusVariant(status: DerivedInvoiceStatus) {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "error";
    case "partially_paid":
      return "warning";
    case "issued":
      return "info";
    case "cancelled":
      return "neutral";
    case "draft":
    default:
      return "neutral";
  }
}

export function getActivePayments(payments: PaymentRow[]) {
  return payments.filter((payment) => payment.reversed_at === null);
}

export function sumPaymentAmount(payments: PaymentRow[]) {
  return Number(
    getActivePayments(payments)
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
      .toFixed(2),
  );
}

export function deriveInvoiceStatus(invoice: Pick<InvoiceRow, "status" | "due_date">, balanceAmount: number): DerivedInvoiceStatus {
  if (invoice.status === "cancelled") {
    return "cancelled";
  }

  if (invoice.status === "draft") {
    return "draft";
  }

  if (balanceAmount <= 0) {
    return "paid";
  }

  const dueDate = invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dueDate && dueDate < today) {
    return "overdue";
  }

  if (invoice.status === "partially_paid") {
    return "partially_paid";
  }

  return invoice.status === "paid" ? "paid" : "issued";
}

export function formatInvoiceDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...options,
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPaymentMode(mode: string) {
  return mode === "upi" ? "UPI" : "Cash";
}

export function buildInvoiceQueryHref(basePath: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
