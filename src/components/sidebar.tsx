"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Tag } from "lucide-react";
import { useCurrentSession } from "@/lib/utils";
import { Logout } from "./auth/logout";
import { useRouter } from "next/navigation";
import Image from "next/image";

const navigation = [
  {
    name: "dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    name: "catégories",
    href: "/categories",
    icon: Tag,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const session = useCurrentSession();

  const router = useRouter();

  return (
    <div
      className="flex h-screen w-60 flex-col bg-gray-900"
      style={{ backgroundColor: "#0f0f0f" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center pt-8 pb-12">
        <Image
          src="/logo.png"
          alt="Meffin"
          width={100}
          height={100}
          className="rounded-lg dark:invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium tracking-wide transition-colors uppercase ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="px-4 pb-6 space-y-2">
        {session?.user && (
          <div
            onClick={() => router.push("/profile")}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm uppercase font-medium tracking-wide text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            Mon Profil
          </div>
        )}

        {/* Logout Button */}
        <Logout />
      </div>
    </div>
  );
}
