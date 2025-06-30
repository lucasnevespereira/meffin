import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-5 items-center justify-center h-screen px-5 text-center">
      <Image
        src="/logo.png"
        alt="Meffin"
        width={100}
        height={100}
        className="rounded-lg dark:invert"
      />

      <h1 className="text-4xl font-bold">Meffin</h1>

      <p className="text-lg">Simple budgeting app for your monthly expenses.</p>

      <div className="flex gap-2">
        <Link href="/login">
          <Button>Login</Button>
        </Link>
        <Link href="/signup">
          <Button>Signup</Button>
        </Link>
      </div>
    </div>
  );
}
