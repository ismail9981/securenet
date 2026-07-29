import { z } from "zod";

import {
  alertSeveritySchema,
  alertStatusSchema,
  deviceStatusSchema,
} from "@/modules/shared/domain/network";

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

export const reportFilterSchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    deviceId: z.string().uuid().optional(),
    severity: alertSeveritySchema.optional(),
    alertStatus: alertStatusSchema.optional(),
    deviceStatus: deviceStatusSchema.optional(),
  })
  .transform((value) => {
    const to = value.to ?? new Date();
    const from = value.from ?? new Date(to.getTime() - 24 * 60 * 60 * 1_000);
    return { ...value, from, to };
  })
  .superRefine(({ from, to }, context) => {
    if (from > to) {
      context.addIssue({
        code: "custom",
        path: ["from"],
        message: "The from date must be before or equal to the to date.",
      });
    }
    if (to.getTime() - from.getTime() > 30 * 24 * 60 * 60 * 1_000) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "The selected period cannot exceed 30 days.",
      });
    }
  });

export type ReportFilters = z.infer<typeof reportFilterSchema>;

export function parseReportFilters(
  searchParams: URLSearchParams,
): ReportFilters {
  return reportFilterSchema.parse({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    deviceId: searchParams.get("deviceId") || undefined,
    severity: searchParams.get("severity") || undefined,
    alertStatus: searchParams.get("alertStatus") || undefined,
    deviceStatus: searchParams.get("deviceStatus") || undefined,
  });
}
