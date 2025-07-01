import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const serverUserSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session && session.user) {
    return session.user;
  }

  return null;
};
