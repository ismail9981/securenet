import { isIP } from "node:net";
import { z } from "zod";

import {
  deviceStatusSchema,
  deviceTypeSchema,
} from "@/modules/shared/domain/network";

const nullableText = (maximum: number) =>
  z
    .union([z.string(), z.null()])
    .transform((value) => value?.trim() || null)
    .pipe(z.string().max(maximum).nullable());

export const deviceIdSchema = z.string().uuid();
export const deviceNameSchema = z.string().trim().min(1).max(120);
export const hostnameSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/,
    "Use letters, numbers, dots, or hyphens.",
  )
  .transform((value) => value.toUpperCase());
export const ipAddressSchema = z
  .string()
  .trim()
  .max(45)
  .refine((value) => isIP(value) > 0, "Enter a valid IP address.");
export const macAddressSchema = z
  .union([z.string(), z.null()])
  .transform((value) => value?.trim().toUpperCase() || null)
  .pipe(
    z
      .string()
      .regex(
        /^[0-9A-F]{2}(?::[0-9A-F]{2}){5}$/,
        "Use colon-separated MAC address notation.",
      )
      .nullable(),
  );

export const createDeviceSchema = z.object({
  name: deviceNameSchema,
  hostname: hostnameSchema,
  ipAddress: ipAddressSchema,
  macAddress: macAddressSchema.default(null),
  type: deviceTypeSchema,
  status: deviceStatusSchema.default("UNKNOWN"),
  osName: nullableText(120).default(null),
  locationId: deviceIdSchema,
  parentDeviceId: deviceIdSchema.nullable().default(null),
  importanceWeight: z.number().int().min(1).max(5).default(1),
});

export const updateDeviceSchema = z
  .object({
    name: deviceNameSchema.optional(),
    hostname: hostnameSchema.optional(),
    ipAddress: ipAddressSchema.optional(),
    macAddress: macAddressSchema.optional(),
    type: deviceTypeSchema.optional(),
    status: deviceStatusSchema.optional(),
    osName: nullableText(120).optional(),
    locationId: deviceIdSchema.optional(),
    parentDeviceId: deviceIdSchema.nullable().optional(),
    importanceWeight: z.number().int().min(1).max(5).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const deviceSortSchema = z.enum(["name", "status", "ping", "lastSeen"]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

export const deviceListQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  statuses: z.array(deviceStatusSchema).max(5).default([]),
  types: z.array(deviceTypeSchema).max(8).default([]),
  locationId: deviceIdSchema.optional(),
  sort: deviceSortSchema.default("name"),
  order: sortOrderSchema.default("asc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const metricRangeSchema = z.enum(["1h", "6h", "24h", "7d", "30d"]);
export const metricCursorQuerySchema = z
  .object({
    cursor: z.string().regex(/^\d+$/).optional(),
    limit: z.number().int().min(1).max(100).default(24),
    range: metricRangeSchema.optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (value) => !(value.cursor && (value.range || value.from || value.to)),
    {
      message: "Cursor pagination cannot be combined with a historical range.",
    },
  )
  .refine((value) => Boolean(value.from) === Boolean(value.to), {
    message: "Both from and to are required for a custom period.",
  })
  .refine(
    (value) =>
      !value.from ||
      !value.to ||
      new Date(value.from).getTime() <= new Date(value.to).getTime(),
    { message: "The from date must be before or equal to the to date." },
  )
  .refine(
    (value) =>
      !value.from ||
      !value.to ||
      new Date(value.to).getTime() - new Date(value.from).getTime() <=
        30 * 24 * 60 * 60 * 1_000,
    { message: "The selected period cannot exceed 30 days." },
  );

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeviceListQuery = z.infer<typeof deviceListQuerySchema>;
export type MetricCursorQuery = z.infer<typeof metricCursorQuerySchema>;
