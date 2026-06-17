import { z } from "zod";

export const refundStatusSchema = z.enum([
  "not_expected",
  "expected",
  "processing",
  "received",
  "adjusted",
  "rejected",
  "follow_up_required",
]);

const optionalMoneySchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().finite().min(0, "Amount cannot be negative.").optional());

const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
  .optional()
  .or(z.literal(""));

const optionalDateTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date and time must be valid.")
  .optional()
  .or(z.literal(""));

export const createRefundSchema = z
  .object({
    clientId: z.string().uuid("Choose a valid client."),
    assessmentYearId: z.string().uuid("Choose a valid assessment year."),
    filingRecordId: z.string().uuid("Choose a valid filing record.").optional().or(z.literal("")),
    status: refundStatusSchema,
    expectedAmount: optionalMoneySchema,
    expectedDate: optionalDateSchema,
    receivedAmount: optionalMoneySchema,
    receivedDate: optionalDateSchema,
    lastCheckedAt: optionalDateTimeSchema,
    nextAction: z.string().trim().max(500, "Next action is too long.").optional().or(z.literal("")),
    notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.status === "received") {
      if (value.receivedAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["receivedAmount"],
          message: "Received amount is required when the refund is marked received.",
        });
      }

      if (!value.receivedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["receivedDate"],
          message: "Received date is required when the refund is marked received.",
        });
      }
    }

    if (value.receivedDate && value.expectedDate && value.receivedDate < value.expectedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receivedDate"],
        message: "Received date cannot be earlier than the expected date.",
      });
    }
  });

export const updateRefundSchema = createRefundSchema.extend({
  revalidateTarget: z.string().trim().min(1).default("/refunds"),
});

export type RefundStatusInput = z.infer<typeof refundStatusSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type UpdateRefundInput = z.infer<typeof updateRefundSchema>;
