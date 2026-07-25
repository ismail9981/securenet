import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type Session,
} from "@/modules/identity/infrastructure/session";

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireServerSession(): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
