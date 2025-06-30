import { auth } from "@/lib/auth";
import { signIn, signUp } from "@/server/users";

import { headers } from "next/headers";
import SignOutButton from "@/components/auth/signout-button";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="flex flex-col gap-3 items-center justify-center p-10">
      <div>
        {session ? (
          <div className="flex flex-col">
            <p>Hello {session.user.name}</p>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              className="bg-neutral-700 text-white p-2 rounded-md cursor-pointer"
              onClick={signIn}
            >
              Sign In
            </button>
            <button
              className="bg-neutral-700 text-white p-2 rounded-md cursor-pointer"
              onClick={signUp}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
      <p>{!session ? "Not authenticated" : session.user.name}</p>
    </main>
  );
}
