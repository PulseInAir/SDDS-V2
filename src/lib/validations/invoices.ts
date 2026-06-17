import { z } from "zod";

const positiveMoneySchema = z.coerce.number().finite().min(0.01, "Amount must be greater than zero.");
const nonNegativeMoneySchema = z.coerce.number().finite().min(0, "Amount cannot be negative.");

export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(250, "Description is too long."),
  quantity: z.coerce.number().finite().positive("Quantity must be greater than zero."),
  unitAmount: nonNegativeMoneySchema,
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const createInvoiceSchema = z
  .object({
    clientId: z.string().uuid("Choose a valid client."),
    assessmentYearId: z.string().uuid("Choose a valid assessment year."),
    discountAmount: nonNegativeMoneySchema.default(0),
    notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
    items: z.array(invoiceItemInputSchema).min(1, "Add at least one invoice item."),
  })
  .superRefine((value, ctx) => {
    const subtotal = value.items.reduce(
      (sum, item) => sum + Number((item.quantity * item.unitAmount).toFixed(2)),
      0,
    );

    if (value.discountAmount > subtotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountAmount"],
        message: "Discount cannot exceed the invoice subtotal.",
      });
    }

    if (subtotal - value.discountAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Invoice total must remain greater than zero.",
      });
    }
  });

export const issueInvoiceSchema = z
  .object({
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD."),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD."),
  })
  .superRefine((value, ctx) => {
    if (value.dueDate < value.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Due date cannot be earlier than issue date.",
      });
    }
  });

export const paymentModeSchema = z.enum(["cash", "upi"]);

export const recordPaymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Payment date must be YYYY-MM-DD."),
  amount: positiveMoneySchema,
  mode: paymentModeSchema,
  reference: z.string().trim().max(120, "Reference is too long.").optional().or(z.literal("")),
  note: z.string().trim().max(1000, "Note is too long.").optional().or(z.literal("")),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type PaymentMode = z.infer<typeof paymentModeSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
