"use client";
import { Logout } from "@/components/auth/logout";
import { useCurrentSession } from "@/lib/utils";

export default function Dashboard() {
  const session = useCurrentSession();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {session && (
        <div className="my-4">
          <div>
            <h2 className="text-2xl font-bold">
              Hello, {session.user?.name} 👋
            </h2>
          </div>
        </div>
      )}
      <Logout />
    </div>
  );
}
