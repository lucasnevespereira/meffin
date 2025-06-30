"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Logout() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div
      onClick={handleLogout}
      className="flex uppercase items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium tracking-wide text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
    >
      Déconnexion
    </div>
  );
}
