import { z } from "zod";

export const taxEventTypeSchema = z.enum(["intimation", "notice", "rectification", "defective_return"]);
export const taxEventStatusSchema = z.enum(["open", "response_due", "submitted", "closed", "cancelled"]);

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

export const createTaxEventSchema = z
  .object({
    clientId: z.string().uuid("Choose a valid client."),
    assessmentYearId: z.string().uuid("Choose a valid assessment year."),
    filingRecordId: z.string().uuid("Choose a valid filing record.").optional().or(z.literal("")),
    eventType: taxEventTypeSchema,
    category: z.string().trim().min(1, "Category is required.").max(120, "Category is too long."),
    status: taxEventStatusSchema,
    issueDate: optionalDateSchema,
    receivedDate: optionalDateSchema,
    responseDueDate: optionalDateSchema,
    submissionDate: optionalDateSchema,
    closureDate: optionalDateSchema,
    referenceNumber: z.string().trim().max(120, "Reference number is too long.").optional().or(z.literal("")),
    amount: optionalMoneySchema,
    nextAction: z.string().trim().max(500, "Next action is too long.").optional().or(z.literal("")),
    notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.responseDueDate && value.receivedDate && value.responseDueDate < value.receivedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responseDueDate"],
        message: "Response due date cannot be earlier than the received date.",
      });
    }

    if (value.status === "submitted" && !value.submissionDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["submissionDate"],
        message: "Submission date is required when the response is marked submitted.",
      });
    }

    if (value.status === "closed" && !value.closureDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closureDate"],
        message: "Closure date is required when the event is closed.",
      });
    }

    if (value.closureDate && value.receivedDate && value.closureDate < value.receivedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closureDate"],
        message: "Closure date cannot be earlier than the received date.",
      });
    }

    if (value.closureDate && value.submissionDate && value.closureDate < value.submissionDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closureDate"],
        message: "Closure date cannot be earlier than the response submission date.",
      });
    }
  });

export const updateTaxEventSchema = createTaxEventSchema.extend({
  revalidateTarget: z.string().trim().min(1).default("/notices"),
});

export type CreateTaxEventInput = z.infer<typeof createTaxEventSchema>;
export type UpdateTaxEventInput = z.infer<typeof updateTaxEventSchema>;
