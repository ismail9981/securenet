import { z } from "zod";

export const alertRuleIdSchema = z.string().uuid();

export const updateAlertRuleSchema = z
  .object({
    warningThreshold: z.number().finite().nullable().optional(),
    criticalThreshold: z.number().finite().nullable().optional(),
    enabled: z.boolean().optional(),
    durationSeconds: z.number().int().min(0).max(86_400).optional(),
    consecutiveSamples: z.number().int().min(1).max(100).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one editable AlertRule field.",
  });

export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;

export interface AlertRuleAdminView {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly metric: string;
  readonly operator: string;
  readonly warningThreshold: number | null;
  readonly criticalThreshold: number | null;
  readonly durationSeconds: number;
  readonly consecutiveSamples: number | null;
  readonly enabled: boolean;
}
