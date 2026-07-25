import {
  assertPermission,
  type Permission,
} from "@/modules/identity/domain/permissions";
import type { PublicUser } from "@/modules/identity/domain/user";

export interface ActorContext {
  readonly actor: PublicUser;
}

export function authorizeActor(
  context: ActorContext,
  permission: Permission,
): ActorContext {
  assertPermission(context.actor.role, permission);
  return context;
}
