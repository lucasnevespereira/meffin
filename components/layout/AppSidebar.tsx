"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mascot } from "@/components/shared/Mascot";
import {
  LayoutDashboard,
  Tag,
  LogOut,
  CreditCard,
  ClipboardList,
  LineChart,
  User,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { useI18n } from "@/locales/client";

import { APP_VERSION } from "@/lib/version";

// Generate a fallback avatar URL based on user's name or email using initials
const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

// Get the best available avatar URL (Google profile image or fallback to initials)
const getAvatarUrl = (user: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): string => {
  // Use Google profile image if available
  if (user.image) {
    return user.image;
  }

  // Fallback to initials avatar
  return generateFallbackAvatarUrl(user.name || user.email || "user");
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useI18n();
  const { data: session } = useSession();
  const { setOpenMobile, isMobile } = useSidebar();

  const items = [
    {
      title: t("nav_dashboard"),
      url: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: t("nav_transactions"),
      url: `/${locale}/transactions`,
      icon: CreditCard,
    },
    {
      title: t("nav_trends"),
      url: `/${locale}/trends`,
      icon: LineChart,
    },
    {
      title: t("nav_categories"),
      url: `/${locale}/categories`,
      icon: Tag,
    },
    {
      title: t("nav_lists"),
      url: `/${locale}/lists`,
      icon: ClipboardList,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/login`);
  };

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  return (
    <Sidebar variant="inset" className="border-r border-border shadow-subtle">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <Mascot size={40} />
          <div className="flex flex-col min-w-0">
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Meffin
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`rounded-lg transition-all duration-200 ease-in-out touch-manipulation group cursor-pointer ${
                      isActive(item.url)
                        ? "bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground font-semibold hover:bg-primary/20 dark:hover:bg-primary/90 dark:hover:text-primary-foreground"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    }`}
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-3 min-h-[48px]"
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-200 group-hover:scale-110 ${
                          isActive(item.url)
                            ? "text-primary dark:text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="px-4 py-4">
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-primary/10 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-border shrink-0">
                    <Image
                      src={getAvatarUrl(session.user)}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateFallbackAvatarUrl(
                          session.user.name || session.user.email || "user",
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium truncate w-full">
                      {session.user.name || t("nav_profile")}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {session.user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                    className="cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    {t("nav_profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  {t("nav_signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
