import { z } from "zod";

import {
  userRoleSchema,
  userStatusSchema,
} from "@/modules/shared/domain/network";

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  role: userRoleSchema,
  status: userStatusSchema,
});

export type User = z.infer<typeof userSchema>;

export type PublicUser = Omit<User, "status">;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
