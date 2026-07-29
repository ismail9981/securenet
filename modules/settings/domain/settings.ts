import { z } from "zod";

export const TIMEZONES = ["Asia/Muscat", "UTC"] as const;
export const CPU_UNITS = ["percent"] as const;
export const MEMORY_UNITS = ["percent"] as const;
export const TRAFFIC_UNITS = ["Mbps", "Gbps"] as const;

export const systemSettingSchema = z.object({
  timezone: z.enum(TIMEZONES),
  cpuUnit: z.enum(CPU_UNITS),
  memoryUnit: z.enum(MEMORY_UNITS),
  trafficUnit: z.enum(TRAFFIC_UNITS),
  updatedAt: z.string().datetime(),
});

export const updateSystemSettingSchema = z
  .object({
    timezone: z.enum(TIMEZONES),
    cpuUnit: z.enum(CPU_UNITS),
    memoryUnit: z.enum(MEMORY_UNITS),
    trafficUnit: z.enum(TRAFFIC_UNITS),
  })
  .strict();

export type SystemSettingView = z.infer<typeof systemSettingSchema>;
export type UpdateSystemSetting = z.infer<typeof updateSystemSettingSchema>;
