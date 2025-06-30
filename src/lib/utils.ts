import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession } from "@/lib/auth-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const useCurrentUser = () => {
  const session = useSession();
  const user = session.data?.user;

  if (!user) {
    return null;
  }

  return user;
};

export const useCurrentSession = () => {
  const session = useSession();
  const sessionData = session.data;

  if (!sessionData) {
    return null;
  }

  return sessionData;
};
