"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { Mascot } from "@/components/shared/Mascot";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  LayoutDashboard,
  Tag,
  LogOut,
  CreditCard,
  ClipboardList,
  LineChart,
  User,
  ChevronUp,
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
                <button
                  className="group flex w-full min-w-0 items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-primary/10 data-[state=open]:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("nav_profile")}
                >
                  <UserAvatar
                    image={session.user.image}
                    name={session.user.name}
                    email={session.user.email}
                    size={36}
                    className="rounded-lg"
                  />
                  <div className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="w-full truncate text-sm font-medium">
                      {session.user.name || t("nav_profile")}
                    </span>
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-0 rounded-xl p-1.5 shadow-xl"
              >
                <div className="min-w-0 px-2.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      image={session.user.image}
                      name={session.user.name}
                      email={session.user.email}
                      size={40}
                      className="rounded-lg"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {session.user.name || t("nav_profile")}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-xs leading-relaxed text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="h-10 cursor-pointer rounded-lg px-2.5">
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t("nav_profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="h-10 cursor-pointer rounded-lg px-2.5 text-destructive focus:text-destructive"
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
