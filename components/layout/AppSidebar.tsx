'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Tag,
  LogOut,
  CreditCard,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { signOut, useSession } from '@/lib/auth-client';
import { useI18n } from '@/locales/client';

const APP_VERSION = process.env.APP_VERSION || '0.1.0-dev';

// Generate a fallback avatar URL based on user's name or email using initials
const generateFallbackAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3f4f6&textColor=374151`;
};

// Get the best available avatar URL (Google profile image or fallback to initials)
const getAvatarUrl = (user: { name?: string | null; email?: string | null; image?: string | null }): string => {
  // Use Google profile image if available
  if (user.image) {
    return user.image;
  }

  // Fallback to initials avatar
  return generateFallbackAvatarUrl(user.name || user.email || 'user');
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
      title: t('nav_dashboard'),
      url: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: t('nav_transactions'),
      url: `/${locale}/transactions`,
      icon: CreditCard,
    },
    {
      title: t('nav_categories'),
      url: `/${locale}/categories`,
      icon: Tag,
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
          <Image
            src="/logo.png"
            alt="Meffin Logo"
            width={64}
            height={64}
            className="object-cover invert dark:invert-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Meffin
            </span>
            <span className="text-xs text-muted-foreground font-medium">v{APP_VERSION}</span>
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
                    className={`rounded-lg transition-all duration-200 ease-in-out touch-manipulation group ${
                      isActive(item.url)
                        ? 'bg-primary text-primary-foreground font-medium shadow-card'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-subtle'
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
                      <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                        isActive(item.url) ? 'text-primary-foreground' : ''
                      }`} />
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
          <SidebarMenu className="space-y-2">
            {session && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 touch-manipulation group"
                  >
                    <Link
                      href={`/${locale}/profile`}
                      className="flex gap-2.5 py-3 min-h-[48px]"
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-sidebar-accent transition-colors shrink-0 -ml-0.5">
                        <Image
                          src={getAvatarUrl(session.user)}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials avatar if Google image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = generateFallbackAvatarUrl(session.user.name || session.user.email || 'user');
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">{session.user.name || t('nav_profile')}</span>
                        <span className="text-xs text-muted-foreground">{t('nav_profile')}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleSignOut}
                    className="text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 w-full rounded-lg transition-all duration-200 touch-manipulation group"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">{t('nav_signOut')}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
