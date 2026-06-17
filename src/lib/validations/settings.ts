import { z } from "zod";

function deriveExpectedLabel(startDate: string, endDate: string) {
  const startYear = new Date(`${startDate}T00:00:00`).getUTCFullYear();
  const endYear = new Date(`${endDate}T00:00:00`).getUTCFullYear();

  return `${startYear}-${String(endYear).slice(-2)}`;
}

export const createAssessmentYearSchema = z
  .object({
    label: z
      .string()
      .trim()
      .regex(/^[0-9]{4}-[0-9]{2}$/, "Use the AY label format YYYY-YY, for example 2026-27."),
    startDate: z.iso.date("Choose a valid start date."),
    endDate: z.iso.date("Choose a valid end date."),
    makeCurrent: z.boolean(),
    isOpen: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }

    const expectedLabel = deriveExpectedLabel(value.startDate, value.endDate);
    if (value.label !== expectedLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: `The AY label should match the configured date span (${expectedLabel}).`,
      });
    }

    if (value.makeCurrent && !value.isOpen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isOpen"],
        message: "The current assessment year must stay open for operational use.",
      });
    }
  });
