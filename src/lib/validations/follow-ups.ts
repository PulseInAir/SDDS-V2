import { z } from "zod";

import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTIONS,
  FOLLOW_UP_STATUSES,
} from "@/lib/utils/follow-ups";

const optionalTrimmed = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => value?.trim() ?? "");

const optionalUuid = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => value?.trim() ?? "")
  .refine((value) => value === "" || z.string().uuid().safeParse(value).success, "Choose a valid linked case.")
  .transform((value) => value || "");

export const updateFollowUpSchema = z
  .object({
    status: z.enum(FOLLOW_UP_STATUSES),
    dueDate: z.string().min(1, "Choose a due date."),
    nextAction: optionalTrimmed,
    notes: optionalTrimmed,
    exclusionReason: optionalTrimmed,
    revalidateTarget: z.string().min(1).default("/follow-up"),
  })
  .superRefine((value, ctx) => {
    if (value.status === "excluded" && value.exclusionReason.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an exclusion reason before excluding the follow-up.",
        path: ["exclusionReason"],
      });
    }
  });

export const recordCommunicationSchema = z.object({
  clientId: z.string().uuid("Choose a valid client."),
  caseId: optionalUuid,
  channel: z.enum(COMMUNICATION_CHANNELS),
  direction: z.enum(COMMUNICATION_DIRECTIONS),
  subject: optionalTrimmed,
  summary: z.string().trim().min(1, "Add a contact summary."),
  communicationAt: z.string().min(1, "Choose the contact time."),
  revalidateTarget: z.string().min(1).default("/follow-up"),
});

export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type RecordCommunicationInput = z.infer<typeof recordCommunicationSchema>;
